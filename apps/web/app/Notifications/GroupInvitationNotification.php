<?php

namespace App\Notifications;

use App\Models\GroupInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class GroupInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly GroupInvitation $invitation, private readonly string $resetToken)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $group = $this->invitation->group;
        $inviter = $this->invitation->inviter;

        $resetUrl = url(route('password.reset', [
            'token' => $this->resetToken,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $inviterName = $inviter?->name ?? 'a teammate';
        $workspace = $group?->name ?? 'AI Phone Assistant';
        $inviteeName = $this->invitation->name ?? $notifiable->name ?? 'there';

        return (new MailMessage)
            ->subject("You're invited to join {$workspace}")
            ->greeting("Hi {$inviteeName},")
            ->line("Welcome to AI Phone Assistant! {$inviterName} has invited you to collaborate inside the \"{$workspace}\" workspace.")
            ->line('To get started, set your password using the button below. This will confirm your invitation and give you immediate access to the workspace.')
            ->action('Set your password', $resetUrl)
            ->line('If you were not expecting this invitation, feel free to ignore this message.');
    }
}
