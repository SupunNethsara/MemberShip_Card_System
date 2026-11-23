import { useParams } from 'react-router-dom';
import { BadgeCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Icon, LoadError, Spinner, TierBadge } from '../../components/ui';
import { useVerifyCardQuery } from '../../app/api';
import { useDocumentTitle, useT } from '../../hooks';
import { date, dateTime } from '../../lib/format';

/** Landing page for the QR code on a member's card — used by partner cashiers. */
export default function VerifyPage() {
  const { token } = useParams();
  const { t, tr, locale } = useT();
  useDocumentTitle(t('verify.title'));
  const { data, isLoading, error, refetch } = useVerifyCardQuery(token);

  const member = data?.member;
  const valid = data?.valid;
  // Only a real "not found" from the server means the card is unknown. A network/server failure must never
  // read as "Card not recognised" — a cashier would turn away a valid member.
  const notFound = error?.status === 404;
  const unreachable = error && !notFound;
  const state = notFound ? 'notFound' : valid ? 'valid' : member?.status === 'expired' ? 'expired' : 'invalid';
  const tone = {
    valid: ['border-emerald-200 bg-emerald-50', 'text-emerald-700', BadgeCheck],
    expired: ['border-amber-200 bg-amber-50', 'text-amber-700', ShieldAlert],
    invalid: ['border-rose-200 bg-rose-50', 'text-rose-700', ShieldX],
    notFound: ['border-rose-200 bg-rose-50', 'text-rose-700', ShieldX],
  }[state];

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="eyebrow">{t('verify.title')}</p>
      {isLoading ? (
        <div className="surface mt-4 flex justify-center p-10"><Spinner /></div>
      ) : unreachable ? (
        <LoadError className="mt-4" title={t('verify.unreachable')} description={t('verify.unreachableBody')} onRetry={refetch} />
      ) : (
        <div className="surface mt-4 overflow-hidden">
          <div className={`flex items-center gap-3 border-b px-5 py-4 ${tone[0]}`}>
            <Icon icon={tone[2]} size={22} className={tone[1]} />
            <p className={`text-lg font-semibold ${tone[1]}`}>{t(`verify.${state}`)}</p>
          </div>
          {member && (
            <dl className="divide-y divide-slate-100">
              <Row k={t('auth.name')} v={member.name} />
              <Row k={t('portal.memberId')} v={<span className="font-mono">{member.member_code}</span>} />
              <Row k={t('portal.tier')} v={member.tier ? <TierBadge name={tr(member.tier.name)} color={member.tier.color} /> : '—'} />
              <Row k={t('portal.validUntil')} v={<span className="tabular-nums">{date(member.expires_at, locale)}</span>} />
            </dl>
          )}
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{t('verify.checked')} {dateTime(new Date().toISOString(), locale)}</p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-navy-900">{v}</dd>
    </div>
  );
}
