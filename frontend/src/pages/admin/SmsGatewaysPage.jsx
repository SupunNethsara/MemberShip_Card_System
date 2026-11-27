import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BookOpen, CalendarClock, CheckCircle2, Clock, Gauge, Plus, Radio, RefreshCw, Send, Settings2, ShieldCheck, Smartphone, Trash2,
} from 'lucide-react';
import {
  Alert, Button, Can, Card, ConfirmDialog, EmptyState, Icon, Input, LoadError, Modal, PageHeader, Select, Skeleton,
  SlideOverDrawer, StatCard, StatusBadge, Textarea, Toggle,
} from '../../components/ui';
import { CredentialFields, SettingFields } from './gateway/DriverFields';
import { DriverSetupGuideCard, GatewayHelpModal } from './gateway/DriverSetupGuide';
import { useDeleteSmsGatewayMutation, useSaveSmsGatewayMutation, useSetSmsServiceMutation, useSmsGatewaysQuery, useTestSmsMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { date, dateTime, errorMessage, fieldErrors, number, relative } from '../../lib/format';

export default function SmsGatewaysPage() {
  useDocumentTitle('SMS Gateways');
  const can = usePermission();
  const canManage = can('gateways.sms.manage');
  const toast = useToast();
  const { data, isLoading, refetch } = useSmsGatewaysQuery();
  const [save] = useSaveSmsGatewayMutation();
  const [setService, { isLoading: togglingService }] = useSetSmsServiceMutation();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const gateways = data?.data || [];
  const drivers = data?.drivers || [];
  const enabled = data?.enabled;
  const summary = data?.summary || {};

  const primaryGw = useMemo(() => gateways.find((g) => g.is_primary) || gateways[0], [gateways]);
  const fallbackGw = useMemo(() => gateways.find((g) => g.is_fallback), [gateways]);

  const quick = async (g, patch, msg) => {
    try {
      await save({ id: g.id, name: g.name, is_active: g.is_active, is_primary: g.is_primary, is_fallback: g.is_fallback, sender_id: g.sender_id, settings: g.settings, ...patch }).unwrap();
      toast(msg);
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const toggleService = async (v) => {
    try {
      await setService(v).unwrap();
      toast(v ? 'SMS service enabled' : 'SMS service paused');
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="SMS Gateways"
        description="Providers used for receipts, activation notices, expiry reminders and OTPs. Monitor SMS capacity, validity months and delivery chain."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={BookOpen} onClick={() => setShowGuide(true)}>Setup Guide</Button>
            <Can perform="gateways.sms.manage"><Button icon={Plus} onClick={() => setAdding(true)}>Add gateway</Button></Can>
          </div>
        }
      />

      {/* Top Summary / KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total SMS Remaining"
          value={summary?.has_quota ? `${number(summary.total_remaining)}` : 'Unlimited'}
          hint={summary?.has_quota ? `of ${number(summary.total_capacity)} capacity` : 'Pay-as-you-go'}
          icon={Gauge}
          accent={summary?.has_quota && summary.total_remaining < 500 ? 'amber' : 'emerald'}
          loading={isLoading}
        />
        <StatCard
          label="SMS Sent (This Month)"
          value={number(summary?.sent_this_month ?? 0)}
          hint={summary?.failed_this_month > 0 ? `${number(summary.failed_this_month)} failed attempts` : 'All deliveries successful'}
          icon={Send}
          accent={summary?.failed_this_month > 0 ? 'rose' : 'slate'}
          loading={isLoading}
        />
        <StatCard
          label="Primary Gateway"
          value={primaryGw?.name ?? 'Not set'}
          hint={primaryGw?.usage?.has_quota ? `${number(primaryGw.usage.remaining_capacity)} SMS remaining` : primaryGw ? 'Active & Ready' : 'No primary configured'}
          icon={Radio}
          accent={primaryGw?.is_active ? 'slate' : 'amber'}
          loading={isLoading}
        />
        <StatCard
          label="SMS Service Status"
          value={enabled ? 'Active' : 'Paused'}
          hint={enabled ? `${summary?.active_count ?? gateways.filter((g) => g.is_active).length} provider(s) active` : 'Automated SMS paused'}
          icon={enabled ? CheckCircle2 : AlertTriangle}
          accent={enabled ? 'emerald' : 'amber'}
          loading={isLoading}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card bodyClass="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><Icon icon={Radio} size={17} /></span>
              <div>
                <p className="text-sm font-semibold">Automated SMS service {enabled ? 'enabled' : 'paused'}</p>
                <p className="text-xs text-slate-500">When paused, no automated SMS are sent to customers (test messages still work).</p>
              </div>
            </div>
            {canManage ? <Toggle checked={!!enabled} disabled={togglingService} onChange={toggleService} /> : <StatusBadge status={enabled ? 'enabled' : 'disabled'} />}
          </div>
        </Card>
        <Card bodyClass="p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Icon icon={ShieldCheck} size={15} /> Delivery chain</div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="rounded bg-navy-900 px-2 py-0.5 text-white">{primaryGw?.name ?? 'No primary'}</span>
              <span className="text-slate-400">→</span>
              <span className="rounded border border-slate-300 px-2 py-0.5 text-slate-700">{fallbackGw?.name ?? 'No fallback'}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}

          {gateways.map((g) => {
            const u = g.usage || {};
            return (
              <div key={g.id} className="surface flex flex-col gap-4 p-5 transition-shadow hover:shadow-md">
                {/* Header Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                      <Icon icon={Smartphone} size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-navy-950">{g.name}</p>
                        {g.is_primary && <StatusBadge tone="dark" dot={false}>Primary</StatusBadge>}
                        {g.is_fallback && <StatusBadge tone="sky" dot={false}>Fallback</StatusBadge>}
                        <StatusBadge status={g.is_active ? 'active' : 'inactive'}>
                          {g.is_active ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {g.driver_label} · Sender ID: <span className="font-mono font-medium text-slate-700">{g.sender_id || '—'}</span> · updated {relative(g.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <Toggle checked={g.is_active} disabled={!canManage} onChange={(v) => quick(g, { is_active: v }, v ? `${g.name} enabled` : `${g.name} disabled`)} />
                    <Button variant="secondary" size="sm" icon={Settings2} onClick={() => setEditing(g)}>{canManage ? 'Configure' : 'View'}</Button>
                  </div>
                </div>

                {/* Capacity & Usage Bar */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon icon={Gauge} size={15} className="text-navy-700" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">SMS Capacity:</span>
                      {u.has_quota ? (
                        <span className="text-sm font-bold text-navy-950">
                          {number(u.remaining_capacity)} <span className="text-xs font-normal text-slate-500">/ {number(u.quota_capacity)} SMS remaining</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-600">Pay-as-you-go / Unlimited</span>
                      )}
                    </div>
                    {u.has_quota && (
                      <span className="text-xs font-medium tabular-nums text-slate-600">
                        {u.usage_percentage}% consumed ({number(u.total_sent)} sent)
                      </span>
                    )}
                  </div>

                  {u.has_quota && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all ${
                          u.is_expired || u.is_low_balance
                            ? 'bg-rose-500'
                            : u.usage_percentage > 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, u.usage_percentage ?? 0)}%` }}
                      />
                    </div>
                  )}

                  {/* Metrics Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Sent today: <strong className="text-navy-900">{number(u.sent_today ?? 0)}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>This month: <strong className="text-navy-900">{number(u.sent_this_month ?? 0)}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>Total segments: <strong className="text-navy-900">{number(u.total_segments ?? 0)}</strong></span>
                    </div>

                    {/* Validity Badge */}
                    <div>
                      {u.valid_until ? (
                        <div className="flex items-center gap-1.5">
                          <Icon icon={CalendarClock} size={13} className="text-slate-400" />
                          <span className="text-2xs text-slate-500">
                            Valid until {date(u.valid_until)} {u.validity_months ? `(${u.validity_months}m)` : ''}:
                          </span>
                          {u.is_expired ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-2xs font-semibold text-rose-700">
                              <Icon icon={AlertTriangle} size={11} /> Expired
                            </span>
                          ) : u.is_expiring_soon ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-700">
                              <Icon icon={Clock} size={11} /> {u.days_remaining}d left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-medium text-emerald-700">
                              <Icon icon={CheckCircle2} size={11} /> {u.days_remaining}d left
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-2xs text-slate-400">No expiration date set</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warnings / Alerts */}
                {u.is_expired && (
                  <Alert tone="danger" title="SMS Package Expired">
                    This provider's package expired on {date(u.valid_until)}. Please renew or extend package validity.
                  </Alert>
                )}
                {!u.is_expired && u.is_low_balance && (
                  <Alert tone="warning" title="Low SMS Balance Warning">
                    Only {number(u.remaining_capacity)} SMS remaining (alert threshold: {number(u.alert_threshold)}). Please top up package credits.
                  </Alert>
                )}
                {!u.is_expired && !u.is_low_balance && u.is_expiring_soon && (
                  <Alert tone="warning" title="Package Expiring Soon">
                    SMS package will expire in {u.days_remaining} day{u.days_remaining > 1 ? 's' : ''} on {date(u.valid_until)}.
                  </Alert>
                )}
              </div>
            );
          })}

          {!isLoading && !data && <LoadError onRetry={refetch} />}
          {!isLoading && data && !gateways.length && <div className="surface"><EmptyState icon={Smartphone} title="No SMS gateways" /></div>}
          <p className="pt-2 text-xs text-slate-500">
            Message content is managed in <Link to="/admin/sms-templates" className="font-medium text-navy-800 underline underline-offset-2">SMS Templates</Link>; every attempt is recorded in <Link to="/admin/sms-logs" className="font-medium text-navy-800 underline underline-offset-2">Delivery Logs</Link>.
          </p>
        </div>
        <Can perform="gateways.sms.manage"><TestSmsWidget gateways={gateways} /></Can>
      </div>

      <SmsGatewayDrawer gateway={editing} drivers={drivers} readOnly={!canManage} onClose={() => setEditing(null)} />
      <AddSmsGatewayModal open={adding} drivers={drivers} onClose={() => setAdding(false)} onCreated={(g) => { setAdding(false); setEditing(g); }} />
      <GatewayHelpModal open={showGuide} onClose={() => setShowGuide(false)} defaultType="sms" />
    </div>
  );
}

/** "Send Test SMS" widget with live provider response log. */
function TestSmsWidget({ gateways }) {
  const [gatewayId, setGatewayId] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [test, { isLoading }] = useTestSmsMutation();

  useEffect(() => {
    if (!gatewayId && gateways.length) setGatewayId(String((gateways.find((g) => g.is_primary) || gateways[0]).id));
  }, [gateways, gatewayId]);

  const send = async () => {
    const gw = gateways.find((g) => String(g.id) === String(gatewayId));
    try {
      const res = await test({ id: gatewayId, phone, message: message || undefined }).unwrap();
      setHistory((h) => [{ at: new Date().toISOString(), gateway: gw?.name, ok: res.success, ms: res.duration_ms, log: res.log }, ...h].slice(0, 5));
    } catch (e) {
      setHistory((h) => [{ at: new Date().toISOString(), gateway: gw?.name, ok: false, error: errorMessage(e) }, ...h].slice(0, 5));
    }
  };

  return (
    <Card title="Send test SMS" description="Hits the selected gateway directly and shows the raw provider response." className="self-start">
      <div className="space-y-3">
        <Select label="Gateway" value={gatewayId} onChange={(e) => setGatewayId(e.target.value)} options={gateways.map((g) => ({ value: g.id, label: `${g.name}${g.is_active ? '' : ' (inactive)'}` }))} />
        <Input label="Mobile number" placeholder="07X XXX XXXX" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Textarea label="Message" rows={2} placeholder="Leave blank for a default test message" value={message} onChange={(e) => setMessage(e.target.value)} hint={message ? `${message.length} chars · ${/[^\x00-\x7F]/.test(message) ? 'Unicode (70/segment)' : 'GSM (160/segment)'}` : undefined} />
        <Button className="w-full justify-center" icon={Send} loading={isLoading} disabled={!phone || !gatewayId} onClick={send}>Send test</Button>
      </div>
      {history.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
          <p className="eyebrow">Response log</p>
          {history.map((h, i) => (
            <div key={i} className={`rounded-md border p-2.5 text-xs ${h.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{h.gateway} · {h.ok ? 'Delivered to provider' : 'Failed'}</span>
                <span className="tabular-nums text-slate-500">{h.ms ? `${h.ms} ms` : ''}</span>
              </div>
              <p className="mt-0.5 text-2xs text-slate-500">{dateTime(h.at)}{h.log ? ` · HTTP ${h.log.http_status ?? '—'} · to ${h.log.recipient}` : ''}</p>
              <pre className="mt-1.5 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-white/70 p-1.5 font-mono text-2xs text-slate-700">{h.error || h.log?.provider_response || '—'}</pre>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AddSmsGatewayModal({ open, onClose, drivers, onCreated }) {
  const toast = useToast();
  const [save, { isLoading }] = useSaveSmsGatewayMutation();
  const create = async (d) => {
    const settings = d.driver === 'custom_http'
      ? { endpoint: 'https://', method: 'POST', body_format: 'json', headers: [], payload: [{ key: 'to', value: '{to}' }, { key: 'message', value: '{message}' }] }
      : {};
    try {
      const res = await save({ driver: d.driver, name: d.label, is_active: false, is_primary: false, is_fallback: false, settings }).unwrap();
      toast(`${d.label} added — configure its credentials`);
      onCreated(res.data);
    } catch (e) { toast(errorMessage(e), 'error'); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add SMS gateway" description="Choose a provider driver.">
      <div className="grid gap-2 sm:grid-cols-2">
        {drivers.map((d) => (
          <button key={d.driver} disabled={isLoading} onClick={() => create(d)} className="rounded-lg border border-slate-200 p-3 text-left hover:border-slate-400 disabled:opacity-50">
            <span className="block text-sm font-semibold">{d.label}</span>
            <span className="text-xs text-slate-500">{d.description}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function SmsGatewayDrawer({ gateway, drivers, readOnly, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [save, { isLoading, error, reset }] = useSaveSmsGatewayMutation();
  const [remove, { isLoading: removing }] = useDeleteSmsGatewayMutation();
  const errs = fieldErrors(error);
  const def = useMemo(() => drivers.find((d) => d.driver === gateway?.driver), [drivers, gateway]);

  useEffect(() => {
    if (!gateway) return;
    reset();
    const s = gateway.settings || {};
    setForm({
      id: gateway.id,
      name: gateway.name,
      is_active: gateway.is_active,
      is_primary: gateway.is_primary,
      is_fallback: gateway.is_fallback,
      sender_id: gateway.sender_id || '',
      settings: {
        ...s,
        quota_capacity: s.quota_capacity != null ? String(s.quota_capacity) : '',
        validity_months: s.validity_months != null ? String(s.validity_months) : '',
        valid_from: s.valid_from || '',
        valid_until: s.valid_until || '',
        alert_threshold: s.alert_threshold != null ? String(s.alert_threshold) : '100',
        cost_per_sms: s.cost_per_sms != null ? String(s.cost_per_sms) : '',
      },
      credentials: {},
    });
  }, [gateway, reset]);

  if (!form || !gateway) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    try {
      const credentials = Object.fromEntries(Object.entries(form.credentials).filter(([, v]) => v !== ''));
      // Clean settings: convert empty strings to null or numbers
      const cleanSettings = {
        ...form.settings,
        quota_capacity: form.settings.quota_capacity ? parseInt(form.settings.quota_capacity, 10) : null,
        validity_months: form.settings.validity_months ? parseInt(form.settings.validity_months, 10) : null,
        valid_from: form.settings.valid_from || null,
        valid_until: form.settings.valid_until || null,
        alert_threshold: form.settings.alert_threshold ? parseInt(form.settings.alert_threshold, 10) : 100,
        cost_per_sms: form.settings.cost_per_sms ? parseFloat(form.settings.cost_per_sms) : null,
      };

      await save({ ...form, settings: cleanSettings, credentials }).unwrap();
      toast('SMS gateway saved successfully');
      onClose();
    } catch { /* shown */ }
  };

  const doDelete = async () => {
    try { await remove(gateway.id).unwrap(); toast('Gateway deleted'); setConfirm(false); onClose(); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <SlideOverDrawer
      open={!!gateway}
      onClose={onClose}
      title={gateway.name}
      description={def?.description}
      size="xl"
      footer={!readOnly && (
        <div className="flex w-full justify-between">
          <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button>
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>Save gateway</Button></div>
        </div>
      )}
    >
      <fieldset disabled={readOnly} className="space-y-6">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}

        <DriverSetupGuideCard driver={gateway.driver} type="sms" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errs.name} />
          <Input label="Sender ID / Mask" placeholder="e.g. PRIVILEGE" value={form.sender_id} onChange={(e) => set({ sender_id: e.target.value })} error={errs.sender_id} hint="Must be approved by the provider." />
        </div>

        <Card title="Routing" bodyClass="p-4 space-y-4">
          <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" />
          <Toggle checked={form.is_primary} onChange={(v) => set({ is_primary: v, is_fallback: v ? false : form.is_fallback })} label="Primary gateway" description="Used first for every automated SMS." tone="slate" />
          <Toggle checked={form.is_fallback} onChange={(v) => set({ is_fallback: v, is_primary: v ? false : form.is_primary })} label="Fallback gateway" description="Retried automatically if the primary fails." tone="slate" />
        </Card>

        {/* Package Capacity & Validity */}
        <Card title="Package Capacity & Validity (ධාරිතාවය සහ වලංගු කාලය)" description="Configure total SMS package credits, validity duration in months, and low balance threshold alerts." bodyClass="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Total Package Capacity (SMS Credits)</label>
              <span className="text-2xs text-slate-400">Leave blank for unlimited / postpaid</span>
            </div>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={form.settings.quota_capacity ?? ''}
              onChange={(e) => set({ settings: { ...form.settings, quota_capacity: e.target.value } })}
              error={errs['settings.quota_capacity']}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-2xs font-medium text-slate-400 mr-1">Quick presets:</span>
              {[1000, 2500, 5000, 10000, 25000, 50000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => set({ settings: { ...form.settings, quota_capacity: String(num) } })}
                  className="px-2 py-0.5 text-2xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  +{number(num)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set({ settings: { ...form.settings, quota_capacity: '' } })}
                className="px-2 py-0.5 text-2xs font-medium rounded border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              >
                Clear (Unlimited)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Package Validity Duration (මාස ගණන)</label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {[
                { months: 1, label: '1 Month' },
                { months: 3, label: '3 Months' },
                { months: 6, label: '6 Months' },
                { months: 12, label: '1 Year (12 Mos)' },
              ].map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => {
                    const from = form.settings.valid_from || new Date().toISOString().split('T')[0];
                    const targetDate = new Date(from);
                    targetDate.setMonth(targetDate.getMonth() + opt.months);
                    const until = targetDate.toISOString().split('T')[0];
                    set({
                      settings: {
                        ...form.settings,
                        validity_months: String(opt.months),
                        valid_from: from,
                        valid_until: until,
                      },
                    });
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md border transition-all ${
                    String(form.settings.validity_months) === String(opt.months)
                      ? 'bg-navy-900 border-navy-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="date"
                label="Package Start Date (Valid from)"
                value={form.settings.valid_from ?? ''}
                onChange={(e) => {
                  const from = e.target.value;
                  const months = Number(form.settings.validity_months);
                  let until = form.settings.valid_until;
                  if (from && months > 0) {
                    const targetDate = new Date(from);
                    targetDate.setMonth(targetDate.getMonth() + months);
                    until = targetDate.toISOString().split('T')[0];
                  }
                  set({ settings: { ...form.settings, valid_from: from, valid_until: until } });
                }}
                error={errs['settings.valid_from']}
              />
              <Input
                type="date"
                label="Package Expiry Date (Valid until)"
                value={form.settings.valid_until ?? ''}
                onChange={(e) => set({ settings: { ...form.settings, valid_until: e.target.value } })}
                error={errs['settings.valid_until']}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-slate-100">
            <Input
              type="number"
              label="Low Balance Alert Threshold (SMS)"
              placeholder="100"
              value={form.settings.alert_threshold ?? ''}
              onChange={(e) => set({ settings: { ...form.settings, alert_threshold: e.target.value } })}
              hint="Triggers warning badge when remaining credits drop below this."
              error={errs['settings.alert_threshold']}
            />
            <Input
              type="number"
              step="0.01"
              label="Cost per SMS (LKR) — Optional"
              placeholder="e.g. 0.35"
              value={form.settings.cost_per_sms ?? ''}
              onChange={(e) => set({ settings: { ...form.settings, cost_per_sms: e.target.value } })}
              hint="Unit cost for reporting / cost tracking."
              error={errs['settings.cost_per_sms']}
            />
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Recharging or topping up package?</span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const months = Number(form.settings.validity_months) || 1;
                const targetDate = new Date(today);
                targetDate.setMonth(targetDate.getMonth() + months);
                set({
                  settings: {
                    ...form.settings,
                    valid_from: today,
                    valid_until: targetDate.toISOString().split('T')[0],
                  },
                });
                toast('Reset package start date to today and updated expiry date.');
              }}
            >
              Reset start date to today
            </Button>
          </div>
        </Card>

        {def?.credentials?.length > 0 && (
          <Card title="Credentials" description="Encrypted at rest. Leave blank to keep the stored value." bodyClass="p-4">
            <CredentialFields fields={def.credentials} values={form.credentials} masked={gateway.credentials} configured={gateway.configured_keys} onChange={(v) => set({ credentials: v })} errors={errs} />
          </Card>
        )}
        {def?.settings?.length > 0 && (
          <Card title={gateway.driver === 'custom_http' ? 'HTTP request mapping' : 'Advanced settings'} description={gateway.driver === 'custom_http' ? 'Placeholders: {to} {to_local} {message} {sender} {api_key} {username} {password}' : undefined} bodyClass="p-4">
            <SettingFields fields={def.settings} values={form.settings} onChange={(v) => set({ settings: v })} errors={errs} />
          </Card>
        )}
      </fieldset>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removing} title="Delete SMS gateway?" description="Logs are kept; the gateway will no longer be used." confirmLabel="Delete gateway" />
    </SlideOverDrawer>
  );
}
