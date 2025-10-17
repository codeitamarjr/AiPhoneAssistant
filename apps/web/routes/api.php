<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    GroupController,
    OnboardingController,
    TwilioConnectionController,
    ListingController,
    ViewingController,
    ViewingSlotController,
    TwilioVerifyController,
    CallLogApiController,
    ListingApiController,
    LeadEventsController,
    LeadApiController,
    NotificationPreferenceApiController,
};
use App\Http\Controllers\{CallEventsController};

// Session/Sanctum-protected API (used by the web app)
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::post('/groups', [GroupController::class, 'store']);
    Route::get('/onboarding/status', [OnboardingController::class, 'status']);
    Route::post('/groups/{group}/twilio', [TwilioConnectionController::class, 'store']);
    Route::put('/groups/{group}/twilio', [TwilioConnectionController::class, 'store']);
    Route::get('/groups/{group}/twilio', [TwilioConnectionController::class, 'show']);
    Route::delete('/groups/{group}/twilio', [TwilioConnectionController::class, 'destroy']);
    Route::post('/groups/{group}/twilio/verify', [TwilioVerifyController::class, 'verify']);
    Route::post('/groups/{group}/twilio/attach-number', [TwilioVerifyController::class, 'attachNumber']);
    Route::delete('/groups/{group}/memberships/{membership}', [\App\Http\Controllers\GroupMembershipController::class, 'destroy']);
    Route::get('/calls/stats', [CallLogApiController::class, 'stats']);
    Route::get('/calls', [CallLogApiController::class, 'index']);
    Route::get('/listings/active', [ListingApiController::class, 'active']);
    Route::get('/leads/stats', [LeadApiController::class, 'stats']);
    Route::get('/leads', [LeadApiController::class, 'index']);
    Route::patch('/leads/{lead}', [LeadApiController::class, 'update']);
    Route::post('/groups/{group}/invitations', [\App\Http\Controllers\GroupInvitationController::class, 'store']);
    Route::get('/notification-preferences', [\App\Http\Controllers\NotificationPreferenceApiController::class, 'index']);
    Route::put('/notification-preferences', [\App\Http\Controllers\NotificationPreferenceApiController::class, 'update']);
});

// Public/tenant APIs (example) — protect with your API token middleware
Route::middleware('api_token')->group(function () {
    Route::get('/listings/by-number', [ListingController::class, 'byNumber']);
    Route::get('/viewing-slots', [ViewingSlotController::class, 'index']);
    Route::get('/appointments/next', [ViewingSlotController::class, 'nextAvailable']);
    Route::post('/viewings', [ViewingController::class, 'store']);
    Route::post('/appointments', [ViewingController::class, 'store']);
    Route::patch('/appointments/{viewing}', [ViewingController::class, 'update']);
    Route::delete('/appointments/{viewing}', [ViewingController::class, 'destroy']);
    // Called by the orchestrator (server-to-server)
    Route::post('/calls/start', [CallEventsController::class, 'start']);
    Route::post('/calls/end',   [CallEventsController::class, 'end']);
    Route::post('/leads', [LeadEventsController::class, 'store']);
});

// Handy auth check
Route::get('/user', fn($request) => $request->user())->middleware('auth:sanctum');
Route::get('/ping', fn() => response()->json(['ok' => true, 'time' => now()->toIso8601String()]));
