<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationPreferenceApiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $subscriptions = $user->notificationPreferences()
            ->pluck('channel')
            ->values()
            ->all();

        $channels = collect(NotificationPreference::channels())
            ->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'],
            ])
            ->values()
            ->all();

        return response()->json([
            'channels' => $channels,
            'subscriptions' => $subscriptions,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'channels' => ['array'],
            'channels.*' => [
                'string',
                Rule::in(array_keys(NotificationPreference::channels())),
            ],
        ]);

        $channels = collect($data['channels'] ?? [])->unique()->values();

        if ($channels->isEmpty()) {
            $user->notificationPreferences()->delete();
        } else {
            $user->notificationPreferences()
                ->whereNotIn('channel', $channels)
                ->delete();
        }

        foreach ($channels as $channel) {
            $user->notificationPreferences()->firstOrCreate([
                'channel' => $channel,
            ]);
        }

        $subscriptions = $user->notificationPreferences()
            ->pluck('channel')
            ->values()
            ->all();

        return response()->json([
            'subscriptions' => $subscriptions,
        ]);
    }
}
