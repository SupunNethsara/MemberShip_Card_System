import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import Icon from './Icon';
import Button from './Button';
import { useEscape } from '../../hooks';

function useBodyLock(open) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEscape(onClose, open);
  useBodyLock(open);
  if (!open) return null;
  return createPortal(
    <div className="no-print fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-900/40" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${MODAL_SIZES[size]} animate-pop-in flex-col rounded-t-xl border border-slate-200 bg-white shadow-[0_24px_48px_-16px_rgb(15_23_42/0.35)] sm:rounded-xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <Icon icon={X} size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const DRAWER_SIZES = { md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };

export function SlideOverDrawer({ open, onClose, title, description, children, footer, size = 'lg', headerExtra }) {
  useEscape(onClose, open);
  useBodyLock(open);
  if (!open) return null;
  return createPortal(
    <div className="no-print fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-900/30" onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 flex w-full ${DRAWER_SIZES[size]} animate-slide-in flex-col border-l border-slate-200 bg-white shadow-[-24px_0_48px_-24px_rgb(15_23_42/0.3)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
              <Icon icon={X} size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {tone === 'danger' && <Icon icon={AlertTriangle} size={16} className="text-rose-600" />}
          {title}
        </span>
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
      {children}
    </Modal>
  );
}
