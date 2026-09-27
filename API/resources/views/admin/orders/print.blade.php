@php
$total_amount = (float) ($order->total_amount ?? 0);
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Picking List #{{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', 'Arial', sans-serif;
            color: #000;
            font-size: 13px;
            line-height: 1.2;
        }

        @page {
            size: legal portrait;
            margin: 3mm 3mm 3mm 3mm;
        }

        .header {
            text-align: center;
            margin: 0 4mm 0 4mm;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
        }

        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
        }

        .order-info {
            margin: 1mm 4mm 1mm 4mm;
            font-size: 11px;
        }

        .order-number-box {
            font-size: 14px;
            font-weight: bold;
            border: 1px solid #000;
            padding: 1px 3px;
            display: inline-block;
            margin-bottom: 2px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background: #000;
            color: white;
            padding: 1px 2px;
            margin: 1mm 4mm 0.5mm 4mm;
        }

        th {
            border: 1px solid #000;
            padding: 2px 3px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }

        td {
            border: 1px solid #000;
            padding: 2px 3px;
            font-size: 11px;
            word-wrap: break-word;
        }

        .notes { width: 56%; }
        .item-name { width: 26%; }
        .qty { width: 8%; text-align: center; }
        .uom { width: 10%; text-align: center; }

        .total-section {
            margin: 0 4mm 0 4mm;
            border: 1px solid #000;
            padding: 2px 3px;
            text-align: right;
            font-size: 13px;
        }

        .footer {
            text-align: center;
            font-size: 9px;
            margin: 1px 4mm 1px 4mm;
        }

        table {
            width: calc(100% - 8mm);
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0 4mm 0 4mm;
        }

        thead { background: #e0e0e0; }

        /* Item Labels (page 2) */
        .page-break { page-break-before: always; }

        .labels-table {
            width: auto;
            border-collapse: separate;
            border-spacing: 2mm;
            margin: 0 3mm 0 3mm;
        }

        td.label-cell {
            width: 3in;
            height: 2in;
            border: none;
            padding: 0;
            vertical-align: top;
        }

        .label-box {
            width: 3in;
            height: 2in;
            border: 1.5px solid #2e7d32;
            border-radius: 4px;
            padding: 1.5mm 2mm;
            overflow: hidden;
        }

        .label-header {
            text-align: center;
            margin-bottom: 1mm;
        }

        .label-wordmark {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #0B6E3A;
        }

        .label-wordmark span { color: #0097A7; }

        .label-title {
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 0.3px;
            color: #333;
            text-transform: uppercase;
        }

        .label-item-name {
            border: 1px solid #999;
            border-radius: 2px;
            padding: 1mm 2mm;
            font-size: 14px;
            font-weight: bold;
            margin: 0.5mm 0 1mm 0;
            min-height: 4mm;
        }

        table.label-meta {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        td.label-meta-cell {
            width: 50%;
            border: none;
            padding: 0 0.8mm 0 0;
            vertical-align: top;
        }

        .label-meta-value {
            border: 1px solid #999;
            border-radius: 2px;
            padding: 1mm 1mm;
            font-size: 11px;
            margin-top: 0.5mm;
            white-space: nowrap;
        }

        .label-footer {
            text-align: center;
            font-size: 8px;
            font-style: italic;
            color: #2e7d32;
            border-top: 1px solid #ccc;
            margin-top: 1mm;
            padding-top: 0.8mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PICKING LIST</h1>
    </div>

    <div class="order-info">
        <div class="order-number-box">#{{ $order->order_number }}</div>
        @if($order->is_reservation)
            <div><strong>ORDER LATER:</strong> Scheduled for {{ $order->scheduled_delivery_time ? \Carbon\Carbon::parse($order->scheduled_delivery_time)->format('M d h:i A') : 'the selected time' }}</div>
        @endif
    </div>

    <div class="section-title">Items to Pick</div>
    <table>
        <thead>
            <tr>
                <th class="item-name">Item Name</th>
                <th class="qty">Qty</th>
                <th class="uom">UOM</th>
                <th class="notes">Special Instructions</th>
            </tr>
        </thead>
        <tbody>
            @forelse($order->items as $item)
                <tr>
                    <td class="item-name">{{ strtoupper($item->item_name) }}</td>
                    <td class="qty">{{ $item->item_quantity }}</td>
                    <td class="uom">{{ $item->unit_name ?: ($item->item?->unit?->short_name ?? $item->item?->unit?->name ?? '-') }}</td>
                    <td class="notes">
                        @if($item->selected_size)
                            <strong>Size:</strong> {{ $item->selected_size }}<br>
                        @endif
                        @if($item->customer_note)
                            {{ $item->customer_note }}
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center; color: #999;">No items</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="total-section">
        <strong>TOTAL: &#8369;{{ number_format($total_amount, 2, '.', ',') }}</strong>
    </div>

    <div class="footer">
        Printed: {{ now()->format('M d, Y h:i A') }}
    </div>

    @if($order->items->isNotEmpty())
        <div class="page-break"></div>
        <div class="header" style="margin-top: 0;">
            <h1>ITEM LABELS</h1>
        </div>
        <div class="order-info">
            <div class="order-number-box">#{{ $order->order_number }}</div>
        </div>

        <table class="labels-table">
            @foreach($order->items->chunk(2) as $row)
                <tr>
                    @foreach($row as $item)
                        @php
                            $labelUnit = $item->unit_name ?: ($item->item?->unit?->short_name ?? $item->item?->unit?->name ?? 'unit');
                        @endphp
                        <td class="label-cell">
                            <div class="label-box">
                                <div class="label-header">
                                    <span class="label-wordmark">Palen<span>gkey</span></span>
                                </div>
                                <div class="label-title">Item Description / Paninda</div>
                                <div class="label-item-name">{{ $item->item_name }}</div>
                                <table class="label-meta">
                                    <tr>
                                        <td class="label-meta-cell">
                                            <div class="label-title">Net Weight ({{ strtoupper($labelUnit) }})</div>
                                            <div class="label-meta-value">{{ number_format((float) $item->item_quantity, 2) }} {{ $labelUnit }}</div>
                                        </td>
                                        <td class="label-meta-cell" style="padding-right: 0;">
                                            <div class="label-title">Packed Date</div>
                                            <div class="label-meta-value">{{ now()->format('m/d/Y') }}</div>
                                        </td>
                                    </tr>
                                </table>
                                <div class="label-footer">Freshness Guaranteed! &middot; www.palengkey.com &middot; Quality Audited</div>
                            </div>
                        </td>
                    @endforeach
                    @for($i = $row->count(); $i < 2; $i++)
                        <td class="label-cell"></td>
                    @endfor
                </tr>
            @endforeach
        </table>
    @endif
</body>
</html>
