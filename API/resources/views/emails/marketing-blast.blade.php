

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
				<td colspan="3" style="padding: 24px 32px; color: #222; font-size: 1rem; font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">
					{!! $bodyHtml !!}
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