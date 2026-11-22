<?php

namespace Database\Seeders;

use App\Models\BusinessCategory;
use App\Models\MembershipTier;
use App\Models\Offer;
use App\Models\Partner;
use App\Services\PartnerLogoFetcher;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(PartnerLogoFetcher $logos): void
    {
        $tiers = [
            'silver' => [
                'name' => ['en' => 'Silver', 'si' => 'රිදී', 'ta' => 'வெள்ளி'],
                'description' => ['en' => 'Everyday savings at dining, retail and wellness partners.', 'si' => 'ආහාර, සිල්ලර සහ සුවතා හවුල්කරුවන් වෙතින් දෛනික ඉතිරිකිරීම්.', 'ta' => 'உணவு, சில்லறை மற்றும் நலவாழ்வு கூட்டாளர்களிடம் தினசரி சேமிப்பு.'],
                'features' => [
                    ['en' => 'Up to 10% off at 40+ partners', 'si' => 'හවුල්කරුවන් 40+ වෙතින් 10% දක්වා වට්ටම්', 'ta' => '40+ கூட்டாளர்களிடம் 10% வரை தள்ளுபடி'],
                    ['en' => 'Digital QR membership card', 'si' => 'ඩිජිටල් QR සාමාජික කාඩ්පත', 'ta' => 'டிஜிட்டல் QR உறுப்பினர் அட்டை'],
                    ['en' => 'SMS renewal reminders', 'si' => 'SMS අලුත් කිරීමේ සිහිකැඳවීම්', 'ta' => 'SMS புதுப்பிப்பு நினைவூட்டல்கள்'],
                ],
                'price' => 2500, 'duration_value' => 12, 'duration_unit' => 'months', 'color' => '#64748b', 'priority' => 1, 'is_featured' => false,
            ],
            'gold' => [
                'name' => ['en' => 'Gold', 'si' => 'රන්', 'ta' => 'தங்கம்'],
                'description' => ['en' => 'Our most popular plan — hotel stays, salons and clinics included.', 'si' => 'අපගේ වඩාත් ජනප්‍රිය සැලසුම — හෝටල්, රූපලාවණ්‍යාගාර සහ සායන ඇතුළුව.', 'ta' => 'எங்கள் மிகவும் பிரபலமான திட்டம் — ஹோட்டல்கள், அழகு நிலையங்கள் மற்றும் மருத்துவமனைகள் உட்பட.'],
                'features' => [
                    ['en' => 'Everything in Silver', 'si' => 'රිදී සියල්ල', 'ta' => 'வெள்ளியில் உள்ள அனைத்தும்'],
                    ['en' => 'Up to 25% off hotels & spas', 'si' => 'හෝටල් සහ ස්පා සඳහා 25% දක්වා වට්ටම්', 'ta' => 'ஹோட்டல்கள் & ஸ்பாக்களில் 25% வரை தள்ளுபடி'],
                    ['en' => 'Priority partner bookings', 'si' => 'ප්‍රමුඛතා වෙන්කිරීම්', 'ta' => 'முன்னுரிமை முன்பதிவுகள்'],
                ],
                'price' => 6500, 'duration_value' => 12, 'duration_unit' => 'months', 'color' => '#c99227', 'priority' => 2, 'is_featured' => true,
            ],
            'platinum' => [
                'name' => ['en' => 'Platinum', 'si' => 'ප්ලැටිනම්', 'ta' => 'பிளாட்டினம்'],
                'description' => ['en' => 'The full network with the deepest discounts and concierge support.', 'si' => 'ගැඹුරුම වට්ටම් සහ විශේෂ සහාය සමඟ සම්පූර්ණ ජාලය.', 'ta' => 'ஆழமான தள்ளுபடிகள் மற்றும் சிறப்பு ஆதரவுடன் முழு வலையமைப்பு.'],
                'features' => [
                    ['en' => 'Everything in Gold', 'si' => 'රන් සියල්ල', 'ta' => 'தங்கத்தில் உள்ள அனைத்தும்'],
                    ['en' => 'Up to 40% off premium partners', 'si' => 'ප්‍රිමියම් හවුල්කරුවන් වෙතින් 40% දක්වා', 'ta' => 'பிரீமியம் கூட்டாளர்களிடம் 40% வரை'],
                    ['en' => 'Dedicated concierge line', 'si' => 'කැපවූ සේවා දුරකථන මාර්ගය', 'ta' => 'பிரத்யேக சேவை இணைப்பு'],
                    ['en' => 'Free annual health check', 'si' => 'නොමිලේ වාර්ෂික සෞඛ්‍ය පරීක්ෂණය', 'ta' => 'இலவச வருடாந்திர சுகாதார பரிசோதனை'],
                ],
                'price' => 14500, 'duration_value' => 12, 'duration_unit' => 'months', 'color' => '#13224a', 'priority' => 3, 'is_featured' => false,
            ],
        ];

        $tierModels = [];
        foreach ($tiers as $slug => $t) {
            $tierModels[$slug] = MembershipTier::query()->updateOrCreate(['slug' => $slug], $t + ['is_active' => true]);
        }

        $categories = [
            'hotels' => [['en' => 'Hotels & Resorts', 'si' => 'හෝටල් සහ නිකේතන', 'ta' => 'ஹோட்டல்கள் & ரிசார்ட்டுகள்'], 'bed-double'],
            'salons' => [['en' => 'Salons & Spas', 'si' => 'රූපලාවණ්‍යාගාර සහ ස්පා', 'ta' => 'அழகு நிலையங்கள் & ஸ்பா'], 'scissors'],
            'retail' => [['en' => 'Retail & Fashion', 'si' => 'සිල්ලර සහ විලාසිතා', 'ta' => 'சில்லறை & ஃபேஷன்'], 'shopping-bag'],
            'clinics' => [['en' => 'Clinics & Health', 'si' => 'සායන සහ සෞඛ්‍ය', 'ta' => 'மருத்துவமனைகள் & சுகாதாரம்'], 'stethoscope'],
            'gyms' => [['en' => 'Gyms & Fitness', 'si' => 'ව්‍යායාම ශාලා', 'ta' => 'உடற்பயிற்சி நிலையங்கள்'], 'dumbbell'],
            'dining' => [['en' => 'Dining & Cafés', 'si' => 'ආපනශාලා සහ කැෆේ', 'ta' => 'உணவகங்கள் & கஃபேக்கள்'], 'utensils'],
            'grocery' => [['en' => 'Supermarkets & Grocery', 'si' => 'සුපිරි වෙළඳසැල්', 'ta' => 'பல்பொருள் அங்காடிகள்'], 'shopping-cart'],
            'fuel' => [['en' => 'Fuel Stations', 'si' => 'ඉන්ධන පිරවුම්හල්', 'ta' => 'எரிபொருள் நிலையங்கள்'], 'fuel'],
        ];

        $cat = [];
        $i = 0;
        foreach ($categories as $slug => [$name, $icon]) {
            $cat[$slug] = BusinessCategory::query()->updateOrCreate(['slug' => $slug], ['name' => $name, 'icon' => $icon, 'sort_order' => $i++]);
        }

        $partners = [
            ['serendib-lagoon-resort', 'hotels', ['en' => 'Serendib Lagoon Resort', 'si' => 'සෙරෙන්ඩිබ් ලැගූන් රිසෝට්', 'ta' => 'செரண்டிப் லகூன் ரிசார்ட்'], 'Negombo', '+94 31 222 1100', true,
                [['Negombo Beachfront', 'Porutota Road, Negombo', 'Negombo']],
                [
                    [['en' => '25% off room rates', 'si' => 'කාමර ගාස්තු 25% වට්ටම්', 'ta' => 'அறை கட்டணத்தில் 25% தள்ளுபடி'], 'percentage', 25, ['gold', 'platinum']],
                    [['en' => 'Complimentary dinner for two', 'si' => 'දෙදෙනෙකුට නොමිලේ රාත්‍රී ආහාරය', 'ta' => 'இருவருக்கு இலவச இரவு உணவு'], 'freebie', null, ['platinum']],
                ]],
            ['kandy-hills-spa', 'salons', ['en' => 'Kandy Hills Spa & Salon', 'si' => 'මහනුවර හිල්ස් ස්පා', 'ta' => 'கண்டி ஹில்ஸ் ஸ்பா'], 'Kandy', '+94 81 223 4455', true,
                [['Peradeniya Road', '45 Peradeniya Road, Kandy', 'Kandy'], ['Kandy City Centre', 'Level 2, KCC, Kandy', 'Kandy']],
                [
                    [['en' => '15% off all spa treatments', 'si' => 'සියලු ස්පා ප්‍රතිකාර 15% වට්ටම්', 'ta' => 'அனைத்து ஸ்பா சிகிச்சைகளுக்கும் 15% தள்ளுபடி'], 'percentage', 15, ['silver', 'gold', 'platinum']],
                    [['en' => '30% off bridal packages', 'si' => 'මනාලියන් පැකේජ 30% වට්ටම්', 'ta' => 'மணப்பெண் தொகுப்புகளில் 30% தள்ளுபடி'], 'percentage', 30, ['gold', 'platinum']],
                ]],
            ['colombo-fithub', 'gyms', ['en' => 'Colombo FitHub', 'si' => 'කොළඹ ෆිට්හබ්', 'ta' => 'கொழும்பு ஃபிட்ஹப்'], 'Colombo', '+94 11 250 7788', false,
                [['Colombo 05', '22 Havelock Road, Colombo 05', 'Colombo']],
                [
                    [['en' => 'LKR 3,000 off annual membership', 'si' => 'වාර්ෂික සාමාජිකත්වයට රු. 3,000 අඩු', 'ta' => 'வருடாந்திர உறுப்பினருக்கு ரூ. 3,000 தள்ளுபடி'], 'fixed', 3000, ['silver', 'gold', 'platinum']],
                ]],
            ['lanka-care-medical', 'clinics', ['en' => 'Lanka Care Medical Centre', 'si' => 'ලංකා කෙයාර් වෛද්‍ය මධ්‍යස්ථානය', 'ta' => 'லங்கா கேர் மருத்துவ மையம்'], 'Colombo', '+94 11 269 0000', true,
                [['Bambalapitiya', '301 Galle Road, Colombo 04', 'Colombo'], ['Nugegoda', '88 High Level Road, Nugegoda', 'Nugegoda']],
                [
                    [['en' => '10% off lab tests', 'si' => 'රසායනාගාර පරීක්ෂණ 10% වට්ටම්', 'ta' => 'ஆய்வக சோதனைகளுக்கு 10% தள்ளுபடி'], 'percentage', 10, ['silver', 'gold', 'platinum']],
                    [['en' => 'Free annual full-body check-up', 'si' => 'නොමිලේ වාර්ෂික සම්පූර්ණ ශරීර පරීක්ෂණය', 'ta' => 'இலவச வருடாந்திர முழு உடல் பரிசோதனை'], 'freebie', null, ['platinum']],
                ]],
            ['galle-fort-bookhouse', 'retail', ['en' => 'Galle Fort Bookhouse', 'si' => 'ගාලු කොටුව පොත් මැදුර', 'ta' => 'காலி கோட்டை புத்தக இல்லம்'], 'Galle', '+94 91 224 5566', false,
                [['Church Street', '12 Church Street, Galle Fort', 'Galle']],
                [
                    [['en' => '12% off books & stationery', 'si' => 'පොත් සහ ලිපිද්‍රව්‍ය 12% වට්ටම්', 'ta' => 'புத்தகங்கள் & எழுதுபொருட்களுக்கு 12% தள்ளுபடி'], 'percentage', 12, ['silver', 'gold', 'platinum']],
                ]],
            ['island-spice-kitchen', 'dining', ['en' => 'Island Spice Kitchen', 'si' => 'අයිලන්ඩ් ස්පයිස් කිචන්', 'ta' => 'ஐலண்ட் ஸ்பைஸ் கிச்சன்'], 'Colombo', '+94 11 258 3322', true,
                [['Colombo 07', '5 Flower Road, Colombo 07', 'Colombo']],
                [
                    [['en' => '10% off the total bill', 'si' => 'සම්පූර්ණ බිලට 10% වට්ටම්', 'ta' => 'மொத்த பில்லில் 10% தள்ளுபடி'], 'percentage', 10, ['silver', 'gold', 'platinum']],
                    [['en' => '20% off weekend brunch', 'si' => 'සති අන්ත බ්‍රන්ච් 20% වට්ටම්', 'ta' => 'வார இறுதி புருன்ச்சில் 20% தள்ளுபடி'], 'percentage', 20, ['gold', 'platinum']],
                ]],
            ['nuwara-tea-lounge', 'dining', ['en' => 'Nuwara Tea Lounge', 'si' => 'නුවර තේ විවේකාගාරය', 'ta' => 'நுவர தேநீர் விடுதி'], 'Nuwara Eliya', '+94 52 222 9090', false,
                [['Gregory Lake', 'Lake Road, Nuwara Eliya', 'Nuwara Eliya']],
                [
                    [['en' => 'Free dessert with high tea', 'si' => 'හයි ටී සමඟ නොමිලේ අතුරුපසක්', 'ta' => 'ஹை டீயுடன் இலவச இனிப்பு'], 'freebie', null, ['gold', 'platinum']],
                ]],
            ['green-basket-supermarket', 'grocery', ['en' => 'Green Basket Supermarket', 'si' => 'ග්‍රීන් බාස්කට් සුපිරි වෙළඳසැල', 'ta' => 'கிரீன் பாஸ்கட் பல்பொருள் அங்காடி'], 'Kurunegala', '+94 37 222 4411', true,
                [['Kurunegala Town', '18 Colombo Road, Kurunegala', 'Kurunegala'], ['Kandy Road', '240 Kandy Road, Kurunegala', 'Kurunegala']],
                [
                    [['en' => '5% off monthly groceries', 'si' => 'මාසික සිල්ලර බඩු සඳහා 5% වට්ටම්', 'ta' => 'மாதாந்திர மளிகைக்கு 5% தள்ளுபடி'], 'percentage', 5, ['silver', 'gold', 'platinum']],
                    [['en' => 'LKR 1,000 off bills over LKR 15,000', 'si' => 'රු. 15,000ට වැඩි බිල්පත්වලට රු. 1,000 අඩු', 'ta' => 'ரூ. 15,000க்கு மேற்பட்ட பில்களுக்கு ரூ. 1,000 தள்ளுபடி'], 'fixed', 1000, ['gold', 'platinum']],
                ]],
            ['highway-fuel-centre', 'fuel', ['en' => 'Highway Fuel Centre', 'si' => 'හයිවේ ඉන්ධන මධ්‍යස්ථානය', 'ta' => 'ஹைவே எரிபொருள் மையம்'], 'Kurunegala', '+94 37 222 9900', false,
                [['Puttalam Road', 'No. 5, Puttalam Road, Kurunegala', 'Kurunegala']],
                [
                    [['en' => 'LKR 5 off per litre', 'si' => 'ලීටරයකට රු. 5 අඩු', 'ta' => 'லிட்டருக்கு ரூ. 5 தள்ளுபடி'], 'fixed', 5, ['gold', 'platinum']],
                    [['en' => 'Free vehicle wash with a full tank', 'si' => 'ටැංකිය පිරවීමේදී නොමිලේ වාහන සේදීම', 'ta' => 'முழு டேங்குடன் இலவச வாகனக் கழுவல்'], 'freebie', null, ['platinum']],
                ]],
            ['urban-thread', 'retail', ['en' => 'Urban Thread Fashion', 'si' => 'අර්බන් ත්‍රෙඩ් විලාසිතා', 'ta' => 'அர்பன் த்ரெட் ஃபேஷன்'], 'Colombo', '+94 11 230 4040', false,
                [['Liberty Plaza', 'Level 1, Liberty Plaza, Colombo 03', 'Colombo'], ['Kandy', '14 Dalada Veediya, Kandy', 'Kandy']],
                [
                    [['en' => '15% off new arrivals', 'si' => 'නව නිෂ්පාදන 15% වට්ටම්', 'ta' => 'புதிய வரவுகளுக்கு 15% தள்ளுபடி'], 'percentage', 15, ['silver', 'gold', 'platinum']],
                    [['en' => 'Extra 10% during sale season', 'si' => 'විකුණුම් කාලයේ අමතර 10%', 'ta' => 'விற்பனை காலத்தில் கூடுதல் 10%'], 'percentage', 10, ['platinum']],
                ]],
        ];

        foreach ($partners as [$slug, $catSlug, $name, $city, $phone, $featured, $branches, $offers]) {
            $partner = Partner::query()->updateOrCreate(['slug' => $slug], [
                'business_category_id' => $cat[$catSlug]->id,
                'name' => $name,
                'description' => [
                    'en' => "A trusted {$cat[$catSlug]->name['en']} partner in {$city}.",
                    'si' => "{$city} හි විශ්වාසනීය හවුල්කරුවෙක්.",
                    'ta' => "{$city} இல் நம்பகமான கூட்டாளர்.",
                ],
                'phone' => $phone,
                'email' => str_replace('-', '', $slug).'@example.lk',
                'website' => 'https://example.lk/'.$slug,
                'address' => $branches[0][1],
                'city' => $city,
                'google_maps_url' => 'https://maps.google.com/?q='.urlencode($name['en'].' '.$city),
                'is_active' => true,
                'is_featured' => $featured,
            ]);

            // Logo: bundled sample (database/seeders/assets/partners/{slug}.png) first,
            // otherwise a generated initials logo from a public URL (skipped silently when offline).
            if (! $partner->logo_path && ! $logos->useBundled($partner)) {
                try {
                    $logos->fetch($partner->load('category'));
                } catch (\Throwable $e) {
                    $this->command?->warn("  Logo skipped for {$slug}: {$e->getMessage()}");
                }
            }

            $partner->branches()->delete();
            foreach ($branches as [$bName, $addr, $bCity]) {
                $partner->branches()->create(['name' => $bName, 'address' => $addr, 'city' => $bCity, 'phone' => $phone]);
            }

            $partner->offers()->delete();
            foreach ($offers as [$title, $type, $value, $tierSlugs]) {
                $offer = Offer::query()->create([
                    'partner_id' => $partner->id,
                    'title' => $title,
                    'description' => [
                        'en' => 'Show your digital membership card at checkout to redeem.',
                        'si' => 'මුදල් ගෙවීමේදී ඔබේ ඩිජිටල් සාමාජික කාඩ්පත පෙන්වන්න.',
                        'ta' => 'பணம் செலுத்தும்போது உங்கள் டிஜிட்டல் உறுப்பினர் அட்டையைக் காட்டுங்கள்.',
                    ],
                    'terms' => [
                        'en' => 'Cannot be combined with other promotions. Subject to availability.',
                        'si' => 'වෙනත් ප්‍රවර්ධන සමඟ ඒකාබද්ධ කළ නොහැක.',
                        'ta' => 'மற்ற சலுகைகளுடன் இணைக்க முடியாது.',
                    ],
                    'discount_type' => $type,
                    'discount_value' => $value,
                    'starts_at' => now()->subMonths(2)->toDateString(),
                    'ends_at' => now()->addYear()->toDateString(),
                    'is_active' => true,
                ]);
                $offer->tiers()->sync(collect($tierSlugs)->map(fn ($s) => $tierModels[$s]->id)->all());
            }
        }
    }
}
