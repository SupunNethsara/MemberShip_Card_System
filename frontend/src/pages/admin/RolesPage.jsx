import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2, Users } from 'lucide-react';
import { Alert, Button, Can, ConfirmDialog, Icon, Input, LoadError, Modal, PageHeader, PermissionMatrix, Select, Skeleton, Textarea } from '../../components/ui';
import { useDeleteRoleMutation, useRolesQuery, useSavePermissionMatrixMutation, useSaveRoleMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { errorMessage, fieldErrors } from '../../lib/format';

const toSets = (roles) => Object.fromEntries(roles.map((r) => [r.id, new Set(r.permissions || [])]));

export default function RolesPage() {
  useDocumentTitle('Roles & Permissions');
  const can = usePermission();
  const toast = useToast();
  const { data, isLoading, refetch } = useRolesQuery();
  const [saveMatrix, { isLoading: saving }] = useSavePermissionMatrixMutation();
  const [deleteRole, { isLoading: deleting }] = useDeleteRoleMutation();
  const roles = useMemo(() => data?.roles?.data ?? data?.roles ?? [], [data]);
  const groups = data?.groups ?? [];
  const [baseline, setBaseline] = useState({});
  const [draft, setDraft] = useState({});
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { const s = toSets(roles); setBaseline(s); setDraft(toSets(roles)); }, [roles]);

  const changes = useMemo(() => {
    let n = 0;
    Object.keys(draft).forEach((id) => {
      const a = baseline[id] || new Set(); const b = draft[id];
      b.forEach((p) => { if (!a.has(p)) n++; });
      a.forEach((p) => { if (!b.has(p)) n++; });
    });
    return n;
  }, [draft, baseline]);

  const submit = useCallback(async () => {
    const matrix = Object.fromEntries(roles.filter((r) => r.name !== 'Super Admin').map((r) => [r.id, [...(draft[r.id] || [])]]));
    try {
      const res = await saveMatrix(matrix).unwrap();
      const changed = Object.keys(res.changes || {});
      toast('Permissions saved', 'success', changed.length ? `Updated: ${changed.join(', ')}` : 'No effective changes.');
    } catch (e) { toast(errorMessage(e), 'error'); }
  }, [roles, draft, saveMatrix, toast]);

  // Warn before leaving with unsaved matrix changes.
  useEffect(() => {
    if (!changes) return undefined;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [changes]);

  const customRoles = roles.filter((r) => !r.is_system);

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow="Settings"
        title="Roles & Permissions"
        description="Tick which roles can perform each action. Enforced on API routes, policies and in the UI."
        actions={<Can perform="roles.manage"><Button variant="secondary" icon={Plus} onClick={() => setCreating(true)}>Custom role</Button></Can>}
      />

      {!can('roles.manage') && <Alert tone="info" className="mb-4">Read-only view. Only users with roles.manage can change permissions.</Alert>}

      <div className="mb-4 flex flex-wrap gap-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
            <span className="font-medium text-navy-800">{r.name}</span>
            <span className="inline-flex items-center gap-1 text-slate-500"><Icon icon={Users} size={11} />{r.users_count ?? 0}</span>
            {!r.is_system && can('roles.manage') && (
              <button onClick={() => setToDelete(r)} className="text-slate-400 hover:text-rose-600" aria-label={`Delete ${r.name}`}><Icon icon={Trash2} size={12} /></button>
            )}
          </div>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-[480px] rounded-lg" />
      ) : !data ? (
        <LoadError onRetry={refetch} />
      ) : (
        <PermissionMatrix groups={groups} roles={roles} value={draft} baseline={baseline} onChange={setDraft} readOnly={!can('roles.manage')} />
      )}
      {customRoles.length === 0 && !isLoading && <p className="mt-3 text-xs text-slate-500">Tip: create a custom role (e.g. "Regional Auditor") and copy permissions from an existing role as a starting point.</p>}

      {changes > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200 bg-amber-50/95 backdrop-blur lg:left-60">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              {changes} unsaved permission change{changes > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setDraft(toSets(roles))}>Discard</Button>
              <Button size="sm" icon={Save} loading={saving} onClick={submit}>Save matrix</Button>
            </div>
          </div>
        </div>
      )}

      <CreateRoleModal open={creating} onClose={() => setCreating(false)} roles={roles} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={deleting}
        title={`Delete ${toDelete?.name}?`}
        description="Roles that are still assigned to staff can't be deleted."
        confirmLabel="Delete role"
        onConfirm={async () => {
          try { await deleteRole(toDelete.id).unwrap(); toast('Role deleted'); } catch (e) { toast(errorMessage(e), 'error'); }
          setToDelete(null);
        }}
      />
    </div>
  );
}

function CreateRoleModal({ open, onClose, roles }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', copy_from: '' });
  const [save, { isLoading, error, reset }] = useSaveRoleMutation();
  const errs = fieldErrors(error);
  useEffect(() => { if (open) { reset(); setForm({ name: '', description: '', copy_from: '' }); } }, [open, reset]);
  const submit = async () => {
    try {
      await save({ ...form, copy_from: form.copy_from || undefined }).unwrap();
      toast(`Role "${form.name}" created`, 'success', 'It now appears as a column in the matrix.');
      onClose();
    } catch { /* shown */ }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create custom role" footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>Create role</Button></>}>
      <div className="space-y-4">
        <Input label="Role name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errs.name} placeholder="e.g. Regional Auditor" />
        <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select label="Copy permissions from" placeholder="Start empty" value={form.copy_from} onChange={(e) => setForm({ ...form, copy_from: e.target.value })} options={roles.filter((r) => r.is_staff !== false && r.name !== 'Member').map((r) => ({ value: r.id, label: r.name }))} />
      </div>
    </Modal>
  );
}
