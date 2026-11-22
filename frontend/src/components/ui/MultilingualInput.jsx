import { useId, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import Icon from './Icon';

const TABS = [
  { code: 'en', label: 'EN', font: '' },
  { code: 'si', label: 'සිං', font: 'font-[Noto_Sans_Sinhala]' },
  { code: 'ta', label: 'தமி', font: 'font-[Noto_Sans_Tamil]' },
];

/**
 * Tabbed EN | සිං | தமி editor for a translatable {en, si, ta} value.
 * Tabs show a tick when a translation exists; English is the required fallback.
 * errors may be keyed by "field.en" etc. (Laravel dot notation) via `errors` + `name`.
 */
export default function MultilingualInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required = false,
  placeholder,
  hint,
  errors = {},
  name,
  maxLength,
  className = '',
}) {
  const [active, setActive] = useState('en');
  const id = useId();
  const v = value || { en: '', si: '', ta: '' };
  const errFor = (code) => (name ? errors[`${name}.${code}`] : undefined);
  const anyError = name ? errors[name] || TABS.map((t) => errFor(t.code)).find(Boolean) : undefined;
  const tab = TABS.find((t) => t.code === active);

  const common = {
    id,
    value: v[active] ?? '',
    onChange: (e) => onChange({ ...v, [active]: e.target.value }),
    placeholder: active === 'en' ? placeholder : v.en ? `${v.en.slice(0, 60)}${v.en.length > 60 ? '…' : ''}` : placeholder,
    maxLength,
    lang: active,
    className: `block w-full resize-y border-0 bg-transparent px-3 py-2 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 ${tab.font}`,
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <div className={`overflow-hidden rounded-md border bg-white focus-within:ring-1 ${anyError ? 'border-rose-500 focus-within:ring-rose-500' : 'border-slate-300 focus-within:border-navy-900 focus-within:ring-navy-900'}`}>
        <div className="flex items-center gap-px border-b border-slate-200 bg-slate-50 px-1 pt-1">
          {TABS.map((t) => {
            const filled = (v[t.code] ?? '').trim() !== '';
            const err = errFor(t.code);
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => setActive(t.code)}
                className={`relative -mb-px inline-flex items-center gap-1.5 rounded-t-md border px-2.5 py-1 text-xs font-medium transition-colors
                  ${active === t.code ? 'border-slate-200 border-b-white bg-white text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-800'}`}
              >
                <span className={t.font}>{t.label}</span>
                {err ? (
                  <Icon icon={AlertCircle} size={11} className="text-rose-600" />
                ) : filled ? (
                  <Icon icon={Check} size={11} className="text-emerald-600" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </button>
            );
          })}
          {maxLength && <span className="ml-auto pr-2 text-2xs tabular-nums text-slate-400">{(v[active] ?? '').length}/{maxLength}</span>}
        </div>
        {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
      </div>
      {anyError ? (
        <p className="mt-1 text-xs text-rose-600">{anyError}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
