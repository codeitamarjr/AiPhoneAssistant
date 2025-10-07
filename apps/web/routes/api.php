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
    LeadEventsController
};
use App\Http\Controllers\{CallEventsController};

// Session/Sanctum-protected API (used by the web app)
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::post('/groups', [GroupController::class, 'store']);
    Route::get('/onboarding/status', [OnboardingController::class, 'status']);
    Route::post('/groups/{group}/twilio', [TwilioConnectionController::class, 'store']);
    Route::post('/groups/{group}/twilio/verify', [TwilioVerifyController::class, 'verify']);
    Route::post('/groups/{group}/twilio/attach-number', [TwilioVerifyController::class, 'attachNumber']);
    Route::get('/calls', [CallLogApiController::class, 'index']);
    Route::get('/listings/active', [ListingApiController::class, 'active']);
});

// Public/tenant APIs (example) — protect with your API token middleware
Route::middleware('api_token')->group(function () {
    Route::get('/listings/by-number', [ListingController::class, 'byNumber']);
    Route::get('/viewing-slots', [ViewingSlotController::class, 'index']);
    Route::post('/viewings', [ViewingController::class, 'store']);
    // Called by the orchestrator (server-to-server)
    Route::post('/calls/start', [CallEventsController::class, 'start']);
    Route::post('/calls/end',   [CallEventsController::class, 'end']);
    Route::post('/leads', [LeadEventsController::class, 'store']);
});

// Handy auth check
Route::get('/user', fn($request) => $request->user())->middleware('auth:sanctum');
Route::get('/ping', fn() => response()->json(['ok' => true, 'time' => now()->toIso8601String()]));
