<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/user-manual', fn () => Inertia::render('Support/UserManualPublic'))
    ->name('manual.public');
Route::get('/privacy-policy', fn () => Inertia::render('Legal/PrivacyPolicy'))
    ->name('legal.privacy');
Route::get('/cookie-policy', fn () => Inertia::render('Legal/CookiePolicy'))
    ->name('legal.cookies');
Route::get('/terms-of-use', fn () => Inertia::render('Legal/TermsOfUse'))
    ->name('legal.terms');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/onboarding', fn() => Inertia::render('Onboarding/OnboardingWizard'))
        ->name('onboarding');
    Route::get('/support/user-manual', fn () => Inertia::render('Support/UserManual'))
        ->name('support.user-manual');
    Route::get('/usage', [\App\Http\Controllers\UsageWebController::class, 'index'])
        ->name('usage.index');
    Route::get('/calls', [\App\Http\Controllers\CallLogWebController::class, 'index'])->name('calls.index');

    Route::get('/listings',               [\App\Http\Controllers\ListingWebController::class, 'index'])->name('listings.index');
    Route::get('/listings/create',        [\App\Http\Controllers\ListingWebController::class, 'create'])->name('listings.create');
    Route::post('/listings',              [\App\Http\Controllers\ListingWebController::class, 'store'])->name('listings.store');
    Route::get('/listings/{listing}/edit', [\App\Http\Controllers\ListingWebController::class, 'edit'])->name('listings.edit');
    Route::put('/listings/{listing}',     [\App\Http\Controllers\ListingWebController::class, 'update'])->name('listings.update');
    Route::delete('/listings/{listing}',  [\App\Http\Controllers\ListingWebController::class, 'destroy'])->name('listings.destroy');

    Route::prefix('appointments')->name('appointments.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ViewingWebController::class, 'index'])->name('index');
        Route::post('/slots', [\App\Http\Controllers\ViewingWebController::class, 'storeSlot'])->name('slots.store');
        Route::put('/slots/{slot}', [\App\Http\Controllers\ViewingWebController::class, 'updateSlot'])->name('slots.update');
        Route::delete('/slots/{slot}', [\App\Http\Controllers\ViewingWebController::class, 'destroySlot'])->name('slots.destroy');
        Route::post('/bookings', [\App\Http\Controllers\ViewingWebController::class, 'storeBooking'])->name('bookings.store');
        Route::delete('/bookings/{viewing}', [\App\Http\Controllers\ViewingWebController::class, 'destroyBooking'])->name('bookings.destroy');
    });

    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::resource('buildings', \App\Http\Controllers\BuildingWebController::class)->except(['show']);
        Route::resource('units', \App\Http\Controllers\UnitWebController::class)->except(['show']);
        Route::resource('unit-types', \App\Http\Controllers\UnitTypeWebController::class)->except(['show']);
    });
});
Route::middleware(['auth', 'verified'])->post('/settings/group/switch', [App\Http\Controllers\SwitchGroupController::class, 'store'])
    ->name('settings.group.switch');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
