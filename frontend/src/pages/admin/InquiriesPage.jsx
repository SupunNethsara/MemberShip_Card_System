import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, Phone, Trash2 } from 'lucide-react';
import {
  Button, ConfirmDialog, DataTable, DescriptionList, Icon, PageHeader, Segmented, SlideOverDrawer, StatCard, StatusBadge, Textarea,
} from '../../components/ui';
import { useDeleteInquiryMutation, useInquiriesQuery, useInquiryQuery, useUpdateInquiryMutation } from '../../app/api';
import { useDocumentTitle, usePermission, useTableState, useToast } from '../../hooks';
import { dateTime, errorMessage, number } from '../../lib/format';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'spam', label: 'Spam' },
];

/** Staff inbox for the public "Send an Inquiry" contact form. */
export default function InquiriesPage() {
  useDocumentTitle('Contact Inquiries');
  const [params, update, raw] = useTableState();
  const { data, isLoading, isFetching, refetch } = useInquiriesQuery(params, { pollingInterval: 30000 });
  const [search, setSearch] = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => Number(search.get('open')) || null);
  const s = data?.summary;
  const subjects = data?.subjects || {};

  // Opening from a notification link (/admin/inquiries?open=12) jumps straight to that inquiry.
  useEffect(() => {
    const open = Number(search.get('open'));
    if (open) setSelectedId(open);
  }, [search]);

  const close = () => {
    setSelectedId(null);
    if (search.get('open')) { search.delete('open'); setSearch(search, { replace: true }); }
  };

  const columns = [
    { key: 'created_at', header: 'Received', sortable: true, render: (r) => <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">{dateTime(r.created_at)}</span> },
    {
      key: 'name', header: 'From', sortable: true, render: (r) => (
        <div className="min-w-0">
          <p className={`truncate text-navy-900 ${r.status === 'new' ? 'font-semibold' : 'font-medium'}`}>{r.name}</p>
          <p className="truncate text-2xs text-slate-500">{[r.email, r.phone].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    { key: 'subject', header: 'Topic', render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-medium text-slate-700">{r.subject_label || 'General'}</span> },
    { key: 'message', header: 'Message', render: (r) => <p className="max-w-sm truncate text-xs text-slate-600">{r.message}</p> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'handler', header: 'Handled by', render: (r) => <span className="text-xs text-slate-500">{r.handler?.name ?? '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Contact Inquiries" description="Messages sent from the public Contact page. Reply by phone or email, then mark them resolved." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="New" value={number(s?.new)} accent="amber" loading={isLoading} hint="Not yet picked up" />
        <StatCard label="In progress" value={number(s?.in_progress)} loading={isLoading} />
        <StatCard label="Resolved" value={number(s?.resolved)} accent="emerald" loading={isLoading} hint={s ? `${number(s.total)} total` : undefined} />
      </div>
      <DataTable
        columns={columns}
        data={data}
        onRetry={refetch}
        loading={isLoading}
        fetching={isFetching}
        state={raw}
        onChange={update}
        dense
        onRowClick={(r) => setSelectedId(r.id)}
        searchPlaceholder="Name, email, phone, message…"
        filters={[
          { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          { key: 'subject', label: 'Topic', options: Object.entries(subjects).map(([value, label]) => ({ value, label })) },
        ]}
        emptyTitle="No inquiries yet"
      />
      <InquiryDrawer id={selectedId} onClose={close} />
    </div>
  );
}

function InquiryDrawer({ id, onClose }) {
  const can = usePermission();
  const toast = useToast();
  const canManage = can('inquiries.manage');
  const { data: inquiry, isFetching } = useInquiryQuery(id, { skip: !id });
  const [save, { isLoading: saving }] = useUpdateInquiryMutation();
  const [remove, { isLoading: removing }] = useDeleteInquiryMutation();
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const autoMarked = useRef(null);

  useEffect(() => { setNote(inquiry?.staff_note || ''); }, [inquiry?.id, inquiry?.staff_note]);

  // Opening a new inquiry moves it to "in progress" so other staff can see it is being handled.
  useEffect(() => {
    if (canManage && inquiry?.status === 'new' && inquiry.id === id && autoMarked.current !== id) {
      autoMarked.current = id;
      save({ id: inquiry.id, status: 'in_progress' });
    }
  }, [inquiry?.id, inquiry?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async (body, msg) => {
    try {
      await save({ id, ...body }).unwrap();
      if (msg) toast(msg, 'success');
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const doDelete = async () => {
    try {
      await remove(id).unwrap();
      toast('Inquiry deleted', 'success');
      setConfirm(false);
      onClose();
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  const open = !!id;
  const ready = inquiry && inquiry.id === id;

  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={ready ? inquiry.name : 'Inquiry'}
      description={ready ? `${inquiry.subject_label || 'General'} · ${dateTime(inquiry.created_at)}` : ''}
      headerExtra={ready && <StatusBadge status={inquiry.status} />}
      footer={ready && canManage && (
        <>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" loading={saving} disabled={note === (inquiry.staff_note || '')} onClick={() => apply({ staff_note: note }, 'Note saved')}>Save note</Button>
          {inquiry.status !== 'resolved' && (
            <Button variant="success" size="sm" icon={CheckCircle2} loading={saving} onClick={() => apply({ status: 'resolved', staff_note: note }, 'Marked as resolved')}>Mark resolved</Button>
          )}
        </>
      )}
    >
      {!ready ? (
        <p className="py-10 text-center text-sm text-slate-500">{isFetching ? 'Loading…' : 'Inquiry not found.'}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {inquiry.phone && (
              <a href={`tel:${inquiry.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-slate-50">
                <Icon icon={Phone} size={14} /> {inquiry.phone}
              </a>
            )}
            {inquiry.email && (
              <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.subject_label || 'Your inquiry'}`)}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-slate-50">
                <Icon icon={Mail} size={14} /> {inquiry.email}
              </a>
            )}
          </div>

          <div>
            <p className="eyebrow mb-2">Message</p>
            <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">{inquiry.message}</div>
          </div>

          {canManage && (
            <div>
              <p className="eyebrow mb-2">Status</p>
              <Segmented value={inquiry.status} onChange={(v) => apply({ status: v })} options={STATUS_OPTIONS} />
            </div>
          )}

          {canManage ? (
            <Textarea label="Internal note (staff only)" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called back on 23 Nov, sent Gold plan details by SMS." />
          ) : inquiry.staff_note && (
            <div>
              <p className="eyebrow mb-2">Internal note</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{inquiry.staff_note}</p>
            </div>
          )}

          <DescriptionList items={[
            ['Received', dateTime(inquiry.created_at)],
            ['Topic', inquiry.subject_label || 'General'],
            ['Last handled by', inquiry.handler ? `${inquiry.handler.name} · ${dateTime(inquiry.handled_at)}` : '—'],
            ['IP address', <span className="font-mono text-xs">{inquiry.ip_address || '—'}</span>],
          ]} />
        </div>
      )}
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removing} title="Delete this inquiry?" description="This permanently removes the message. The deletion is recorded in the audit log." confirmLabel="Delete inquiry" />
    </SlideOverDrawer>
  );
}
