import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, CheckCircle2, CloudOff, Info, RotateCw, X, XCircle } from 'lucide-react';
import Icon from './Icon';
import { dismissToast } from '../../app/toastSlice';
import { useT } from '../../hooks';

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

/**
 * Loading state for pages and guarded routes: logo + a thin gold line.
 * Uses the boot-screen classes from index.html, so the first load hands over without a visual change.
 * Inline loaders wait a moment before appearing, so fast loads never flash anything.
 */
export function PageLoader({ fullscreen = false, delay = 180 }) {
  const [show, setShow] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return undefined;
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (!fullscreen && !show) return <div className="boot boot--inline" />;
  return (
    <div className={`boot ${fullscreen ? 'boot--full' : 'boot--inline'} ${delay === 0 ? '' : 'boot--fade'}`} role="status" aria-label="Loading">
      {show && (
        <>
          <img src="/brand/jeewanasaviya-logo.png" alt="" />
          <span className="boot-track" />
        </>
      )}
    </div>
  );
}

/**
 * Shown in place of a section whose data couldn't be fetched (server down, timeout, 5xx).
 * Keeps the section's footprint, says what happened in plain words, and offers a retry.
 * `compact` fits inside a card or table; the default suits a full page section.
 */
export function LoadError({ onRetry, title, description, compact = false, tone = 'light', className = '' }) {
  const { t } = useT();
  const [retrying, setRetrying] = useState(false);
  const dark = tone === 'dark';
  const boxed = tone === 'light'; // 'plain' sits inside an existing card/table without its own border
  const retry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  };

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'} ${
        dark ? 'text-slate-300' : boxed ? 'rounded-lg border border-dashed border-slate-300 bg-white/60 text-slate-500' : 'text-slate-500'
      } ${className}`}
    >
      <Icon icon={CloudOff} size={compact ? 18 : 22} className={dark ? 'text-slate-400' : 'text-slate-400'} />
      <p className={`mt-3 text-sm font-semibold ${dark ? 'text-white' : 'text-navy-900'}`}>{title || t('common.loadFailedTitle')}</p>
      <p className="mt-1 max-w-sm text-xs">{description || t('common.loadFailedBody')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className={`mt-4 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-60 ${
            dark ? 'border-white/25 text-white hover:bg-white/10' : 'border-slate-300 bg-white text-navy-900 hover:bg-slate-50'
          }`}
        >
          <Icon icon={RotateCw} size={13} className={retrying ? 'animate-spin' : ''} />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
