import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Info, RefreshCw, Scissors, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { Alert, Button, Icon, Modal, Skeleton } from '../../../components/ui';
import { useCleanDemoDataMutation, useDemoDataSummaryQuery } from '../../../app/api';
import { useToast } from '../../../hooks';
import { errorMessage, number } from '../../../lib/format';

export default function DemoDataManagerModal({ open, onClose }) {
  const toast = useToast();
  const { data: summary, isLoading, isFetching, refetch } = useDemoDataSummaryQuery(undefined, { skip: !open });
  const [cleanDemoData, { isLoading: isCleaning }] = useCleanDemoDataMutation();
  const [confirmMode, setConfirmMode] = useState(null); // 'trim' | 'purge' | null

  const handleAction = async (mode) => {
    try {
      const res = await cleanDemoData({ mode }).unwrap();
      toast(res.message || 'Sample data updated successfully');
      setConfirmMode(null);
      refetch();
      if (onClose) onClose();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isCleaning) {
          setConfirmMode(null);
          onClose();
        }
      }}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Icon icon={Database} size={18} className="text-navy-700" />
          <span>Demo & Sample Data Manager</span>
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            icon={RefreshCw}
            onClick={() => refetch()}
            loading={isFetching}
            disabled={isCleaning}
          >
            Refresh counts
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setConfirmMode(null);
              onClose();
            }}
            disabled={isCleaning}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Safety Banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
          <Icon icon={ShieldCheck} size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <span className="font-semibold">Safety Guarantee: </span>
            Staff accounts (<code className="rounded bg-emerald-100 px-1 py-0.5 font-mono">is_staff</code>) and registered real member accounts are strictly protected and will never be modified or deleted.
          </div>
        </div>

        {/* Current Counts */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Database Records</h4>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                <p className="text-2xs font-medium text-slate-500">Sample Members</p>
                <p className="text-lg font-bold tabular-nums text-amber-700">{number(summary?.demo_members ?? 0)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                <p className="text-2xs font-medium text-slate-500">Real Members</p>
                <p className="text-lg font-bold tabular-nums text-emerald-700">{number(summary?.real_members ?? 0)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                <p className="text-2xs font-medium text-slate-500">Partner Outlets</p>
                <p className="text-lg font-bold tabular-nums text-navy-900">{number(summary?.partners ?? 0)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                <p className="text-2xs font-medium text-slate-500">Partner Offers</p>
                <p className="text-lg font-bold tabular-nums text-navy-900">{number(summary?.offers ?? 0)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation or Action Selection */}
        {confirmMode ? (
          <div className="rounded-lg border-2 border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-start gap-3">
              <Icon icon={AlertTriangle} size={20} className="mt-0.5 shrink-0 text-rose-600" />
              <div className="space-y-2">
                <h4 className="font-semibold text-rose-950">
                  {confirmMode === 'trim' ? 'Confirm Trim to 2 Samples' : 'Confirm Purge All Sample Data'}
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {confirmMode === 'trim'
                    ? 'This will keep 2 demo members and 2 partner businesses (with their offers) for demonstration, and remove all remaining seeded demo records. Real users and staff are safe.'
                    : 'This will permanently remove ALL demo members, seeded demo partners, and demo offers. Real registered users and staff accounts will remain.'}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={confirmMode === 'trim' ? 'primary' : 'danger'}
                    loading={isCleaning}
                    onClick={() => handleAction(confirmMode)}
                  >
                    {confirmMode === 'trim' ? 'Yes, trim to 2 samples' : 'Yes, purge all demo data'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isCleaning}
                    onClick={() => setConfirmMode(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Action 1: Trim */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-navy-900">Trim to 2 Samples per Feature</span>
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-2xs font-semibold text-sky-800">Recommended</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Keeps exactly 2 demo members and 2 demo partner businesses for reference and testing. Removes all other seeded demo records cleanly.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={Scissors}
                onClick={() => setConfirmMode('trim')}
                disabled={isCleaning || (summary?.demo_members <= 2 && summary?.partners <= 2)}
                className="shrink-0"
              >
                Trim to 2
              </Button>
            </div>

            {/* Action 2: Purge All */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="space-y-1">
                <span className="font-semibold text-sm text-navy-900">Purge All Demo Data</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Removes all demo card holders and sample partners completely. Use this when ready for clean live production launch.
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => setConfirmMode('purge')}
                disabled={isCleaning || (summary?.demo_members === 0 && summary?.partners === 0)}
                className="shrink-0"
              >
                Purge All
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-2xs text-slate-500 pt-1">
          <Icon icon={Info} size={13} className="shrink-0 text-slate-400" />
          <span>
            You can also filter the Members table by selecting <strong>Data type: Real members only</strong> to hide demo cards without deleting anything.
          </span>
        </div>
      </div>
    </Modal>
  );
}
