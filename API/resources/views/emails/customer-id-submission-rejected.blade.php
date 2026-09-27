<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1F2937;">
    <p>Hi {{ $customer->fname }},</p>
    <p>We weren't able to verify the ID you submitted for Cash on Delivery.</p>
    <p><strong>Reason:</strong> {{ $reason }}</p>
    @if ($order)
        <p>Order #{{ $order->order_number }} is still awaiting a valid ID — please resubmit from the app.</p>
    @else
        <p>Please resubmit your ID from the app to continue using Cash on Delivery.</p>
    @endif
</body>
</html>
