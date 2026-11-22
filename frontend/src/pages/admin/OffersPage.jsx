import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
  Alert, Button, Can, Checkbox, ConfirmDialog, DataTable, Input, MultilingualInput, PageHeader, Segmented, Select,
  SlideOverDrawer, StatusBadge, TierBadge, Toggle,
} from '../../components/ui';
import { useDeleteOfferMutation, useOffersQuery, usePartnerOptionsQuery, useSaveOfferMutation, useTiersQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { date, emptyTr, errorMessage, fieldErrors, offerValue, tr } from '../../lib/format';

export default function OffersPage() {
  useDocumentTitle('Offers & Benefits');
  const can = usePermission();
  const [search] = useSearchParams();
  const [params, update, raw] = useTableState({ partner: search.get('partner') || undefined });
  const { data, isLoading, isFetching } = useOffersQuery(params);
  const { data: partners = [] } = usePartnerOptionsQuery();
  const { data: tiersRes } = useTiersQuery({ per_page: 100, sort: 'priority', direction: 'asc' });
  const tiers = tiersRes?.data || [];
  const [editing, setEditing] = useState(null);

  const status = (o) => {
    if (!o.is_active) return 'inactive';
    if (o.ends_at && new Date(o.ends_at) < new Date(new Date().toDateString())) return 'expired';
    return 'active';
  };

  const columns = [
    {
      key: 'title', header: 'Offer', sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-navy-900">{tr(r.title)}</p>
          <p className="truncate text-xs text-slate-500">{tr(r.partner?.name)}</p>
        </div>
      ),
    },
    { key: 'discount_value', header: 'Benefit', sortable: true, render: (r) => <span className="font-semibold tabular-nums text-emerald-700">{offerValue(r)}</span> },
    {
      key: 'tiers', header: 'Unlocked by',
      render: (r) => <div className="flex flex-wrap gap-1">{[...(r.tiers || [])].sort((a, b) => a.priority - b.priority).map((t) => <TierBadge key={t.id} name={tr(t.name)} color={t.color} />)}</div>,
    },
    { key: 'ends_at', header: 'Validity', sortable: true, render: (r) => <span className="text-xs tabular-nums text-slate-600">{r.starts_at ? date(r.starts_at) : 'Now'} → {r.ends_at ? date(r.ends_at) : 'Ongoing'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={status(r)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Offers & Benefits"
        description="Discounts provided by partners, and which membership tiers unlock them."
        actions={<Can perform="offers.manage"><Button icon={Plus} onClick={() => setEditing({})}>New offer</Button></Can>}
      />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        onRowClick={can('offers.manage') ? (r) => setEditing(r) : undefined}
        searchPlaceholder="Search offers or partners…"
        filters={[
          { key: 'partner', label: 'Partner', options: partners.map((p) => ({ value: p.id, label: tr(p.name) })) },
          { key: 'tier', label: 'Tier', options: tiers.map((t) => ({ value: t.id, label: tr(t.name) })) },
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Live' }, { value: 'inactive', label: 'Inactive' }, { value: 'expired', label: 'Expired' }] },
        ]}
        emptyTitle="No offers found"
      />
      <OfferDrawer offer={editing} onClose={() => setEditing(null)} partners={partners} tiers={tiers} />
    </div>
  );
}

function OfferDrawer({ offer, onClose, partners, tiers }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [save, { isLoading, error, reset }] = useSaveOfferMutation();
  const [remove, { isLoading: removing }] = useDeleteOfferMutation();
  const errs = fieldErrors(error);

  useEffect(() => {
    if (!offer) return;
    reset();
    setForm({
      id: offer.id,
      partner_id: offer.partner_id ?? '',
      title: offer.title || emptyTr(),
      description: offer.description || emptyTr(),
      terms: offer.terms || emptyTr(),
      discount_type: offer.discount_type || 'percentage',
      discount_value: offer.discount_value ?? '',
      starts_at: offer.starts_at || '',
      ends_at: offer.ends_at || '',
      is_active: offer.is_active ?? true,
      tier_ids: offer.tier_ids || [],
    });
  }, [offer, reset]);

  if (!form) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleTier = (id) => set({ tier_ids: form.tier_ids.includes(id) ? form.tier_ids.filter((x) => x !== id) : [...form.tier_ids, id] });
  const allTiers = tiers.length > 0 && form.tier_ids.length === tiers.length;

  const submit = async () => {
    try {
      await save({
        ...form,
        partner_id: Number(form.partner_id) || null,
        discount_value: form.discount_type === 'freebie' ? null : form.discount_value === '' ? null : Number(form.discount_value),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }).unwrap();
      toast(form.id ? 'Offer updated' : 'Offer created');
      onClose();
    } catch { /* shown */ }
  };

  const doDelete = async () => {
    try { await remove(form.id).unwrap(); toast('Offer deleted'); setConfirm(false); onClose(); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <SlideOverDrawer
      open={!!offer}
      onClose={onClose}
      title={form.id ? 'Edit offer' : 'New offer'}
      footer={
        <div className="flex w-full justify-between">
          {form.id ? <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button> : <span />}
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>{form.id ? 'Save offer' : 'Create offer'}</Button></div>
        </div>
      }
    >
      <div className="space-y-5">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Select label="Partner business" required placeholder="— Select partner —" value={form.partner_id} onChange={(e) => set({ partner_id: e.target.value })} options={partners.map((p) => ({ value: p.id, label: tr(p.name) + (p.is_active ? '' : ' (inactive)') }))} error={errs.partner_id} />
        <MultilingualInput label="Offer title" required name="title" errors={errs} value={form.title} onChange={(v) => set({ title: v })} maxLength={160} placeholder="e.g. 25% off room rates" />

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-700">Benefit type</p>
          <Segmented value={form.discount_type} onChange={(v) => set({ discount_type: v })} options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed LKR' }, { value: 'freebie', label: 'Complimentary' }]} />
          {form.discount_type !== 'freebie' && (
            <Input className="mt-3 max-w-[200px]" type="number" min="0" step="0.01" prefix={form.discount_type === 'percentage' ? '%' : 'LKR'} value={form.discount_value} onChange={(e) => set({ discount_value: e.target.value })} error={errs.discount_value} fieldClass="tabular-nums" />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">Unlocked for tiers <span className="text-rose-600">*</span></p>
            <Checkbox size="sm" checked={allTiers} indeterminate={!allTiers && form.tier_ids.length > 0} onChange={() => set({ tier_ids: allTiers ? [] : tiers.map((t) => t.id) })} label={<span className="text-xs">All tiers</span>} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {tiers.map((t) => {
              const on = form.tier_ids.includes(t.id);
              return (
                <div
                  key={t.id}
                  role="presentation"
                  onClick={(e) => { if (!e.target.closest('[role=checkbox]')) toggleTier(t.id); }}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${on ? 'border-navy-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <Checkbox checked={on} onChange={() => toggleTier(t.id)} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-medium">{tr(t.name)}</span>
                </div>
              );
            })}
          </div>
          {errs.tier_ids && <p className="mt-1 text-xs text-rose-600">{errs.tier_ids}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="date" label="Starts" value={form.starts_at} onChange={(e) => set({ starts_at: e.target.value })} error={errs.starts_at} />
          <Input type="date" label="Ends" hint="Blank = ongoing" value={form.ends_at} onChange={(e) => set({ ends_at: e.target.value })} error={errs.ends_at} />
        </div>

        <MultilingualInput label="Description" multiline name="description" errors={errs} value={form.description} onChange={(v) => set({ description: v })} />
        <MultilingualInput label="Terms & conditions" multiline rows={2} name="terms" errors={errs} value={form.terms} onChange={(v) => set({ terms: v })} />
        <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" description="Inactive offers are hidden from members and the public site." />
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removing} title="Delete offer?" description="Members will no longer see this benefit." confirmLabel="Delete offer" />
    </SlideOverDrawer>
  );
}
