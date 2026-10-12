

<div style="background: #fff; min-height: 100vh; padding: 40px 0; font-family: 'Consolas', 'Courier New', monospace;">
	<div style="max-width: 520px; margin: 0 auto; background: #f5f6fa; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0; border: 1.5px solid #e0e0e0; overflow: hidden; position: relative;">
		<!-- Watermark Logo (centered, overlapping, behind content) -->
		<!-- <div style="position: absolute; left: 0; top: 0; width: 100%; height: 270px; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none;">
			<img src="{{ $message->embed(public_path('login/logo.png')) }}" alt="Logo Watermark" style="opacity: 0.13; width: 75%; max-width: 340px; min-width: 200px; margin: 0 auto; display: block;" />
		</div> -->
		<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; position: relative; z-index: 1;">
			<tr>
				<td colspan="3" style="padding: 0;">
					<div style="background: #f5f6fa; color: #222; font-size: 1.1rem; text-align: center; padding: 16px 0 0 0; border-bottom: 1px solid #e0e0e0;">
						<img src="{{ $message->embed(public_path('login/name.png')) }}" alt="Palengkey Name" style="height: 80px; max-width: 80%; vertical-align: middle; margin: 0 auto 4px auto; display: block;" />
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 0;">
					<div style="color: #222; text-align: center; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px; padding: 18px 0 0 0;">Verification Code</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 0 32px 0 32px;">
					<div style="color: #222; text-align: left; font-size: 1rem; padding: 18px 0 0 0;">
						Hi {{ $firstName ?: 'Customer' }},<br>
						Use the code below to verify your identity. It will expire in {{ $expiresInMinutes }} minutes.
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 24px 0 24px 0;">
					<div style="text-align: center;">
						<table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto; border: 2px solid #2d8f5a; border-radius: 8px; background: #fff;">
							<tr>
								<td style="padding: 12px 32px; font-size: 2rem; letter-spacing: 18px; color: #2d8f5a; font-weight: bold; text-align: center; font-family: 'Consolas', 'Courier New', monospace;">{{ $otp }}</td>
							</tr>
						</table>
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 0 32px 0 32px;">
					<div style="color: #222; text-align: left; font-size: 1rem; padding-bottom: 12px;">
						Don't share this code with anyone.
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 0 32px 0 32px;">
					<div style="color: #222; text-align: left; font-size: 1rem; padding-bottom: 18px;">
						Didn't request this? You can safely ignore this email or report it if you suspect unauthorized activity.
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="3" style="padding: 0;">
					<div style="background: #f5f6fa; color: #888; font-size: 0.95rem; text-align: center; border-top: 1px solid #e0e0e0; padding: 12px 0 12px 0;">
						Palengkey &nbsp;|&nbsp; <a href="https://palengkey.com/support" style="color:#2d8f5a; text-decoration:none;">Support</a> &nbsp;|&nbsp; <a href="https://palengkey.com/privacy" style="color:#2d8f5a; text-decoration:none;">Privacy Policy</a>
					</div>
				</td>
			</tr>
		</table>
	</div>
</div>