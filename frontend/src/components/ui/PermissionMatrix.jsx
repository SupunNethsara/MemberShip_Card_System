import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import Icon from './Icon';
import { Checkbox } from './Form';

/**
 * Interactive roles × permissions tick matrix.
 *
 * groups: [{ name, permissions: [{ name, label }] }]   (rows, grouped by module)
 * roles:  [{ id, name, is_system }]                   (columns)
 * value:  { [roleId]: Set<string> }                   (controlled draft state)
 * onChange(nextValue)
 * lockedRoleNames: roles whose column is read-only (Super Admin always holds everything)
 */
export default function PermissionMatrix({ groups, roles, value, onChange, readOnly = false, lockedRoleNames = ['Super Admin'], baseline }) {
  const [collapsed, setCollapsed] = useState({});
  const editableRoles = useMemo(() => roles.filter((r) => !lockedRoleNames.includes(r.name)), [roles, lockedRoleNames]);
  const allPerms = useMemo(() => groups.flatMap((g) => g.permissions.map((p) => p.name)), [groups]);

  const has = (roleId, perm) => value[roleId]?.has(perm);
  const isLocked = (role) => readOnly || lockedRoleNames.includes(role.name);
  const changed = (roleId, perm) => baseline && baseline[roleId]?.has(perm) !== value[roleId]?.has(perm);

  const mutate = (fn) => {
    const next = Object.fromEntries(Object.entries(value).map(([k, s]) => [k, new Set(s)]));
    fn(next);
    onChange(next);
  };

  const toggleCell = (roleId, perm) =>
    mutate((n) => { n[roleId].has(perm) ? n[roleId].delete(perm) : n[roleId].add(perm); });

  /** Module row toggle: across all editable roles, for every permission in the group. */
  const groupState = (group) => {
    const cells = editableRoles.flatMap((r) => group.permissions.map((p) => has(r.id, p.name)));
    const on = cells.filter(Boolean).length;
    return { all: cells.length > 0 && on === cells.length, some: on > 0 && on < cells.length };
  };
  const toggleGroup = (group) => {
    const { all } = groupState(group);
    mutate((n) => editableRoles.forEach((r) => group.permissions.forEach((p) => (all ? n[r.id].delete(p.name) : n[r.id].add(p.name)))));
  };

  /** Per-role toggle inside one module group. */
  const roleGroupState = (role, group) => {
    const on = group.permissions.filter((p) => has(role.id, p.name)).length;
    return { all: on === group.permissions.length, some: on > 0 && on < group.permissions.length };
  };
  const toggleRoleGroup = (role, group) => {
    const { all } = roleGroupState(role, group);
    mutate((n) => group.permissions.forEach((p) => (all ? n[role.id].delete(p.name) : n[role.id].add(p.name))));
  };

  /** Column toggle: every permission for one role. */
  const columnState = (role) => {
    const on = allPerms.filter((p) => has(role.id, p)).length;
    return { all: on === allPerms.length, some: on > 0 && on < allPerms.length, count: on };
  };
  const toggleColumn = (role) => {
    const { all } = columnState(role);
    mutate((n) => { n[role.id] = all ? new Set() : new Set(allPerms); });
  };

  return (
    <div className="surface overflow-hidden">
      <div className="max-h-[calc(100vh-260px)] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[280px] border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <span className="eyebrow">Permission</span>
              </th>
              {roles.map((role) => {
                const st = columnState(role);
                return (
                  <th key={role.id} className="sticky top-0 z-20 min-w-[132px] border-b border-slate-200 bg-slate-50 px-3 py-3 text-center align-bottom">
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold text-navy-900">
                        {isLocked(role) && !readOnly && <Icon icon={Lock} size={11} className="text-slate-400" />}
                        {role.name}
                      </span>
                      <span className="text-2xs font-normal tabular-nums text-slate-500">{st.count}/{allPerms.length}</span>
                      <Checkbox
                        size="sm"
                        checked={st.all}
                        indeterminate={st.some}
                        disabled={isLocked(role)}
                        onChange={() => toggleColumn(role)}
                        title={`Toggle all permissions for ${role.name}`}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const gs = groupState(group);
              const isCollapsed = collapsed[group.name];
              return (
                <Fragment key={group.name}>
                  <tr className="group/row">
                    <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100/90 px-4 py-2 backdrop-blur">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          size="sm"
                          checked={gs.all}
                          indeterminate={gs.some}
                          disabled={readOnly || editableRoles.length === 0}
                          onChange={() => toggleGroup(group)}
                          title={`Select all ${group.name} permissions for every role`}
                        />
                        <button
                          type="button"
                          onClick={() => setCollapsed((c) => ({ ...c, [group.name]: !c[group.name] }))}
                          className="flex flex-1 items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-700"
                        >
                          <Icon icon={ChevronDown} size={13} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                          {group.name}
                          <span className="font-normal normal-case tracking-normal text-slate-400">· {group.permissions.length}</span>
                        </button>
                      </div>
                    </td>
                    {roles.map((role) => {
                      const st = roleGroupState(role, group);
                      return (
                        <td key={role.id} className="border-b border-slate-200 bg-slate-100/90 px-3 py-2 text-center">
                          <div className="flex justify-center">
                            <Checkbox size="sm" checked={st.all} indeterminate={st.some} disabled={isLocked(role)} onChange={() => toggleRoleGroup(role, group)} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {!isCollapsed &&
                    group.permissions.map((perm) => (
                      <tr key={perm.name} className="hover:bg-slate-50/70">
                        <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-2.5 pl-11">
                          <div className="text-[13px] text-navy-800">{perm.label}</div>
                          <code className="text-2xs text-slate-400">{perm.name}</code>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className={`border-b border-slate-100 px-3 py-2.5 text-center ${changed(role.id, perm.name) ? 'bg-amber-50' : ''}`}>
                            <div className="flex justify-center">
                              {lockedRoleNames.includes(role.name) ? (
                                <Icon icon={ShieldCheck} size={15} className="text-emerald-600" />
                              ) : (
                                <Checkbox checked={has(role.id, perm.name)} disabled={isLocked(role)} onChange={() => toggleCell(role.id, perm.name)} />
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
