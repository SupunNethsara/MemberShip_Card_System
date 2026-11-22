import { KeyRound, Lock } from 'lucide-react';
import { Field, Icon, Input, KeyValueEditor, Select, Textarea } from '../../../components/ui';

/**
 * Renders a driver's credential / setting schema (from the backend definition) as form fields.
 * Secret fields show the masked stored value as placeholder; leaving them blank keeps the stored secret.
 */
export function CredentialFields({ fields = [], values = {}, masked = {}, configured = [], onChange, errors = {} }) {
  if (!fields.length) return <p className="text-xs text-slate-500">This driver needs no credentials.</p>;
  return (
    <div className="grid gap-4">
      {fields.map((f) => {
        const isSecret = f.type === 'secret' || f.type === 'secret_textarea';
        const stored = configured.includes(f.key);
        const common = {
          label: (
            <span className="inline-flex items-center gap-1.5">
              {isSecret && <Icon icon={Lock} size={11} className="text-slate-400" />}
              {f.label}
            </span>
          ),
          required: f.required && !stored,
          hint: f.help,
          error: errors[`credentials.${f.key}`],
        };
        const placeholder = stored ? (masked[f.key] || '••••••••••••') : f.required ? 'Required' : 'Optional';

        if (f.type === 'secret_textarea') {
          return (
            <Textarea
              key={f.key}
              {...common}
              rows={4}
              className="font-mono"
              placeholder={stored ? `${placeholder}\n(stored securely — paste a new value to replace)` : '-----BEGIN PUBLIC KEY-----'}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            />
          );
        }
        return (
          <Input
            key={f.key}
            {...common}
            type={isSecret ? 'password' : 'text'}
            autoComplete="new-password"
            placeholder={placeholder}
            value={values[f.key] ?? ''}
            onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            fieldClass="font-mono text-[13px]"
            aside={stored ? <span className="inline-flex items-center gap-1 text-2xs font-medium text-emerald-700"><Icon icon={KeyRound} size={10} />Stored · encrypted</span> : null}
          />
        );
      })}
    </div>
  );
}

export function SettingFields({ fields = [], values = {}, onChange, errors = {} }) {
  if (!fields.length) return null;
  const set = (k, v) => onChange({ ...values, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const err = errors[`settings.${f.key}`];
        if (f.type === 'select') {
          return <Select key={f.key} label={f.label} required={f.required} hint={f.help} error={err} value={values[f.key] ?? f.options[0]} onChange={(e) => set(f.key, e.target.value)} options={f.options.map((o) => ({ value: o, label: o }))} />;
        }
        if (f.type === 'textarea') {
          return <Textarea key={f.key} className="sm:col-span-2" label={f.label} hint={f.help} error={err} value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />;
        }
        if (f.type === 'keyvalue') {
          return (
            <Field key={f.key} className="sm:col-span-2" label={f.label} required={f.required} hint={f.help} error={err}>
              <KeyValueEditor value={values[f.key] || []} onChange={(v) => set(f.key, v)} />
            </Field>
          );
        }
        return <Input key={f.key} className={f.key === 'endpoint' ? 'sm:col-span-2' : ''} label={f.label} required={f.required} hint={f.help} error={err} value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} fieldClass={f.key === 'endpoint' ? 'font-mono text-[13px]' : ''} />;
      })}
    </div>
  );
}
