<?php

namespace App\Services\Notifications;

use App\Models\Group;
use App\Models\Lead;
use App\Models\Listing;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Models\Viewing;
use App\Notifications\LeadCapturedNotification;
use App\Notifications\ViewingBookedNotification;
use App\Notifications\ViewingCancelledNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class NotificationChannelService
{
    public function notifyLeadCaptured(Lead $lead): void
    {
        $group = Group::find($lead->group_id);
        if (!$group) {
            return;
        }

        $recipients = $this->recipientsForChannel($group, NotificationPreference::CHANNEL_LEADS);
        if ($recipients->isEmpty()) {
            return;
        }

        $listingTitle = null;
        if ($lead->listing_id) {
            $listingTitle = Listing::whereKey($lead->listing_id)->value('title');
        }

        Notification::send(
            $recipients,
            new LeadCapturedNotification($lead, $group->name, $listingTitle)
        );
    }

    public function notifyViewingBooked(Viewing $viewing): void
    {
        $listing = $viewing->listing()->with('group')->first();
        $group = $listing?->group;

        if (!$group) {
            return;
        }

        $recipients = $this->recipientsForChannel($group, NotificationPreference::CHANNEL_BOOKINGS);
        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send(
            $recipients,
            new ViewingBookedNotification($viewing, $group->name, $listing?->title)
        );
    }

    public function notifyViewingCancelled(Viewing $viewing): void
    {
        $listing = $viewing->listing()->with('group')->first();
        $group = $listing?->group;

        if (!$group) {
            return;
        }

        $recipients = $this->recipientsForChannel($group, NotificationPreference::CHANNEL_BOOKINGS);
        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send(
            $recipients,
            new ViewingCancelledNotification($viewing, $group->name, $listing?->title)
        );
    }

    private function recipientsForChannel(Group $group, string $channel): Collection
    {
        if (!NotificationPreference::validChannel($channel)) {
            return collect();
        }

        $memberIds = $group->memberships()->pluck('user_id')->toBase();
        if ($group->owner_id) {
            $memberIds->push($group->owner_id);
        }

        $userIds = $memberIds->unique()->filter();

        if ($userIds->isEmpty()) {
            return collect();
        }

        return User::query()
            ->whereIn('id', $userIds)
            ->whereHas('notificationPreferences', fn ($query) => $query->where('channel', $channel))
            ->get();
    }
}
