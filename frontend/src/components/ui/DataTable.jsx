import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Inbox, Search, X } from 'lucide-react';
import Icon from './Icon';
import { Skeleton, EmptyState, LoadError } from './Feedback';

/**
 * Server-driven data table.
 *
 * columns: [{ key, header, render?(row), sortable?, align?, className?, width? }]
 * data:    Laravel paginator payload { data, meta: { current_page, last_page, per_page, total, from, to } }
 * state:   { page, per_page, search, sort, direction, ...filters } from useTableState
 * onChange(patch) updates state; filters: [{ key, label, options:[{value,label}] }] render as pills.
 */
export default function DataTable({
  columns,
  data,
  loading,
  fetching,
  state = {},
  onChange,
  filters = [],
  searchPlaceholder = 'Search…',
  searchable = true,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  toolbar,
  rowKey = 'id',
  dense = false,
  onRetry,
}) {
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const activeFilters = filters.filter((f) => state[f.key] !== undefined && state[f.key] !== '');

  const toggleSort = (col) => {
    if (!col.sortable) return;
    const key = col.sortKey || col.key;
    if (state.sort !== key) onChange({ sort: key, direction: 'asc' });
    else if (state.direction === 'asc') onChange({ sort: key, direction: 'desc' });
    else onChange({ sort: undefined, direction: undefined });
  };

  const cellPad = dense ? 'px-4 py-2' : 'px-4 py-3';

  return (
    <div className="surface overflow-hidden">
      {(searchable || filters.length > 0 || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative w-full sm:w-72">
                <Icon icon={Search} size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={state.search ?? ''}
                  onChange={(e) => onChange({ search: e.target.value })}
                  placeholder={searchPlaceholder}
                  className="field h-8 py-1 pl-8 text-[13px]"
                />
              </div>
            )}
            {filters.map((f) => (
              <FilterPill key={f.key} filter={f} value={state[f.key]} onChange={(v) => onChange({ [f.key]: v })} />
            ))}
            {activeFilters.length > 0 && (
              <button
                onClick={() => onChange(Object.fromEntries(activeFilters.map((f) => [f.key, undefined])))}
                className="text-xs font-medium text-slate-500 hover:text-navy-900"
              >
                Clear filters
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {fetching && !loading && <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-slate-300 border-t-slate-700" />}
              {toolbar}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-200">
              {columns.map((col) => {
                const key = col.sortKey || col.key;
                const sorted = state.sort === key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`${dense ? 'px-4 py-2' : 'px-4 py-2.5'} text-2xs font-semibold uppercase tracking-[0.06em] text-slate-500 ${col.align === 'right' ? 'text-right' : ''} ${col.headerClass || ''}`}
                  >
                    {col.sortable ? (
                      <button onClick={() => toggleSort(col)} className={`inline-flex items-center gap-1 uppercase hover:text-navy-900 ${sorted ? 'text-navy-900' : ''}`}>
                        {col.header}
                        <Icon icon={sorted ? (state.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown} size={12} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: Math.min(state.per_page || 8, 8) }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cellPad}>
                        <Skeleton className={`h-4 ${i % 2 ? 'w-3/5' : 'w-4/5'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`${cellPad} align-middle text-slate-700 ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.className || ''}`}>
                        {col.render ? col.render(row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {/* Loading finished but no payload at all → the request failed (server down / timeout), not an empty list. */}
        {!loading && !fetching && !data && <LoadError compact tone="plain" onRetry={onRetry} />}
        {!loading && data && rows.length === 0 && <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} action={emptyAction} />}
      </div>

      {meta && meta.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              {meta.from}–{meta.to} of {meta.total.toLocaleString()}
            </span>
            <select
              value={state.per_page || meta.per_page}
              onChange={(e) => onChange({ per_page: Number(e.target.value) })}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs"
              aria-label="Rows per page"
            >
              {[10, 15, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <PageBtn disabled={meta.current_page <= 1} onClick={() => onChange({ page: meta.current_page - 1 })} label="Previous"><Icon icon={ChevronLeft} size={14} /></PageBtn>
            {pageWindow(meta.current_page, meta.last_page).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-1.5">…</span>
              ) : (
                <PageBtn key={p} active={p === meta.current_page} onClick={() => onChange({ page: p })}>{p}</PageBtn>
              )
            )}
            <PageBtn disabled={meta.current_page >= meta.last_page} onClick={() => onChange({ page: meta.current_page + 1 })} label="Next"><Icon icon={ChevronRight} size={14} /></PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick, label }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums transition-colors
        ${active ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'} disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function pageWindow(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set([1, last, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

/** Pill-style single-select filter. */
function FilterPill({ filter, value, onChange }) {
  const active = value !== undefined && value !== '';
  const selected = filter.options.find((o) => String(o.value) === String(value));
  return (
    <div className={`relative inline-flex h-8 items-center rounded-full border text-xs font-medium transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-dashed border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}>
      <span className="pl-3 pr-1">{filter.label}{active && ':'}</span>
      {active && <span className="pr-1 font-semibold">{selected?.label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={filter.label}
      >
        <option value="">All</option>
        {filter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {active ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); onChange(undefined); }} className="relative z-10 mr-1.5 rounded-full p-0.5 hover:bg-white/20" aria-label={`Clear ${filter.label}`}>
          <Icon icon={X} size={12} />
        </button>
      ) : (
        <span className="pr-3" />
      )}
    </div>
  );
}
