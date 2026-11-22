import { usePublicContentQuery } from '../../app/api';
import { Skeleton } from '../../components/ui';
import { useDocumentTitle, useT } from '../../hooks';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, CreditCard, ShieldCheck } from 'lucide-react';

const DEFAULT_SECTIONS = [
  {
    icon: CheckCircle2,
    title: '1. Instant Digital Activation',
    body: 'Jeewanasaviya is a digital membership and privilege service. Immediately upon successful online payment confirmation (or manual bank slip approval), your digital QR membership card is issued and partner merchant discounts are unlocked instantly.',
  },
  {
    icon: Clock,
    title: '2. Membership Cancellation',
    body: 'Memberships are non-recurring by default: we do not automatically charge your payment card upon expiry. You are free to renew or let your tier expire without penalty or recurring fees. If you wish to deactivate or close your profile early, you may do so by contacting support.',
  },
  {
    icon: ShieldCheck,
    title: '3. General Refund Policy',
    body: 'Because membership benefits, digital credentials, and merchant discounts become immediately accessible once an account is activated, paid membership subscription fees are generally non-refundable once card generation is complete.',
  },
  {
    icon: RefreshCw,
    title: '4. Duplicate or Erroneous Transactions',
    body: 'In the event that an account is charged multiple times due to a network interruption, bank gateway delay, or technical glitch: please notify us immediately with your transaction reference numbers. Upon verification, 100% of the duplicate charge will be refunded directly to your original payment card or bank account within 5 to 10 business days.',
  },
  {
    icon: CreditCard,
    title: '5. Manual Bank Deposit Slip Inquiries',
    body: 'For payments made via direct bank deposit or wire transfer: if an uploaded slip is invalid or the transaction cannot be verified by our finance team, any confirmed excess funds credited to our account will be returned to the depositing party upon verification.',
  },
  {
    icon: AlertCircle,
    title: '6. How to Request Assistance / Refund Review',
    body: 'To submit a billing dispute or payment inquiry, please contact our support desk via email or phone with your Member ID, registered mobile number, payment invoice number, and transaction receipt. Our team reviews all payment inquiries within 24–48 hours.',
  },
];

export default function RefundPage() {
  const { t, tr } = useT();
  useDocumentTitle(t('nav.refund'));
  const { data, isLoading } = usePublicContentQuery();
  const cmsBody = tr(data?.content?.['refund.body']);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow text-gold-600">Compliance & Customer Protection</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {t('nav.refund')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Our cancellation guidelines, instant digital service terms, and duplicate payment resolution policies.
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
