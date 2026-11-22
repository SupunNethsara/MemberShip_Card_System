import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, IdCard, Pencil, Plus, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import CardPrintModal from './cards/CardPrintModal';
import {
  Alert, Avatar, Button, Can, Card, Checkbox, ConfirmDialog, DataTable, DescriptionList, Input, Modal, PageHeader,
  Select, SlideOverDrawer, StatusBadge, Tabs, Textarea, TierBadge, Toggle,
} from '../../components/ui';
import {
  useCreateMemberMutation, useDeleteMemberMutation, useMemberQuery, useMembersQuery, useOverrideMembershipMutation,
  useTiersQuery, useUpdateMemberMutation,
} from '../../app/api';
import { useDocumentTitle, useTableState, useToast } from '../../hooks';
import { date, dateTime, errorMessage, fieldErrors, money, relative, tr } from '../../lib/format';

export default function MembersPage() {
  useDocumentTitle('Members');
  const [params, update, raw] = useTableState({ sort: 'created_at', direction: 'desc' });
  const { data, isLoading, isFetching } = useMembersQuery(params);
  const { data: tiers } = useTiersQuery({ per_page: 100 });
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const columns = [
    {
      key: 'name', header: 'Member', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size={30} />
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{r.name}</p>
            <p className="truncate text-xs text-slate-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'member_code', header: 'Member ID', sortable: true, render: (r) => <span className="font-mono text-xs">{r.member_code}</span> },
    { key: 'phone', header: 'Mobile', render: (r) => <span className="tabular-nums">{r.phone || '—'}</span> },
    { key: 'tier', header: 'Tier', render: (r) => (r.active_membership ? <TierBadge name={tr(r.active_membership.tier?.name)} color={r.active_membership.tier?.color} /> : <span className="text-xs text-slate-400">No active plan</span>) },
    {
      key: 'expires', header: 'Expires',
      render: (r) => {
        const m = r.active_membership;
        if (!m) return '—';
        return (
          <span className={`tabular-nums ${m.days_remaining <= 30 ? 'font-medium text-amber-700' : ''}`}>
            {date(m.expires_at)} <span className="text-xs text-slate-400">· {m.days_remaining}d</span>
          </span>
        );
      },
    },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <div className="min-w-[90px]">
          <StatusBadge status={r.status === 'suspended' ? 'suspended' : r.active_membership ? (r.active_membership.days_remaining <= 30 ? 'expiring' : 'active') : 'inactive'} />
          {r.status === 'suspended' && r.suspension_reason && (
            <p className="mt-1 max-w-[160px] truncate text-[11px] font-medium text-rose-600" title={r.suspension_reason}>
              {r.suspension_reason}
            </p>
          )}
        </div>
      ),
    },
    { key: 'created_at', header: 'Joined', sortable: true, render: (r) => <span className="text-xs text-slate-500">{relative(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Members"
        description="Search, filter and manage card holders. Click a row for details and manual membership overrides."
        actions={<Can perform="members.create"><Button icon={UserPlus} onClick={() => setCreating(true)}>Add member</Button></Can>}
      />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        onRowClick={(r) => setSelected(r.id)}
        searchPlaceholder="Name, email, mobile, member ID…"
        filters={[
          { key: 'status', label: 'Status', options: [
            { value: 'active', label: 'Active' }, { value: 'expiring', label: 'Expiring ≤ 30d' }, { value: 'expired', label: 'Expired' },
            { value: 'no_plan', label: 'No plan' }, { value: 'suspended', label: 'Suspended' },
          ] },
          { key: 'tier_id', label: 'Tier', options: (tiers?.data || []).map((t) => ({ value: t.id, label: tr(t.name) })) },
        ]}
        emptyTitle="No members found"
      />
      <MemberDrawer id={selected} onClose={() => setSelected(null)} tiers={tiers?.data || []} />
      <CreateMemberModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function MemberDrawer({ id, onClose, tiers }) {
  const toast = useToast();
  const { data, isFetching } = useMemberQuery(id, { skip: !id });
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [updateMember, { isLoading: saving }] = useUpdateMemberMutation();
  const [deleteMember, { isLoading: deleting }] = useDeleteMemberMutation();
  const m = data?.data;

  useEffect(() => { setTab('overview'); }, [id]);

  const handleReactivate = async () => {
    try {
      await updateMember({ id: m.id, status: 'active', suspension_reason: null }).unwrap();
      toast('Account reactivated');
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const openSuspendModal = () => {
    setSuspendReason('');
    setSuspendOpen(true);
  };

  const handleSuspendSubmit = async () => {
    if (!suspendReason.trim()) return;
    try {
      await updateMember({
        id: m.id,
        status: 'suspended',
        suspension_reason: suspendReason.trim(),
      }).unwrap();
      toast('Account suspended');
      setSuspendOpen(false);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const remove = async () => {
    try {
      await deleteMember(m.id).unwrap();
      toast('Member deleted');
      setConfirmDelete(false);
      onClose();
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const am = m?.active_membership;

  return (
    <SlideOverDrawer
      open={!!id}
      onClose={onClose}
      title={m?.name ?? 'Loading…'}
      description={m ? `${m.member_code} · ${m.email}` : ''}
      size="xl"
      footer={m && (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Can perform="members.delete"><Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>Delete</Button></Can>
          <div className="flex gap-2">
            <Can perform="members.update">
              <Button
                variant="secondary"
                size="sm"
                icon={m.status === 'suspended' ? CheckCircle2 : Ban}
                loading={saving}
                onClick={m.status === 'suspended' ? handleReactivate : openSuspendModal}
              >
                {m.status === 'suspended' ? 'Reactivate' : 'Suspend'}
              </Button>
              <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Edit profile</Button>
            </Can>
            {am && m.status === 'active' && (
              <Can perform="cards.print"><Button variant="secondary" size="sm" icon={IdCard} onClick={() => setPrinting(true)}>Preview &amp; print card</Button></Can>
            )}
            <Can perform="members.override"><Button size="sm" icon={ShieldAlert} onClick={() => setOverriding(true)}>Override membership</Button></Can>
          </div>
        </div>
      )}
    >
      {!m || isFetching && !m ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          {m.status === 'suspended' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4">
              <div className="flex items-start gap-3">
                <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-900">Account Suspended</p>
                    <span className="rounded bg-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-800">Suspended</span>
                  </div>
                  <p className="mt-1.5 text-sm text-rose-950">
                    <span className="font-semibold text-rose-900">Reason: </span>
                    {m.suspension_reason || 'No specific reason provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface p-4">
              <p className="eyebrow">Current tier</p>
              <div className="mt-2">{am ? <TierBadge name={tr(am.tier?.name)} color={am.tier?.color} /> : <span className="text-sm text-slate-400">None</span>}</div>
            </div>
            <div className="surface p-4">
              <p className="eyebrow">Expires</p>
              <p className="mt-1.5 text-sm font-semibold tabular-nums">{am ? date(am.expires_at) : '—'}</p>
              {am && <p className="text-xs text-slate-500">{am.days_remaining} days left</p>}
            </div>
            <div className="surface p-4">
              <p className="eyebrow">Account</p>
              <div className="mt-2"><StatusBadge status={m.status} /></div>
            </div>
          </div>

          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'overview', label: 'Profile' },
            { value: 'history', label: 'Memberships', count: m.memberships?.length },
            { value: 'invoices', label: 'Invoices', count: data.invoices?.data?.length ?? data.invoices?.length },
            { value: 'sms', label: 'SMS', count: data.sms?.data?.length ?? data.sms?.length },
          ]} />

          {tab === 'overview' && (
            <DescriptionList items={[
              ['Full name', m.name], ['Email', m.email], ['Mobile', m.phone || '—'], ['NIC', m.nic || '—'],
              ['Member ID', <span className="font-mono">{m.member_code}</span>], ['SMS language', { en: 'English', si: 'Sinhala', ta: 'Tamil' }[m.preferred_locale] || 'English'],
              ['Account status', <StatusBadge status={m.status} />],
              ...(m.status === 'suspended' && m.suspension_reason ? [['Suspension reason', <span className="font-semibold text-rose-700">{m.suspension_reason}</span>]] : []),
              ['Joined', dateTime(m.created_at)], ['Last login', m.last_login_at ? dateTime(m.last_login_at) : 'Never'],
            ]} />
          )}

          {tab === 'history' && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(m.memberships || []).map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2"><TierBadge name={tr(h.tier?.name)} color={h.tier?.color} /><span className="text-xs capitalize text-slate-500">{h.source}</span></div>
                  <span className="tabular-nums text-slate-600">{date(h.starts_at)} → {date(h.expires_at)}</span>
                  <StatusBadge status={h.status} />
                  {h.notes && <p className="w-full text-xs text-slate-500">{h.notes}</p>}
                </li>
              ))}
              {!m.memberships?.length && <li className="px-4 py-6 text-center text-sm text-slate-400">No memberships yet</li>}
            </ul>
          )}

          {tab === 'invoices' && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(data.invoices?.data ?? data.invoices ?? []).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-mono text-xs">{i.number}</span>
                  <span className="text-xs text-slate-500">{i.gateway?.name}</span>
                  <span className="tabular-nums">{money(i.amount, i.currency)}</span>
                  <StatusBadge status={i.status} />
                </li>
              ))}
              {!(data.invoices?.data ?? data.invoices ?? []).length && <li className="px-4 py-6 text-center text-sm text-slate-400">No invoices</li>}
            </ul>
          )}

          {tab === 'sms' && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(data.sms?.data ?? data.sms ?? []).map((s) => (
                <li key={s.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-navy-800">{s.event.replace(/_/g, ' ')}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{s.message}</p>
                  <p className="mt-1 text-2xs text-slate-400">{dateTime(s.created_at)} · {s.gateway?.name}</p>
                </li>
              ))}
              {!(data.sms?.data ?? data.sms ?? []).length && <li className="px-4 py-6 text-center text-sm text-slate-400">No SMS sent</li>}
            </ul>
          )}
        </div>
      )}

      {m && <EditMemberModal open={editing} onClose={() => setEditing(false)} member={m} />}
      {m && <CardPrintModal open={printing} userIds={[m.id]} onClose={() => setPrinting(false)} />}
      {m && <OverrideModal open={overriding} onClose={() => setOverriding(false)} member={m} tiers={tiers} />}
      {m && (
        <Modal
          open={suspendOpen}
          onClose={() => setSuspendOpen(false)}
          title={`Suspend ${m.name}`}
          description="Suspending this member will immediately revoke login access, disable digital QR card verification, and cancel member benefits."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSuspendOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={Ban}
                loading={saving}
                disabled={!suspendReason.trim()}
                onClick={handleSuspendSubmit}
              >
                Suspend account
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Textarea
              label="Reason for suspension"
              required
              rows={3}
              autoFocus
              placeholder="Enter the reason for suspension (e.g. Terms violation, payment dispute, suspicious activity, requested by card holder...)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              This reason will be saved to the member's profile and displayed across the admin console.
            </p>
          </div>
        </Modal>
      )}
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} loading={deleting} title="Delete member?" description={`This permanently removes ${m?.name}, their memberships and invoices. This cannot be undone.`} confirmLabel="Delete member" />
    </SlideOverDrawer>
  );
}

