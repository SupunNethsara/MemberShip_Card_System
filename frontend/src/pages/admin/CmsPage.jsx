import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import {
  Alert, Button, Can, Card, ConfirmDialog, EmptyState, Icon, Input, Modal, MultilingualInput, PageHeader, Skeleton, StatusBadge, Tabs, Toggle,
} from '../../components/ui';
import { useCmsQuery, useDeleteFaqMutation, useFaqsQuery, useSaveCmsMutation, useSaveFaqMutation, useUploadBrandLogoMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import HeroSlidesEditor from './cms/HeroSlidesEditor';
import FooterContactEditor from './cms/FooterContactEditor';
import { emptyTr, errorMessage, fieldErrors, tr } from '../../lib/format';

const GROUP_LABELS = { brand: 'Brand name & tagline', hero: 'Homepage hero', how: 'How it works', contact: 'Contact info', legal: 'Legal & Policies', terms: 'Terms & Conditions', footer: 'Footer' };

export default function CmsPage() {
  useDocumentTitle('CMS & Localization');
  const [tab, setTab] = useState('hero');
  return (
    <div>
      <PageHeader
        title="CMS & Localization"
        description="Edit public-facing copy in English, Sinhala and Tamil. Changes go live immediately — no deploy needed."
        actions={<a href="/" target="_blank" rel="noreferrer"><Button variant="secondary" icon={Eye}>View site</Button></a>}
      />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: 'hero', label: 'Hero slides' }, { value: 'content', label: 'Page content' }, { value: 'faqs', label: 'FAQs' }, { value: 'settings', label: 'Site settings & footer' }]} />
      {tab === 'hero' && <HeroSlidesEditor />}
      {tab === 'content' && <ContentEditor />}
      {tab === 'faqs' && <FaqEditor />}
      {tab === 'settings' && <div className="grid gap-6 xl:grid-cols-2"><SettingsEditor /><BrandingEditor /><FooterContactEditor /></div>}
    </div>
  );
}

function useCmsDraft() {
  const { data, isLoading } = useCmsQuery();
  const contents = useMemo(() => data?.contents?.data ?? data?.contents ?? [], [data]);
  return { data, contents, isLoading };
}

function ContentEditor() {
  const can = usePermission();
  const toast = useToast();
  const { contents, isLoading } = useCmsDraft();
  const [draft, setDraft] = useState({});
  const [save, { isLoading: saving, error }] = useSaveCmsMutation();

  useEffect(() => { setDraft(Object.fromEntries(contents.map((c) => [c.key, c.value]))); }, [contents]);

  const groups = useMemo(() => contents.reduce((acc, c) => { (acc[c.group] ||= []).push(c); return acc; }, {}), [contents]);
  const dirtyKeys = contents.filter((c) => JSON.stringify(draft[c.key]) !== JSON.stringify(c.value)).map((c) => c.key);
  const missing = contents.reduce((n, c) => n + ['si', 'ta'].filter((l) => !(draft[c.key]?.[l] || '').trim()).length, 0);

  const submit = async () => {
    try {
      await save({ contents: dirtyKeys.map((key) => ({ key, value: draft[key] })) }).unwrap();
      toast(`${dirtyKeys.length} block${dirtyKeys.length > 1 ? 's' : ''} published`);
    } catch { /* shown */ }
  };

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 pb-20">
      {missing > 0 && <Alert tone="warning">{missing} translation{missing > 1 ? 's are' : ' is'} missing. Visitors will see English where a translation is empty.</Alert>}
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      {Object.entries(groups).map(([group, items]) => (
        <Card key={group} title={GROUP_LABELS[group] || group}>
          <fieldset disabled={!can('cms.manage')} className="space-y-5">
            {items.map((c) => (
              <MultilingualInput
                key={c.key}
                label={<span>{c.label} <code className="ml-1 text-2xs font-normal text-slate-400">{c.key}</code></span>}
                multiline={c.type !== 'text'}
                rows={c.type === 'richtext' ? 12 : 3}
                value={draft[c.key]}
                onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))}
              />
            ))}
          </fieldset>
        </Card>
      ))}
      <Can perform="cms.manage">
        {dirtyKeys.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-60">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
              <p className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-amber-500" />{dirtyKeys.length} unsaved change{dirtyKeys.length > 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(Object.fromEntries(contents.map((c) => [c.key, c.value])))}>Discard</Button>
                <Button size="sm" icon={Save} loading={saving} onClick={submit}>Publish changes</Button>
              </div>
            </div>
          </div>
        )}
      </Can>
    </div>
  );
}

