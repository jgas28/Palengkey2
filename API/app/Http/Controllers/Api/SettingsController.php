<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'service_fee_rate' => (float) Setting::get('service_fee_percent', 2) / 100,
                'service_fee_percent' => (float) Setting::get('service_fee_percent', 2),
                'service_fee_max_amount' => (float) Setting::get('service_fee_max_amount', 100),
                'service_fee_fixed_amount' => (float) Setting::get('service_fee_fixed_amount', 20),

                'delivery_base_fee' => (float) Setting::get('delivery_base_fee', 40),
                'delivery_base_distance' => (float) Setting::get('delivery_base_distance', 3),
                'delivery_increment_fee' => (float) Setting::get('delivery_increment_fee', 15),
                'delivery_increment_distance' => (float) Setting::get('delivery_increment_distance', 1),

                'minimum_order_amount' => (float) Setting::get('minimum_order_amount', 500),

                'paymongo_public_key' => config('services.paymongo.public_key') ?? '',
            ],
        ]);
    }
}