function EditMemberModal({ open, onClose, member }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [save, { isLoading, error, reset }] = useUpdateMemberMutation();
  const errs = fieldErrors(error);
  useEffect(() => {
    if (open) { setForm({ name: member.name, email: member.email, phone: member.phone || '', nic: member.nic || '', preferred_locale: member.preferred_locale, password: '' }); reset(); }
  }, [open, member, reset]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      await save({ id: member.id, ...body }).unwrap();
      toast('Member updated');
      onClose();
    } catch { /* shown */ }
  };
  return (
    <Modal open={open} onClose={onClose} title="Edit member" footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>Save changes</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Full name" value={form.name ?? ''} onChange={set('name')} error={errs.name} />
        <Input label="Email" value={form.email ?? ''} onChange={set('email')} error={errs.email} />
        <Input label="Mobile" value={form.phone ?? ''} onChange={set('phone')} error={errs.phone} />
        <Input label="NIC" value={form.nic ?? ''} onChange={set('nic')} />
        <Select label="SMS language" value={form.preferred_locale ?? 'en'} onChange={set('preferred_locale')} options={[{ value: 'en', label: 'English' }, { value: 'si', label: 'Sinhala' }, { value: 'ta', label: 'Tamil' }]} />
        <Input className="sm:col-span-2" type="password" label="Reset password" placeholder="Leave blank to keep current" value={form.password ?? ''} onChange={set('password')} error={errs.password} />
      </div>
    </Modal>
  );
}

