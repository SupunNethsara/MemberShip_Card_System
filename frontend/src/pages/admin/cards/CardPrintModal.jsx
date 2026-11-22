import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Printer, RotateCcw } from 'lucide-react';
import { Alert, Button, Icon, Modal, Segmented, Spinner, Toggle } from '../../../components/ui';
import CardFront, { CardBack, CARD_MM } from '../../../components/card/CardFront';
import CardPrintSheet, { sheetPagesFor } from '../../../components/card/CardPrintSheet';
import { useCardSheetMutation, useMarkCardsPrintedMutation, usePublicContentQuery } from '../../../app/api';
import { usePermission, useToast } from '../../../hooks';
import { errorMessage, tr } from '../../../lib/format';

/** Scales a mm-authored card to its container on screen. */
function Scaled({ children, className = '' }) {
  return (
    <div className={className} style={{ containerType: 'inline-size' }}>
      <div style={{ aspectRatio: `${CARD_MM.w} / ${CARD_MM.h}` }} className="rounded-[4cqw] shadow-[0_2px_4px_rgb(19_34_74/0.08),0_18px_32px_-20px_rgb(19_34_74/0.5)]">
        {children}
      </div>
    </div>
  );
}

/**
 * Preview → print → confirm workflow for one or many member cards.
 * Status only changes after the operator confirms the cards came out correctly.
 */