function FaqEditor() {
  const can = usePermission();
  const toast = useToast();
  const { data, isLoading } = useFaqsQuery({ sort: 'sort_order', direction: 'asc' });
  const [save] = useSaveFaqMutation();
  const [remove, { isLoading: removing }] = useDeleteFaqMutation();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const faqs = data?.data || [];

  const move = async (i, dir) => {
    const a = faqs[i]; const b = faqs[i + dir];
    if (!a || !b) return;
    try {
      await save({ ...a, sort_order: b.sort_order === a.sort_order ? a.sort_order + dir : b.sort_order }).unwrap();
      await save({ ...b, sort_order: a.sort_order }).unwrap();
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end"><Can perform="cms.manage"><Button icon={Plus} onClick={() => setEditing({})}>Add FAQ</Button></Can></div>
      <div className="surface divide-y divide-slate-100">
        {isLoading && <div className="p-4"><Skeleton className="h-20" /></div>}
        {faqs.map((f, i) => (
          <div key={f.id} className="flex items-start gap-4 p-4">
            {can('cms.manage') && (
              <div className="flex flex-col pt-0.5">
                <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-slate-400 hover:text-navy-900 disabled:opacity-30" aria-label="Move up"><Icon icon={ArrowUp} size={13} /></button>
                <button disabled={i === faqs.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-slate-400 hover:text-navy-900 disabled:opacity-30" aria-label="Move down"><Icon icon={ArrowDown} size={13} /></button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-navy-900">{tr(f.question)}</p>
                {!f.is_active && <StatusBadge status="inactive" />}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{tr(f.answer)}</p>
              <div className="mt-2 flex gap-1.5">
                {['en', 'si', 'ta'].map((l) => (
                  <span key={l} className={`rounded px-1.5 py-0.5 text-2xs font-medium ${f.question[l] && f.answer[l] ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{l.toUpperCase()}</span>
                ))}
              </div>
            </div>
            <Can perform="cms.manage">
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(f)} aria-label="Edit"><Icon icon={Pencil} size={14} /></Button>
                <Button size="icon" variant="danger-ghost" onClick={() => setDeleting(f)} aria-label="Delete"><Icon icon={Trash2} size={14} /></Button>
              </div>
            </Can>
          </div>
        ))}
        {!isLoading && !faqs.length && <EmptyState title="No FAQs yet" />}
      </div>
      <FaqModal faq={editing} onClose={() => setEditing(null)} nextOrder={faqs.length} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} loading={removing} title="Delete FAQ?" description={tr(deleting?.question)} confirmLabel="Delete" onConfirm={async () => { await remove(deleting.id); toast('FAQ deleted'); setDeleting(null); }} />
    </div>
  );
}

function FaqModal({ faq, onClose, nextOrder }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [save, { isLoading, error, reset }] = useSaveFaqMutation();
  const errs = fieldErrors(error);
  useEffect(() => {
    if (faq) { reset(); setForm({ id: faq.id, question: faq.question || emptyTr(), answer: faq.answer || emptyTr(), sort_order: faq.sort_order ?? nextOrder, is_active: faq.is_active ?? true }); }
  }, [faq, reset, nextOrder]);
  if (!form) return null;
  const submit = async () => {
    try { await save(form).unwrap(); toast(form.id ? 'FAQ updated' : 'FAQ added'); onClose(); } catch { /* shown */ }
  };
  return (
    <Modal open={!!faq} onClose={onClose} size="lg" title={form.id ? 'Edit FAQ' : 'Add FAQ'} footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>Save</Button></>}>
      <div className="space-y-4">
        <MultilingualInput label="Question" required name="question" errors={errs} value={form.question} onChange={(v) => setForm({ ...form, question: v })} maxLength={300} />
        <MultilingualInput label="Answer" required multiline rows={5} name="answer" errors={errs} value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} maxLength={3000} />
        <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Published" />
      </div>
    </Modal>
  );
}

function SettingsEditor() {
  const can = usePermission();
  const toast = useToast();
  const { data, isLoading } = useCmsDraft();
  const [form, setForm] = useState({ site_name: '', contact_email: '', contact_phone: '' });
  const [save, { isLoading: saving, error }] = useSaveCmsMutation();
  const errs = fieldErrors(error);
  useEffect(() => { if (data?.settings) setForm({ site_name: data.settings.site_name ?? '', contact_email: data.settings.contact_email ?? '', contact_phone: data.settings.contact_phone ?? '' }); }, [data]);

  const submit = async () => {
    try { await save({ settings: form }).unwrap(); toast('Settings saved'); } catch { /* shown */ }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;
  return (
    <Card title="Site settings" description="Brand name and support contact shown across the site, receipts and SMS ({site_name})."
      footer={<Can perform="cms.manage"><div className="flex justify-end"><Button size="sm" icon={Save} loading={saving} onClick={submit}>Save settings</Button></div></Can>}>
      <fieldset disabled={!can('cms.manage')} className="grid gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Site / brand name" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} error={errs['settings.site_name']} />
        <Input label="Support email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} error={errs['settings.contact_email']} />
        <Input label="Support phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} error={errs['settings.contact_phone']} />
      </fieldset>
    </Card>
  );
}

function BrandingEditor() {
  const can = usePermission();
  const toast = useToast();
  const { data } = useCmsDraft();
  const [files, setFiles] = useState({ logo: null });
  const [upload, { isLoading, error }] = useUploadBrandLogoMutation();
  const b = data?.branding || {};
  const preview = (k, url) => (files[k] ? URL.createObjectURL(files[k]) : url);

  const submit = async () => {
    try {
      await upload(Object.fromEntries(Object.entries(files).filter(([, f]) => f))).unwrap();
      setFiles({ logo: null });
      toast('Logo updated', 'success', 'The new logo is live across the site, cards and receipts.');
    } catch { /* shown */ }
  };

  const slot = (k, label, hint, url, box) => (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-700">{label}</p>
      <label className={`flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white hover:border-gold-500 ${box} ${can('cms.manage') ? '' : 'pointer-events-none'}`}>
        {preview(k, url) ? <img src={preview(k, url)} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">Upload</span>}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => setFiles((f) => ({ ...f, [k]: e.target.files?.[0] || null }))} />
      </label>
      <p className="mt-1 text-2xs text-slate-500">{hint}</p>
    </div>
  );

  return (
    <Card
      title="Brand logo"
      description="One logo used everywhere: header, footer, admin sidebar, digital card, printed card, receipts and browser tab icon."
      footer={<Can perform="cms.manage"><div className="flex justify-end"><Button size="sm" icon={Save} disabled={!files.logo} loading={isLoading} onClick={submit}>Upload logo</Button></div></Can>}
    >
      {error && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}
      {slot('logo', 'Logo', 'Transparent PNG recommended · JPG or WebP also accepted · max 4 MB', b.logo_url, 'h-56 p-3')}
    </Card>
  );
}