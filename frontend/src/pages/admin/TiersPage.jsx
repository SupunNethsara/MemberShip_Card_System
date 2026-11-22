import { useEffect, useState } from 'react';
import { GripVertical, Layers, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import {
  Alert, Button, Can, ConfirmDialog, EmptyState, Icon, Input, MultilingualInput, PageHeader, Select, Skeleton,
  SlideOverDrawer, StatusBadge, Toggle,
} from '../../components/ui';
import { useDeleteTierMutation, useSaveTierMutation, useTiersQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { duration, emptyTr, errorMessage, fieldErrors, money, tr } from '../../lib/format';

const SWATCHES = ['#64748b', '#c99227', '#13224a', '#b45309', '#0e7490', '#047857', '#7c2d12', '#be123c', '#4338ca'];

export default function TiersPage() {
  useDocumentTitle('Membership Tiers');
  const can = usePermission();
  const { data, isLoading } = useTiersQuery({ per_page: 100, sort: 'priority', direction: 'asc' });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [remove, { isLoading: removing }] = useDeleteTierMutation();
  const toast = useToast();
  const tiers = data?.data || [];

  const doDelete = async () => {
    try {
      await remove(deleting.id).unwrap();
      toast('Tier deleted');
      setDeleting(null);
    } catch (e) { toast(errorMessage(e), 'error'); setDeleting(null); }
  };

  return (
    <div>
      <PageHeader
        title="Membership Tiers"
        description="Plans members can buy. Names and descriptions are shown in English, Sinhala and Tamil."
        actions={<Can perform="tiers.manage"><Button icon={Plus} onClick={() => setEditing({})}>New tier</Button></Can>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        {tiers.map((t) => (
          <div key={t.id} className="surface flex flex-col overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: t.color }} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{tr(t.name)}</h3>
                    {t.is_featured && <Icon icon={Star} size={13} className="fill-amber-400 text-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-500">{t.name.si || '—'} · {t.name.ta || '—'}</p>
                </div>
                <StatusBadge status={t.is_active ? 'active' : 'inactive'} />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold tabular-nums">{money(t.price)}</p>
              <p className="text-xs text-slate-500">per {duration(t.duration_value, t.duration_unit)} · priority {t.priority}</p>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{tr(t.description)}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div><dt className="eyebrow">Active members</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{t.active_members_count ?? 0}</dd></div>
                <div><dt className="eyebrow">Offers mapped</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{t.offers_count ?? 0}</dd></div>
              </dl>
            </div>
            {can('tiers.manage') && (
              <div className="flex justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                <Button size="xs" variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(t)}>Delete</Button>
                <Button size="xs" variant="secondary" icon={Pencil} onClick={() => setEditing(t)}>Edit</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {!isLoading && tiers.length === 0 && <div className="surface"><EmptyState icon={Layers} title="No tiers yet" description="Create your first membership tier to start selling." /></div>}

      <TierDrawer tier={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={removing} title="Delete tier?" description={`"${tr(deleting?.name)}" will be removed. Tiers with existing memberships can't be deleted — deactivate them instead.`} confirmLabel="Delete tier" />
    </div>
  );
}

function TierDrawer({ tier, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [save, { isLoading, error, reset }] = useSaveTierMutation();
  const errs = fieldErrors(error);

  useEffect(() => {
    if (!tier) return;
    reset();
    setForm({
      id: tier.id,
      name: tier.name || emptyTr(),
      description: tier.description || emptyTr(),
      features: tier.features?.length ? tier.features : [emptyTr()],
      price: tier.price ?? '',
      duration_value: tier.duration_value ?? 12,
      duration_unit: tier.duration_unit ?? 'months',
      color: tier.color ?? '#13224a',
      priority: tier.priority ?? 0,
      is_active: tier.is_active ?? true,
      is_featured: tier.is_featured ?? false,
    });
  }, [tier, reset]);

  if (!form) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    try {
      await save({ ...form, price: Number(form.price), duration_value: Number(form.duration_value), priority: Number(form.priority) }).unwrap();
      toast(form.id ? 'Tier updated' : 'Tier created');
      onClose();
    } catch { /* shown */ }
  };

  return (
    <SlideOverDrawer
      open={!!tier}
      onClose={onClose}
      title={form.id ? `Edit ${tr(form.name)}` : 'New membership tier'}
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>{form.id ? 'Save tier' : 'Create tier'}</Button></>}
    >
      <div className="space-y-5">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <MultilingualInput label="Tier name" required name="name" errors={errs} value={form.name} onChange={(v) => set({ name: v })} maxLength={80} placeholder="e.g. Gold" />
        <MultilingualInput label="Description" multiline name="description" errors={errs} value={form.description} onChange={(v) => set({ description: v })} maxLength={1000} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Price" required prefix="LKR" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} error={errs.price} fieldClass="tabular-nums" />
          <Input label="Validity" required type="number" min="1" value={form.duration_value} onChange={(e) => set({ duration_value: e.target.value })} error={errs.duration_value} />
          <Select label="Unit" value={form.duration_unit} onChange={(e) => set({ duration_unit: e.target.value })} options={[{ value: 'months', label: 'Months' }, { value: 'days', label: 'Days' }]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">Card theme colour</p>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button key={c} type="button" onClick={() => set({ color: c })} className={`h-7 w-7 rounded-md border ${form.color === c ? 'ring-2 ring-navy-900 ring-offset-2' : 'border-slate-200'}`} style={{ backgroundColor: c }} aria-label={c} />
              ))}
              <input type="color" value={form.color} onChange={(e) => set({ color: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white" />
            </div>
            {errs.color && <p className="mt-1 text-xs text-rose-600">{errs.color}</p>}
          </div>
          <Input label="Priority rank" type="number" min="0" hint="Higher = more premium (used for upgrades & sorting)" value={form.priority} onChange={(e) => set({ priority: e.target.value })} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-700">Feature bullets</p>
          <div className="space-y-3">
            {form.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon icon={GripVertical} size={14} className="mt-9 text-slate-300" />
                <MultilingualInput className="flex-1" value={f} onChange={(v) => set({ features: form.features.map((x, idx) => (idx === i ? v : x)) })} placeholder="e.g. Up to 25% off hotels" maxLength={160} />
                <button type="button" onClick={() => set({ features: form.features.filter((_, idx) => idx !== i) })} className="mt-8 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove feature"><Icon icon={X} size={14} /></button>
              </div>
            ))}
            <Button size="xs" variant="secondary" icon={Plus} onClick={() => set({ features: [...form.features, emptyTr()] })}>Add feature</Button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" description="Inactive tiers are hidden from the public site and checkout." />
          <Toggle checked={form.is_featured} onChange={(v) => set({ is_featured: v })} label="Highlight as Most popular" tone="slate" />
        </div>
      </div>
    </SlideOverDrawer>
  );
}
