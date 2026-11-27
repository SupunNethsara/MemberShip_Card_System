import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ImagePlus, MapPin, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import {
  Alert, Button, Can, Checkbox, ConfirmDialog, DataTable, Icon, Input, Modal, MultilingualInput, PageHeader, Select,
  SlideOverDrawer, StatusBadge, Toggle,
} from '../../components/ui';
import CategoryIcon, { CATEGORY_ICONS } from '../../components/public/CategoryIcon';
import {
  useBulkDeletePartnersMutation, useCategoriesQuery, useDeleteCategoryMutation, useDeletePartnerMutation, usePartnerQuery, usePartnersQuery,
  useSaveCategoryMutation, useSavePartnerMutation,
} from '../../app/api';
import { useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { emptyTr, errorMessage, fieldErrors, tr } from '../../lib/format';

export default function PartnersPage() {
  useDocumentTitle('Partner Businesses');
  const can = usePermission();
  const toast = useToast();
  const [params, update, raw] = useTableState();
  const { data, isLoading, isFetching, refetch } = usePartnersQuery(params);
  const { data: cats } = useCategoriesQuery();
  const [bulkDeletePartners, { isLoading: deletingBulk }] = useBulkDeletePartnersMutation();
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // number | 'new' | null
  const [catsOpen, setCatsOpen] = useState(false);

  const rows = data?.data ?? [];
  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => checkedIds.has(id));
  const someOnPage = pageIds.some((id) => checkedIds.has(id));

  const toggle = (id) => setCheckedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setCheckedIds((s) => { const n = new Set(s); allOnPage ? pageIds.forEach((id) => n.delete(id)) : pageIds.forEach((id) => n.add(id)); return n; });

  const confirmBulkDelete = async () => {
    try {
      const res = await bulkDeletePartners([...checkedIds]).unwrap();
      toast(res.message || 'Partners deleted successfully');
      setCheckedIds(new Set());
      setBulkDeleteOpen(false);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const columns = [
    {
      key: 'select', width: 44,
      header: <Checkbox size="sm" checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} title="Select all on this page" />,
      render: (r) => <div onClick={(e) => e.stopPropagation()}><Checkbox size="sm" checked={checkedIds.has(r.id)} onChange={() => toggle(r.id)} /></div>,
    },
    {
      key: 'name', header: 'Partner', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            {r.logo_url ? <img src={r.logo_url} alt="" className="h-full w-full object-cover" /> : <CategoryIcon name={r.category?.icon} size={15} className="text-slate-500" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{tr(r.name)}</p>
            <p className="truncate text-xs text-slate-500">{r.email || r.website || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (r) => (r.category ? <span className="inline-flex items-center gap-1.5 text-slate-700"><CategoryIcon name={r.category.icon} size={13} />{tr(r.category.name)}</span> : '—') },
    { key: 'city', header: 'City', sortable: true, render: (r) => r.city ? <span className="inline-flex items-center gap-1"><Icon icon={MapPin} size={12} className="text-slate-400" />{r.city}</span> : '—' },
    { key: 'phone', header: 'Contact', render: (r) => <span className="tabular-nums">{r.phone || '—'}</span> },
    { key: 'offers_count', header: 'Offers', align: 'right', render: (r) => <Link to={`/admin/offers?partner=${r.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-navy-900 hover:underline">{r.offers_count}</Link> },
    { key: 'status', header: 'Status', render: (r) => <div className="flex gap-1.5"><StatusBadge status={r.is_active ? 'active' : 'inactive'} />{r.is_featured && <StatusBadge tone="dark" dot={false}>Featured</StatusBadge>}</div> },
  ];

  return (
    <div>
      <PageHeader
        title="Partner Businesses"
        description="Hotels, salons, clinics, gyms and retailers in your network."
        actions={
          <Can perform="partners.manage">
            <Button variant="secondary" icon={Tags} onClick={() => setCatsOpen(true)}>Categories</Button>
            <Button icon={Plus} onClick={() => setEditingId('new')}>Add partner</Button>
          </Can>
        }
      />

      {checkedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-2.5">
          <span className="text-sm font-medium text-navy-900"><span className="tabular-nums">{checkedIds.size}</span> partner(s) selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Can perform="partners.manage">
              <Button size="sm" variant="danger" icon={Trash2} onClick={() => setBulkDeleteOpen(true)}>
                Delete selected ({checkedIds.size})
              </Button>
            </Can>
            <Button size="sm" variant="ghost" icon={X} onClick={() => setCheckedIds(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        onRowClick={can('partners.manage') ? (r) => setEditingId(r.id) : undefined}
        searchPlaceholder="Search partners, city, email…"
        filters={[
          { key: 'category', label: 'Category', options: (cats?.data || []).map((c) => ({ value: c.id, label: tr(c.name) })) },
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        ]}
        emptyTitle="No partners yet"
      />
      <PartnerDrawer id={editingId} onClose={() => setEditingId(null)} categories={cats?.data || []} />
      <CategoriesModal open={catsOpen} onClose={() => setCatsOpen(false)} categories={cats?.data || []} />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${checkedIds.size} partner business${checkedIds.size > 1 ? 'es' : ''}?`}
        description={`This will permanently delete the selected ${checkedIds.size} partner(s), along with all their branches and associated discount offers.`}
        confirmLabel={`Delete ${checkedIds.size} partner${checkedIds.size > 1 ? 's' : ''}`}
        loading={deletingBulk}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}

const blankPartner = () => ({
  name: emptyTr(), description: emptyTr(), business_category_id: '', contact_person: '', phone: '', email: '', website: '',
  address: '', city: '', google_maps_url: '', is_active: true, is_featured: false, branches: [], logo: null, remove_logo: false,
});

function PartnerDrawer({ id, onClose, categories }) {
  const toast = useToast();
  const isNew = id === 'new';
  const { data: partner } = usePartnerQuery(id, { skip: !id || isNew });
  const [form, setForm] = useState(blankPartner());
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [save, { isLoading, error, reset }] = useSavePartnerMutation();
  const [remove, { isLoading: removing }] = useDeletePartnerMutation();
  const errs = fieldErrors(error);

  useEffect(() => {
    if (!id) return;
    reset();
    if (isNew) { setForm(blankPartner()); setPreview(null); }
    else if (partner) {
      setForm({
        ...blankPartner(),
        ...Object.fromEntries(Object.entries(partner).map(([k, v]) => [k, v ?? ''])),
        name: partner.name, description: partner.description || emptyTr(),
        business_category_id: partner.business_category_id ?? '',
        branches: partner.branches || [],
        is_active: partner.is_active, is_featured: partner.is_featured, logo: null, remove_logo: false,
      });
      setPreview(partner.logo_url);
    }
  }, [id, isNew, partner, reset]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setBranch = (i, patch) => set({ branches: form.branches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });

  const submit = async () => {
    const payload = {
      id: isNew ? undefined : id,
      name: form.name, description: form.description,
      business_category_id: form.business_category_id || '',
      contact_person: form.contact_person, phone: form.phone, email: form.email, website: form.website,
      address: form.address, city: form.city, google_maps_url: form.google_maps_url,
      is_active: form.is_active, is_featured: form.is_featured,
      branches: form.branches.map(({ id: bid, name, address, city, phone, google_maps_url }) => ({ id: bid ?? '', name, address: address ?? '', city: city ?? '', phone: phone ?? '', google_maps_url: google_maps_url ?? '' })),
      remove_logo: form.remove_logo,
    };
    if (form.logo) payload.logo = form.logo;
    try {
      await save(payload).unwrap();
      toast(isNew ? 'Partner added' : 'Partner updated');
      onClose();
    } catch { /* shown */ }
  };

  const doDelete = async () => {
    try { await remove(id).unwrap(); toast('Partner deleted'); setConfirm(false); onClose(); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <SlideOverDrawer
      open={!!id}
      onClose={onClose}
      title={isNew ? 'Add partner business' : tr(form.name) || 'Partner'}
      size="xl"
      footer={
        <div className="flex w-full justify-between">
          {!isNew ? <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button> : <span />}
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>{isNew ? 'Add partner' : 'Save changes'}</Button></div>
        </div>
      }
    >
      <div className="space-y-6">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <div className="flex items-start gap-4">
          <label className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:border-slate-400">
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Icon icon={ImagePlus} size={20} className="text-slate-400" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { set({ logo: f, remove_logo: false }); setPreview(URL.createObjectURL(f)); }
            }} />
          </label>
          <div className="flex-1 space-y-1 text-xs text-slate-500">
            <p className="text-sm font-medium text-navy-800">Logo</p>
            <p>PNG, JPG or WebP, square, up to 2 MB.</p>
            {preview && <button type="button" className="font-medium text-rose-600 hover:underline" onClick={() => { set({ logo: null, remove_logo: true }); setPreview(null); }}>Remove logo</button>}
            {errs.logo && <p className="text-rose-600">{errs.logo}</p>}
          </div>
        </div>

        <MultilingualInput label="Business name" required name="name" errors={errs} value={form.name} onChange={(v) => set({ name: v })} maxLength={120} />
        <MultilingualInput label="Description" multiline name="description" errors={errs} value={form.description} onChange={(v) => set({ description: v })} maxLength={2000} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Business category" placeholder="— Select —" value={form.business_category_id} onChange={(e) => set({ business_category_id: e.target.value })} options={categories.map((c) => ({ value: c.id, label: tr(c.name) }))} error={errs.business_category_id} />
          <Input label="Contact person" value={form.contact_person} onChange={(e) => set({ contact_person: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => set({ phone: e.target.value })} error={errs.phone} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errs.email} />
          <Input label="Website" placeholder="https://" value={form.website} onChange={(e) => set({ website: e.target.value })} error={errs.website} />
          <Input label="City" value={form.city} onChange={(e) => set({ city: e.target.value })} />
          <Input className="sm:col-span-2" label="Head office address" value={form.address} onChange={(e) => set({ address: e.target.value })} />
          <Input
            className="sm:col-span-2" label="Google Maps link" placeholder="https://maps.google.com/…" value={form.google_maps_url} onChange={(e) => set({ google_maps_url: e.target.value })} error={errs.google_maps_url}
            suffix={form.google_maps_url ? <a href={form.google_maps_url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-navy-900"><Icon icon={ExternalLink} size={14} /></a> : null}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Branch locations</p>
            <Button size="xs" variant="secondary" icon={Plus} onClick={() => set({ branches: [...form.branches, { name: '', address: '', city: '', phone: '', google_maps_url: '' }] })}>Add branch</Button>
          </div>
          <div className="space-y-3">
            {form.branches.map((b, i) => (
              <div key={b.id ?? `n${i}`} className="relative grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                <button type="button" className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => set({ branches: form.branches.filter((_, idx) => idx !== i) })} aria-label="Remove branch"><Icon icon={X} size={13} /></button>
                <Input label="Branch name" value={b.name} onChange={(e) => setBranch(i, { name: e.target.value })} error={errs[`branches.${i}.name`]} />
                <Input label="City" value={b.city ?? ''} onChange={(e) => setBranch(i, { city: e.target.value })} />
                <Input label="Address" value={b.address ?? ''} onChange={(e) => setBranch(i, { address: e.target.value })} />
                <Input label="Phone" value={b.phone ?? ''} onChange={(e) => setBranch(i, { phone: e.target.value })} />
                <Input className="sm:col-span-2" label="Maps link" value={b.google_maps_url ?? ''} onChange={(e) => setBranch(i, { google_maps_url: e.target.value })} error={errs[`branches.${i}.google_maps_url`]} />
              </div>
            ))}
            {form.branches.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">No branches added.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" description="Inactive partners and their offers are hidden everywhere." />
          <Toggle checked={form.is_featured} onChange={(v) => set({ is_featured: v })} label="Featured" description="Shown first in the public directory." tone="slate" />
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removing} title="Delete partner?" description="All of this partner's offers and branches will also be deleted." confirmLabel="Delete partner" />
    </SlideOverDrawer>
  );
}

function CategoriesModal({ open, onClose, categories }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: emptyTr(), icon: 'store', sort_order: 0 });
  const [save, { isLoading, error, reset }] = useSaveCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const errs = fieldErrors(error);

  const edit = (c) => { reset(); setForm({ id: c.id, name: c.name, icon: c.icon, sort_order: c.sort_order }); };
  const clear = () => { reset(); setForm({ name: emptyTr(), icon: 'store', sort_order: categories.length }); };

  const submit = async () => {
    try { await save(form).unwrap(); toast(form.id ? 'Category updated' : 'Category added'); clear(); } catch { /* shown */ }
  };
  const del = async (c) => {
    try { await remove(c.id).unwrap(); toast('Category deleted'); if (form.id === c.id) clear(); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Business categories" description="Used to group partners in the directory.">
      <div className="grid gap-6 md:grid-cols-2">
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {categories.map((c) => (
            <li key={c.id} className={`flex items-center gap-3 px-3 py-2.5 ${form.id === c.id ? 'bg-slate-50' : ''}`}>
              <CategoryIcon name={c.icon} size={15} className="text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tr(c.name)}</p>
                <p className="text-2xs text-slate-400">{c.partners_count} partners</p>
              </div>
              <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-900" onClick={() => edit(c)} aria-label="Edit"><Icon icon={Pencil} size={13} /></button>
              <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => del(c)} aria-label="Delete"><Icon icon={Trash2} size={13} /></button>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <p className="text-sm font-semibold">{form.id ? 'Edit category' : 'New category'}</p>
          <MultilingualInput label="Name" required name="name" errors={errs} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CATEGORY_ICONS).map((k) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, icon: k })} className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${form.icon === k ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`} title={k}>
                  <CategoryIcon name={k} size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {form.id && <Button variant="ghost" size="sm" onClick={clear}>New instead</Button>}
            <Button size="sm" loading={isLoading} onClick={submit}>{form.id ? 'Save' : 'Add category'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
