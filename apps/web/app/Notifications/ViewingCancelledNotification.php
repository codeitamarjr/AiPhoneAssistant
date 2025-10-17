<?php

namespace App\Notifications;

use App\Models\Viewing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class ViewingCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected readonly Viewing $viewing,
        protected readonly ?string $groupName,
        protected readonly ?string $listingTitle
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $viewing = $this->viewing;

        $subject = sprintf(
            'Viewing cancelled%s',
            $this->listingTitle ? " for {$this->listingTitle}" : ''
        );

        $mail = (new MailMessage())
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},")
            ->line('A viewing booked through the AI Phone Assistant has been cancelled.');

        if ($this->groupName) {
            $mail->line("Workspace: {$this->groupName}");
        }

        if ($this->listingTitle) {
            $mail->line("Listing: {$this->listingTitle}");
        }

        $mail->line("Cancelled appointment reference: {$viewing->id}");

        if ($viewing->scheduled_at) {
            $mail->line('Scheduled for: ' . $viewing->scheduled_at->toDayDateTimeString());
        }

        if ($viewing->name) {
            $mail->line("Guest name: {$viewing->name}");
        }

        if ($viewing->phone) {
            $mail->line("Phone: {$viewing->phone}");
        }

        if ($viewing->email) {
            $mail->line("Email: {$viewing->email}");
        }

        $mail->line('No further action is required, but you can follow up if needed.');

        return $mail;
    }
}
