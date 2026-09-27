<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Voucher::query()->with('market')->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $data['created_by'] = $request->user()->id;
        $data['is_active'] = $request->boolean('is_active', true);
        $data['is_public'] = $request->boolean('is_public', true);
        $data['per_customer_limit'] = $data['per_customer_limit'] ?? 1;

        $voucher = Voucher::create($data);

        return response()->json($voucher->load('market'), 201);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $data = $this->validated($request, $voucher->id);
        $data['code'] = strtoupper($data['code']);
        $data['is_active'] = $request->boolean('is_active', false);
        $data['is_public'] = $request->boolean('is_public', true);
        $data['per_customer_limit'] = $data['per_customer_limit'] ?? 1;

        $voucher->update($data);

        return response()->json($voucher->fresh()->load('market'));
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();

        return response()->json(['message' => 'Voucher deleted.']);
    }

    private function validated(Request $request, ?int $voucherId = null): array
    {
        return $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code,'.($voucherId ?? 'NULL').',id',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0.01',
            'applies_to' => 'required|array|min:1',
            'applies_to.*' => 'in:subtotal,service_fee,delivery_fee',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'per_customer_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'market_id' => 'nullable|exists:markets,id',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
        ]);
    }
}
