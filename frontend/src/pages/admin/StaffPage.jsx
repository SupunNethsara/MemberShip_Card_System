import { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Alert, Avatar, Button, Can, Checkbox, ConfirmDialog, DataTable, Input, Modal, PageHeader, Select, StatusBadge, Textarea } from '../../components/ui';
import { useDeleteStaffMutation, useSaveStaffMutation, useStaffQuery } from '../../app/api';
import { useCurrentUser, useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { errorMessage, fieldErrors, relative } from '../../lib/format';

export default function StaffPage() {
  useDocumentTitle('Staff Accounts');
  const can = usePermission();
  const [params, update, raw] = useTableState();
  const { data, isLoading, isFetching, refetch } = useStaffQuery(params);
  const [editing, setEditing] = useState(null);
  const roles = data?.roles || [];

  const columns = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} size={30} /><div><p className="font-medium text-navy-900">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div></div> },
    { key: 'roles', header: 'Roles', render: (r) => <div className="flex flex-wrap gap-1">{(r.roles || []).map((x) => <span key={x} className={`rounded px-1.5 py-0.5 text-2xs font-medium ${x === 'Super Admin' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700'}`}>{x}</span>)}</div> },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} />
          {r.status === 'suspended' && r.suspension_reason && (
            <p className="mt-1 max-w-[150px] truncate text-[11px] font-medium text-rose-600" title={r.suspension_reason}>
              {r.suspension_reason}
            </p>
          )}
        </div>
      ),
    },
    { key: 'last_login_at', header: 'Last login', sortable: true, render: (r) => <span className="text-xs text-slate-500">{r.last_login_at ? relative(r.last_login_at) : 'Never'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Staff Accounts" description="People who can sign in to this admin console, and the roles that define their access." actions={<Can perform="staff.manage"><Button icon={UserPlus} onClick={() => setEditing({})}>Invite staff</Button></Can>} />
      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        onRowClick={can('staff.manage') ? setEditing : undefined}
        filters={[{ key: 'role', label: 'Role', options: roles.map((r) => ({ value: r, label: r })) }]}
        searchPlaceholder="Name or email…"
      />
      <StaffModal staff={editing} roles={roles} onClose={() => setEditing(null)} />
    </div>
  );
}

function StaffModal({ staff, roles, onClose }) {
  const toast = useToast();
  const me = useCurrentUser();
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [save, { isLoading, error, reset }] = useSaveStaffMutation();
  const [remove, { isLoading: removing }] = useDeleteStaffMutation();
  const errs = fieldErrors(error);

  useEffect(() => {
    if (staff) {
      reset();
      setForm({
        id: staff.id,
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        status: staff.status || 'active',
        suspension_reason: staff.suspension_reason || '',
        password: '',
        roles: staff.roles || [],
      });
    }
  }, [staff, reset]);
  if (!form) return null;

  const toggleRole = (r) => setForm({ ...form, roles: form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r] });
  const canGrantSuper = me?.roles?.includes('Super Admin');

  const submit = async () => {
    const body = { ...form };
    if (!body.password) delete body.password;
    if (body.status === 'active') body.suspension_reason = null;
    try { await save(body).unwrap(); toast(form.id ? 'Staff updated' : 'Staff account created'); onClose(); } catch { /* shown */ }
  };

  return (
    <Modal
      open={!!staff}
      onClose={onClose}
      title={form.id ? form.name : 'Invite staff member'}
      footer={
        <div className="flex w-full justify-between">
          {form.id && form.id !== me?.id ? <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button> : <span />}
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>{form.id ? 'Save' : 'Create account'}</Button></div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errs.name} />
          <Input label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errs.email} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={form.id ? 'New password' : 'Password'} required={!form.id} type="password" placeholder={form.id ? 'Leave blank to keep' : ''} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errs.password} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
          {form.status === 'suspended' && (
            <Textarea
              className="sm:col-span-2"
              label="Reason for suspension"
              required
              rows={2}
              placeholder="Enter reason for suspension..."
              value={form.suspension_reason || ''}
              onChange={(e) => setForm({ ...form, suspension_reason: e.target.value })}
            />
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-700">Roles <span className="text-rose-600">*</span></p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <div key={r} className={`rounded-lg border px-3 py-2.5 ${form.roles.includes(r) ? 'border-navy-900 bg-slate-50' : 'border-slate-200'}`}>
                <Checkbox checked={form.roles.includes(r)} disabled={r === 'Super Admin' && !canGrantSuper} onChange={() => toggleRole(r)} label={r} />
              </div>
            ))}
          </div>
          {errs.roles && <p className="mt-1 text-xs text-rose-600">{errs.roles}</p>}
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} loading={removing} title="Delete staff account?" description={`${form.name} will lose access immediately.`} confirmLabel="Delete" onConfirm={async () => {
        try { await remove(form.id).unwrap(); toast('Staff account deleted'); setConfirm(false); onClose(); } catch (e) { toast(errorMessage(e), 'error'); setConfirm(false); }
      }} />
    </Modal>
  );
}
