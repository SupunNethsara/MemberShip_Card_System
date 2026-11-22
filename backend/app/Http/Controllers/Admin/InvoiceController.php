<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\Invoice;
use App\Repositories\InvoiceRepository;
use App\Repositories\PaymentTransactionRepository;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class InvoiceController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function index(Request $request, InvoiceRepository $repo): AnonymousResourceCollection
    {
        $paginator = $repo->paginate($request->all(), function ($q) use ($request) {
            if ($s = $request->query('status')) {
                $q->where('status', $s);
            }
            if ($g = $request->integer('gateway')) {
                $q->where('payment_gateway_id', $g);
            }
            if ($from = $request->query('from')) {
                $q->whereDate('created_at', '>=', $from);
            }
            if ($to = $request->query('to')) {
                $q->whereDate('created_at', '<=', $to);
            }
        });

        return InvoiceResource::collection($paginator)->additional([
            'summary' => [
                'paid_total' => (float) Invoice::query()->where('status', 'paid')->sum('amount'),
                'awaiting_approval' => Invoice::query()->where('status', 'awaiting_approval')->count(),
                'pending' => Invoice::query()->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        Gate::authorize('view', $invoice);

        return new InvoiceResource($invoice->load(['user', 'tier', 'gateway', 'membership.tier', 'transactions']));
    }

    public function approve(Request $request, Invoice $invoice): InvoiceResource
    {
        Gate::authorize('approve', $invoice);
        abort_if($invoice->status === 'paid', 422, 'Invoice is already paid.');
        abort_if(in_array($invoice->status, ['cancelled', 'refunded'], true), 422, 'Cancelled or refunded invoices cannot be approved.');

        $invoice = $this->payments->markPaid($invoice, $request->input('reference'), $request->user());

        return new InvoiceResource($invoice->load(['user', 'tier', 'gateway', 'membership.tier', 'transactions']));
    }

    public function reject(Request $request, Invoice $invoice): InvoiceResource
    {
        Gate::authorize('approve', $invoice);
        $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $invoice = $this->payments->reject($invoice, $request->user(), $request->input('reason'));

        return new InvoiceResource($invoice->load(['user', 'tier', 'gateway', 'transactions']));
    }

    public function transactions(Request $request, PaymentTransactionRepository $repo): AnonymousResourceCollection
    {
        return PaymentTransactionResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            if ($s = $request->query('status')) {
                $q->where('status', $s);
            }
        }));
    }

    public function pendingCount(): JsonResponse
    {
        return response()->json(['count' => Invoice::query()->where('status', 'awaiting_approval')->count()]);
    }
}
