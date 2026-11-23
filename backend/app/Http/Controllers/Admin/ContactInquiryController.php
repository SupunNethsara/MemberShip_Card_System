<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactInquiryResource;
use App\Models\ContactInquiry;
use App\Repositories\ContactInquiryRepository;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ContactInquiryController extends Controller
{
    public function index(Request $request, ContactInquiryRepository $repo): AnonymousResourceCollection
    {
        $counts = ContactInquiry::query()->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        return ContactInquiryResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            foreach (['status', 'subject'] as $f) {
                if ($v = $request->query($f)) {
                    $q->where($f, $v);
                }
            }
        }))->additional([
            'summary' => [
                'new' => (int) ($counts['new'] ?? 0),
                'in_progress' => (int) ($counts['in_progress'] ?? 0),
                'resolved' => (int) ($counts['resolved'] ?? 0),
                'total' => (int) $counts->sum(),
            ],
            'subjects' => ContactInquiry::SUBJECTS,
        ]);
    }

    /** Sidebar badge: inquiries nobody has picked up yet. */
    public function newCount(): JsonResponse
    {
        return response()->json(['count' => ContactInquiry::query()->where('status', 'new')->count()]);
    }

    public function show(ContactInquiry $inquiry): ContactInquiryResource
    {
        return new ContactInquiryResource($inquiry->load('handler'));
    }

    public function update(Request $request, ContactInquiry $inquiry, AuditLogger $audit): ContactInquiryResource
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(ContactInquiry::STATUSES)],
            'staff_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $from = $inquiry->status;
        $inquiry->fill($data);
        if ($inquiry->isDirty()) {
            $inquiry->handled_by = $request->user()->id;
            $inquiry->handled_at = now();
            $inquiry->save();
            $audit->log('inquiry.updated', "Updated contact inquiry #{$inquiry->id} from {$inquiry->name}", $inquiry, ['from' => $from, 'to' => $inquiry->status]);
        }

        return new ContactInquiryResource($inquiry->load('handler'));
    }

    public function destroy(ContactInquiry $inquiry, AuditLogger $audit): JsonResponse
    {
        $audit->log('inquiry.deleted', "Deleted contact inquiry #{$inquiry->id} from {$inquiry->name}", $inquiry);
        $inquiry->delete();

        return response()->json(['message' => 'Inquiry deleted.']);
    }
}
