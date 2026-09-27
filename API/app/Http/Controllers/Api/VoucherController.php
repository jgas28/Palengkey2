<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function listVouchers(Request $request)
    {
        $customer = $request->user();
        $marketId = $request->query('market_id') ? (int) $request->query('market_id') : null;

        $vouchers = Voucher::availableForCustomer($customer->id, $marketId)
            ->orderBy('expires_at')
            ->get()
            ->map(fn (Voucher $v) => [
                'id' => $v->id,
                'code' => $v->code,
                'description' => $v->description,
                'discount_type' => $v->discount_type,
                'discount_value' => $v->discount_value,
                'min_order_amount' => $v->min_order_amount,
                'max_discount_amount' => $v->max_discount_amount,
                'expires_at' => $v->expires_at?->toDateString(),
                'applies_to_label' => $v->applies_to_label,
            ]);

        return response()->json(['vouchers' => $vouchers]);
    }

    public function checkVoucher(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
            'market_id' => 'nullable|integer|exists:markets,id',
        ]);

        $code = strtoupper(trim($data['code']));
        $subtotal = (float) $data['subtotal'];
        $marketId = isset($data['market_id']) ? (int) $data['market_id'] : null;

        $voucher = Voucher::where('code', $code)->first();

        if (! $voucher) {
            return response()->json(['message' => 'Voucher code not found'], 404);
        }

        $blockReason = $voucher->redemptionBlockReason($request->user()->id, $subtotal, $marketId);

        if ($blockReason) {
            return response()->json(['message' => $blockReason], 422);
        }

        $discountAmount = $voucher->calculateTotalDiscount($subtotal, 0, 0);

        return response()->json([
            'message' => 'Voucher valid',
            'voucher' => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'description' => $voucher->description,
                'discount_type' => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
                'applies_to' => $voucher->applies_to,
                'max_discount_amount' => $voucher->max_discount_amount,
                'usage_limit' => $voucher->usage_limit,
                'per_customer_limit' => $voucher->perCustomerUsageLimit(),
            ],
            'discount_amount' => $discountAmount,
        ]);
    }
}
