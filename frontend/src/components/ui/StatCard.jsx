import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Icon from './Icon';
import { Skeleton } from './Feedback';

const ACCENTS = {
  slate: 'text-slate-700 bg-slate-100',
  emerald: 'text-emerald-700 bg-emerald-50',
  amber: 'text-amber-700 bg-amber-50',
  rose: 'text-rose-700 bg-rose-50',
};

export default function StatCard({ label, value, icon, accent = 'slate', change, hint, loading }) {
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon && (
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${ACCENTS[accent]}`}>
            <Icon icon={icon} size={15} />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <div className="font-display text-2xl font-semibold tracking-tight text-navy-900 tabular-nums">{value}</div>
      )}
      <div className="flex min-h-[18px] items-center gap-2 text-xs">
        {typeof change === 'number' && (
          <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            <Icon icon={change >= 0 ? ArrowUpRight : ArrowDownRight} size={13} />
            {Math.abs(change)}%
          </span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}
