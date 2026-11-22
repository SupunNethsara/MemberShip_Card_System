import { forwardRef, useId, useState } from 'react';
import { Check, Eye, EyeOff, Minus, Plus, Trash2 } from 'lucide-react';
import Icon from './Icon';

export function Field({ label, error, hint, required, children, className = '', htmlFor, aside }) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          {aside}
        </div>
      )}
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className = '', fieldClass = '', prefix, suffix, aside, ...rest }, ref) {
  const id = useId();
  const input = (
    <input ref={ref} id={id} className={`field ${error ? 'field-error' : ''} ${prefix ? 'pl-12' : ''} ${suffix ? 'pr-10' : ''} ${fieldClass}`} {...rest} />
  );
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id} aside={aside}>
      {prefix || suffix ? (
        <div className="relative">
          {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-2.5 text-xs font-medium text-slate-500">{prefix}</span>}
          {input}
          {suffix && <span className="absolute inset-y-0 right-0 flex items-center pr-2">{suffix}</span>}
        </div>
      ) : input}
    </Field>
  );
});

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? 'text' : 'password'}
      suffix={
        <button type="button" onClick={() => setShow((s) => !s)} className="rounded p-1 text-slate-400 hover:text-slate-700" aria-label={show ? 'Hide' : 'Show'}>
          <Icon icon={show ? EyeOff : Eye} size={15} />
        </button>
      }
    />
  );
}

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className = '', rows = 3, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <textarea ref={ref} id={id} rows={rows} className={`field resize-y ${error ? 'field-error' : ''}`} {...rest} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, required, className = '', options = [], placeholder, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <select ref={ref} id={id} className={`field pr-8 ${error ? 'field-error' : ''}`} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
});

/** Crisp square tick-box. `indeterminate` renders a dash (used by matrix row/column toggles). */
export function Checkbox({ checked, indeterminate, onChange, disabled, label, description, className = '', size = 'md', title }) {
  const box = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  const on = checked || indeterminate;
  const control = (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : !!checked}
      disabled={disabled}
      title={title}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-[4px] border transition-colors
        ${on ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white hover:border-slate-500'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      {indeterminate ? <Icon icon={Minus} size={12} /> : checked ? <Icon icon={Check} size={12} strokeWidth={3} /> : null}
    </button>
  );
  if (!label) return control;
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 ${disabled ? 'cursor-not-allowed' : ''} ${className}`}>
      <span className="mt-px">{control}</span>
      <span className="text-sm">
        <span className="font-medium text-navy-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange, disabled, label, description, className = '', tone = 'emerald' }) {
  const onColor = tone === 'slate' ? 'bg-navy-900' : 'bg-emerald-600';
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : 'cursor-pointer'} ${className}`}>
      {(label || description) && (
        <span className="text-sm">
          <span className="font-medium text-navy-800">{label}</span>
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? onColor : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

/** Segmented control, e.g. Sandbox | Live. */
export function Segmented({ value, onChange, options, size = 'md' }) {
  return (
    <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-[5px] font-medium transition-colors ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'}
            ${value === o.value ? 'bg-white text-navy-900 shadow-[0_1px_2px_rgb(15_23_42/0.08)] ring-1 ring-slate-200' : 'text-slate-600 hover:text-navy-900'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Editable list of {key, value} rows (headers / payload mapping). */
export function KeyValueEditor({ value = [], onChange, keyPlaceholder = 'key', valuePlaceholder = 'value' }) {
  const rows = value.length ? value : [];
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input className="field w-2/5 font-mono text-xs" placeholder={keyPlaceholder} value={r.key ?? ''} onChange={(e) => set(i, { key: e.target.value })} />
          <input className="field flex-1 font-mono text-xs" placeholder={valuePlaceholder} value={r.value ?? ''} onChange={(e) => set(i, { value: e.target.value })} />
          <button type="button" className="rounded-md px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove row">
            <Icon icon={Trash2} size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { key: '', value: '' }])} className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-navy-900">
        <Icon icon={Plus} size={13} /> Add row
      </button>
    </div>
  );
}
