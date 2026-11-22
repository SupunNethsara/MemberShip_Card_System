import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { Modal } from '../../../components/ui';
import { useLocale } from '../../../hooks';

export const PAYMENT_GUIDES = {
  en: {
    payhere: {
      title: 'PayHere (Sri Lanka: Visa, Master, eZ Cash, mCash, FriMi, Genie)',
      portalUrl: 'https://merchant.payhere.lk',
      portalName: 'PayHere Merchant Portal',
      steps: [
        {
          title: '1. Register & Verify Merchant Account',
          desc: 'Sign up at payhere.lk with your Business Registration (BR), Director NIC, and Bank Account details. Wait for verification approval.',
        },
        {
          title: '2. Switch to Live Mode in PayHere',
          desc: 'Log in to the PayHere Merchant Portal. Ensure your top dashboard switch is set to "Live Mode" (toggle off Sandbox).',
        },
        {
          title: '3. Add Domain & Copy Live Credentials',
          desc: 'Go to Settings → Domains & Credentials. Click "Add Domain" and enter your website domain (e.g. jeewanasaviya.lk). Copy the generated Merchant ID and Merchant Secret.',
        },
        {
          title: '4. Configure in this Drawer & Turn Off Sandbox',
          desc: 'Set Environment to "Live" (this removes the amber Sandbox badge from checkout). Enter your live Merchant ID and Merchant Secret. Turn "Active at checkout" to ON and click Save.',
        },
        {
          title: '5. Webhook / Notify URL',
          desc: 'PayHere automatically receives the Webhook URL generated below during checkout. Ensure your domain is whitelisted in PayHere settings.',
        },
      ],
      sandboxTip: 'Switching Environment from Sandbox to Live immediately hides the "Sandbox" badge on the checkout screen.',
    },
    stripe: {
      title: 'Stripe (International Visa, Master, Amex)',
      portalUrl: 'https://dashboard.stripe.com',
      portalName: 'Stripe Dashboard',
      steps: [
        {
          title: '1. Register & Verify Stripe Account',
          desc: 'Sign up at stripe.com, complete company onboarding, and link your payout bank account.',
        },
        {
          title: '2. Switch to Live Mode',
          desc: 'In the top right of Stripe Dashboard, toggle off "Test mode" to switch to Live mode.',
        },
        {
          title: '3. Copy Live API Keys',
          desc: 'Navigate to Developers → API Keys. Copy the Publishable key (pk_live_...) and Secret key (sk_live_...).',
        },
        {
          title: '4. Create Webhook Endpoint',
          desc: 'In Stripe, go to Developers → Webhooks → Add an endpoint. Paste the Webhook URL shown below. Select events "checkout.session.completed" and "checkout.session.expired". Reveal and copy the Signing secret (whsec_...).',
        },
        {
          title: '5. Configure & Save',
          desc: 'Set Environment to "Live", enter all 3 keys, turn "Active at checkout" to ON, and click Save.',
        },
      ],
      sandboxTip: 'Live mode charges real credit cards and eliminates the Sandbox indicator on checkout.',
    },
    webxpay: {
      title: 'WebXPay (Sri Lanka: Cards, Sampath Vishwa, FriMi)',
      portalUrl: 'https://webxpay.com',
      portalName: 'WebXPay Merchant Backoffice',
      steps: [
        {
          title: '1. Sign Merchant Agreement',
          desc: 'Register at webxpay.com and complete merchant underwriting with their banking partners.',
        },
        {
          title: '2. Switch to Live & Get Keys',
          desc: 'In your WebXPay backoffice under Live integration settings, copy your Secret Key and the full RSA Public Key block (including -----BEGIN PUBLIC KEY-----).',
        },
        {
          title: '3. Configure & Save',
          desc: 'Set Environment to "Live", paste the Secret Key and Public Key, turn "Active at checkout" to ON, and click Save.',
        },
      ],
      sandboxTip: 'Switch to Live only with production credentials from your bank-approved WebXPay account.',
    },
    manual: {
      title: 'Manual Bank Transfer & Slip Upload',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: '1. Enter Official Bank Details',
          desc: 'Provide your society or company Bank Name (e.g. Commercial Bank), Account Name, Account Number, and Branch.',
        },
        {
          title: '2. Provide Clear Payment Instructions',
          desc: 'Explain how members should pay (e.g. "Use Invoice Number as the reference and upload deposit slip or bank app transfer screenshot below").',
        },
        {
          title: '3. Turn On at Checkout',
          desc: 'Turn "Active at checkout" to ON and click Save. When members upload a slip, staff will be notified instantly to approve or reject it.',
        },
      ],
      sandboxTip: 'Bank transfer does not use sandbox mode; make sure real account details are provided.',
    },
  },
  si: {
    payhere: {
      title: 'PayHere (ශ්‍රී ලංකා: Visa, Master, eZ Cash, mCash, FriMi, Genie)',
      portalUrl: 'https://merchant.payhere.lk',
      portalName: 'PayHere Merchant Portal',
      steps: [
        {
          title: '1. Merchant ගිණුමක් ලියාපදිංචි කර තහවුරු කරගැනීම',
          desc: 'payhere.lk වෙත ගොස් ඔබගේ ව්‍යාපාර ලියාපදිංචි සහතිකය (BR), අධ්‍යක්ෂක NIC සහ බැංකු ගිණුම් විස්තර ලබාදී ලියාපදිංචි වන්න. ගිණුම අනුමත වන තෙක් රැඳී සිටින්න.',
        },
        {
          title: '2. PayHere හි Live Mode වෙත මාරු වීම',
          desc: 'PayHere Merchant Portal එකට log වී, ඉහළ dashboard switch එකෙන් "Live Mode" තෝරන්න (Sandbox mode එක අක්‍රිය කරන්න).',
        },
        {
          title: '3. Domain එක ඇතුළත් කර Live Credentials ලබාගැනීම',
          desc: 'Settings → Domains & Credentials වෙත ගොස් "Add Domain" click කර ඔබගේ වෙබ් අඩවියේ domain නම (උදා: jeewanasaviya.lk) ඇතුළත් කරන්න. එහිදී ලැබෙන Merchant ID සහ Merchant Secret පිටපත් (copy) කරගන්න.',
        },
        {
          title: '4. පද්ධතියට ඇතුළත් කර Sandbox අක්‍රිය කිරීම',
          desc: 'මෙහි Environment එක "Live" ලෙස මාරු කරන්න (එවිට Checkout පිටුවේ පෙනෙන Sandbox ලේබලය ඉබේම ඉවත් වේ). ලබාගත් Merchant ID සහ Merchant Secret මෙහි paste කරන්න. "Active at checkout" ON කර Save කරන්න.',
        },
        {
          title: '5. Webhook / Notify URL',
          desc: 'පහත පෙන්වන Webhook URL එක PayHere වෙත ස්වයංක්‍රීයව ලැබේ. PayHere හි ඔබගේ domain එක whitelist කර ඇති බව තහවුරු කරගන්න.',
        },
      ],
      sandboxTip: 'Environment එක Sandbox සිට Live ලෙස මාරු කළ වහාම සාමාජිකයින්ට පෙනෙන Checkout පිටුවේ කහ පැහැති "Sandbox" badge එක සම්පූර්ණයෙන්ම නැතිවී යයි.',
    },
    stripe: {
      title: 'Stripe (ජාත්‍යන්තර Visa, Master, Amex)',
      portalUrl: 'https://dashboard.stripe.com',
      portalName: 'Stripe Dashboard',
      steps: [
        {
          title: '1. Stripe ගිණුම සකසා සක්‍රීය කිරීම',
          desc: 'stripe.com හි ලියාපදිංචි වී, ව්‍යාපාරික තොරතුරු සහ මුදල් ලැබිය යුතු බැංකු ගිණුම සම්බන්ධ කරන්න.',
        },
        {
          title: '2. Live Mode වෙත මාරු වීම',
          desc: 'Stripe Dashboard එකේ ඉහළ දකුණු කෙළවරේ ඇති "Test mode" toggle එක අක්‍රිය කර Live mode එකට මාරු වන්න.',
        },
        {
          title: '3. Live API Keys ලබාගැනීම',
          desc: 'Developers → API Keys වෙත ගොස් Publishable key (pk_live_...) සහ Secret key (sk_live_...) පිටපත් කරගන්න.',
        },
        {
          title: '4. Webhook එකක් සෑදීම',
          desc: 'Stripe හි Developers → Webhooks → Add an endpoint වෙත යන්න. පහත ඇති Webhook URL එක paste කරන්න. "checkout.session.completed" සහ "checkout.session.expired" events තෝරා Add endpoint කරන්න. ලැබෙන Signing secret (whsec_...) පිටපත් කරගන්න.',
        },
        {
          title: '5. පද්ධතියට ඇතුළත් කර Save කිරීම',
          desc: 'Environment එක "Live" කර, keys 3 ම ඇතුළත් කර, "Active at checkout" ON කර Save කරන්න.',
        },
      ],
      sandboxTip: 'Live mode සක්‍රිය වූ පසු සැබෑ ක්‍රෙඩිට් කාඩ්පත් වලින් මුදල් අයවන අතර Checkout හි ඇති Sandbox ලේබලය ඉවත් වේ.',
    },
    webxpay: {
      title: 'WebXPay (ශ්‍රී ලංකා කාඩ්පත්, සම්පත් විශ්ව, FriMi)',
      portalUrl: 'https://webxpay.com',
      portalName: 'WebXPay Merchant Backoffice',
      steps: [
        {
          title: '1. වෙළඳ ගිවිසුම සම්පූර්ණ කිරීම',
          desc: 'webxpay.com හා සම්බන්ධ වී බැංකු ගිණුම සහ ව්‍යාපාරික ලියකියවිලි හරහා Merchant onboarding සම්පූර්ණ කරන්න.',
        },
        {
          title: '2. Live Mode වෙත ගොස් Keys ලබාගැනීම',
          desc: 'WebXPay merchant backoffice එකේ Live integration වෙත ගොස් Secret Key එක සහ සම්පූර්ණ RSA Public Key කොටස (-----BEGIN PUBLIC KEY----- සමඟ) පිටපත් කරගන්න.',
        },
        {
          title: '3. පද්ධතියට ඇතුළත් කර Save කිරීම',
          desc: 'Environment එක "Live" කර, Keys ඇතුළත් කර, "Active at checkout" ON කර Save කරන්න.',
        },
      ],
      sandboxTip: 'WebXPay බැංකු අනුමැතිය ලැබුණු සැබෑ credentials මඟින් පමණක් Live mode සක්‍රිය කරන්න.',
    },
    manual: {
      title: 'බැංකු තැන්පතු සහ ලදුපත් උඩුගත කිරීම (Bank Slip Upload)',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: '1. නිල බැංකු ගිණුම් විස්තර ඇතුළත් කිරීම',
          desc: 'ඔබගේ සමිතියේ හෝ ආයතනයේ නිල බැංකු නම (උදා: Commercial Bank), ගිණුම් නම, ගිණුම් අංකය සහ ශාඛාව ඇතුළත් කරන්න.',
        },
        {
          title: '2. ගෙවීම් උපදෙස් ලබාදීම',
          desc: 'සාමාජිකයින් මුදල් ගෙවිය යුතු ආකාරය පැහැදිලි කරන්න (උදා: "ඉන්වොයිස් අංකය reference එක ලෙස යොදා මුදල් තැන්පත් කර, රිසිට්පත හෝ mobile banking screenshot එක පහතින් upload කරන්න").',
        },
        {
          title: '3. Checkout එකේ Active කිරීම',
          desc: '"Active at checkout" ON කර Save කරන්න. සාමාජිකයෙකු slip එකක් upload කළ වහාම Staff dashboard එකට notification එකක් ලැබේ.',
        },
      ],
      sandboxTip: 'බැංකු තැන්පතු සඳහා sandbox නැත; නිවැරදි සැබෑ ගිණුම් විස්තර ලබාදීමට වගබලා ගන්න.',
    },
  },
};

