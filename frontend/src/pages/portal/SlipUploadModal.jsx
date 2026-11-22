import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { Alert, Button, Icon, Modal } from '../../components/ui';
import { useUploadSlipMutation } from '../../app/api';
import { useT, useToast } from '../../hooks';
import { errorMessage, money } from '../../lib/format';

export function SlipDropzone({ file, onFile }) {
  const { t } = useT();
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-slate-400">
      <Icon icon={FileUp} size={20} className="text-slate-500" />
      <span className="text-sm font-medium text-navy-800">{file ? file.name : t('checkout.slip')}</span>
      {file && <span className="text-xs tabular-nums text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>}
      <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
    </label>
  );
}

export default function SlipUploadModal({ invoice, onClose, onDone }) {
  const { t } = useT();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [upload, { isLoading, error, reset }] = useUploadSlipMutation();

  const close = () => { setFile(null); reset(); onClose(); };
  const submit = async () => {
    try {
      await upload({ id: invoice.id, file }).unwrap();
      toast(t('checkout.slipReceived'));
      onDone?.();
      close();
    } catch { /* shown */ }
  };

  return (
    <Modal
      open={!!invoice}
      onClose={close}
      title={t('portal.uploadSlip')}
      description={invoice ? `${invoice.number} · ${money(invoice.amount, invoice.currency)}` : ''}
      footer={<><Button variant="secondary" size="sm" onClick={close}>{t('common.cancel')}</Button><Button size="sm" disabled={!file} loading={isLoading} onClick={submit}>{t('checkout.submitSlip')}</Button></>}
    >
      {error && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}
      <SlipDropzone file={file} onFile={setFile} />
    </Modal>
  );
}
