<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Palengkey Official Receipt #{{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: Arial, sans-serif;
            color: #222;
            background: #efefef;
            font-size: 12px;
            line-height: 1.25;
        }

        body::before {
            display: none;
        }

        .page::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 500px;
            background-image: url('file://{{ str_replace('\\', '/', $watermark) }}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
        }

        .page {
            max-width: 900px;
            margin: 0 auto;
            padding: 18px 18px 26px;
            background: transparent;
            position: relative;
            z-index: 1;
        }

        @media (max-width: 640px) {
            .page {
                max-width: 100%;
                padding: 12px 12px 18px;
            }

            .company-name {
                font-size: 18px;
            }

            .header-right {
                width: auto;
            }

            .receipt-table th,
            .receipt-table td {
                padding: 6px 8px !important;
                font-size: 11px;
            }

            .mini-table td {
                padding: 6px 8px !important;
                font-size: 11px;
            }
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }

        .header-left,
        .header-right {
            display: table-cell;
            vertical-align: top;
        }

        .header-right {
            text-align: right;
            width: 230px;
        }

        .brand-logo {
            max-height: 52px;
            width: auto;
        }

        .company-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
            white-space: nowrap;
        }

        .company-line {
            font-size: 14px;
            margin-bottom: 2px;
        }

        .center-title {
            text-align: center;
            margin: 14px 0 10px;
        }

        .center-title h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .center-title p {
            font-size: 16px;
            font-weight: 700;
        }

        .meta {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
        }

        .meta td {
            padding: 2px 0;
            vertical-align: top;
        }

        .meta .label {
            width: 180px;
            color: #555;
            font-weight: 700;
        }

        .meta .value {
            font-weight: 700;
        }

        .divider {
            border-top: 3px solid #232323;
            margin: 10px 0 8px;
        }

        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            background: #f7f7f7;
        }

        .receipt-table th,
        .receipt-table td {
            border: 1px solid #b7b7b7;
            padding: 8px 10px;
        }

        .receipt-table th {
            color: #585858;
            font-size: 12px;
            font-weight: 700;
            text-align: left;
            background: #ebebeb;
        }

        .receipt-table th.num,
        .receipt-table td.num {
            text-align: right;
            width: 160px;
        }

        .receipt-table tbody td {
            background: #f5f5f5;
        }

        .totals-wrap {
            display: table;
            width: 100%;
            margin-top: 8px;
        }

        .totals-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 8px;
        }

        .totals-box:last-child {
            padding-right: 0;
            padding-left: 8px;
        }

        .mini-table {
            width: 100%;
            border-collapse: collapse;
            background: #f5f5f5;
        }

        .mini-table td {
            border: 1px solid #b7b7b7;
            padding: 8px 10px;
            font-weight: 700;
        }

        .mini-table td.value {
            text-align: right;
            width: 120px;
        }

        .notice {
            text-align: center;
            font-weight: 700;
            margin-top: 18px;
            font-size: 14px;
        }

        .foot {
            margin-top: 26px;
            font-size: 12px;
            color: #303030;
        }

        .foot .muted {
            margin-top: 12px;
            color: #666;
        }
    </style>
</head>
<body>

