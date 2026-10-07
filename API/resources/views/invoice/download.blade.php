<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $appName }} Official Receipt #{{ $order->order_number }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1F2937; }
        h1 { font-size: 18px; margin-bottom: 0; }
        .muted { color: #6B7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #E5E7EB; }
        .totals td { border: none; }
        .totals tr:last-child td { font-weight: bold; border-top: 2px solid #1F2937; }
    </style>
</head>
<body>
    <h1>{{ $appName }}</h1>
    <p class="muted">Official Receipt — Order #{{ $order->order_number }}</p>
    @if ($order->invoice_series_number)
        <p class="muted">Invoice No: {{ $order->invoice_series_number }}</p>
    @endif
    <p class="muted">Date: {{ $order->created_at->format('M d, Y h:i A') }}</p>

    <p>
        <strong>Customer:</strong> {{ $order->contact_name }} ({{ $order->contact_phone }})<br>
        <strong>Delivery address:</strong> {{ $order->delivery_address }}<br>
        <strong>Market:</strong> {{ $order->market->name ?? '—' }}
    </p>

    <table>
        <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td>{{ $item->item_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ $item->unit_name }}</td>
                    <td>₱{{ number_format((float) $item->price, 2) }}</td>
                    <td>₱{{ number_format((float) $item->subtotal, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right">₱{{ number_format((float) $order->subtotal, 2) }}</td></tr>
        <tr><td>Delivery fee</td><td style="text-align:right">₱{{ number_format((float) $order->delivery_fee, 2) }}</td></tr>
        <tr><td>VAT</td><td style="text-align:right">₱{{ number_format((float) $order->vat, 2) }}</td></tr>
        <tr><td>Service fee</td><td style="text-align:right">₱{{ number_format((float) $order->service_fee, 2) }}</td></tr>
        @if ((float) ($order->bulk_delivery_subsidy ?? 0) > 0)
            <tr><td>Bulk delivery subsidy ({{ \App\Support\BulkPricing::VOUCHER_CODE }})</td><td style="text-align:right">-₱{{ number_format((float) $order->bulk_delivery_subsidy, 2) }}</td></tr>
        @endif
        @if ((float) $order->voucher_discount > 0)
            <tr><td>Voucher discount ({{ $order->voucher_code }})</td><td style="text-align:right">-₱{{ number_format((float) $order->voucher_discount, 2) }}</td></tr>
        @endif
        @if ((float) ($order->bulk_discount ?? 0) > 0)
            <tr><td colspan="2" style="color:#2E7D32">Bulk wholesale savings already in item prices: ₱{{ number_format((float) $order->bulk_discount, 2) }}</td></tr>
        @endif
        <tr><td>Total</td><td style="text-align:right">₱{{ number_format((float) $order->total_amount, 2) }}</td></tr>
    </table>

    <p class="muted" style="margin-top: 24px;">Payment method: {{ \App\Models\Order::paymentMethodLabel($order->payment_method) }} — {{ ucfirst($order->payment_status) }}</p>
</body>
</html>
