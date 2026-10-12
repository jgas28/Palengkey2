<div style="background: #fff; min-height: 100vh; padding: 40px 0; font-family: 'Consolas', 'Courier New', monospace;">
    <div style="max-width: 520px; margin: 0 auto; background: #f5f6fa; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0; border: 1.5px solid #e0e0e0; overflow: hidden;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                <td colspan="3" style="padding: 0;">
                    <div style="background: #f5f6fa; color: #222; font-size: 1.1rem; text-align: center; padding: 16px 0 0 0; border-bottom: 1px solid #e0e0e0;">
                        <img src="{{ $message->embed(public_path('login/name.png')) }}" alt="Palengkey" style="height: 80px; max-width: 80%; display: block; margin: 0 auto 4px auto;" />
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <div style="color: #222; text-align: center; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px; padding: 18px 0 0 0;">ID Submission Rejected</div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 18px 32px 0 32px;">
                    <div style="color: #222; font-size: 1rem;">
                        Hi {{ $customer->fname ?? 'Customer' }},<br><br>
                        @if ($order)Unfortunately, the ID you submitted for order <strong>{{ $order->order_number }}</strong> was not accepted. Your order is on hold until a valid ID is provided.@else Unfortunately, the ID you submitted for Cash on Delivery was not accepted.@endif
                    </div>
                </td>
            </tr>
            @if ($reason)
                <tr>
                    <td colspan="3" style="padding: 12px 32px 0 32px;">
                        <div style="color: #b91c1c; font-size: 1rem;"><strong>Reason:</strong> {{ $reason }}</div>
                    </td>
                </tr>
            @endif
            <tr>
                <td colspan="3" style="padding: 24px 0;">
                    <div style="text-align: center;">
                        <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto; border: 2px solid #b91c1c; border-radius: 8px; background: #fff;">
                            <tr>
                                <td style="padding: 12px 32px; font-size: 2rem; letter-spacing: 8px; color: #b91c1c; font-weight: bold; font-family: 'Consolas', 'Courier New', monospace;">REJECTED</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 0 32px 18px 32px;">
                    <div style="color: #222; font-size: 1rem;">
                        Please log in to your account, go to your order, and submit a clear photo of a valid government-issued ID.
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <div style="background: #f5f6fa; color: #888; font-size: 0.95rem; text-align: center; border-top: 1px solid #e0e0e0; padding: 12px 0;">
                        Palengkey &nbsp;|&nbsp; <a href="https://palengkey.com/support" style="color:#2d8f5a; text-decoration:none;">Support</a>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>
