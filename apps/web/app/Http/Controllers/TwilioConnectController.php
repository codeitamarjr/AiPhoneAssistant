<?php

namespace App\Http\Controllers;

use App\Jobs\SyncTwilioPhoneNumbers;
use App\Models\Group;
use App\Models\TwilioCredential;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use JsonException;
use RuntimeException;
use Twilio\Security\RequestValidator;

class TwilioConnectController extends Controller
{
    public function connectUrl(Request $request, Group $group): JsonResponse
    {
        $this->authorize('update', $group);

        $appSid = config('services.twilio_connect.app_sid');

        if (! $appSid) {
            return response()->json([
                'message' => 'Twilio Connect is not configured. Please add TWILIO_CONNECT_APP_SID to your environment.',
            ], 503);
        }

        $baseUrl = rtrim(config('services.twilio_connect.authorize_base', 'https://www.twilio.com/authorize'), '/');

        $statePayload = [
            'group_id' => $group->id,
            'user_id' => $request->user()->id,
            'redirect_to' => route('onboarding'),
            'issued_at' => now()->timestamp,
        ];

        try {
            $state = Crypt::encryptString(json_encode($statePayload, JSON_THROW_ON_ERROR));
        } catch (JsonException $exception) {
            Log::error('Unable to generate Twilio Connect state payload.', [
                'group_id' => $group->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to start Twilio Connect right now. Please try again.',
            ], 500);
        }

        $connectUrl = sprintf('%s/%s?state=%s', $baseUrl, $appSid, urlencode($state));

        return response()->json([
            'url' => $connectUrl,
            'expires_at' => Carbon::createFromTimestamp($statePayload['issued_at'])->addMinutes(15)->toIso8601String(),
        ]);
    }

    /**
     * Twilio sends the account credentials here once the customer approves the Connect App.
     */
    public function handleAuthorize(Request $request)
    {
        if (! $this->hasValidSignature($request)) {
            Log::warning('Twilio Connect callback failed signature validation.', [
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            return $this->redirectWithStatus(null, 'error', ['reason' => 'invalid_signature'], 403);
        }

        $stateParam = $request->input('state');

        if (! $stateParam) {
            return response('Missing state parameter. Please restart the connection process.', 400);
        }

        try {
            $statePayload = json_decode(Crypt::decryptString($stateParam), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException|RuntimeException $exception) {
            Log::warning('Received invalid Twilio Connect state payload.', [
                'error' => $exception->getMessage(),
            ]);

            return response('Invalid state parameter. Please restart the connection process.', 400);
        }

        if (! is_array($statePayload) || empty($statePayload['group_id'])) {
            return $this->redirectWithStatus(null, 'error', ['reason' => 'invalid_state'], 400);
        }

        $issuedAt = $statePayload['issued_at'] ?? null;
        if ($issuedAt && Carbon::createFromTimestamp($issuedAt)->lt(now()->subMinutes(20))) {
            Log::warning('Twilio Connect state payload expired.', [
                'group_id' => $statePayload['group_id'] ?? null,
                'user_id' => $statePayload['user_id'] ?? null,
            ]);

            return $this->redirectWithStatus($statePayload, 'error', ['reason' => 'expired_state']);
        }

        $group = Group::find($statePayload['group_id']);

        if (! $group) {
            Log::warning('Twilio Connect group not found.', [
                'group_id' => $statePayload['group_id'],
            ]);

            return $this->redirectWithStatus($statePayload, 'error', ['reason' => 'group_not_found']);
        }

        if (! empty($statePayload['user_id'])) {
            $userId = (int) $statePayload['user_id'];
            $belongsToGroup = $group->owner_id === $userId
                || $group->memberships()->where('user_id', $userId)->exists();

            if (! $belongsToGroup) {
                Log::warning('Twilio Connect unauthorized attempt.', [
                    'group_id' => $group->id,
                    'user_id' => $statePayload['user_id'],
                ]);

                return $this->redirectWithStatus($statePayload, 'error', ['reason' => 'unauthorized']);
            }
        }

        $accountSid = $request->input('AccountSid');

        if (! $accountSid) {
            Log::warning('Twilio Connect missing Account SID.', [
                'group_id' => $group->id,
            ]);

            return $this->redirectWithStatus($statePayload, 'error', ['reason' => 'missing_account_sid']);
        }

        $updates = [
            'account_sid' => $accountSid,
            'is_active' => true,
        ];

        if ($request->filled('IncomingPhoneNumber')) {
            $updates['incoming_phone_e164'] = $request->input('IncomingPhoneNumber');
        }

        if ($request->filled('IncomingPhoneSid')) {
            $updates['incoming_phone_sid'] = $request->input('IncomingPhoneSid');
        }

        if ($request->filled('SubaccountSid')) {
            $updates['subaccount_sid'] = $request->input('SubaccountSid');
        } elseif ($request->filled('OwnerAccountSid')) {
            $updates['subaccount_sid'] = $request->input('OwnerAccountSid');
        }

        $credential = TwilioCredential::updateOrCreate(
            ['group_id' => $group->id],
            $updates
        );

        $userIdForSync = (int) ($statePayload['user_id'] ?? $request->user()?->id ?? $group->owner_id);
        SyncTwilioPhoneNumbers::dispatch($group->id, $userIdForSync, $credential->account_sid);

        return $this->redirectWithStatus($statePayload, 'connected');
    }

    /**
     * Twilio notifies this endpoint when the customer revokes access.
     */
    public function deauthorize(Request $request)
    {
        if (! $this->hasValidSignature($request)) {
            Log::warning('Twilio Connect deauthorize failed signature validation.', [
                'ip' => $request->ip(),
                'params' => $request->all(),
            ]);

            return response('Invalid signature', 403);
        }

        $accountSid = $request->input('AccountSid') ?? $request->input('account_sid');

        if ($accountSid) {
            $credential = TwilioCredential::where('account_sid', $accountSid)->first();

            if ($credential) {
                $credential->delete();
                Log::info('Twilio credentials revoked and removed.', [
                    'credential_id' => $credential->id,
                    'account_sid' => $accountSid,
                ]);
            }
        }

        return response()->json(['received' => true]);
    }

    protected function hasValidSignature(Request $request): bool
    {
        $authToken = config('services.twilio.auth_token');

        if (! $authToken) {
            return true;
        }

        $signature = $request->header('X-Twilio-Signature');

        if (! $signature) {
            return false;
        }

        $validator = new RequestValidator($authToken);
        $url = $request->fullUrl();
        $payload = $request->isMethod('get') ? $request->query->all() : $request->request->all();

        return $validator->validate($signature, $url, $payload);
    }

    protected function redirectWithStatus(?array $statePayload, string $status, array $extra = [], int $httpStatus = 302): RedirectResponse|Response
    {
        $redirectTo = $statePayload['redirect_to'] ?? route('onboarding');

        if (! $redirectTo) {
            $message = $status === 'connected'
                ? 'Twilio account connected. You can return to the app.'
                : 'Unable to complete Twilio Connect. Please retry from the app.';

            return response($message, $httpStatus);
        }

        $params = array_merge(['twilio' => $status], $extra);
        $separator = str_contains($redirectTo, '?') ? '&' : '?';

        return redirect()->to($redirectTo.$separator.http_build_query($params), $httpStatus);
    }
}