export const SMS_GUIDES = {
  en: {
    notifylk: {
      title: 'Notify.lk (Sri Lanka Bulk SMS)',
      portalUrl: 'https://app.notify.lk',
      portalName: 'Notify.lk Dashboard',
      steps: [
        {
          title: '1. Create Account & Top Up',
          desc: 'Register at notify.lk and purchase SMS credits via card or bank transfer.',
        },
        {
          title: '2. Request Approved Sender ID (Mask)',
          desc: 'Go to Sender IDs → Request Sender ID. Request your business name (e.g. JEEWANASV). Until approved, you can test with "NotifyDEMO".',
        },
        {
          title: '3. Copy API Keys',
          desc: 'Go to Settings → API Keys. Copy your User ID and API Key.',
        },
        {
          title: '4. Configure, Save & Set Primary',
          desc: 'Enter your Sender ID, User ID, and API Key in this drawer. Turn Active to ON and Save. Then click "Set Primary" on the Notify.lk card.',
        },
        {
          title: '5. Test & Deactivate Development Log',
          desc: 'Use the "Send test SMS" widget to verify delivery on your phone. Then edit the "Development Log" gateway and turn its Active toggle to OFF.',
        },
      ],
      tip: 'Notify.lk supports English, Sinhala, and Tamil Unicode automatically.',
    },
    dialog: {
      title: 'Dialog eSMS (Dialog Axiata Corporate SMS)',
      portalUrl: 'https://esms.dialog.lk',
      portalName: 'Dialog eSMS Portal',
      steps: [
        {
          title: '1. Enterprise Agreement',
          desc: 'Contact Dialog Enterprise (esms.dialog.lk) and sign the corporate SMS contract to obtain your company Sender Mask and portal credentials.',
        },
        {
          title: '2. Enter Credentials',
          desc: 'Enter your approved Sender Mask, eSMS API Username, and Password in this drawer.',
        },
        {
          title: '3. Save & Set Primary / Fallback',
          desc: 'Turn Active to ON and Save. Set Dialog as Primary (or Fallback if using another provider). Use "Send test SMS" to verify.',
        },
      ],
      tip: 'Corporate masks require TRCSL operator approval through Dialog Enterprise.',
    },
    custom_http: {
      title: 'Custom HTTP / REST Webhook (ShoutOUT, SMS.lk, Semaphore, etc.)',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: '1. Consult Provider API Documentation',
          desc: 'Locate your provider\'s HTTP or REST API endpoint for sending SMS messages.',
        },
        {
          title: '2. Enter Endpoint & Method',
          desc: 'Enter the Endpoint URL (e.g. https://api.smsprovider.lk/v1/send) and choose Method (POST or GET).',
        },
        {
          title: '3. Configure Headers & Payload Mapping',
          desc: 'Add Authorization headers (e.g. Authorization: Bearer {api_key}). In Payload Mapping, map their parameters to system placeholders: to = {to}, message = {message}, from = {sender}.',
        },
        {
          title: '4. Test Delivery',
          desc: 'Save and test using the "Send test SMS" widget to verify real-time provider response.',
        },
      ],
      tip: 'Supported variables: {to}, {to_local}, {message}, {sender}, {api_key}, {username}, {password}.',
    },
    twilio: {
      title: 'Twilio (International Programmable SMS)',
      portalUrl: 'https://console.twilio.com',
      portalName: 'Twilio Console',
      steps: [
        {
          title: '1. Upgrade Twilio Account',
          desc: 'Upgrade from trial to a paid Twilio account to remove trial restrictions.',
        },
        {
          title: '2. Retrieve Account SID & Auth Token',
          desc: 'From the Twilio Console dashboard, copy your Account SID and Auth Token.',
        },
        {
          title: '3. Enter Sender ID or Phone Number',
          desc: 'Enter your purchased Twilio phone number (with country code) in Sender ID, or provide a Messaging Service SID in settings.',
        },
      ],
      tip: 'Best for sending to expatriates and overseas member numbers.',
    },
    log: {
      title: 'Development Log (Testing / Demo Driver)',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: 'Purpose',
          desc: 'This driver writes simulated SMS messages to the system database log without sending real SMS to mobile networks. Ideal for development.',
        },
        {
          title: 'How to Disable for Production Go-Live',
          desc: 'Once you have added a real SMS gateway (e.g. Notify.lk or Dialog) and set it as "Primary", edit this Development Log gateway and turn the "Active" toggle to OFF.',
        },
      ],
      tip: 'Never leave Development Log as Primary in production, as members will not receive real OTP or invoice SMS on their phones.',
    },
  },
  si: {
    notifylk: {
      title: 'Notify.lk (ශ්‍රී ලංකා Bulk SMS)',
      portalUrl: 'https://app.notify.lk',
      portalName: 'Notify.lk Dashboard',
      steps: [
        {
          title: '1. ගිණුමක් සාදා Credits මිලදී ගැනීම',
          desc: 'notify.lk හි ලියාපදිංචි වී කාඩ්පතකින් හෝ බැංකු තැන්පතුවකින් SMS credits මිලදී ගන්න.',
        },
        {
          title: '2. අනුමත Sender ID (Mask) එකක් ලබාගැනීම',
          desc: 'Sender IDs → Request Sender ID වෙත ගොස් ඔබගේ ආයතනයේ නම (උදා: JEEWANASV) ඉල්ලුම් කරන්න. අනුමත වන තෙක් "NotifyDEMO" ලෙස පරීක්ෂා කළ හැක.',
        },
        {
          title: '3. API Keys ලබාගැනීම',
          desc: 'Settings → API Keys වෙත ගොස් ඔබගේ User ID සහ API Key පිටපත් කරගන්න.',
        },
        {
          title: '4. විස්තර ඇතුළත් කර Primary ලෙස සැකසීම',
          desc: 'Sender ID, User ID, සහ API Key මෙහි ඇතුළත් කර Active: ON කර Save කරන්න. ඉන්පසු Notify.lk card එක මත ඇති "Set Primary" ඔබන්න.',
        },
        {
          title: '5. Test කර Development Log අක්‍රිය කිරීම',
          desc: '"Send test SMS" මඟින් ඔබගේ දුරකථනයට පණිවිඩයක් යවා පරීක්ෂා කරන්න. ඉන්පසු "Development Log" gateway එක Edit කර Active toggle එක OFF කරන්න.',
        },
      ],
      tip: 'Notify.lk මඟින් සිංහල, දෙමළ (Unicode) සහ ඉංග්‍රීසි පණිවිඩ ස්වයංක්‍රීයව සහය දක්වයි.',
    },
    dialog: {
      title: 'Dialog eSMS (Dialog Axiata ආයතනික SMS)',
      portalUrl: 'https://esms.dialog.lk',
      portalName: 'Dialog eSMS Portal',
      steps: [
        {
          title: '1. ආයතනික ගිවිසුම අත්සන් කිරීම',
          desc: 'Dialog Enterprise (esms.dialog.lk) හා සම්බන්ධ වී corporate SMS ගිවිසුම අත්සන් කර Sender Mask සහ portal username/password ලබාගන්න.',
        },
        {
          title: '2. Credentials ඇතුළත් කිරීම',
          desc: 'අනුමත Sender Mask, API Username, සහ Password මෙහි ඇතුළත් කරන්න.',
        },
        {
          title: '3. Save කර Primary හෝ Fallback ලෙස තැබීම',
          desc: 'Active: ON කර Save කරන්න. Primary (හෝ වෙනත් gateway එකක් ඇත්නම් Fallback) ලෙස සකසා Test SMS යවා තහවුරු කරගන්න.',
        },
      ],
      tip: 'Dialog Enterprise හරහා Sender Mask ලබාගැනීමට TRCSL ලියාපදිංචිය අවශ්‍ය වේ.',
    },
    custom_http: {
      title: 'Custom HTTP / REST Webhook (ShoutOUT, SMS.lk ආදී ඕනෑම Provider කෙනෙක්)',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: '1. Provider ගේ API ලියකියවිලි බැලීම',
          desc: 'ඔබ තෝරාගත් SMS Provider ගේ SMS යවන HTTP / REST API endpoint එක සොයාගන්න.',
        },
        {
          title: '2. Endpoint සහ Method ඇතුළත් කිරීම',
          desc: 'Endpoint URL (උදා: https://api.smsprovider.lk/v1/send) ඇතුළත් කර Method (POST හෝ GET) තෝරන්න.',
        },
        {
          title: '3. Headers සහ Payload Mapping සැකසීම',
          desc: 'Authorization headers (උදා: Authorization: Bearer {api_key}) යොදන්න. Payload Mapping හි ඔවුන්ගේ parameters අපේ variables වලට map කරන්න: to = {to}, message = {message}, from = {sender}.',
        },
        {
          title: '4. පරීක්ෂා කිරීම',
          desc: 'Save කර "Send test SMS" මඟින් පණිවිඩයක් යවා සාර්ථක දැයි තහවුරු කරගන්න.',
        },
      ],
      tip: 'පහත variables භාවිතා කළ හැක: {to}, {to_local}, {message}, {sender}, {api_key}, {username}, {password}.',
    },
    twilio: {
      title: 'Twilio (ජාත්‍යන්තර SMS)',
      portalUrl: 'https://console.twilio.com',
      portalName: 'Twilio Console',
      steps: [
        {
          title: '1. Twilio Account Upgrade කිරීම',
          desc: 'Trial ගිණුමෙන් Paid ගිණුමකට මාරු වන්න.',
        },
        {
          title: '2. Account SID & Auth Token ලබාගැනීම',
          desc: 'Twilio Dashboard වෙතින් Account SID සහ Auth Token පිටපත් කරගන්න.',
        },
        {
          title: '3. Sender ID හෝ දුරකථන අංකය ඇතුළත් කිරීම',
          desc: 'මිලදී ගත් Twilio phone number එක Sender ID ලෙස ඇතුළත් කරන්න.',
        },
      ],
      tip: 'විදෙස්ගත සාමාජිකයින් සඳහා SMS යැවීමට ඉතා සුදුසුය.',
    },
    log: {
      title: 'Development Log (පරීක්ෂණ / Demo Driver)',
      portalUrl: null,
      portalName: null,
      steps: [
        {
          title: 'කාර්යය',
          desc: 'දුරකථන ජාල වලට සැබෑ SMS නොයවා, පද්ධතියේ database log එකේ පමණක් SMS සුරැකීමට මෙය යොදාගනී (Development කාලයේදී පරීක්ෂා කිරීමට).',
        },
        {
          title: 'සැබෑ SMS යැවීම සඳහා මෙය අක්‍රිය කරන්නේ කෙසේද?',
          desc: 'සැබෑ SMS gateway එකක් (Notify.lk හෝ Dialog) සකසා "Primary" ලෙස තේරූ පසු, මෙම Development Log gateway එක Edit කර එහි ඇති "Active" ටොගල් එක OFF කරන්න.',
        },
      ],
      tip: 'Production හිදී Development Log එක කිසිවිටෙක Primary ලෙස නොතබන්න, එසේ වුවහොත් සාමාජිකයින්ට real OTP හෝ SMS නොලැබේ.',
    },
  },
};