function OverrideModal({ open, onClose, member, tiers }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [save, { isLoading, error, reset }] = useOverrideMembershipMutation();
  const errs = fieldErrors(error);
  useEffect(() => {
    if (open) {
      const am = member.active_membership;
      setForm({ status: 'active', membership_tier_id: am?.tier?.id ?? tiers[0]?.id ?? '', starts_at: new Date().toISOString().slice(0, 10), expires_at: am?.expires_at?.slice(0, 10) ?? '', notes: '', notify: true });
      reset();
    }
  }, [open, member, tiers, reset]);
  const submit = async () => {
    try {
      const body = { ...form };
      if (!body.expires_at) delete body.expires_at;
      await save({ id: member.id, ...body }).unwrap();
      toast('Membership updated', 'success', 'This change was recorded in the audit log.');
      onClose();
    } catch { /* shown */ }
  };
  return (
    <Modal open={open} onClose={onClose} title="Manual membership override" description="Grant, extend, change tier or cancel without payment. Every override is audited." footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" variant={form.status === 'cancelled' ? 'danger' : 'primary'} loading={isLoading} onClick={submit}>{form.status === 'cancelled' ? 'Cancel membership' : 'Apply override'}</Button></>}>
      <div className="space-y-4">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Select label="Action" value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Grant / replace active membership' }, { value: 'cancelled', label: 'Cancel current membership' }]} />
        {form.status === 'active' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Select className="sm:col-span-3" label="Tier" value={form.membership_tier_id ?? ''} onChange={(e) => setForm({ ...form, membership_tier_id: Number(e.target.value) })} options={tiers.map((t) => ({ value: t.id, label: `${tr(t.name)} — ${money(t.price)}` }))} error={errs.membership_tier_id} />
            <Input type="date" label="Starts" value={form.starts_at ?? ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} error={errs.starts_at} />
            <Input type="date" className="sm:col-span-2" label="Expires" hint="Blank = tier's standard duration" value={form.expires_at ?? ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} error={errs.expires_at} />
          </div>
        )}
        <Textarea label="Reason (audit log)" required rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} error={errs.notes} placeholder="e.g. Goodwill extension after partner complaint #1182" />
        {form.status === 'active' && <Checkbox checked={!!form.notify} onChange={(v) => setForm({ ...form, notify: v })} label="Send 'Membership Activated' SMS" />}
      </div>
    </Modal>
  );
}