@php
    $subtotal = (float) ($order->subtotal ?? $order->items->sum('subtotal') ?? 0);
    $serviceFee = (float) ($order->service_fee ?? 0);
    $minOrder = (float) \App\Models\Setting::get('minimum_order_amount', 500);
    $serviceFeePercent = (float) \App\Models\Setting::get('service_fee_percent', 2);
    $isBelowMinimum = $subtotal < $minOrder;
    $serviceFeeLabel = $isBelowMinimum ? 'flat' : rtrim(rtrim(number_format($serviceFeePercent, 2), '0'), '.') . '%';

    // If service fee is 0 or missing, calculate it from subtotal (tiered)
    // This handles old orders created before service fee logic was implemented
    if ($serviceFee <= 0 && $subtotal > 0) {
        $serviceFee = \App\Models\Setting::calculateServiceFee($subtotal);
    }

    $delivery = (float) ($order->delivery_fee ?? 0);
    $vat = (float) ($order->vat ?? 0);
    $voucherDiscount = (float) ($order->voucher_discount ?? 0);

    // Total must match what the customer was actually charged (total_amount),
    // which already nets out the voucher discount.
    $total = (float) ($order->total_amount ?? round($subtotal + $serviceFee + $delivery + $vat - $voucherDiscount, 2));

    // The order gets its series number at checkout; never write to the DB from a view.
    $seriesNumber = $order->invoice_series_number ?: '—';
    $cookingFee = (float) ($order->paluto_cooking_fee ?? 0);
    $bulkSubsidy = (float) ($order->bulk_delivery_subsidy ?? 0);
    $issuedAt = $order->created_at?->copy()->timezone('Asia/Manila');
@endphp

