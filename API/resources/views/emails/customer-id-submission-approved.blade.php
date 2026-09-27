<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1F2937;">
    <p>Hi {{ $customer->fname }},</p>
    <p>Your ID has been verified — you can now place Cash on Delivery orders.</p>
    @if ($order)
        <p>Your order #{{ $order->order_number }} is now confirmed.</p>
    @endif
    @if ($reviewNotes)
        <p style="color: #6B7280;">Note from our team: {{ $reviewNotes }}</p>
    @endif
</body>
</html>