export default function CardPrintModal({ userIds, open, onClose, onPrinted }) {
  const can = usePermission();
  const toast = useToast();
  const { data: content } = usePublicContentQuery();
  const [loadSheet, { data, isLoading, error, reset }] = useCardSheetMutation();
  const [markPrinted, { isLoading: marking }] = useMarkCardsPrintedMutation();
  const [layout, setLayout] = useState('a4');
  const [includeBack, setIncludeBack] = useState(true);
  const [step, setStep] = useState('preview'); // preview | confirm
  const [printing, setPrinting] = useState(false);
  const cards = useMemo(() => data?.data ?? [], [data]);
  const key = (userIds || []).join(',');

  const brand = useMemo(() => ({
    si: content?.content?.['brand.name']?.si || 'ජීවනසවිය',
    en: (content?.content?.['brand.name']?.en || 'Jeewanasaviya').toUpperCase(),
    logo: content?.settings?.logo_url,
  }), [content]);

  useEffect(() => {
    if (open && userIds?.length) {
      setStep('preview');
      setLayout(userIds.length === 1 ? 'cr80' : 'a4');
      loadSheet(userIds);
    }
    if (!open) reset();
  }, [open, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const reprints = cards.filter((c) => c.is_reprint).length;
  const pages = sheetPagesFor(cards.length, layout, includeBack);
  const single = cards.length === 1 ? cards[0] : null;

  const doPrint = () => {
    setPrinting(true);
    // Let React mount the print sheet before opening the dialog.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const after = () => { window.removeEventListener('afterprint', after); setPrinting(false); setStep('confirm'); };
      window.addEventListener('afterprint', after);
      window.print();
    }));
  };

  const confirmPrinted = async () => {
    try {
      const res = await markPrinted(cards.map((c) => c.user_id)).unwrap();
      toast(`${res.printed + res.reprinted} card(s) marked as printed`, 'success', res.reprinted ? `${res.reprinted} reprint(s) logged · batch ${res.batch}` : `Batch ${res.batch}`);
      onPrinted?.();
      onClose();
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const title = single ? `${single.is_reprint ? 'Reprint' : 'Print'} card — ${single.name}` : `Print ${cards.length || userIds?.length || ''} member cards`;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="2xl"
        title={title}
        description={single ? `${single.member_code} · ${tr(single.tier?.name)}` : 'Preview before printing. Card status changes only after you confirm the print.'}
        footer={step === 'confirm' ? (
          <>
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setStep('preview')}>Print again</Button>
            <Button variant="secondary" size="sm" onClick={onClose}>Not now</Button>
            <Button variant="success" size="sm" icon={CheckCircle2} loading={marking} onClick={confirmPrinted}>Yes, mark {cards.length} as printed</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            {can('cards.print') && (
              <Button size="sm" icon={Printer} disabled={!cards.length} loading={printing} onClick={doPrint}>
                {reprints ? (reprints === cards.length ? 'Reprint' : `Print (${reprints} reprint${reprints > 1 ? 's' : ''})`) : 'Print'} · {pages} page{pages > 1 ? 's' : ''}
              </Button>
            )}
          </>
        )}
      >
        {isLoading && <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>}
        {error && <Alert tone="danger">{errorMessage(error)}</Alert>}

        {!isLoading && cards.length > 0 && step === 'confirm' && (
          <div className="py-6 text-center">
            <Icon icon={Printer} size={32} className="mx-auto text-navy-700" />
            <h3 className="mt-3 text-base font-semibold">Did all {cards.length} card{cards.length > 1 ? 's' : ''} print correctly?</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Confirming sets the status to <b>Printed</b>{reprints ? <> and logs <b>{reprints} reprint{reprints > 1 ? 's' : ''}</b></> : null} under your name. You can mark them <b>Issued</b> when handed to the member.
            </p>
          </div>
        )}

        {!isLoading && cards.length > 0 && step === 'preview' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-slate-500">Layout</p>
                <Segmented value={layout} onChange={setLayout} options={[{ value: 'a4', label: 'A4 sheet · 10 per page' }, { value: 'cr80', label: 'Card printer · CR80' }]} />
              </div>
              <Toggle checked={includeBack} onChange={setIncludeBack} label="Print back side" description={layout === 'a4' ? 'Back pages are mirrored for long-edge duplex.' : 'Each card prints front, then back.'} tone="slate" />
              <div className="ml-auto text-right text-xs text-slate-500">
                <p className="font-display text-xl font-semibold tabular-nums text-navy-900">{cards.length}</p>
                card{cards.length > 1 ? 's' : ''} · {pages} page{pages > 1 ? 's' : ''}
              </div>
            </div>

            {reprints > 0 && (
              <Alert tone="warning">
                {single ? 'This card was printed before' : `${reprints} of these ${cards.length} cards were printed before`} — confirming will count as {reprints > 1 ? 'reprints' : 'a reprint'} and be logged under your name.
              </Alert>
            )}
            {single ? (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Front</p>
                  <Scaled>
                    <CardFront unit="cq" variant="id" name={single.name} memberCode={single.member_code} nic={single.nic} joinedAt={single.joined_at}
                      tierName={single.tier?.name?.en} tierColor={single.tier?.color} expiresAt={single.expires_at}
                      verifyUrl={single.verify_url} brandSi={brand.si} brandEn={brand.en} logoUrl={brand.logo} />
                  </Scaled>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Back {includeBack ? '' : '(not printed)'}</p>
                  <Scaled className={includeBack ? '' : 'opacity-40'}>
                    <CardBack unit="cq" memberCode={single.member_code} memberSince={single.joined_at} contactPhone={single.contact?.phone} contactEmail={single.contact?.email} />
                  </Scaled>
                </div>
              </div>
            ) : (
              <div className="grid max-h-[52vh] grid-cols-2 gap-4 overflow-y-auto pr-1 md:grid-cols-3">
                {cards.map((c) => (
                  <div key={c.user_id}>
                    <Scaled>
                      <CardFront unit="cq" variant="id" name={c.name} memberCode={c.member_code} nic={c.nic} joinedAt={c.joined_at}
                        tierName={c.tier?.name?.en} tierColor={c.tier?.color} expiresAt={c.expires_at}
                        verifyUrl={c.verify_url} brandSi={brand.si} brandEn={brand.en} logoUrl={brand.logo} />
                    </Scaled>
                    <p className="mt-1.5 truncate text-2xs text-slate-500">
                      {c.member_code}{c.is_reprint && <span className="ml-1.5 rounded bg-amber-50 px-1 font-medium text-amber-700">reprint</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {open && cards.length > 0 && <CardPrintSheet cards={cards} layout={layout} includeBack={includeBack} brand={brand} />}
    </>
  );
}
