<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerAddressApiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->addresses()->orderByDesc('is_default')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'label' => 'required|string|max:50',
            'contact_name' => 'required|string|max:100',
            'contact_phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_default' => 'boolean',
        ]);

        $customer = $request->user();

        return DB::transaction(function () use ($customer, $data) {
            if (! empty($data['is_default'])) {
                $customer->addresses()->update(['is_default' => false]);
            }

            $address = $customer->addresses()->create($data);

            return response()->json(['message' => 'Address created', 'address' => $address], 201);
        });
    }

    public function update(Request $request, CustomerAddress $address)
    {
        $data = $request->validate([
            'label' => 'sometimes|string|max:50',
            'contact_name' => 'sometimes|string|max:100',
            'contact_phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:255',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'is_default' => 'sometimes|boolean',
        ]);

        $customer = $request->user();
        abort_if($address->customer_id !== $customer->id, 403, 'Unauthorized');

        return DB::transaction(function () use ($customer, $address, $data) {
            if (! empty($data['is_default'])) {
                $customer->addresses()->update(['is_default' => false]);
            }

            $address->update($data);

            return response()->json(['message' => 'Address updated', 'address' => $address]);
        });
    }

    public function destroy(Request $request, CustomerAddress $address)
    {
        $customer = $request->user();
        abort_if($address->customer_id !== $customer->id, 403, 'Unauthorized');

        if ($customer->addresses()->count() === 1) {
            return response()->json(['message' => 'You must keep at least one address'], 422);
        }

        $address->delete();

        return response()->json(['message' => 'Address removed']);
    }
}
