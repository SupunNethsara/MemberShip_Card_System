import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Mail, Phone, Plus, Save, Trash2 } from 'lucide-react';
import { Alert, Button, Can, Card, Icon, Input, LoadError, MultilingualInput, Segmented, Skeleton } from '../../../components/ui';
import { useCmsQuery, useSaveCmsMutation } from '../../../app/api';
import { usePermission, useToast } from '../../../hooks';
import { emptyTr, errorMessage, fieldErrors } from '../../../lib/format';
import { SOCIAL_PLATFORMS } from '../../../lib/social';

const blankSocial = () => Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, '']));

/**
 * CMS › Site settings › Footer: social media links + additional emails / phone numbers.
 * Empty fields are hidden on the public footer, so staff only fill in what they use.
 */
export default function FooterContactEditor() {
  const can = usePermission();
  const toast = useToast();
  const { data, isLoading, refetch } = useCmsQuery();
  const [save, { isLoading: saving, error }] = useSaveCmsMutation();
  const [social, setSocial] = useState(blankSocial());
  const [extra, setExtra] = useState([]);
  const errs = fieldErrors(error);
  const readOnly = !can('cms.manage');

  useEffect(() => {
    if (!data?.settings) return;
    setSocial({ ...blankSocial(), ...(data.settings.social || {}) });
    setExtra((data.settings.contact_extra || []).map((c) => ({ ...c, label: c.label || emptyTr() })));
  }, [data]);

  const setRow = (i, patch) => setExtra((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const move = (i, dir) => setExtra((rows) => {
    const next = [...rows];
    const j = i + dir;
    if (j < 0 || j >= next.length) return rows;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const submit = async () => {
    try {
      await save({ settings: { social, contact_extra: extra.filter((r) => r.value.trim() !== '') } }).unwrap();
      toast('Footer updated', 'success', 'Changes are live on the public website.');
    } catch { /* shown below */ }
  };

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;
  if (!data) return <LoadError onRetry={refetch} />;

  return (
    <Card
      title="Footer: contact & social media"
      description="Shown in the website footer. Leave a field empty to hide it."
      className="xl:col-span-2"
      footer={<Can perform="cms.manage"><div className="flex justify-end"><Button size="sm" icon={Save} loading={saving} onClick={submit}>Save footer</Button></div></Can>}
    >
      {error && !Object.keys(errs).length && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}
      <fieldset disabled={readOnly} className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-navy-900">Social media</p>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((p) => (
              <div key={p.key} className="flex items-start gap-3">
                <span className="mt-[22px] inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-navy-800">
                  <Icon icon={p.icon} size={16} />
                </span>
                <Input
                  className="flex-1"
                  label={p.label}
                  placeholder={p.placeholder}
                  inputMode={p.isNumber ? 'tel' : 'url'}
                  value={social[p.key] || ''}
                  onChange={(e) => setSocial((s) => ({ ...s, [p.key]: e.target.value }))}
                  error={errs[`settings.social.${p.key}`]}
                  hint={p.isNumber ? 'Number with country code — visitors open a WhatsApp chat.' : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy-900">Additional emails & phone numbers</p>
            <Button size="xs" variant="secondary" icon={Plus} disabled={extra.length >= 12} onClick={() => setExtra((rows) => [...rows, { type: 'email', value: '', label: emptyTr() }])}>Add contact</Button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            The main support email and phone (Site settings above) always show first. Add more here — e.g. Partnerships, Hotline, Accounts.
          </p>
          <div className="space-y-3">
            {extra.map((r, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Segmented size="sm" value={r.type} onChange={(v) => setRow(i, { type: v })} options={[{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }]} />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon icon={ArrowUp} size={14} /></Button>
                    <Button size="icon" variant="ghost" disabled={i === extra.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon icon={ArrowDown} size={14} /></Button>
                    <Button size="icon" variant="danger-ghost" onClick={() => setExtra((rows) => rows.filter((_, idx) => idx !== i))} aria-label="Remove"><Icon icon={Trash2} size={14} /></Button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Input
                    label={r.type === 'email' ? 'Email address' : 'Phone number'}
                    prefix={<Icon icon={r.type === 'email' ? Mail : Phone} size={14} />}
                    placeholder={r.type === 'email' ? 'partners@example.lk' : '+94 11 234 5678'}
                    inputMode={r.type === 'email' ? 'email' : 'tel'}
                    value={r.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                    error={errs[`settings.contact_extra.${i}.value`]}
                  />
                  <MultilingualInput label="Label (optional)" value={r.label} onChange={(v) => setRow(i, { label: v })} placeholder="e.g. Partnerships" maxLength={60} />
                </div>
              </div>
            ))}
            {!extra.length && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">No additional contacts.</p>}
          </div>
        </div>
      </fieldset>
    </Card>
  );
}
