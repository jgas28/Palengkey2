<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1F2937;">
    <p>Hi {{ $firstName }},</p>
    <p>Your Palengkey verification code is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ $otp }}</p>
    <p>This code expires in {{ $expiresInMinutes }} minutes. If you didn't request this, you can ignore this email.</p>
</body>
</html>
