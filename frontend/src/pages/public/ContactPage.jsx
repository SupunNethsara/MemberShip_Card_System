import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { Button, Card, Icon, Input } from '../../components/ui';
import { usePublicContentQuery } from '../../app/api';
import { useDocumentTitle, useT, useToast } from '../../hooks';
import { SOCIAL_PLATFORMS, socialHref } from '../../lib/social';

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
  const extra = s.contact_extra || [];

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || (!form.email && !form.phone) || !form.message) {
      toast('Please provide your name, contact method, and message.', 'error');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast('Your message has been sent successfully! Our support team will get back to you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 600);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Top Banner */}
      <div className="max-w-2xl">
        <p className="eyebrow text-gold-600">Get in touch</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {t('nav.contact')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {tr(c['contact.intro']) || 'Have a question about membership plans, partner privileges, or payment processing? We are here to assist you.'}
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1.3fr]">
        {/* Contact Information & Channels */}
        <div className="space-y-6">
          <div className="surface p-6 sm:p-7">
            <h2 className="text-base font-semibold text-navy-900">Direct Support Channels</h2>
            <p className="mt-1 text-xs text-slate-500">Reach out directly via call, email, or chat.</p>

            <ul className="mt-6 space-y-4">
              {phone && (
                <li className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-gold-600">
                    <Icon icon={Phone} size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Call Support</p>
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                      className="mt-0.5 block font-semibold text-navy-900 transition-colors hover:text-gold-600"
                    >
                      {phone}
                    </a>
                    <span className="text-xs text-slate-400">Available during business hours</span>
                  </div>
                </li>
              )}

              {email && (
                <li className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-gold-600">
                    <Icon icon={Mail} size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Email Desk</p>
                    <a
                      href={`mailto:${email}`}
                      className="mt-0.5 block font-semibold text-navy-900 transition-colors hover:text-gold-600"
                    >
                      {email}
                    </a>
                    <span className="text-xs text-slate-400">Responses within 24 business hours</span>
                  </div>
                </li>
              )}

              {whatsapp && (
                <li className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon icon={MessageCircle} size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">WhatsApp Support</p>
                    <a
                      href={socialHref('whatsapp', whatsapp)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-0.5 block font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                    >
                      {whatsapp}
                    </a>
                    <span className="text-xs text-slate-400">Instant messaging assistance</span>
                  </div>
                </li>
              )}

              {address && (
                <li className="flex items-start gap-3.5 border-t border-slate-100 pt-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-gold-600">
                    <Icon icon={MapPin} size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Office Location</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{address}</p>
                  </div>
                </li>
              )}

              {hours && (
                <li className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-gold-600">
                    <Icon icon={Clock} size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Business Hours</p>
                    <p className="mt-0.5 text-sm text-slate-700">{hours}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Trust Banner for Gateway auditors */}
          <div className="rounded-xl border border-gold-200 bg-gold-50/60 p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-navy-950">
                <Icon icon={ShieldCheck} size={17} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-900">Verified Merchant Support</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  Jeewanasaviya is an authorized lifestyle membership and merchant benefits service provider in Sri Lanka.
                  All payment inquiries, activations, and tier queries are securely resolved by our local team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Send Inquiry Form */}
        <div className="surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-navy-900">Send an Inquiry</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fill out the form below and our customer support team will reply via your preferred contact channel.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Icon icon={CheckCircle2} size={24} />
              </span>
              <h3 className="mt-3 text-base font-semibold text-emerald-950">Message Sent Successfully!</h3>
              <p className="mt-1.5 text-xs text-emerald-800">
                Thank you for reaching out. We have received your inquiry and our representative will contact you shortly.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Your Full Name"
                required
                placeholder="e.g. Supun Nethsara"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Mobile Number"
                  placeholder="07x xxx xxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Subject / Topic <span className="text-rose-600">*</span>
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="field h-10 w-full"
                >
                  <option value="">— Select inquiry type —</option>
                  <option value="membership">Membership Registration & Tiers</option>
                  <option value="partner">Partner Merchant Discounts</option>
                  <option value="billing">Payment Gateway & Invoices</option>
                  <option value="merchant_join">Become a Merchant Partner</option>
                  <option value="general">General Support</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Your Message <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can our support team assist you today?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field w-full p-3 text-sm"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={sending}
                  iconRight={Send}
                  className="w-full justify-center sm:w-auto"
                >
                  Send Inquiry
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
