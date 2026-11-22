<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Str;
use Throwable;

class PortalNotification extends Notification implements ShouldBroadcastNow
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public string $type = 'info',
        public ?string $link = null,
        public ?string $icon = null,
        public array $data = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'link' => $this->link,
            'icon' => $this->icon,
            'data' => $this->data,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => (string) Str::uuid(),
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'link' => $this->link,
            'icon' => $this->icon,
            'created_at' => now()->toIso8601String(),
            'read_at' => null,
        ]);
    }

    /**
     * Safely dispatches the notification to one or more notifiables.
     * If broadcasting fails (e.g. Reverb socket down), gracefully persists to database.
     */
    public static function dispatchTo(
        mixed $notifiables,
        string $title,
        string $message,
        string $type = 'info',
        ?string $link = null,
        ?string $icon = null,
        array $data = []
    ): void {
        $notification = new self($title, $message, $type, $link, $icon, $data);
        try {
            NotificationFacade::send($notifiables, $notification);
        } catch (Throwable $e) {
            report($e);
            try {
                // Fallback: save to database only if broadcast failed
                $dbOnly = new class($title, $message, $type, $link, $icon, $data) extends PortalNotification {
                    public function via(object $notifiable): array
                    {
                        return ['database'];
                    }
                };
                NotificationFacade::send($notifiables, $dbOnly);
            } catch (Throwable) {
                // Ignore silent database duplication errors
            }
        }
    }
}