function CreateMemberModal({ open, onClose }) {
  const toast = useToast();
  const blank = { name: '', email: '', phone: '', nic: '', preferred_locale: 'en', password: '', send_welcome: true };
  const [form, setForm] = useState(blank);
  const [create, { isLoading, error, reset }] = useCreateMemberMutation();
  const errs = fieldErrors(error);
  useEffect(() => { if (open) { setForm(blank); reset(); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    try {
      await create(form).unwrap();
      toast('Member created');
      onClose();
    } catch { /* shown */ }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add member" description="Creates a member account. Use Override membership afterwards to grant a plan without payment." footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" icon={Plus} loading={isLoading} onClick={submit}>Create member</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Full name" required value={form.name} onChange={set('name')} error={errs.name} />
        <Input label="Email" required value={form.email} onChange={set('email')} error={errs.email} />
        <Input label="Mobile" value={form.phone} onChange={set('phone')} error={errs.phone} />
        <Input label="NIC" value={form.nic} onChange={set('nic')} />
        <Select label="SMS language" value={form.preferred_locale} onChange={set('preferred_locale')} options={[{ value: 'en', label: 'English' }, { value: 'si', label: 'Sinhala' }, { value: 'ta', label: 'Tamil' }]} />
        <Input className="sm:col-span-2" type="password" label="Temporary password" required value={form.password} onChange={set('password')} error={errs.password} />
        <Toggle className="sm:col-span-2" checked={form.send_welcome} onChange={(v) => setForm({ ...form, send_welcome: v })} label="Send welcome SMS" description="Uses the Registration Welcome template in the member's language." />
      </div>
    </Modal>
  );
}
