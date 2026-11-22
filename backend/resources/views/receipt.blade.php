<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $invoice->number }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 40px 16px; background: #f8fafc; color: #13224a; font: 14px/1.5 Inter, "Noto Sans Sinhala", "Noto Sans Tamil", system-ui, -apple-system, Segoe UI, sans-serif; }
        .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
        header { border-top: 4px solid #c99227; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 32px; border-bottom: 1px solid #e2e8f0; }
        h1 { margin: 0; font-size: 18px; letter-spacing: -0.01em; }
        .muted { color: #64748b; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 600; }
        section { padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        th { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 600; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .total td { border-bottom: 0; font-weight: 700; font-size: 16px; }
        footer { padding: 20px 32px; font-size: 12px; }
        @media print { body { background: #fff; padding: 0; } .sheet { border: 0; } .no-print { display: none; } }
    </style>
</head>
<body>
<div class="sheet">
    <header>
        <div style="display:flex;align-items:center;gap:12px">
            @if($logoUrl)<img src="{{ $logoUrl }}" alt="" style="height:64px;width:auto;object-fit:contain">@endif
            <div>
            <h1>{{ $siteName }}</h1>
            <div class="muted">Payment receipt</div>
            </div>
        </div>
        <div style="text-align:right">
            <div class="eyebrow">Receipt No.</div>
            <div style="font-weight:600;font-variant-numeric:tabular-nums">{{ $invoice->number }}</div>
            <div style="margin-top:6px"><span class="badge">PAID</span></div>
        </div>
    </header>

    <section class="grid">
        <div>
            <div class="eyebrow">Billed to</div>
            <div style="font-weight:600">{{ $invoice->user->name }}</div>
            <div class="muted">{{ $invoice->user->email }}</div>
            <div class="muted">{{ $invoice->user->phone }}</div>
            <div class="muted">Member ID: {{ $invoice->user->member_code }}</div>
        </div>
        <div>
            <div class="eyebrow">Payment</div>
            <div>Paid on {{ $invoice->paid_at?->format('d M Y, H:i') }}</div>
            <div class="muted">Method: {{ $invoice->gateway?->name ?? 'Manual' }}</div>
            @if($invoice->membership)
                <div class="muted">Valid until {{ $invoice->membership->expires_at?->format('d M Y') }}</div>
            @endif
        </div>
    </section>

    <section>
        <table>
            <thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
            <tbody>
            <tr>
                <td>{{ $invoice->tier->translate('name', 'en') }} Membership — {{ ucfirst($invoice->type) }}
                    <div class="muted" style="font-size:12px">{{ $invoice->tier->duration_value }} {{ $invoice->tier->duration_unit }}</div>
                </td>
                <td class="num">{{ $invoice->currency }} {{ number_format((float) $invoice->amount, 2) }}</td>
            </tr>
            <tr class="total"><td>Total paid</td><td class="num">{{ $invoice->currency }} {{ number_format((float) $invoice->amount, 2) }}</td></tr>
            </tbody>
        </table>
    </section>

    <footer class="muted">
        This is a computer-generated receipt and does not require a signature.
        @if($contactEmail) Questions? {{ $contactEmail }} @endif @if($contactPhone) · {{ $contactPhone }} @endif
        <div class="no-print" style="margin-top:12px"><button onclick="window.print()" style="padding:8px 14px;border:1px solid #13224a;background:#13224a;color:#fff;border-radius:6px;cursor:pointer">Print / Save as PDF</button></div>
    </footer>
</div>
</body>
</html>
