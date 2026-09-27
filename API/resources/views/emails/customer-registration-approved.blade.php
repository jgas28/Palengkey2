<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1F2937;">
    <p>Hi {{ $customer->fname }},</p>
    <p>Good news — your Palengkey account has been approved. You can now log in and start ordering.</p>
    @if ($reviewNotes)
        <p style="color: #6B7280;">Note from our team: {{ $reviewNotes }}</p>
    @endif
    <p>Salamat!</p>
</body>
</html>
