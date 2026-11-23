import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Building2, CreditCard, Globe, Landmark, Plus, Settings2, Star, Trash2 } from 'lucide-react';
import {
  Alert, Button, Can, Card, ConfirmDialog, CopyField, EmptyState, Icon, Input, LoadError, Modal, MultilingualInput, PageHeader,
  Segmented, Skeleton, SlideOverDrawer, StatusBadge, Toggle,
} from '../../components/ui';
import { CredentialFields, SettingFields } from './gateway/DriverFields';
import { DriverSetupGuideCard, GatewayHelpModal } from './gateway/DriverSetupGuide';
import { useDeletePaymentGatewayMutation, usePaymentGatewaysQuery, useSavePaymentGatewayMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useToast } from '../../hooks';
import { emptyTr, errorMessage, fieldErrors, relative } from '../../lib/format';

const DRIVER_ICON = { onepay: CreditCard, payhere: CreditCard, stripe: Globe, webxpay: Building2, manual: Landmark };

export default function PaymentGatewaysPage() {
  useDocumentTitle('Payment Gateways');
  const can = usePermission();
  const canManage = can('gateways.payment.manage');
  const toast = useToast();
  const { data, isLoading, refetch } = usePaymentGatewaysQuery();
  const [save] = useSavePaymentGatewayMutation();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const gateways = data?.data || [];
  const drivers = data?.drivers || [];

  const quick = async (g, patch, msg) => {
    try {
      await save({ id: g.id, name: g.name, mode: g.mode, is_active: g.is_active, is_default: g.is_default, sort_order: g.sort_order, display_name: g.display_name, ...patch }).unwrap();
      toast(msg);
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const move = async (index, dir) => {
    const a = gateways[index];
    const b = gateways[index + dir];
    if (!a || !b) return;
    await quick(a, { sort_order: b.sort_order === a.sort_order ? a.sort_order + dir : b.sort_order }, 'Display order updated');
    await quick(b, { sort_order: a.sort_order }, 'Display order updated');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Payment Gateways"
        description="Configure the payment methods offered at checkout. Credentials are encrypted at rest and never shown in full."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={BookOpen} onClick={() => setShowGuide(true)}>Setup Guide</Button>
            <Can perform="gateways.payment.manage"><Button icon={Plus} onClick={() => setAdding(true)}>Add gateway</Button></Can>
          </div>
        }
      />
      {!canManage && <Alert tone="info" className="mb-4">You have read-only access. Ask a Finance & Gateways Admin to change gateway settings.</Alert>}

      <div className="space-y-3">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        {gateways.map((g, i) => (
          <div key={g.id} className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              {canManage && (
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-slate-400 hover:text-navy-900 disabled:opacity-30" aria-label="Move up"><Icon icon={ArrowUp} size={13} /></button>
                  <button disabled={i === gateways.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-slate-400 hover:text-navy-900 disabled:opacity-30" aria-label="Move down"><Icon icon={ArrowDown} size={13} /></button>
                </div>
              )}
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <Icon icon={DRIVER_ICON[g.driver] || CreditCard} size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-900">{g.name}</p>
                  {g.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2 py-0.5 text-2xs font-semibold text-white"><Icon icon={Star} size={10} />Default</span>}
                  <StatusBadge status={g.mode} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {g.driver_label} · {g.configured_keys.length ? `${g.configured_keys.length} credential${g.configured_keys.length > 1 ? 's' : ''} stored` : g.driver === 'manual' ? 'Bank details in settings' : 'Not configured'} · {g.transactions_count} transactions · updated {relative(g.updated_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={g.is_active} disabled={!canManage} onChange={(v) => quick(g, { is_active: v }, v ? `${g.name} enabled` : `${g.name} disabled`)} />
              <span className="w-14 text-xs font-medium text-slate-600">{g.is_active ? 'Active' : 'Inactive'}</span>
              <Button variant="secondary" size="sm" icon={Settings2} onClick={() => setEditing(g)}>{canManage ? 'Configure' : 'View'}</Button>
            </div>
          </div>
        ))}
        {!isLoading && !data && <LoadError onRetry={refetch} />}
        {!isLoading && data && !gateways.length && <div className="surface"><EmptyState icon={CreditCard} title="No payment gateways" description="Add Onepay, PayHere, Stripe, WebXPay or bank transfer to start accepting payments." /></div>}
      </div>

      <GatewayDrawer gateway={editing} drivers={drivers} readOnly={!canManage} onClose={() => setEditing(null)} />
      <AddGatewayModal open={adding} drivers={drivers} onClose={() => setAdding(false)} onCreated={(g) => { setAdding(false); setEditing(g); }} />
      <GatewayHelpModal open={showGuide} onClose={() => setShowGuide(false)} defaultType="payment" />
    </div>
  );
}

function AddGatewayModal({ open, onClose, drivers, onCreated }) {
  const toast = useToast();
  const [save, { isLoading }] = useSavePaymentGatewayMutation();
  const create = async (d) => {
    try {
      const res = await save({ driver: d.driver, name: d.label, mode: 'sandbox', is_active: false, is_default: false, sort_order: 99, display_name: { en: d.label, si: d.label, ta: d.label } }).unwrap();
      toast(`${d.label} added — configure its credentials`);
      onCreated(res.data);
    } catch (e) { toast(errorMessage(e), 'error'); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add payment gateway" description="Pick a driver. You'll configure credentials next.">
      <div className="grid gap-2">
        {drivers.map((d) => (
          <button key={d.driver} disabled={isLoading} onClick={() => create(d)} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-slate-400 disabled:opacity-50">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50"><Icon icon={DRIVER_ICON[d.driver] || CreditCard} size={16} /></span>
            <span><span className="block text-sm font-semibold">{d.label}</span><span className="text-xs text-slate-500">{d.description}</span></span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function GatewayDrawer({ gateway, drivers, readOnly, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [save, { isLoading, error, reset }] = useSavePaymentGatewayMutation();
  const [remove, { isLoading: removing }] = useDeletePaymentGatewayMutation();
  const errs = fieldErrors(error);
  const def = useMemo(() => drivers.find((d) => d.driver === gateway?.driver), [drivers, gateway]);

  useEffect(() => {
    if (!gateway) return;
    reset();
    setForm({
      id: gateway.id,
      name: gateway.name,
      display_name: gateway.display_name || emptyTr(),
      mode: gateway.mode,
      is_active: gateway.is_active,
      is_default: gateway.is_default,
      sort_order: gateway.sort_order,
      settings: { ...(gateway.settings || {}) },
      credentials: {},
    });
  }, [gateway, reset]);

  if (!form || !gateway) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    try {
      const credentials = Object.fromEntries(Object.entries(form.credentials).filter(([, v]) => v !== ''));
      await save({ ...form, credentials }).unwrap();
      toast('Gateway saved', 'success', Object.keys(credentials).length ? 'Credentials encrypted and stored.' : undefined);
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
      headerExtra={<StatusBadge status={form.mode} />}
      footer={!readOnly && (
        <div className="flex w-full justify-between">
          <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button>
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isLoading} onClick={submit}>Save gateway</Button></div>
        </div>
      )}
    >
      <fieldset disabled={readOnly} className="space-y-6">
        {error && !Object.keys(errs).length && <Alert tone="danger">{errorMessage(error)}</Alert>}

        <DriverSetupGuideCard driver={gateway.driver} type="payment" />

        <Card title="Status & mode" bodyClass="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Environment</p>
              <p className="text-xs text-slate-500">Sandbox uses the provider's test endpoints. Switch to Live only with production credentials.</p>
            </div>
            <Segmented value={form.mode} onChange={(v) => set({ mode: v })} options={[{ value: 'sandbox', label: 'Sandbox' }, { value: 'live', label: 'Live' }]} />
          </div>
          {form.mode === 'live' && gateway.mode === 'sandbox' && <Alert tone="warning">Switching to Live will charge real cards on the next checkout.</Alert>}
          <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active at checkout" description="Members can choose this method when paying." />
          <Toggle checked={form.is_default} onChange={(v) => set({ is_default: v })} label="Default gateway" description="Pre-selected at checkout. Only one gateway can be default." tone="slate" />
        </Card>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Input label="Internal name" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errs.name} />
          <Input label="Display order" type="number" min="0" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
        </div>
        <MultilingualInput label="Label shown to members" name="display_name" errors={errs} value={form.display_name} onChange={(v) => set({ display_name: v })} maxLength={80} />

        {def?.credentials?.length > 0 && (
          <Card title="API credentials" description="Encrypted with AES-256 (Laravel Crypt). Leave a field blank to keep the stored value." bodyClass="p-4">
            <CredentialFields fields={def.credentials} values={form.credentials} masked={gateway.credentials} configured={gateway.configured_keys} onChange={(v) => set({ credentials: v })} errors={errs} />
          </Card>
        )}

        {def?.settings?.length > 0 && (
          <Card title={gateway.driver === 'manual' ? 'Bank account details' : 'Settings'} bodyClass="p-4">
            <SettingFields fields={def.settings} values={form.settings} onChange={(v) => set({ settings: v })} errors={errs} />
          </Card>
        )}

        {gateway.webhook_url && (
          <Card title="Webhook / Notify URL" description="Paste this into your provider dashboard so payments are confirmed server-to-server." bodyClass="p-4 space-y-4">
            <CopyField value={gateway.webhook_url} hint={gateway.driver === 'payhere' ? 'PayHere sends this automatically as notify_url, but whitelist your domain in the merchant portal.' : gateway.driver === 'stripe' ? 'Subscribe to checkout.session.completed and checkout.session.expired.' : undefined} />
            {gateway.return_url && <CopyField label="Return URL" value={gateway.return_url} />}
          </Card>
        )}
      </fieldset>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removing} title="Delete gateway?" description="Historical invoices keep their record, but members can no longer pay with this method." confirmLabel="Delete gateway" />
    </SlideOverDrawer>
  );
}
