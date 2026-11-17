<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoucherController extends Controller
{
    /** Most customers one voucher can be given to. */
    private const MAX_CUSTOMERS = 500;

    /** The market, and who the voucher is for (name and email only). */
    private static function relations(): array
    {
        return [
            'market',
            'customers' => fn ($query) => $query->select(['customers.id', 'customers.fname', 'customers.lname', 'customers.email']),
        ];
    }

    /** Customers whose email contains the search, for picking who gets a voucher. */
    public function searchCustomers(Request $request)
    {
        $data = $request->validate(['email' => 'required|string|min:3|max:100']);
        $search = addcslashes(trim($data['email']), '%_\\');

        $customers = Customer::query()
            ->where('email', 'like', "%{$search}%")
            ->orderBy('email')
            ->limit(10)
            ->get(['id', 'fname', 'lname', 'email']);

        return response()->json(['customers' => $customers]);
    }

    public function index(Request $request)
    {
        $query = Voucher::query()->with(self::relations())->latest();

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
        $customerIds = $this->takeCustomerIds($request, $data);

        $voucher = DB::transaction(function () use ($data, $customerIds) {
            $voucher = Voucher::create($data);
            $voucher->customers()->sync($customerIds);

            return $voucher;
        });

        return response()->json($voucher->load(self::relations()), 201);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $data = $this->validated($request, $voucher->id);
        $data['code'] = strtoupper($data['code']);
        $data['is_active'] = $request->boolean('is_active', false);
        $data['is_public'] = $request->boolean('is_public', true);
        $data['per_customer_limit'] = $data['per_customer_limit'] ?? 1;
        $customerIds = $this->takeCustomerIds($request, $data);

        DB::transaction(function () use ($voucher, $data, $customerIds) {
            $voucher->update($data);
            $voucher->customers()->sync($customerIds);
        });

        return response()->json($voucher->fresh()->load(self::relations()));
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();

        return response()->json(['message' => 'Voucher deleted.']);
    }

    /**
     * Sets the for_specific_customers flag and returns who gets the voucher.
     * Turning the flag off clears the list.
     */
    private function takeCustomerIds(Request $request, array &$data): array
    {
        $data['for_specific_customers'] = $request->boolean('for_specific_customers');
        $customerIds = $data['for_specific_customers'] ? array_map('intval', $data['customer_ids']) : [];
        unset($data['customer_ids']);

        return $customerIds;
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
            'for_specific_customers' => 'boolean',
            'customer_ids' => 'exclude_unless:for_specific_customers,true,1|required|array|min:1|max:'.self::MAX_CUSTOMERS,
            'customer_ids.*' => 'integer|distinct|exists:customers,id',
            'market_id' => 'nullable|exists:markets,id',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
        ]);
    }
}
