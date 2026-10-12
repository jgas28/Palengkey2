<div style="background: #fff; min-height: 100vh; padding: 40px 0; font-family: 'Consolas', 'Courier New', monospace;">
    <div style="max-width: 520px; margin: 0 auto; background: #f5f6fa; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0; border: 1.5px solid #e0e0e0; overflow: hidden; position: relative;">
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
                    <div style="color: #222; text-align: center; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px; padding: 18px 0 0 0;">Registration Rejected</div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 0 32px 0 32px;">
                    <div style="color: #222; text-align: left; font-size: 1rem; padding: 18px 0 0 0;">
                        Hi {{ $customer->fname ?? 'Customer' }},<br>
                        Your registration was not approved at this time. Please review the reason below before submitting your documents again.
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 24px 32px 18px 32px;">
                    <div style="border: 2px solid #c2410c; border-radius: 8px; background: #fff7ed; padding: 16px;">
                        <div style="font-size: 0.95rem; color: #9a3412; font-weight: bold; margin-bottom: 8px;">REJECTION REASON</div>
                        <div style="font-size: 1rem; color: #222; line-height: 1.6;">{{ $reason }}</div>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 0 32px 0 32px;">
                    <div style="color: #222; text-align: left; font-size: 1rem; padding-bottom: 12px;">
                        Make sure your next submission uses clear, valid, and readable documents.
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 0 32px 0 32px;">
                    <div style="color: #222; text-align: left; font-size: 1rem; padding-bottom: 18px;">
                        If you need help or believe this was a mistake, please contact Palengkey support.
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
