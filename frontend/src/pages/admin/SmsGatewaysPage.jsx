import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Radio, Send, Settings2, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import {
  Alert, Button, Can, Card, ConfirmDialog, EmptyState, Icon, Input, LoadError, Modal, PageHeader, Select, Skeleton,
  SlideOverDrawer, StatusBadge, Textarea, Toggle,
} from '../../components/ui';
import { CredentialFields, SettingFields } from './gateway/DriverFields';
import { DriverSetupGuideCard, GatewayHelpModal } from './gateway/DriverSetupGuide';
import { useDeleteSmsGatewayMutation, useSaveSmsGatewayMutation, useSetSmsServiceMutation, useSmsGatewaysQuery, useTestSmsMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { dateTime, errorMessage, fieldErrors, relative } from '../../lib/format';

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
        description="Providers used for receipts, activation notices, expiry reminders and OTPs. The primary gateway is tried first, then the fallback."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={BookOpen} onClick={() => setShowGuide(true)}>Setup Guide</Button>
            <Can perform="gateways.sms.manage"><Button icon={Plus} onClick={() => setAdding(true)}>Add gateway</Button></Can>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card bodyClass="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><Icon icon={Radio} size={17} /></span>
              <div>
                <p className="text-sm font-semibold">SMS service {enabled ? 'enabled' : 'paused'}</p>
                <p className="text-xs text-slate-500">When paused, no automated SMS are sent (test messages still work).</p>
              </div>
            </div>
            {canManage ? <Toggle checked={!!enabled} disabled={togglingService} onChange={toggleService} /> : <StatusBadge status={enabled ? 'enabled' : 'disabled'} />}
          </div>
        </Card>
        <Card bodyClass="p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Icon icon={ShieldCheck} size={15} /> Delivery chain</div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="rounded bg-navy-900 px-2 py-0.5 text-white">{gateways.find((g) => g.is_primary)?.name ?? 'No primary'}</span>
              <span className="text-slate-400">→</span>
              <span className="rounded border border-slate-300 px-2 py-0.5 text-slate-700">{gateways.find((g) => g.is_fallback)?.name ?? 'No fallback'}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          {gateways.map((g) => (
            <div key={g.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700"><Icon icon={Smartphone} size={17} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{g.name}</p>
                    {g.is_primary && <StatusBadge tone="dark" dot={false}>Primary</StatusBadge>}
                    {g.is_fallback && <StatusBadge tone="sky" dot={false}>Fallback</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{g.driver_label} · Sender ID <span className="font-mono">{g.sender_id || '—'}</span> · updated {relative(g.updated_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={g.is_active} disabled={!canManage} onChange={(v) => quick(g, { is_active: v }, v ? `${g.name} enabled` : `${g.name} disabled`)} />
                <Button variant="secondary" size="sm" icon={Settings2} onClick={() => setEditing(g)}>{canManage ? 'Configure' : 'View'}</Button>
              </div>
            </div>
          ))}
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
    setForm({ id: gateway.id, name: gateway.name, is_active: gateway.is_active, is_primary: gateway.is_primary, is_fallback: gateway.is_fallback, sender_id: gateway.sender_id || '', settings: { ...(gateway.settings || {}) }, credentials: {} });
  }, [gateway, reset]);

  if (!form || !gateway) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    try {
      const credentials = Object.fromEntries(Object.entries(form.credentials).filter(([, v]) => v !== ''));
      await save({ ...form, credentials }).unwrap();
      toast('SMS gateway saved');
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
