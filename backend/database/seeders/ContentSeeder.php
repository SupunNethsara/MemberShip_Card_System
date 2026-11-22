<?php

namespace Database\Seeders;

use App\Models\CmsContent;
use App\Models\Faq;
use App\Models\Setting;
use App\Models\SmsTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        Setting::put('site.name', 'Jeewanasaviya');
        // Contact details are left blank: enter the real ones in Admin › CMS › Site settings.
        Setting::put('contact.email', '');
        Setting::put('contact.phone', '');

        // Brand logo: the official transparent PNG, used everywhere (site, cards, receipts).
        Storage::disk('public')->put('brand/jeewanasaviya-logo.png', file_get_contents(database_path('seeders/assets/jeewanasaviya-logo.png')));
        Setting::put('site.logo', 'brand/jeewanasaviya-logo.png');
        Setting::put('sms.enabled', true);

        $blocks = [
            ['brand.name', 'brand', 'Brand name', 'text', [
                'en' => 'Jeewanasaviya',
                'si' => 'ජීවනසවිය',
                'ta' => 'ஜீவனசவிய',
            ]],
            ['brand.tagline', 'brand', 'Brand tagline', 'text', [
                'en' => 'Protection • Savings • A Valuable Lifestyle',
                'si' => 'ආරක්ෂාව • ඉතුරුම් • වටිනා ජීවන රටාව',
                'ta' => 'பாதுகாப்பு • சேமிப்பு • மதிப்புமிக்க வாழ்க்கை முறை',
            ]],
            ['hero.eyebrow', 'hero', 'Hero eyebrow', 'text', [
                'en' => 'Protection • Savings • A Valuable Lifestyle',
                'si' => 'ආරක්ෂාව • ඉතුරුම් • වටිනා ජීවන රටාව',
                'ta' => 'பாதுகாப்பு • சேமிப்பு • மதிப்புமிக்க வாழ்க்கை முறை',
            ]],
            ['hero.title', 'hero', 'Hero headline', 'text', [
                'en' => 'One card for your family’s protection and everyday savings.',
                'si' => 'ඔබේ පවුලේ ආරක්ෂාවට සහ දෛනික ඉතුරුම්වලට එකම කාඩ්පතක්.',
                'ta' => 'உங்கள் குடும்பத்தின் பாதுகாப்புக்கும் அன்றாட சேமிப்புக்கும் ஒரே அட்டை.',
            ]],
            ['hero.subtitle', 'hero', 'Hero sub-headline', 'textarea', [
                'en' => 'Jeewanasaviya members save on healthcare, medical services, groceries, fuel and everyday essentials at trusted partners across Sri Lanka — verified instantly with a QR code on your phone.',
                'si' => 'ජීවනසවිය සාමාජිකයින්ට ශ්‍රී ලංකාව පුරා විශ්වාසනීය හවුල්කරුවන් වෙතින් සෞඛ්‍ය, වෛද්‍ය සේවා, සිල්ලර බඩු, ඉන්ධන සහ දෛනික අවශ්‍යතා සඳහා ඉතුරුම් — ඔබගේ දුරකථනයේ QR කේතයෙන් ක්ෂණිකව තහවුරු කෙරේ.',
                'ta' => 'ஜீவனசவிய உறுப்பினர்கள் இலங்கை முழுவதும் நம்பகமான கூட்டாளர்களிடம் சுகாதாரம், மருத்துவ சேவைகள், மளிகை, எரிபொருள் மற்றும் அன்றாடத் தேவைகளில் சேமிக்கிறார்கள் — உங்கள் தொலைபேசியில் QR குறியீட்டால் உடனடியாக சரிபார்க்கப்படும்.',
            ]],
            ['hero.cta_primary', 'hero', 'Primary button', 'text', ['en' => 'Become a member', 'si' => 'සාමාජිකයෙකු වන්න', 'ta' => 'உறுப்பினராகுங்கள்']],
            ['hero.cta_secondary', 'hero', 'Secondary button', 'text', ['en' => 'Browse partners', 'si' => 'හවුල්කරුවන් බලන්න', 'ta' => 'கூட்டாளர்களைப் பாருங்கள்']],
            ['how.title', 'how', 'How it works — title', 'text', ['en' => 'How it works', 'si' => 'එය ක්‍රියා කරන ආකාරය', 'ta' => 'இது எப்படி செயல்படுகிறது']],
            ['how.step1', 'how', 'Step 1', 'text', ['en' => 'Choose a tier that fits how you spend.', 'si' => 'ඔබේ වියදම් රටාවට ගැළපෙන මට්ටමක් තෝරන්න.', 'ta' => 'உங்கள் செலவுக்கு ஏற்ற நிலையைத் தேர்ந்தெடுக்கவும்.']],
            ['how.step2', 'how', 'Step 2', 'text', ['en' => 'Pay securely online — your card activates instantly.', 'si' => 'මාර්ගගතව ආරක්ෂිතව ගෙවන්න — ඔබේ කාඩ්පත ක්ෂණිකව සක්‍රිය වේ.', 'ta' => 'பாதுகாப்பாக ஆன்லைனில் செலுத்துங்கள் — உங்கள் அட்டை உடனடியாக செயல்படும்.']],
            ['how.step3', 'how', 'Step 3', 'text', ['en' => 'Show your QR card at any partner and save.', 'si' => 'ඕනෑම හවුල්කරුවෙකු වෙත ඔබේ QR කාඩ්පත පෙන්වා ඉතිරි කරගන්න.', 'ta' => 'எந்த கூட்டாளரிடமும் உங்கள் QR அட்டையைக் காட்டி சேமியுங்கள்.']],
            ['contact.address', 'contact', 'Office address', 'textarea', [
                'en' => '',
                'si' => '',
                'ta' => '',
            ]],
            ['contact.hours', 'contact', 'Support hours', 'text', [
                'en' => 'Mon – Fri, 9.00 am – 5.30 pm',
                'si' => 'සඳුදා – සිකුරාදා, පෙ.ව. 9.00 – ප.ව. 5.30',
                'ta' => 'திங்கள் – வெள்ளி, காலை 9.00 – மாலை 5.30',
            ]],
            ['contact.intro', 'contact', 'Contact page subtitle', 'text', [
                'en' => 'Have a question about membership plans, partner privileges, or payment processing? We are here to assist you.',
                'si' => 'සාමාජික සැලසුම්, හවුල්කාර වට්ටම් හෝ ගෙවීම් පිළිබඳව ඔබට ගැටළුවක් තිබේද? ඔබට සහය වීමට අපි සූදානම්.',
                'ta' => 'உறுப்பினர் திட்டங்கள், கூட்டாளர் சலுகைகள் அல்லது கட்டணம் செலுத்துதல் பற்றி ஏதேனும் கேள்விகள் உள்ளதா? உங்களுக்கு உதவ நாங்கள் தயாராக உள்ளோம்.',
            ]],
            ['terms.body', 'legal', 'Terms & Conditions', 'richtext', [
                'en' => "1. Membership\nMembership is personal and non-transferable. The card must be presented with a valid photo ID on request.\n\n2. Validity\nEach tier is valid for the period shown at purchase and activates once payment is confirmed.\n\n3. Partner offers\nOffers are provided by independent partner businesses and may change. Partners may apply their own terms, blackout dates and availability.\n\n4. Payments & refunds\nFees are non-refundable once a membership has been activated, except where required by law.\n\n5. Privacy\nWe store only the information needed to run your membership and never sell your data.",
                'si' => "1. සාමාජිකත්වය\nසාමාජිකත්වය පුද්ගලික වන අතර පැවරිය නොහැක. ඉල්ලූ විට වලංගු ඡායාරූප හැඳුනුම්පතක් සමඟ කාඩ්පත ඉදිරිපත් කළ යුතුය.\n\n2. වලංගුභාවය\nසෑම මට්ටමක්ම මිලදී ගැනීමේදී පෙන්වන කාලය සඳහා වලංගු වන අතර ගෙවීම තහවුරු වූ පසු සක්‍රිය වේ.\n\n3. හවුල්කාර දීමනා\nදීමනා ස්වාධීන හවුල්කාර ව්‍යාපාර විසින් සපයනු ලබන අතර වෙනස් විය හැක.\n\n4. ගෙවීම් සහ ආපසු ගෙවීම්\nසාමාජිකත්වය සක්‍රිය කළ පසු ගාස්තු ආපසු ගෙවනු නොලැබේ.\n\n5. පෞද්ගලිකත්වය\nඔබගේ සාමාජිකත්වය පවත්වාගෙන යාමට අවශ්‍ය තොරතුරු පමණක් අපි ගබඩා කරමු.",
                'ta' => "1. உறுப்பினர் தகுதி\nஉறுப்பினர் தகுதி தனிப்பட்டது மற்றும் மாற்ற முடியாதது. கோரிக்கையின் பேரில் செல்லுபடியாகும் புகைப்பட அடையாள அட்டையுடன் அட்டையைக் காட்ட வேண்டும்.\n\n2. செல்லுபடி\nஒவ்வொரு நிலையும் வாங்கும் போது காட்டப்படும் காலத்திற்கு செல்லுபடியாகும்.\n\n3. கூட்டாளர் சலுகைகள்\nசலுகைகள் சுயாதீன கூட்டாளர் வணிகங்களால் வழங்கப்படுகின்றன மற்றும் மாறலாம்.\n\n4. கட்டணங்கள் மற்றும் திருப்பிச் செலுத்துதல்\nஉறுப்பினர் தகுதி செயல்படுத்தப்பட்ட பின் கட்டணங்கள் திருப்பித் தரப்படாது.\n\n5. தனியுரிமை\nஉங்கள் உறுப்பினர் தகுதியை இயக்கத் தேவையான தகவல்களை மட்டுமே நாங்கள் சேமிக்கிறோம்.",
            ]],
            ['privacy.body', 'legal', 'Privacy Policy', 'richtext', [
                'en' => "1. Information We Collect\nWe collect personal details necessary to provide our membership services: your full name, email address, mobile number, National Identity Card (NIC) number, and language preference.\n\n2. How We Use Information\nYour data is used to issue your digital QR membership card, verify your discount privileges at partner outlets, send transactional SMS confirmations, and provide customer support.\n\n3. Payment Data Security\nAll payments are processed securely through licensed payment gateways (PayHere, WebXPay, Stripe). We never store or access your credit/debit card numbers or CVV.\n\n4. Third-Party Sharing\nWe never sell, rent, or trade your personal data. Merchant partners only verify your active membership status and name.\n\n5. Your Rights\nYou can review and update your profile details in the Member Portal or contact support to request data removal.",
                'si' => "1. අප රැස් කරන තොරතුරු\nඅපගේ සාමාජික සේවා සැපයීමට අවශ්‍ය පුද්ගලික තොරතුරු පමණක් අප රැස් කරමු: සම්පූර්ණ නම, විද්‍යුත් තැපෑල, ජංගම දුරකථන අංකය, ජාතික හැඳුනුම්පත් (NIC) අංකය සහ භාෂා මනාපය.\n\n2. තොරතුරු භාවිතා කරන ආකාරය\nඔබගේ ඩිජිටල් QR කාඩ්පත නිකුත් කිරීමට, හවුල්කාර ආයතන වලින් වට්ටම් තහවුරු කිරීමට, SMS දැනුම්දීම් එවීමට සහ පාරිභෝගික සහය ලබා දීමට ඔබගේ දත්ත භාවිතා කරයි.\n\n3. ගෙවීම් දත්ත ආරක්ෂාව\nසියලුම ගෙවීම් බලපත්‍රලාභී Payment Gateways (PayHere, WebXPay, Stripe) හරහා 256-bit SSL ආරක්ෂිතව සිදු කෙරේ. අපි ඔබගේ කාඩ්පත් අංක හෝ CVV ගබඩා කර නොගනිමු.\n\n4. තෙවන පාර්ශවයන්ට ලබා නොදීම\nඅපි කිසිවිටෙක ඔබගේ පුද්ගලික තොරතුරු තෙවන පාර්ශවයන්ට විකුණන්නේ හෝ ලබා දෙන්නේ නැත.\n\n5. ඔබගේ අයිතිවාසිකම්\nසාමාජික ද්වාරය හරහා ඕනෑම වේලාවක ඔබගේ තොරතුරු යාවත්කාලීන කිරීමට හෝ දත්ත ඉවත් කිරීමට ඉල්ලුම් කළ හැක.",
                'ta' => "1. நாங்கள் சேகரிக்கும் தகவல்கள்\nஎங்கள் உறுப்பினர் சேவைகளை வழங்க தேவையான தனிப்பட்ட தகவல்களை மட்டுமே நாங்கள் சேகரிக்கிறோம்: முழுப் பெயர், மின்னஞ்சல், மொபைல் எண், தேசிய அடையாள அட்டை (NIC) எண் மற்றும் மொழி முன்னுரிமை.\n\n2. தகவல்களைப் பயன்படுத்தும் விதம்\nஉங்கள் டிஜிட்டல் QR அட்டையை வழங்கவும், கூட்டாளர் நிறுவனங்களில் தள்ளுபடிகளை உறுதிப்படுத்தவும், SMS அறிவிப்புகளை அனுப்பவும் உங்கள் தரவு பயன்படுத்தப்படுகிறது.\n\n3. கட்டணத் தரவு பாதுகாப்பு\nஅனைத்து கொடுப்பனவுகளும் உரிமம் பெற்ற கட்டண நுழைவாயில்கள் (PayHere, WebXPay, Stripe) மூலம் பாதுகாப்பாக செயல்படுத்தப்படுகின்றன. அட்டை எண்களை நாங்கள் சேமிப்பதில்லை.\n\n4. மூன்றாம் தரப்பினருக்கு வழங்கப்படாமை\nஉங்கள் தனிப்பட்ட தகவல்களை நாங்கள் மூன்றாம் தரப்பினருக்கு விற்கவோ பகிரவோ மாட்டோம்.\n\n5. உங்கள் உரிமைகள்\nஉறுப்பினர் போர்டல் மூலம் உங்கள் தகவல்களைப் புதுப்பிக்க அல்லது நீக்கக் கோரலாம்.",
            ]],
            ['refund.body', 'legal', 'Refund & Cancellation Policy', 'richtext', [
                'en' => "1. Instant Service Activation\nJeewanasaviya membership is an instant digital service. Once your payment is confirmed, your digital QR card and all partner discount benefits are immediately activated.\n\n2. Cancellation Policy\nMemberships do not auto-renew or recurring-charge your payment card. You can choose not to renew at the end of your term without any penalty.\n\n3. Refund Eligibility\nBecause digital card benefits and merchant discounts are unlocked immediately upon purchase, membership fees are non-refundable once activated.\n\n4. Duplicate Transactions\nIf you were charged twice due to a technical glitch or network error, please notify us with your transaction receipts. We will issue a 100% refund for the duplicate charge within 5 to 10 business days.\n\n5. How to Request Support\nContact our billing support via email or phone with your Member ID and payment invoice number for prompt review within 24-48 hours.",
                'si' => "1. ක්ෂණික සේවා සක්‍රිය කිරීම\nසාමාජිකත්වය ක්ෂණික ඩිජිටල් සේවාවකි. ගෙවීම තහවුරු වූ සැනින් ඩිජිටල් QR කාඩ්පත සහ සියලුම හවුල්කාර වට්ටම් ක්ෂණිකව සක්‍රිය වේ.\n\n2. සාමාජිකත්වය අවලංගු කිරීම\nසාමාජිකත්වය සඳහා ස්වයංක්‍රීයව කාඩ්පතෙන් මුදල් අය නොකෙරේ. කාලසීමාව අවසානයේ අලුත් නොකර සිටීමට ඔබට සම්පූර්ණ නිදහස ඇත.\n\n3. මුදල් ආපසු ගෙවීමේ ප්‍රතිපත්තිය\nඩිජිටල් කාඩ්පත සහ වට්ටම් වහාම භාවිතයට හැකි වන බැවින්, සාමාජිකත්වය සක්‍රිය වූ පසු සාමාජික ගාස්තු ආපසු ගෙවනු නොලැබේ.\n\n4. අත්වැරදීමකින් දෙවරක් මුදල් කැපී යාම\nතාක්ෂණික දෝෂයක් නිසා එකම ගෙවීම දෙවරක් සිදුවුවහොත්, අපට දන්වන්න. දින 5-10ක් ඇතුළත එම අමතර මුදල 100% ක් ඔබගේ ගිණුමට ආපසු බැර කෙරේ.\n\n5. සහය ලබා ගැනීම\nවිද්‍යුත් තැපෑල හෝ දුරකථනය හරහා ඔබගේ සාමාජික අංකය සහ බිල්පත් අංකය සමඟ අපගේ මූල්‍ය අංශය අමතන්න.",
                'ta' => "1. உடனடி சேவை செயல்படுத்தல்\nஉறுப்பினர் தகுதி உடனடி டிஜிட்டல் சேவையாகும். கட்டணம் உறுதிசெய்யப்பட்டவுடன் டிஜிட்டல் அட்டை மற்றும் சலுகைகள் உடனடியாக செயல்படுத்தப்படும்.\n\n2. ரத்து செய்யும் கொள்கை\nஉறுப்பினர் தகுதி தானாக புதுப்பிக்கப்படாது. காலம் முடிந்ததும் புதுப்பிக்காமல் இருக்க உங்களுக்கு முழு உரிமை உண்டு.\n\n3. பணத்தைத் திரும்பப்பெறும் கொள்கை\nடிஜிட்டல் பலன்கள் உடனடியாக திறக்கப்படுவதால், செயல்படுத்தப்பட்ட பிறகு கட்டணங்கள் திருப்பித் தரப்படாது.\n\n4. இரட்டை பரிவர்த்தனைகள்\nதொழில்நுட்பக் கோளாறு காரணமாக இரண்டு முறை பணம் எடுக்கப்பட்டால், எங்களுக்குத் தெரியப்படுத்துங்கள். 5-10 வணிக நாட்களில் முழுத் தொகையும் திருப்பித் தரப்படும்.\n\n5. ஆதரவைப் பெறுதல்\nஉங்கள் உறுப்பினர் எண் மற்றும் ரசீதுடன் மின்னஞ்சல் அல்லது தொலைபேசி மூலம் எங்கள் ஆதரவுக் குழுவைத் தொடர்பு கொள்ளவும்.",
            ]],
            ['footer.tagline', 'footer', 'Footer tagline', 'text', [
                'en' => 'Protection, savings and a valuable lifestyle for every Sri Lankan family.',
                'si' => 'සෑම ශ්‍රී ලාංකික පවුලකටම ආරක්ෂාව, ඉතුරුම් සහ වටිනා ජීවන රටාවක්.',
                'ta' => 'ஒவ்வொரு இலங்கைக் குடும்பத்துக்கும் பாதுகாப்பு, சேமிப்பு மற்றும் மதிப்புமிக்க வாழ்க்கை முறை.',
            ]],
        ];

        foreach ($blocks as $i => [$key, $group, $label, $type, $value]) {
            CmsContent::query()->updateOrCreate(['key' => $key], compact('group', 'label', 'type', 'value') + ['sort_order' => $i]);
        }

        $faqs = [
            [
                ['en' => 'How do I use my membership card?', 'si' => 'මගේ සාමාජික කාඩ්පත භාවිතා කරන්නේ කෙසේද?', 'ta' => 'எனது உறுப்பினர் அட்டையை எவ்வாறு பயன்படுத்துவது?'],
                ['en' => 'Open the member portal on your phone and show the digital card. Partner staff scan the QR code to confirm your tier and expiry instantly.', 'si' => 'ඔබගේ දුරකථනයෙන් සාමාජික ද්වාරය විවෘත කර ඩිජිටල් කාඩ්පත පෙන්වන්න. හවුල්කාර කාර්ය මණ්ඩලය QR කේතය ස්කෑන් කර ඔබේ මට්ටම තහවුරු කරයි.', 'ta' => 'உங்கள் தொலைபேசியில் உறுப்பினர் போர்ட்டலைத் திறந்து டிஜிட்டல் அட்டையைக் காட்டுங்கள். கூட்டாளர் ஊழியர்கள் QR குறியீட்டை ஸ்கேன் செய்து உறுதிப்படுத்துவார்கள்.'],
            ],
            [
                ['en' => 'Which payment methods are accepted?', 'si' => 'පිළිගන්නා ගෙවීම් ක්‍රම මොනවාද?', 'ta' => 'எந்த கட்டண முறைகள் ஏற்றுக்கொள்ளப்படுகின்றன?'],
                ['en' => 'Local and international cards, mobile wallets and bank transfer. Card payments activate immediately; bank transfers activate once our finance team verifies your slip.', 'si' => 'දේශීය සහ ජාත්‍යන්තර කාඩ්පත්, ජංගම පසුම්බි සහ බැංකු මාරු කිරීම්. කාඩ්පත් ගෙවීම් වහාම සක්‍රිය වේ; බැංකු මාරු කිරීම් ලිපිය තහවුරු කළ පසු සක්‍රිය වේ.', 'ta' => 'உள்ளூர் மற்றும் சர்வதேச அட்டைகள், மொபைல் வாலட்கள் மற்றும் வங்கி பரிமாற்றம். அட்டை கட்டணங்கள் உடனடியாக செயல்படும்; வங்கி பரிமாற்றங்கள் சீட்டு சரிபார்த்த பின் செயல்படும்.'],
            ],
            [
                ['en' => 'Can I upgrade my tier later?', 'si' => 'පසුව මගේ මට්ටම උසස් කළ හැකිද?', 'ta' => 'பின்னர் எனது நிலையை மேம்படுத்த முடியுமா?'],
                ['en' => 'Yes. Choose a higher tier from your portal at any time. The new tier starts immediately with a fresh validity period.', 'si' => 'ඔව්. ඕනෑම වේලාවක ඔබේ ද්වාරයෙන් ඉහළ මට්ටමක් තෝරන්න. නව මට්ටම වහාම ආරම්භ වේ.', 'ta' => 'ஆம். எந்த நேரத்திலும் உங்கள் போர்ட்டலில் இருந்து உயர் நிலையைத் தேர்ந்தெடுக்கவும். புதிய நிலை உடனடியாக தொடங்கும்.'],
            ],
            [
                ['en' => 'What happens when my membership expires?', 'si' => 'මගේ සාමාජිකත්වය කල් ඉකුත් වූ විට කුමක් සිදුවේද?', 'ta' => 'எனது உறுப்பினர் தகுதி காலாவதியானால் என்ன ஆகும்?'],
                ['en' => 'We send an SMS reminder 7 days before expiry. Renew in one click and the new period is added on top of your remaining days.', 'si' => 'කල් ඉකුත්වීමට දින 7කට පෙර අපි SMS සිහිකැඳවීමක් යවමු. එක ක්ලික් එකකින් අලුත් කරන්න.', 'ta' => 'காலாவதியாவதற்கு 7 நாட்களுக்கு முன் SMS நினைவூட்டல் அனுப்புவோம். ஒரே கிளிக்கில் புதுப்பிக்கவும்.'],
            ],
        ];

        foreach ($faqs as $i => [$q, $a]) {
            Faq::query()->updateOrCreate(['sort_order' => $i], ['question' => $q, 'answer' => $a, 'is_active' => true]);
        }

        $templates = [
            'registration_welcome' => [
                'en' => 'Welcome to {site_name}, {member_name}! Your member ID is {member_id}. Choose a plan to activate your card.',
                'si' => '{site_name} වෙත සාදරයෙන් පිළිගනිමු, {member_name}! ඔබගේ සාමාජික අංකය {member_id}. කාඩ්පත සක්‍රිය කිරීමට සැලසුමක් තෝරන්න.',
                'ta' => '{site_name}க்கு வரவேற்கிறோம், {member_name}! உங்கள் உறுப்பினர் எண் {member_id}. அட்டையைச் செயல்படுத்த ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
            ],
            'payment_receipt' => [
                'en' => 'Payment received: LKR {amount} for {tier_name} (Ref {invoice_no}). Thank you, {member_name}.',
                'si' => 'ගෙවීම ලැබුණි: {tier_name} සඳහා රු. {amount} (යොමු {invoice_no}). ස්තූතියි, {member_name}.',
                'ta' => 'கட்டணம் பெறப்பட்டது: {tier_name}க்கு ரூ. {amount} (குறிப்பு {invoice_no}). நன்றி, {member_name}.',
            ],
            'membership_activated' => [
                'en' => 'Your {tier_name} membership ({member_id}) is now active until {expiry_date}. Enjoy your privileges!',
                'si' => 'ඔබගේ {tier_name} සාමාජිකත්වය ({member_id}) {expiry_date} දක්වා සක්‍රියයි. ඔබේ වරප්‍රසාද භුක්ති විඳින්න!',
                'ta' => 'உங்கள் {tier_name} உறுப்பினர் தகுதி ({member_id}) {expiry_date} வரை செயலில் உள்ளது. உங்கள் சலுகைகளை அனுபவியுங்கள்!',
            ],
            'expiry_reminder' => [
                'en' => 'Hi {member_name}, your {tier_name} membership expires on {expiry_date}. Renew now to keep your benefits.',
                'si' => 'ආයුබෝවන් {member_name}, ඔබගේ {tier_name} සාමාජිකත්වය {expiry_date} දින කල් ඉකුත් වේ. ප්‍රතිලාභ රඳවා ගැනීමට දැන් අලුත් කරන්න.',
                'ta' => 'வணக்கம் {member_name}, உங்கள் {tier_name} உறுப்பினர் தகுதி {expiry_date} அன்று காலாவதியாகும். பலன்களைத் தொடர இப்போதே புதுப்பிக்கவும்.',
            ],
            'membership_renewed' => [
                'en' => 'Renewed! Your {tier_name} membership is extended to {expiry_date}. Thank you for staying with us.',
                'si' => 'අලුත් කරන ලදී! ඔබගේ {tier_name} සාමාජිකත්වය {expiry_date} දක්වා දීර්ඝ කර ඇත. අප සමඟ රැඳී සිටීම ගැන ස්තූතියි.',
                'ta' => 'புதுப்பிக்கப்பட்டது! உங்கள் {tier_name} உறுப்பினர் தகுதி {expiry_date} வரை நீட்டிக்கப்பட்டது. நன்றி.',
            ],
            'otp' => [
                'en' => 'Your {site_name} verification code is {otp_code}. It expires in 5 minutes.',
                'si' => 'ඔබගේ {site_name} සත්‍යාපන කේතය {otp_code}. එය මිනිත්තු 5කින් කල් ඉකුත් වේ.',
                'ta' => 'உங்கள் {site_name} சரிபார்ப்புக் குறியீடு {otp_code}. இது 5 நிமிடங்களில் காலாவதியாகும்.',
            ],
            'password_reset_otp' => [
                'en' => 'Your {site_name} password reset verification code is {otp_code}. It expires in 5 minutes.',
                'si' => 'ඔබගේ {site_name} මුරපදය නැවත සැකසීමේ සත්‍යාපන කේතය {otp_code}. එය මිනිත්තු 5කින් කල් ඉකුත් වේ.',
                'ta' => 'உங்கள் {site_name} கடவுச்சொல் மீட்டமைப்பு சரிபார்ப்புக் குறியீடு {otp_code}. இது 5 நிமிடங்களில் காலாவதியாகும்.',
            ],
        ];

        $vars = [
            'registration_welcome' => ['{member_name}', '{member_id}', '{site_name}'],
            'payment_receipt' => ['{member_name}', '{amount}', '{tier_name}', '{invoice_no}'],
            'membership_activated' => ['{member_name}', '{member_id}', '{tier_name}', '{expiry_date}'],
            'expiry_reminder' => ['{member_name}', '{tier_name}', '{expiry_date}'],
            'membership_renewed' => ['{member_name}', '{tier_name}', '{expiry_date}'],
            'otp' => ['{otp_code}', '{site_name}'],
            'password_reset_otp' => ['{otp_code}', '{site_name}', '{member_name}'],
        ];

        foreach ($templates as $event => $body) {
            SmsTemplate::query()->updateOrCreate(['event' => $event], [
                'name' => SmsTemplate::EVENTS[$event],
                'body' => $body,
                'variables' => $vars[$event],
                'is_active' => true,
            ]);
        }
    }
}
