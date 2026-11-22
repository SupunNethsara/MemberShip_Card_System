import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import Icon from './Icon';
import { dismissToast } from '../../app/toastSlice';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} />;
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {icon && (
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
          <Icon icon={icon} size={18} />
        </span>
      )}
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const ALERT = {
  info: ['border-slate-200 bg-white text-slate-700', Info, 'text-slate-500'],
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircle2, 'text-emerald-600'],
  warning: ['border-amber-200 bg-amber-50 text-amber-900', AlertTriangle, 'text-amber-600'],
  danger: ['border-rose-200 bg-rose-50 text-rose-900', XCircle, 'text-rose-600'],
};

export function Alert({ tone = 'info', title, children, action, className = '' }) {
  const [cls, glyph, iconCls] = ALERT[tone];
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon icon={glyph} size={16} className={`mt-0.5 shrink-0 ${iconCls}`} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-[13px] opacity-90' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

function ToastItem({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), toast.tone === 'error' ? 6000 : 3500);
    return () => clearTimeout(id);
  }, [dispatch, toast]);
  const glyph = toast.tone === 'error' ? XCircle : toast.tone === 'warning' ? AlertTriangle : CheckCircle2;
  const color = toast.tone === 'error' ? 'text-rose-600' : toast.tone === 'warning' ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div className="pointer-events-auto flex w-80 animate-pop-in items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_-12px_rgb(15_23_42/0.25)]">
      <Icon icon={glyph} size={16} className={`mt-0.5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy-900">{toast.message}</p>
        {toast.description && <p className="mt-0.5 text-xs text-slate-500">{toast.description}</p>}
      </div>
      <button className="text-slate-400 hover:text-slate-700" onClick={() => dispatch(dismissToast(toast.id))} aria-label="Dismiss">
        <Icon icon={X} size={14} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSelector((s) => s.toast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-navy-900 ${className}`} />;
}

/** Thin gold bar sliding across the top of the viewport (route / chunk loading). */
export function TopProgress() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden bg-gold-100/60" role="progressbar" aria-label="Loading">
      <div className="h-full w-1/3 animate-progress rounded-full bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />
    </div>
  );
}

/** Brand mark inside a rotating gold ring. */
export function BrandSpinner({ size = 72 }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full border-[3px] border-navy-100" />
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-gold-400 border-t-gold-500 [animation-duration:900ms]" />
      <img src="/brand/jeewanasaviya-logo.png" alt="" className="animate-soft-pulse object-contain" style={{ width: size * 0.66, height: size * 0.66 }} />
    </span>
  );
}

/**
 * Loading state for pages and guarded routes.
 * The top bar appears at once; the branded spinner only after a short delay,
 * so fast loads never flash a spinner (that flash is what feels "not smooth").
 */
export function PageLoader({ fullscreen = false, delay = 180 }) {
  const [show, setShow] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return undefined;
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <>
      <TopProgress />
      <div className={`flex items-center justify-center ${fullscreen ? 'fixed inset-0 z-[85] bg-white/85 backdrop-blur-[2px]' : 'min-h-[45vh]'}`}>
        {show && (
          <div className="flex animate-fade-in flex-col items-center gap-3">
            <BrandSpinner />
            <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-navy-400">Loading</span>
          </div>
        )}
      </div>
    </>
  );
}
