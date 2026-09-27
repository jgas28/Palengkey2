<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1F2937;">
    <p>Hi {{ $firstName }},</p>
    <p>We received a request to permanently delete your Palengkey account. Enter this code to confirm:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ $otp }}</p>
    <p>This code expires in {{ $expiresInMinutes }} minutes. If you didn't request this, ignore this email — your account will stay as it is.</p>
</body>
</html>
