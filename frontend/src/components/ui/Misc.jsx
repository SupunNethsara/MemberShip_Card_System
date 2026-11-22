import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Icon from './Icon';

export function PageHeader({ title, description, actions, eyebrow, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '', bodyClass = 'p-5', footer }) {
  return (
    <section className={`surface ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
      {footer && <footer className="border-t border-slate-200 bg-slate-50/60 px-5 py-3">{footer}</footer>}
    </section>
  );
}

export function CopyButton({ value, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${copied ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} ${className}`}
    >
      <Icon icon={copied ? Check : Copy} size={13} />
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Read-only URL with one-click copy (webhook / notify URLs). */
export function CopyField({ label, value, hint }) {
  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-medium text-slate-700">{label}</p>}
      <div className="flex gap-2">
        <code className="flex h-8 min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700">{value}</code>
        <CopyButton value={value} />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200 ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
            ${value === t.value ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-800'}`}
        >
          {t.icon && <Icon icon={t.icon} size={14} />}
          {t.label}
          {t.count !== undefined && <span className="rounded-full bg-slate-100 px-1.5 text-2xs tabular-nums text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DescriptionList({ items, columns = 2 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-3' : ''}`}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k}>
          <dt className="eyebrow">{k}</dt>
          <dd className="mt-1 text-sm text-navy-800">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Avatar({ name = '', size = 32, className = '' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-700 ${className}`}
    >
      {initials || '?'}
    </span>
  );
}
