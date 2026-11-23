import { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Button, Icon, Input } from '../../components/ui';
import { usePublicContentQuery, useSubmitContactInquiryMutation } from '../../app/api';
import { useDocumentTitle, useT, useToast } from '../../hooks';
import { socialHref } from '../../lib/social';
import { errorMessage } from '../../lib/format';

const TOPICS = ['membership', 'partner', 'billing', 'merchant_join', 'general'];

/** One contact channel: small icon, label, value, optional note. */
function Channel({ icon, label, note, children, first = false }) {
  return (
    <li className={`flex items-start gap-3 ${first ? '' : 'border-t border-slate-100 pt-4'}`}>
      <Icon icon={icon} size={17} className="mt-0.5 shrink-0 text-gold-600" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm text-navy-900">{children}</div>
        {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
      </div>
    </li>
  );
}

export default function ContactPage() {
  const { t, tr } = useT();
  useDocumentTitle(t('nav.contact'));
  const toast = useToast();
  const { data } = usePublicContentQuery();
  const s = data?.settings || {};
  const c = data?.content || {};

  const address = tr(c['contact.address']);
  const hours = tr(c['contact.hours']);
  const phone = s.contact_phone;
  const email = s.contact_email;
  const whatsapp = s.social?.whatsapp;

  const empty = { name: '', email: '', phone: '', subject: '', message: '', website: '' };
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [submitInquiry, { isLoading: sending }] = useSubmitContactInquiryMutation();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || (!form.email && !form.phone) || !form.message) {
      toast(t('contact.needContact'), 'error');
      return;
    }
    try {
      await submitInquiry({ ...form, subject: form.subject || null, email: form.email || null, phone: form.phone || null }).unwrap();
      setSubmitted(true);
      toast(t('contact.sentToast'));
      setForm(empty);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const channels = [
    phone && { key: 'call', icon: Phone, note: t('contact.callNote'), value: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="font-medium tabular-nums hover:underline">{phone}</a> },
    email && { key: 'email', icon: Mail, note: t('contact.emailNote'), value: <a href={`mailto:${email}`} className="break-all font-medium hover:underline">{email}</a> },
    whatsapp && { key: 'whatsapp', icon: MessageCircle, note: t('contact.whatsappNote'), value: <a href={socialHref('whatsapp', whatsapp)} target="_blank" rel="noreferrer noopener" className="font-medium tabular-nums hover:underline">{whatsapp}</a> },
    address && { key: 'address', icon: MapPin, value: <span className="whitespace-pre-line text-slate-700">{address}</span> },
    hours && { key: 'hours', icon: Clock, value: <span className="text-slate-700">{hours}</span> },
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-navy-900">{t('nav.contact')}</h1>
        <p className="mt-2 text-slate-600 sm:text-base">{tr(c['contact.intro']) || t('contact.intro')}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {channels.length > 0 && (
            <div className="surface p-6">
              <h2 className="text-base font-semibold text-navy-900">{t('contact.reachUs')}</h2>
              <ul className="mt-5 space-y-4">
                {channels.map((ch, i) => (
                  <Channel key={ch.key} icon={ch.icon} label={t(`contact.${ch.key}`)} note={ch.note} first={i === 0}>{ch.value}</Channel>
                ))}
              </ul>
            </div>
          )}

          {/* Business details — payment gateways expect these to be visible on the contact page. */}
          <div className="px-1">
            <h2 className="text-sm font-semibold text-navy-900">{t('contact.aboutTitle')}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t('contact.aboutBody')}</p>
          </div>
        </div>

        <div className="surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-navy-900">{t('contact.formTitle')}</h2>
          <p className="mt-1 text-sm text-slate-600">{t('contact.formSub')}</p>

          {submitted ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <Icon icon={CheckCircle2} size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-950">{t('contact.sentTitle')}</h3>
                  <p className="mt-1 text-sm text-emerald-800">{t('contact.sentBody')}</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
                    {t('contact.sendAnother')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Honeypot: hidden from people, filled by spam bots. Its name/id avoid anything browsers or password
                  managers recognise (e.g. "website"), so autofill doesn't trip it for real visitors. */}
              <input type="text" name="hp_ref_code" id="hp_ref_code" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" aria-hidden="true" value={form.website}
                onChange={set('website')} className="absolute -left-[9999px] h-px w-px opacity-0" />

              <Input label={t('contact.name')} required value={form.name} onChange={set('name')} autoComplete="name" />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('contact.emailField')} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                <Input label={t('contact.phone')} type="tel" placeholder="07x xxx xxxx" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              </div>

              <div>
                <label className="label" htmlFor="contact-subject">{t('contact.subject')}</label>
                <select id="contact-subject" value={form.subject} onChange={set('subject')} className="field h-10">
                  <option value="">{t('contact.subjectPick')}</option>
                  {TOPICS.map((k) => <option key={k} value={k}>{t(`contact.topics.${k}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="contact-message">{t('contact.message')} <span className="text-rose-600">*</span></label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  placeholder={t('contact.messagePh')}
                  value={form.message}
                  onChange={set('message')}
                  className="field"
                />
              </div>

              <Button type="submit" loading={sending} className="w-full justify-center sm:w-auto">
                {t('contact.send')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
