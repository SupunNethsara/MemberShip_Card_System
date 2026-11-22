import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Alert, Button, Can, ConfirmDialog, EmptyState, Icon, Input, MultilingualInput, Skeleton, SlideOverDrawer, StatusBadge, Toggle,
} from '../../../components/ui';
import { useDeleteHeroSlideMutation, useHeroSlidesQuery, useSaveHeroSlideMutation } from '../../../app/api';
import { usePermission, useToast } from '../../../hooks';
import { emptyTr, errorMessage, fieldErrors, tr } from '../../../lib/format';

const DEFAULT_BG = '/images/hero-bg.jpg';
const plain = (v) => tr(v).replace(/\*(.+?)\*/g, '$1');

export default function HeroSlidesEditor() {
  const can = usePermission();
  const toast = useToast();
  const { data: slides = [], isLoading } = useHeroSlidesQuery();
  const [save] = useSaveHeroSlideMutation();
  const [remove, { isLoading: removing }] = useDeleteHeroSlideMutation();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const quick = async (slide, patch, msg) => {
    try { await save({ id: slide.id, ...patch }).unwrap(); if (msg) toast(msg); } catch (e) { toast(errorMessage(e), 'error'); }
  };
  const move = async (i, dir) => {
    const a = slides[i]; const b = slides[i + dir];
    if (!a || !b) return;
    await quick(a, { sort_order: b.sort_order === a.sort_order ? a.sort_order + dir : b.sort_order });
    await quick(b, { sort_order: a.sort_order }, 'Slide order updated');
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Slides rotate every 7 seconds on the home page. Arrows and dots are hidden when only one slide is active.</p>
        <Can perform="cms.manage"><Button icon={Plus} onClick={() => setEditing({})}>Add slide</Button></Can>
      </div>
      <div className="space-y-3">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        {slides.map((s, i) => (
          <div key={s.id} className="surface flex flex-col gap-4 overflow-hidden sm:flex-row sm:items-center">
            <div className="h-28 shrink-0 bg-[#061433] bg-cover bg-right sm:w-56" style={{ backgroundImage: `url('${s.background_url || DEFAULT_BG}')` }} />
            <div className="min-w-0 flex-1 px-4 pb-4 sm:px-0 sm:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs font-semibold tabular-nums text-slate-400">#{i + 1}</span>
                <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
                {['en', 'si', 'ta'].map((l) => (
                  <span key={l} className={`rounded px-1.5 py-0.5 text-2xs font-medium ${s.title?.[l] ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{l.toUpperCase()}</span>
                ))}
              </div>
              <p className="mt-1.5 line-clamp-1 font-medium text-navy-900">{plain(s.title)}</p>
              <p className="line-clamp-1 text-xs text-slate-500">{tr(s.subtitle)}</p>
            </div>
            {can('cms.manage') && (
              <div className="flex items-center gap-1 px-4 pb-4 sm:pb-0">
                <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon icon={ArrowUp} size={14} /></Button>
                <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon icon={ArrowDown} size={14} /></Button>
                <Toggle checked={s.is_active} onChange={(v) => quick(s, { is_active: v }, v ? 'Slide published' : 'Slide hidden')} />
                <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label="Edit"><Icon icon={Pencil} size={14} /></Button>
                <Button size="icon" variant="danger-ghost" onClick={() => setDeleting(s)} aria-label="Delete"><Icon icon={Trash2} size={14} /></Button>
              </div>
            )}
          </div>
        ))}
        {!isLoading && !slides.length && (
          <div className="surface"><EmptyState title="No slides yet" description="Without slides, the hero falls back to the Homepage hero text in Page content." /></div>
        )}
      </div>
      <SlideDrawer slide={editing} nextOrder={slides.length} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={removing}
        title="Delete slide?"
        description={plain(deleting?.title)}
        confirmLabel="Delete slide"
        onConfirm={async () => { try { await remove(deleting.id).unwrap(); toast('Slide deleted'); } catch (e) { toast(errorMessage(e), 'error'); } setDeleting(null); }}
      />
    </div>
  );
}

function SlideDrawer({ slide, nextOrder, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [save, { isLoading, error, reset }] = useSaveHeroSlideMutation();
  const errs = fieldErrors(error);

  useEffect(() => {
    if (!slide) return;
    reset();
    setForm({
      id: slide.id,
      badge: slide.badge || emptyTr(),
      title: slide.title || emptyTr(),
      subtitle: slide.subtitle || emptyTr(),
      cta_primary_label: slide.cta_primary_label || { en: 'Become a member', si: 'සාමාජිකයෙකු වන්න', ta: 'உறுப்பினராகுங்கள்' },
      cta_primary_url: slide.cta_primary_url ?? '/register',
      cta_secondary_label: slide.cta_secondary_label || { en: 'Browse partners', si: 'හවුල්කරුවන් බලන්න', ta: 'கூட்டாளர்களைப் பாருங்கள்' },
      cta_secondary_url: slide.cta_secondary_url ?? '/partners',
      sort_order: slide.sort_order ?? nextOrder,
      is_active: slide.is_active ?? true,
      background: null,
      remove_background: false,
    });
    setPreview(slide.background_url || null);
  }, [slide, nextOrder, reset]);

  if (!form || !slide) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const body = { ...form };
    if (!body.background) delete body.background;
    try { await save(body).unwrap(); toast(form.id ? 'Slide updated' : 'Slide added'); onClose(); } catch { /* shown */ }
  };

  return (
    <SlideOverDrawer
      open={!!slide}
      onClose={onClose}
      title={form.id ? 'Edit hero slide' : 'New hero slide'}
      size="xl"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>{form.id ? 'Save slide' : 'Add slide'}</Button></>}
    >
      <div className="space-y-5">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-700">Background artwork <span className="font-normal text-slate-400">(desktop only — mobile uses solid navy)</span></p>
          <label className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-[#061433] bg-cover bg-right" style={{ backgroundImage: `url('${preview || DEFAULT_BG}')` }}>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-navy-900 opacity-0 transition-opacity group-hover:opacity-100">
              <Icon icon={ImagePlus} size={14} /> Replace image
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { set({ background: f, remove_background: false }); setPreview(URL.createObjectURL(f)); }
            }} />
          </label>
          <div className="mt-1 flex justify-between text-2xs text-slate-500">
            <span>Wide image (≈ 1800×860). Keep the left 45% dark & empty for the text. PNG/JPG/WebP · max 5 MB.</span>
            {preview && <button type="button" className="font-medium text-rose-600 hover:underline" onClick={() => { set({ background: null, remove_background: true }); setPreview(null); }}>Use default</button>}
          </div>
          {errs.background && <p className="mt-1 text-xs text-rose-600">{errs.background}</p>}
        </div>

        <MultilingualInput label="Badge" name="badge" errors={errs} value={form.badge} onChange={(v) => set({ badge: v })} maxLength={120} />
        <MultilingualInput label="Headline" required name="title" errors={errs} value={form.title} onChange={(v) => set({ title: v })} maxLength={200}
          hint="Wrap words in *asterisks* to show them in gold — e.g. One card for your *family’s* protection." />
        <MultilingualInput label="Sub-headline" multiline name="subtitle" errors={errs} value={form.subtitle} onChange={(v) => set({ subtitle: v })} maxLength={600} />

        <div className="grid gap-4 sm:grid-cols-2">
          <MultilingualInput label="Primary button" name="cta_primary_label" errors={errs} value={form.cta_primary_label} onChange={(v) => set({ cta_primary_label: v })} maxLength={60} />
          <Input label="Primary link" value={form.cta_primary_url} onChange={(e) => set({ cta_primary_url: e.target.value })} error={errs.cta_primary_url} hint="/register, /#plans or https://…" fieldClass="font-mono text-[13px]" />
          <MultilingualInput label="Secondary button" name="cta_secondary_label" errors={errs} value={form.cta_secondary_label} onChange={(v) => set({ cta_secondary_label: v })} maxLength={60} />
          <Input label="Secondary link" value={form.cta_secondary_url} onChange={(e) => set({ cta_secondary_url: e.target.value })} error={errs.cta_secondary_url} hint="/partners or https://…" fieldClass="font-mono text-[13px]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-end">
          <Input label="Order" type="number" min="0" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
          <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Published" description="Show this slide on the home page." />
        </div>
      </div>
    </SlideOverDrawer>
  );
}
