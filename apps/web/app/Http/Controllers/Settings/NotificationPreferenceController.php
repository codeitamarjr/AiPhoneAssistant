<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        $channels = collect(NotificationPreference::channels())
            ->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'],
            ])
            ->values()
            ->all();

        $subscriptions = $user->notificationPreferences()
            ->pluck('channel')
            ->values()
            ->all();

        return Inertia::render('settings/notifications', [
            'channels' => $channels,
            'subscriptions' => $subscriptions,
        ]);
    }
}
