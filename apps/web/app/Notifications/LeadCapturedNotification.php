<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class LeadCapturedNotification extends Notification implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected readonly Lead $lead,
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
        $lead = $this->lead;
        $subject = sprintf(
            'New lead captured%s',
            $this->listingTitle ? " for {$this->listingTitle}" : ''
        );

        $mail = (new MailMessage())
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},")
            ->line('A new lead was captured by your AI Phone Assistant.');

        if ($this->groupName) {
            $mail->line("Workspace: {$this->groupName}");
        }

        if ($this->listingTitle) {
            $mail->line("Listing: {$this->listingTitle}");
        }

        if ($lead->name) {
            $mail->line("Lead name: {$lead->name}");
        }

        $mail->line("Phone: {$lead->phone_e164}");

        if ($lead->email) {
            $mail->line("Email: {$lead->email}");
        }

        if ($lead->notes) {
            $mail->line("Notes: {$lead->notes}");
        }

        $mail->line('Status: ' . ($lead->status ?? 'new'))
            ->line('Log in to review and follow up with the caller.');

        return $mail;
    }
}
