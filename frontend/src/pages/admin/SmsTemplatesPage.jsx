import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareText, Save } from 'lucide-react';
import { Alert, Button, Can, Card, Icon, LoadError, PageHeader, Skeleton, StatusBadge, Toggle } from '../../components/ui';
import { useSaveSmsTemplateMutation, useSmsTemplatesQuery } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { errorMessage, fieldErrors, relative } from '../../lib/format';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

const SAMPLE = {
  '{member_name}': 'Tharindu Silva', '{member_id}': 'MEM-2026-00482', '{tier_name}': 'Gold', '{expiry_date}': '2027-11-22',
  '{otp_code}': '482913', '{amount}': '6,500.00', '{invoice_no}': 'INV-2026-000128', '{site_name}': 'Jeewanasaviya',
};

const segments = (text) => {
  const unicode = /[^\x00-\x7F]/.test(text);
  const [single, multi] = unicode ? [70, 67] : [160, 153];
  return { unicode, count: text.length <= single ? 1 : Math.ceil(text.length / multi), len: text.length };
};

export default function SmsTemplatesPage() {
  useDocumentTitle('SMS Templates');
  const can = usePermission();
  const { data, isLoading, refetch } = useSmsTemplatesQuery();
  const [activeId, setActiveId] = useState(null);
  const templates = data?.data || [];
  const variables = data?.variables || [];
  const active = templates.find((t) => t.id === activeId) || templates[0];

  return (
    <div>
      <PageHeader title="SMS Templates" description="Multilingual messages sent automatically on each event. Members receive them in their preferred language." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="surface h-fit overflow-hidden">
          {isLoading && <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>}
          {!isLoading && !data && <LoadError compact tone="plain" onRetry={refetch} />}
          <ul className="divide-y divide-slate-100">
            {templates.map((t) => (
              <li key={t.id}>
                <button onClick={() => setActiveId(t.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active?.id === t.id ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                  <Icon icon={MessageSquareText} size={15} className={active?.id === t.id ? 'text-navy-900' : 'text-slate-400'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-navy-900">{t.name}</span>
                    <span className="block font-mono text-2xs text-slate-400">{t.event}</span>
                  </span>
                  {!t.is_active && <StatusBadge status="disabled" dot={false} />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {active && <TemplateEditor key={active.id} template={active} variables={variables} readOnly={!can('sms.templates.manage')} />}
      </div>
    </div>
  );
}

function TemplateEditor({ template, variables, readOnly }) {
  const toast = useToast();
  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.is_active);
  const [lang, setLang] = useState('en');
  const ref = useRef(null);
  const [save, { isLoading, error }] = useSaveSmsTemplateMutation();
  const errs = fieldErrors(error);
  const dirty = JSON.stringify(body) !== JSON.stringify(template.body) || isActive !== template.is_active;

  useEffect(() => { setBody(template.body); setIsActive(template.is_active); }, [template]);

  const insert = (v) => {
    const el = ref.current;
    const text = body[lang] || '';
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + v + text.slice(end);
    setBody({ ...body, [lang]: next });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + v.length, start + v.length); });
  };

  const preview = useMemo(() => Object.entries(SAMPLE).reduce((s, [k, v]) => s.split(k).join(v), body[lang] || body.en || ''), [body, lang]);
  const seg = segments(preview);

  const submit = async () => {
    try { await save({ id: template.id, body, is_active: isActive }).unwrap(); toast('Template saved'); } catch { /* shown */ }
  };

  return (
    <div className="space-y-4">
      <Card
        title={template.name}
        description={`Event: ${template.event} · updated ${relative(template.updated_at)}`}
        actions={<Toggle checked={isActive} disabled={readOnly} onChange={setIsActive} />}
      >
        {error && !Object.keys(errs).length && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}
        <div className="mb-3 flex gap-1 border-b border-slate-200">
          {LANGS.map((l) => (
            <button key={l.code} type="button" onClick={() => setLang(l.code)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${lang === l.code ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-800'}`}>
              {l.label}
              {!(body[l.code] || '').trim() && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" title="Missing — English will be used" />}
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          rows={5}
          disabled={readOnly}
          lang={lang}
          value={body[lang] || ''}
          onChange={(e) => setBody({ ...body, [lang]: e.target.value })}
          className={`field font-mono text-[13px] leading-relaxed ${errs[`body.${lang}`] ? 'field-error' : ''}`}
          placeholder={lang === 'en' ? 'Required' : `Falls back to English if left empty`}
        />
        {errs[`body.${lang}`] && <p className="mt-1 text-xs text-rose-600">{errs[`body.${lang}`]}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-500">Insert variable:</span>
          {variables.map((v) => (
            <button key={v} type="button" disabled={readOnly} onClick={() => insert(v)} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-2xs text-slate-700 hover:border-slate-400 disabled:opacity-50">{v}</button>
          ))}
        </div>
      </Card>

      <Card title="Preview" description="Rendered with sample data">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="max-w-sm flex-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-navy-800" lang={lang}>{preview || <span className="text-slate-400">Empty</span>}</div>
          <dl className="grid grid-cols-3 gap-4 text-xs sm:grid-cols-1 sm:gap-2">
            <div><dt className="text-slate-500">Characters</dt><dd className="font-semibold tabular-nums">{seg.len}</dd></div>
            <div><dt className="text-slate-500">Encoding</dt><dd className="font-semibold">{seg.unicode ? 'Unicode' : 'GSM-7'}</dd></div>
            <div><dt className="text-slate-500">Segments</dt><dd className={`font-semibold tabular-nums ${seg.count > 2 ? 'text-amber-700' : ''}`}>{seg.count}</dd></div>
          </dl>
        </div>
      </Card>

      <Can perform="sms.templates.manage">
        <div className="flex justify-end">
          <Button icon={Save} disabled={!dirty} loading={isLoading} onClick={submit}>Save template</Button>
        </div>
      </Can>
    </div>
  );
}