<div class="page">

    <div class="header">
        <div class="header-left">
            <div class="company-name">Palengkey Digital Market Corporation</div>
            <div class="company-line">Block 3 Lot 106 Lawang Pari City of San Jose Del Monte Bulacan, 3023, Philippines</div>
            <div class="company-line">TIN: 010-970-433-000</div>
            <div class="company-line">Business Style: Palengkey Delivery Services</div>
        </div>

        <div class="header-right">
            <img src="file://{{ str_replace('\\', '/', $logo) }}" class="brand-logo">
        </div>
    </div>

    <div class="center-title">
        <h1>Official Order Receipt</h1>
        <p>Date: {{ $issuedAt?->format('d-M-Y') }}</p>
    </div>

    

    <table class="meta">
        <tr>
            <td class="label">Order Number</td>
            <td class="value">{{ $order->order_number }}</td>
        </tr>
        <tr>
            <td class="label">Series Number</td>
            <td class="value">{{ $seriesNumber }}</td>
        </tr>
        
        <tr>
            <td class="label">Applied Invoice Series Number</td>
            <td class="value">{{ $seriesNumber }}</td>
        </tr>
        <tr>
            <td class="label">Received From</td>
            <td class="value">{{ strtoupper($order->contact_name ?? $order->customer->name ?? 'CUSTOMER') }}</td>
        </tr>
        <!-- <tr>
            <td class="label">TIN</td>
            <td class="value">-</td>
        </tr> -->
        <tr>
            <td class="label">Business Style</td>
            <td class="value">{{ strtoupper($order->contact_name ?? $order->customer->name ?? 'CUSTOMER') }}</td>
        </tr>
        <tr>
            <td class="label">Address</td>
            <td class="value">{{ $order->delivery_address ?? 'N/A' }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="receipt-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Receipt Amount in PHP</th>
                <th class="num">Functional Amount in PHP</th>
            </tr>
        </thead>
        <tbody>
            @forelse($order->items as $item)
                @php
                    $unitName = $item->unit_name ?: ($item->item?->unit?->short_name ?? $item->item?->unit?->name ?? '-');
                @endphp
                <tr>
                    <td>{{ $item->item_name ?? 'Item' }} x {{ $item->quantity ?? 1 }} {{ $unitName }}</td>
                    <td class="num">{{ number_format((float) ($item->subtotal ?? 0), 2) }}</td>
                    <td class="num">{{ number_format((float) ($item->subtotal ?? 0), 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td>Order {{ $order->order_number }}</td>
                    <td class="num">{{ number_format($subtotal, 2) }}</td>
                    <td class="num">{{ number_format($subtotal, 2) }}</td>
                </tr>
            @endforelse
            <!-- @if($serviceFee > 0)
                <tr>
                    <td>Convenience Fee ({{ $serviceFeeLabel }})</td>
                    <td class="num">{{ number_format($serviceFee, 2) }}</td>
                    <td class="num">{{ number_format($serviceFee, 2) }}</td>
                </tr>
            @endif
            @if($delivery > 0)
                <tr>
                    <td>Delivery Fee (ex-VAT)</td>
                    <td class="num">{{ number_format($delivery, 2) }}</td>
                    <td class="num">{{ number_format($delivery, 2) }}</td>
                </tr>
                <tr>
                    <td>VAT on Delivery (12%)</td>
                    <td class="num">{{ number_format($vat, 2) }}</td>
                    <td class="num">{{ number_format($vat, 2) }}</td>
                </tr>
            @endif -->
        </tbody>
    </table>

    <div class="totals-wrap">
        <div class="totals-box">
            <table class="mini-table">
                <tr>
                    <td>PH VAT STD sales</td>
                    <td class="value">{{ number_format($subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td>PH VAT EXEMPT sales</td>
                    <td class="value">0.00</td>
                </tr>
                <tr>
                    <td>PH VAT ZERO sales</td>
                    <td class="value">0.00</td>
                </tr>
                <tr>
                    <td>Total Sales Amount</td>
                    <td class="value">{{ number_format($subtotal, 2) }}</td>
                </tr>
            </table>
        </div>

        <div class="totals-box">
            <table class="mini-table">
                <tr>
                    <td>Sales Amount</td>
                    <td class="value">{{ number_format($subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td>Convenience Fee ({{ $serviceFeeLabel }})</td>
                    <td class="value">{{ number_format($serviceFee, 2) }}</td>
                </tr>
                <tr>
                    <td>Delivery Fee (ex-VAT)</td>
                    <td class="value">{{ number_format($delivery, 2) }}</td>
                </tr>
                @if ($cookingFee > 0)
                <tr>
                    <td>Paluto Cooking Fee</td>
                    <td class="value">{{ number_format($cookingFee, 2) }}</td>
                </tr>
                @endif
                @if ($bulkSubsidy > 0)
                <tr>
                    <td>Bulk Delivery Subsidy ({{ \App\Support\BulkPricing::VOUCHER_CODE }})</td>
                    <td class="value">-{{ number_format($bulkSubsidy, 2) }}</td>
                </tr>
                @endif
                <tr>
                    <td>Discount{{ $order->voucher_code ? " ({$order->voucher_code})" : '' }}</td>
                    <td class="value">{{ $voucherDiscount > 0 ? '-' . number_format($voucherDiscount, 2) : number_format(0, 2) }}</td>
                </tr>
                <tr>
                    <td>VAT (12% on delivery)</td>
                    <td class="value">{{ number_format($vat, 2) }}</td>
                </tr>
                <tr>
                    <td>WHT</td>
                    <td class="value">0.00</td>
                </tr>
                <tr>
                    <td>Total Amount (PHP)</td>
                    <td class="value">{{ number_format($total, 2) }}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="foot" style="margin-top: 6px;">
        Payment Method: {{ \App\Models\Order::paymentMethodLabel($order->payment_method) }} — {{ ucfirst((string) $order->payment_status) }}
        @if ((float) ($order->bulk_discount ?? 0) > 0)
            <br>Bulk savings already included in item prices: PHP {{ number_format((float) $order->bulk_discount, 2) }}
        @endif
    </div>

    <div class="notice">*THIS DOCUMENT IS NOT VALID FOR CLAIMING OF INPUT TAX*</div>

    <div class="foot">
        <!-- <div>Acknowledgment Certificate: AC_041_{{ now()->format('mdY') }}_{{ str_pad((string) $order->id, 6, '0', STR_PAD_LEFT) }}</div> -->
        <div>Date Issued: {{ $issuedAt?->format('F j, Y') }}</div>
        <div>Effective Date: {{ $issuedAt?->format('F j, Y') }}</div>
        <div>Series Number: {{ $seriesNumber }}</div>

        <div class="muted">* This is a system-generated document. No signature is required.</div>
        <div class="muted">Original</div>
    </div>

</div>
</body>
</html>