/**
 * Expandable card displayed inside the Drawer when editing a specific driver.
 */
export function DriverSetupGuideCard({ driver, type = 'payment' }) {
  const currentSysLocale = useLocale();
  const [lang, setLang] = useState(currentSysLocale === 'si' ? 'si' : 'en');
  const [expanded, setExpanded] = useState(false);

  const guideDict = type === 'payment' ? PAYMENT_GUIDES : SMS_GUIDES;
  const guide = guideDict[lang]?.[driver] || guideDict.en?.[driver];

  if (!guide) return null;

  return (
    <div className="rounded-xl border border-gold-200/70 bg-gradient-to-r from-gold-50/60 via-white to-gold-50/40 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-semibold text-navy-900">
              {lang === 'si' ? 'සැකසුම් මාර්ගෝපදේශය:' : 'Setup & Production Guide:'} {guide.title.split('(')[0].trim()}
            </h4>
            <p className="text-[11px] text-slate-500">
              {lang === 'si'
                ? 'ගිණුම් සාදාගන්නා සහ Live credentials ලබාගන්නා ආකාරය.'
                : 'Step-by-step account setup and live credentials instructions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                lang === 'en' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('si')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                lang === 'si' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              සිං
            </button>
          </div>

          {guide.portalUrl && (
            <a
              href={guide.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-2xs font-medium text-navy-800 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span>{guide.portalName || 'Portal'}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-navy-900 transition-colors"
            aria-label={expanded ? 'Collapse setup guide' : 'Expand setup guide'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3.5 border-t border-gold-200/50 pt-3 space-y-2.5 animate-fade-in">
          {guide.steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{s.title}</p>
                <p className="text-2xs text-slate-600 leading-relaxed mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}

          {(guide.sandboxTip || guide.tip) && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50/80 p-2 text-2xs text-amber-800 border border-amber-200/60">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{guide.sandboxTip || guide.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full Modal opened from the page header button.
 */
export function GatewayHelpModal({ open, onClose, defaultType = 'payment' }) {
  const currentSysLocale = useLocale();
  const [lang, setLang] = useState(currentSysLocale === 'si' ? 'si' : 'en');
  const [activeTab, setActiveTab] = useState('payhere');
  const [category, setCategory] = useState(defaultType); // 'payment' | 'sms'

  const currentGuides = (category === 'payment' ? PAYMENT_GUIDES : SMS_GUIDES)[lang] || PAYMENT_GUIDES.en;
  const guideKeys = Object.keys(currentGuides);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center justify-between gap-4 w-full pr-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold-600" />
            <span>
              {lang === 'si'
                ? 'Gateway පිහිටුවීම් සහ Live කිරීමේ මාර්ගෝපදේශය'
                : 'Gateway Setup & Production Go-Live Guide'}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-md px-2.5 py-1 text-2xs font-bold transition-all ${
                lang === 'en' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('si')}
              className={`rounded-md px-2.5 py-1 text-2xs font-bold transition-all ${
                lang === 'si' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              සිංහල
            </button>
          </div>
        </div>
      }
      description={
        lang === 'si'
          ? 'Merchant ගිණුම් සාදාගැනීම, Live credentials ලබාගැනීම, සහ Sandbox අක්‍රිය කරන ආකාරය.'
          : 'Step-by-step instructions to register merchant accounts, retrieve live credentials, and switch off Sandbox mode.'
      }
    >
      <div className="space-y-4">
        {/* Category switcher */}
        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setCategory('payment');
              setActiveTab('payhere');
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              category === 'payment'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            {lang === 'si' ? 'Payment Gateways (PayHere, Stripe, ආදිය)' : 'Payment Gateways (PayHere, Stripe, etc.)'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory('sms');
              setActiveTab('notifylk');
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              category === 'sms'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            {lang === 'si' ? 'SMS Gateways (Notify.lk, Dialog, ආදිය)' : 'SMS Gateways (Notify.lk, Dialog, etc.)'}
          </button>
        </div>

        {/* Sandbox Turn-off Highlight Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950">
              {lang === 'si'
                ? 'Checkout පිටුවෙන් "Sandbox" ලේබලය ඉවත් කරන්නේ කෙසේද?'
                : 'How the "Sandbox" Label is Removed from the Web:'}
            </p>
            <p className="mt-0.5 text-emerald-800 text-2xs leading-relaxed">
              {lang === 'si' ? (
                <>
                  Admin Console හිදී අදාළ Payment Gateway එක Edit කර එහි <strong>Environment</strong> switch එක <strong>"Live"</strong> ලෙස තැබූ වහාම සාමාජිකයින්ට පෙනෙන Checkout තිරයේ ඇති කහ පැහැති Sandbox badge එක <strong>ක්ෂණිකවම ඉවත් වේ</strong>.
                  SMS සඳහා සැබෑ Gateway එක (උදා: Notify.lk) <strong>"Primary"</strong> කර, Development Log gateway එක <strong>OFF</strong> කරන්න.
                </>
              ) : (
                <>
                  When a Payment Gateway is edited in Admin and its <strong>Environment</strong> switch is set to <strong>"Live"</strong>, the amber Sandbox badge is <strong>instantly hidden</strong> on the Member Checkout screen.
                  For SMS, set your live provider as <strong>"Primary"</strong> and turn <strong>OFF</strong> the Development Log gateway.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {guideKeys.map((key) => {
            const g = currentGuides[key];
            const isSel = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSel
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900'
                }`}
              >
                {g.title.split('(')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Selected Guide Details */}
        {currentGuides[activeTab] && (
          <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 bg-slate-50/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900">{currentGuides[activeTab].title}</h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  {lang === 'si'
                    ? 'නිවැරදි production credentials ලබාගැනීමට මෙම පියවර අනුපිළිවෙලින් අනුගමනය කරන්න.'
                    : 'Follow these steps in order to obtain production credentials.'}
                </p>
              </div>
              {currentGuides[activeTab].portalUrl && (
                <a
                  href={currentGuides[activeTab].portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-2xs font-semibold text-white hover:bg-navy-800 shadow-sm"
                >
                  <span>{currentGuides[activeTab].portalName}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="space-y-3">
              {currentGuides[activeTab].steps.map((st, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-white p-3 border border-slate-200/60 shadow-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 font-bold text-navy-950 text-xs">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-navy-900">{st.title}</h4>
                    <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {(currentGuides[activeTab].sandboxTip || currentGuides[activeTab].tip) && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-2xs text-amber-800 border border-amber-200/70">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{currentGuides[activeTab].sandboxTip || currentGuides[activeTab].tip}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
