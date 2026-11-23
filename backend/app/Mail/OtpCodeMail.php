<?php

namespace App\Mail;

use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** One-time verification code (registration or password reset), in the member's language. */
class OtpCodeMail extends Mailable
{
    use Queueable;

    private const TEXT = [
        'en' => [
            'otp' => ['subject' => 'Your :site verification code', 'intro' => 'Use this code to finish creating your account:'],
            'password_reset_otp' => ['subject' => 'Your :site password reset code', 'intro' => 'Use this code to reset your password:'],
            'hello' => 'Hello',
            'expires' => 'The code expires in 5 minutes.',
            'ignore' => "If you didn't ask for this, you can ignore this email. Never share this code with anyone.",
        ],
        'si' => [
            'otp' => ['subject' => ':site සත්‍යාපන කේතය', 'intro' => 'ඔබේ ගිණුම සෑදීම සම්පූර්ණ කිරීමට මෙම කේතය භාවිත කරන්න:'],
            'password_reset_otp' => ['subject' => ':site මුරපදය නැවත සැකසීමේ කේතය', 'intro' => 'ඔබේ මුරපදය නැවත සැකසීමට මෙම කේතය භාවිත කරන්න:'],
            'hello' => 'ආයුබෝවන්',
            'expires' => 'මෙම කේතය මිනිත්තු 5කින් කල් ඉකුත් වේ.',
            'ignore' => 'ඔබ මෙය ඉල්ලුවේ නැත්නම්, මෙම ඊමේල් පණිවිඩය නොසලකා හරින්න. මෙම කේතය කිසිවෙකු සමඟ බෙදා නොගන්න.',
        ],
        'ta' => [
            'otp' => ['subject' => 'உங்கள் :site சரிபார்ப்புக் குறியீடு', 'intro' => 'உங்கள் கணக்கை உருவாக்குவதை முடிக்க இந்தக் குறியீட்டைப் பயன்படுத்துங்கள்:'],
            'password_reset_otp' => ['subject' => 'உங்கள் :site கடவுச்சொல் மீட்டமைப்புக் குறியீடு', 'intro' => 'உங்கள் கடவுச்சொல்லை மீட்டமைக்க இந்தக் குறியீட்டைப் பயன்படுத்துங்கள்:'],
            'hello' => 'வணக்கம்',
            'expires' => 'இந்தக் குறியீடு 5 நிமிடங்களில் காலாவதியாகும்.',
            'ignore' => 'நீங்கள் இதைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும். இந்தக் குறியீட்டை யாருடனும் பகிர வேண்டாம்.',
        ],
    ];

    public function __construct(
        public readonly string $code,
        public readonly string $event,
        public readonly string $lang = 'en',
        public readonly ?string $name = null,
    ) {}

    private function strings(): array
    {
        $t = self::TEXT[$this->lang] ?? self::TEXT['en'];
        $site = (string) Setting::get('site.name', config('app.name'));
        $kind = $t[$this->event] ?? $t['otp'];

        return [
            'site' => $site,
            'subject' => str_replace(':site', $site, $kind['subject']),
            'intro' => $kind['intro'],
            'hello' => $t['hello'],
            'expires' => $t['expires'],
            'ignore' => $t['ignore'],
        ];
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->strings()['subject']);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.otp-code',
            text: 'mail.otp-code-text',
            with: ['t' => $this->strings(), 'code' => $this->code, 'name' => $this->name, 'lang' => $this->lang],
        );
    }
}
