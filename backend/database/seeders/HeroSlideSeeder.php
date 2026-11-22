<?php

namespace Database\Seeders;

use App\Models\HeroSlide;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Homepage hero slides. Idempotent: safe to run on a live database
 * (php artisan db:seed --class=HeroSlideSeeder) — it only creates slides when none exist.
 * In titles, *word* renders in gold.
 */
class HeroSlideSeeder extends Seeder
{
    public function run(): void
    {
        if (HeroSlide::query()->exists()) {
            $this->command?->info('  Hero slides already exist — skipped.');

            return;
        }

        $background = 'hero/hero-bg.jpg';
        Storage::disk('public')->put($background, file_get_contents(database_path('seeders/assets/hero-bg.jpg')));

        $badge = [
            'en' => 'Protection • Savings • A Valuable Lifestyle',
            'si' => 'ආරක්ෂාව • ඉතුරුම් • වටිනා ජීවන රටාව',
            'ta' => 'பாதுகாப்பு • சேமிப்பு • மதிப்புமிக்க வாழ்க்கை முறை',
        ];
        $primary = ['en' => 'Become a member', 'si' => 'සාමාජිකයෙකු වන්න', 'ta' => 'உறுப்பினராகுங்கள்'];
        $secondary = ['en' => 'Browse partners', 'si' => 'හවුල්කරුවන් බලන්න', 'ta' => 'கூட்டாளர்களைப் பாருங்கள்'];

        $slides = [
            [
                'title' => [
                    'en' => 'One card for your *family’s* protection and everyday savings.',
                    'si' => 'ඔබේ *පවුලේ* ආරක්ෂාවට සහ දෛනික ඉතුරුම්වලට එකම කාඩ්පතක්.',
                    'ta' => 'உங்கள் *குடும்பத்தின்* பாதுகாப்புக்கும் அன்றாட சேமிப்புக்கும் ஒரே அட்டை.',
                ],
                'subtitle' => [
                    'en' => 'Jeewanasaviya members save on healthcare, medical services, groceries, fuel and everyday essentials at trusted partners across Sri Lanka — verified instantly with a QR code on your phone.',
                    'si' => 'ජීවනසවිය සාමාජිකයින්ට ශ්‍රී ලංකාව පුරා විශ්වාසනීය හවුල්කරුවන් වෙතින් සෞඛ්‍ය, වෛද්‍ය සේවා, සිල්ලර බඩු, ඉන්ධන සහ දෛනික අවශ්‍යතා සඳහා ඉතුරුම් — ඔබගේ දුරකථනයේ QR කේතයෙන් ක්ෂණිකව තහවුරු කෙරේ.',
                    'ta' => 'ஜீவனசவிய உறுப்பினர்கள் இலங்கை முழுவதும் நம்பகமான கூட்டாளர்களிடம் சுகாதாரம், மருத்துவ சேவைகள், மளிகை, எரிபொருள் மற்றும் அன்றாடத் தேவைகளில் சேமிக்கிறார்கள் — உங்கள் தொலைபேசியில் QR குறியீட்டால் உடனடியாக சரிபார்க்கப்படும்.',
                ],
                'cta_primary_url' => '/register',
                'cta_secondary_url' => '/partners',
            ],
            [
                'title' => [
                    'en' => 'Healthcare, groceries and fuel — *save more* every month.',
                    'si' => 'සෞඛ්‍ය, සිල්ලර බඩු සහ ඉන්ධන — සෑම මසකම *වැඩිපුර ඉතුරු* කරන්න.',
                    'ta' => 'சுகாதாரம், மளிகை மற்றும் எரிபொருள் — ஒவ்வொரு மாதமும் *அதிகம் சேமியுங்கள்*.',
                ],
                'subtitle' => [
                    'en' => 'Exclusive member discounts at clinics, supermarkets, fuel stations, salons and more — unlocked the moment your membership is active.',
                    'si' => 'සායන, සුපිරි වෙළඳසැල්, ඉන්ධන පිරවුම්හල්, රූපලාවණ්‍යාගාර සහ තවත් බොහෝ තැන්වල සාමාජික වට්ටම් — ඔබේ සාමාජිකත්වය සක්‍රිය වූ විගසම.',
                    'ta' => 'மருத்துவமனைகள், பல்பொருள் அங்காடிகள், எரிபொருள் நிலையங்கள், அழகு நிலையங்கள் மற்றும் பலவற்றில் உறுப்பினர் தள்ளுபடிகள் — உங்கள் உறுப்பினர் தகுதி செயல்பட்டவுடன்.',
                ],
                'cta_primary_url' => '/#plans',
                'cta_secondary_url' => '/partners',
                'cta_primary_label' => ['en' => 'View plans', 'si' => 'සැලසුම් බලන්න', 'ta' => 'திட்டங்களைப் பாருங்கள்'],
            ],
        ];

        foreach ($slides as $i => $s) {
            HeroSlide::query()->create([
                'badge' => $badge,
                'title' => $s['title'],
                'subtitle' => $s['subtitle'],
                'cta_primary_label' => $s['cta_primary_label'] ?? $primary,
                'cta_primary_url' => $s['cta_primary_url'],
                'cta_secondary_label' => $secondary,
                'cta_secondary_url' => $s['cta_secondary_url'],
                'background_path' => $background,
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }
    }
}
