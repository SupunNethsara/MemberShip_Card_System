import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpCircle, Gift, Printer, Receipt, RefreshCw, Sparkles } from 'lucide-react';
import { Alert, Button, Card, Icon, Skeleton, StatusBadge, TierBadge } from '../../components/ui';
import MembershipCard from '../../components/MembershipCard';
import PrintableCard from '../../components/PrintableCard';
import { useMemberDashboardQuery, usePublicContentQuery, usePublicTiersQuery } from '../../app/api';
import { useDocumentTitle, useT } from '../../hooks';
import { date } from '../../lib/format';

export default function PortalDashboard() {
  const { t, tr, locale } = useT();
  useDocumentTitle(t('portal.nav.card'));
  const { data, isLoading } = useMemberDashboardQuery();
  const { data: content } = usePublicContentQuery();
  const { data: tiers = [] } = usePublicTiersQuery();

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const m = data?.membership;
  const card = data?.card;
  const active = m?.status === 'active';
  const higher = tiers.filter((x) => m?.tier && x.priority > m.tier.priority);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{t('portal.welcome')},</p>
        <h1 className="text-2xl font-semibold">{card?.name}</h1>
      </div>

      {active && m.days_remaining <= 30 && (
        <Alert tone="warning" action={<Link to={`/portal/checkout?tier=${m.tier.id}`}><Button size="sm" icon={RefreshCw}>{t('portal.renew')}</Button></Link>}>
          {t('portal.expiringSoon')} <span className="font-semibold tabular-nums">({m.days_remaining} {t('portal.daysLeft')})</span>
        </Alert>
      )}
      {data?.stats?.awaiting_approval > 0 && <Alert tone="info">{t('checkout.slipReceived')}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface flex flex-col items-center justify-center gap-5 p-6 sm:p-10">
          <div className="w-full">
            <MembershipCard
              name={card?.name}
              memberCode={card?.member_code}
              tierName={m ? tr(m.tier?.name) : '—'}
              tierColor={m?.tier?.color}
              expiresAt={m?.expires_at}
              verifyUrl={card?.verify_url}
              status={active ? 'active' : 'inactive'}
              brandSi={content?.content?.['brand.name']?.si || 'ජීවනසවිය'}
              brandEn={(content?.content?.['brand.name']?.en || 'Jeewanasaviya').toUpperCase()}
              logoUrl={content?.settings?.logo_url}
              locale={locale}
              labels={{ member: t('portal.member'), memberId: t('portal.memberId'), validUntil: t('portal.validUntil'), expired: t('status.expired') }}
            />
          </div>
          <p className="text-center text-xs text-slate-500">{t('portal.scanHint')}</p>
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()} disabled={!card?.member_code}>{t('portal.print')}</Button>
          <PrintableCard
            name={card?.name}
            memberCode={card?.member_code}
            tierName={m ? tr(m.tier?.name) : ''}
            tierColor={m?.tier?.color}
            expiresAt={m?.expires_at}
            memberSince={card?.member_since}
            verifyUrl={card?.verify_url}
            active={active}
            siteName={tr(content?.content?.['brand.name']) || content?.settings?.site_name}
            logoUrl={content?.settings?.logo_url}
            brandSi={content?.content?.['brand.name']?.si || 'ජීවනසවිය'}
            brandEn={(content?.content?.['brand.name']?.en || 'Jeewanasaviya').toUpperCase()}
            contactEmail={content?.settings?.contact_email}
            contactPhone={content?.settings?.contact_phone}
            locale={locale}
            labels={{ member: t('portal.member'), memberId: t('portal.memberId'), validUntil: t('portal.validUntil'), memberSince: t('portal.memberSince'), inactive: t('status.expired'), scan: t('portal.scanHint'), howTo: t('portal.printHowTo'), nonTransferable: t('portal.printTerms'), support: t('footer.support'), cut: t('portal.printCut') }}
          />
        </div>

        <div className="space-y-4">
          {active ? (
            <Card bodyClass="p-5">
              <div className="flex items-center justify-between">
                <TierBadge name={tr(m.tier.name)} color={m.tier.color} />
                <StatusBadge status="active">{t('status.active')}</StatusBadge>
              </div>
              <p className="mt-4 font-display text-4xl font-semibold tabular-nums">{m.days_remaining}</p>
              <p className="text-xs text-slate-500">{t('portal.daysLeft')} · {t('portal.validUntil')} {date(m.expires_at, locale)}</p>
              <div className="mt-5 grid gap-2">
                <Link to={`/portal/checkout?tier=${m.tier.id}`}><Button variant="secondary" className="w-full justify-center" icon={RefreshCw}>{t('portal.renew')}</Button></Link>
                {higher.length > 0 && (
                  <Link to={`/portal/checkout?tier=${higher[0].id}`}><Button className="w-full justify-center" icon={ArrowUpCircle}>{t('portal.upgrade')} → {tr(higher[0].name)}</Button></Link>
                )}
              </div>
            </Card>
          ) : (
            <Card bodyClass="p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 text-white"><Icon icon={Sparkles} size={17} /></span>
              <h2 className="mt-4 text-base font-semibold">{t('portal.noPlanTitle')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('portal.noPlanSub')}</p>
              <Link to="/portal/checkout"><Button className="mt-5 w-full justify-center" iconRight={ArrowRight}>{t('portal.choosePlan')}</Button></Link>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link to="/portal/benefits" className="surface p-4 transition-colors hover:border-slate-300">
              <Icon icon={Gift} size={16} className="text-slate-500" />
              <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{data?.stats?.unlocked_offers ?? 0}<span className="text-sm font-normal text-slate-400">/{data?.stats?.total_offers ?? 0}</span></p>
              <p className="text-xs text-slate-500">{t('portal.unlockedOffers')}</p>
            </Link>
            <Link to="/portal/billing" className="surface p-4 transition-colors hover:border-slate-300">
              <Icon icon={Receipt} size={16} className="text-slate-500" />
              <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{data?.stats?.invoices_paid ?? 0}</p>
              <p className="text-xs text-slate-500">{t('portal.invoicesPaid')}</p>
            </Link>
          </div>
        </div>
      </div>

      {data?.history?.data?.length > 0 && (
        <Card title={t('portal.history')} bodyClass="p-0">
          <ul className="divide-y divide-slate-100">
            {data.history.data.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <TierBadge name={tr(h.tier?.name)} color={h.tier?.color} />
                  <span className="text-xs capitalize text-slate-500">{h.source}</span>
                </div>
                <span className="tabular-nums text-slate-600">{date(h.starts_at, locale)} → {date(h.expires_at, locale)}</span>
                <StatusBadge status={h.status}>{t(`status.${h.status}`)}</StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
