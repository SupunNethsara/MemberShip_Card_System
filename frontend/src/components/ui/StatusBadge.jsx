/**
 * Semantic status pill. Emerald = active/paid, Amber = pending/expiring, Rose = failed/expired, Slate = neutral.
 */
const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/25',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  dark: 'bg-navy-900 text-white ring-navy-900',
};

const DOTS = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', slate: 'bg-slate-400', sky: 'bg-sky-500', dark: 'bg-white' };

const STATUS_TONE = {
  active: 'emerald', paid: 'emerald', sent: 'emerald', success: 'emerald', live: 'emerald', enabled: 'emerald', valid: 'emerald',
  printed: 'sky', issued: 'emerald',
  new: 'sky', in_progress: 'amber', resolved: 'emerald',
  pending: 'amber', awaiting_approval: 'amber', expiring: 'amber', sandbox: 'amber', initiated: 'amber',
  failed: 'rose', expired: 'rose', cancelled: 'rose', suspended: 'rose', invalid_signature: 'rose', refunded: 'slate', inactive: 'slate', disabled: 'slate',
};

const LABELS = {
  awaiting_approval: 'Awaiting approval',
  in_progress: 'In progress',
  invalid_signature: 'Invalid signature',
};

export default function StatusBadge({ status, tone, children, dot = true, className = '' }) {
  const t = tone || STATUS_TONE[status] || 'slate';
  const label = children ?? LABELS[status] ?? (status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : '');
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-medium ring-1 ring-inset ${TONES[t]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[t]}`} />}
      {label}
    </span>
  );
}

/** Tier chip rendered in the tier's own theme colour. */
export function TierBadge({ name, color = '#13224a', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-2xs font-semibold text-navy-800 ${className}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
