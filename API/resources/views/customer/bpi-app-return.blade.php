<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Palengkey — Payment {{ ucfirst($status) }}</title>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 48px 24px; color: #1F2937;">
    @if ($cancelled ?? false)
        <h1>Payment cancelled</h1>
        <p>You didn't finish paying for order #{{ $orderNumber }}{{ isset($methodLabel) ? ' with '.$methodLabel : '' }}. Return to the Palengkey app to try again or choose another payment method.</p>
    @elseif ($status === 'paid')
        <h1>Payment received 🎉</h1>
        <p>Order #{{ $orderNumber }} is confirmed. You can close this window and return to the Palengkey app.</p>
    @elseif ($status === 'failed' || $status === 'expired')
        <h1>Payment not completed</h1>
        <p>Order #{{ $orderNumber }} could not be paid. Please return to the Palengkey app to try again.</p>
    @else
        <h1>Processing your payment…</h1>
        <p>Please return to the Palengkey app — we'll update your order status shortly.</p>
    @endif
</body>
</html>
