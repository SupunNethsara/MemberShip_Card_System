import { usePublicContentQuery } from '../../app/api';
import { Skeleton } from '../../components/ui';
import { useDocumentTitle, useT } from '../../hooks';
import { ShieldCheck, Lock, Eye, FileText, UserCheck, HelpCircle } from 'lucide-react';

const DEFAULT_SECTIONS = [
  {
    icon: UserCheck,
    title: '1. Information We Collect',
    body: 'When you create a membership account, purchase a plan, or access partner benefits, we collect necessary personal details: your full name, email address, mobile phone number, National Identity Card (NIC) number (used strictly for member identification and card fraud prevention), and preferred communication language. We also maintain records of transaction reference IDs and payment receipts.',
  },
  {
    icon: FileText,
    title: '2. How We Use Your Information',
    body: 'Your personal information is utilized strictly to: (a) issue and cryptographically verify your digital QR membership card; (b) verify discount entitlement at partner merchant outlets; (c) dispatch important transactional notifications such as SMS verification codes, payment confirmations, and membership renewal reminders; and (d) provide customer support and service inquiries.',
  },
  {
    icon: Lock,
    title: '3. Payment Information & Financial Security',
    body: 'All online monetary transactions are processed through certified, licensed payment gateways (including PayHere, WebXPay, and international banking networks). We never capture, store, or view your credit card numbers, debit card details, CVV codes, or online banking passwords. All payment transmissions occur over encrypted 256-bit SSL connections.',
  },
  {
    icon: Eye,
    title: '4. Non-Disclosure & Third-Party Sharing',
    body: 'We operate under a strict non-disclosure standard: we never sell, lease, rent, trade, or monetize your personal information to third-party advertisers or data brokers. Participating partner businesses only verify member card status (Active / Inactive) and member name when you present your card for discounts.',
  },
  {
    icon: ShieldCheck,
    title: '5. Data Retention & Security Controls',
    body: 'We implement rigorous administrative, technical, and physical safeguards to protect your personal data from unauthorized access, accidental alteration, or disclosure. You retain full rights to review or update your profile through your Member Portal at any time.',
  },
  {
    icon: HelpCircle,
    title: '6. Privacy Inquiries & Data Rights',
    body: 'If you have questions, feedback, or wish to request data correction or deletion, please reach out to our support team via our contact channels. Inquiries are handled promptly within standard business hours.',
  },
];

export default function PrivacyPage() {
  const { t, tr } = useT();
  useDocumentTitle(t('nav.privacy'));
  const { data, isLoading } = usePublicContentQuery();
  const cmsBody = tr(data?.content?.['privacy.body']);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow text-gold-600">Privacy & Data Protection</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {t('nav.privacy')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          How we handle, secure, and protect your personal information across all Jeewanasaviya membership services.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {isLoading ? (
          <div className="surface space-y-4 p-6 sm:p-8">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : cmsBody ? (
          <div className="surface p-6 sm:p-8">
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              {cmsBody.split(/\n{2,}/).map((block, i) => {
                const [first, ...rest] = block.split('\n');
                return (
                  <div key={i}>
                    <p className="font-semibold text-navy-900">{first}</p>
                    {rest.length > 0 && <p className="mt-1">{rest.join(' ')}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {DEFAULT_SECTIONS.map((sec, idx) => {
              const IconComp = sec.icon;
              return (
                <div key={idx} className="surface p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-gold-600">
                      <IconComp size={18} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-navy-900">{sec.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                        {sec.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
