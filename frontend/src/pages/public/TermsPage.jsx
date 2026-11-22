import { usePublicContentQuery } from '../../app/api';
import { Skeleton } from '../../components/ui';
import { useDocumentTitle, useT } from '../../hooks';
import { FileCheck, Shield, AlertTriangle, CreditCard, Users, Landmark } from 'lucide-react';

const DEFAULT_TERMS = [
  {
    icon: Users,
    title: '1. Membership & Card Issuance',
    body: 'Membership in Jeewanasaviya is personal, non-transferable, and valid exclusively for the verified member name registered on the account. The digital QR membership card must be presented through a mobile device or printed replica alongside government-issued photo identification (NIC, Passport, or Driving License) upon request at merchant partner locations.',
  },
  {
    icon: Shield,
    title: '2. Validity & Service Period',
    body: 'Each membership tier is active for the precise duration indicated at purchase (e.g. 1 year, 6 months, or specific calendar validity) and begins immediately upon online payment clearance or manual deposit verification. Members are solely responsible for renewing prior to expiration to maintain uninterrupted benefits.',
  },
  {
    icon: Landmark,
    title: '3. Partner Offers & Merchant Conditions',
    body: 'Discounts, special pricing, and privileges are extended by independent merchant partners. Partners reserve the right to apply standard house rules, blackout dates, and capacity limitations. While Jeewanasaviya verifies all commercial partner agreements, we are not liable for individual merchant service availability or changes in third-party operational terms.',
  },
  {
    icon: CreditCard,
    title: '4. Electronic Payments & Gateway Security',
    body: 'All online subscription fees are transacted via licensed, bank-approved, PCI-DSS compliant payment gateways (including PayHere, WebXPay, Stripe, and authorized acquirers). Customers agree to provide accurate, authorized payment instruments. Jeewanasaviya does not hold or store debit/credit card CVV or card numbers on internal servers.',
  },
  {
    icon: FileCheck,
    title: '5. Fees, Taxes & Billing',
    body: 'All membership rates are listed in Sri Lankan Rupees (LKR) unless otherwise specified. Charges are billed in full at checkout. Jeewanasaviya reserves the right to modify future membership tier pricing, with existing active subscriptions remaining unaffected until their designated expiry.',
  },
  {
    icon: AlertTriangle,
    title: '6. Limitation of Liability',
    body: 'Jeewanasaviya operates as a digital membership credential provider and merchant discount network. We shall not be held liable for indirect, incidental, or consequential damages resulting from transactions or interactions between members and merchant partners.',
  },
];

export default function TermsPage() {
  const { t, tr } = useT();
  useDocumentTitle(t('nav.terms'));
  const { data, isLoading } = usePublicContentQuery();
  const cmsBody = tr(data?.content?.['terms.body']);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="eyebrow text-gold-600">Legal Agreement</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {t('nav.terms')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Terms of service and operational conditions governing the Jeewanasaviya membership portal and digital card.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {isLoading ? (
          <div className="surface space-y-4 p-6 sm:p-8">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : cmsBody && cmsBody.length > 200 ? (
          <div className="surface p-6 sm:p-8">
            <div className="space-y-5 text-[15px] leading-relaxed text-slate-700">
              {cmsBody.split(/\n{2,}/).map((block, i) => {
                const [first, ...rest] = block.split('\n');
                return (
                  <div key={i}>
                    <p className="font-semibold text-navy-900">{first}</p>
                    {rest.length > 0 && <p className="mt-1.5 text-slate-600">{rest.join(' ')}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {DEFAULT_TERMS.map((sec, idx) => {
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
