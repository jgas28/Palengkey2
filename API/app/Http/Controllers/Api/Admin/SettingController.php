<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private array $fields = [
        'delivery_base_fee' => ['label' => 'Base Delivery Fee (₱)', 'default' => 40, 'group' => 'Delivery', 'type' => 'number'],
        'delivery_base_distance' => ['label' => 'Base Distance (km)', 'default' => 3, 'group' => 'Delivery', 'type' => 'number'],
        'delivery_increment_fee' => ['label' => 'Fee Per Extra km (₱)', 'default' => 15, 'group' => 'Delivery', 'type' => 'number'],
        'delivery_increment_distance' => ['label' => 'Extra Distance Step (km)', 'default' => 1, 'group' => 'Delivery', 'type' => 'number'],

        'item_markup_percent' => ['label' => 'Item Markup (%)', 'default' => 10, 'group' => 'Pricing', 'type' => 'number'],
        'service_fee_percent' => ['label' => 'Service Fee (%) — Orders at/above Minimum', 'default' => 2, 'group' => 'Pricing', 'type' => 'number'],
        'service_fee_max_amount' => ['label' => 'Service Fee Maximum Amount (₱)', 'default' => 100, 'group' => 'Pricing', 'type' => 'number'],
        'service_fee_fixed_amount' => ['label' => 'Fixed Service Fee (₱) — Orders Below Minimum', 'default' => 20, 'group' => 'Pricing', 'type' => 'number'],

        'bulk_pricing_enabled' => ['label' => 'Bulk Pricing On (1 = on, 0 = off)', 'default' => 1, 'group' => 'Bulk Orders', 'type' => 'number'],
        'bulk_discount_percent' => ['label' => 'Bulk Vendor Cost Adjustment (%) — markup kept', 'default' => 5, 'group' => 'Bulk Orders', 'type' => 'number'],
        'bulk_delivery_subsidy_cap' => ['label' => 'Bulk Delivery Subsidy Cap (₱) — BULK-FREESHIP', 'default' => 49, 'group' => 'Bulk Orders', 'type' => 'number'],

        'minimum_order_amount' => ['label' => 'Minimum Order Amount (₱)', 'default' => 500, 'group' => 'Orders', 'type' => 'number'],
        'order_operational_start_time' => ['label' => 'Order Operational Start Time', 'default' => '05:00', 'group' => 'Orders', 'type' => 'time'],
        'order_cutoff_time' => ['label' => 'Default Order Cutoff Time', 'default' => '17:00', 'group' => 'Orders', 'type' => 'time'],

        'delivery_slot_1_name' => ['label' => 'Slot 1 Name', 'default' => 'Morning', 'group' => 'Delivery Slots', 'type' => 'string'],
        'delivery_slot_1_start' => ['label' => 'Slot 1 Start Time', 'default' => '07:00', 'group' => 'Delivery Slots', 'type' => 'time'],
        'delivery_slot_1_end' => ['label' => 'Slot 1 End Time', 'default' => '12:00', 'group' => 'Delivery Slots', 'type' => 'time'],
        'delivery_slot_2_name' => ['label' => 'Slot 2 Name', 'default' => 'Afternoon', 'group' => 'Delivery Slots', 'type' => 'string'],
        'delivery_slot_2_start' => ['label' => 'Slot 2 Start Time', 'default' => '14:00', 'group' => 'Delivery Slots', 'type' => 'time'],
        'delivery_slot_2_end' => ['label' => 'Slot 2 End Time', 'default' => '17:00', 'group' => 'Delivery Slots', 'type' => 'time'],
        'delivery_slot_3_name' => ['label' => 'Slot 3 Name', 'default' => 'Evening', 'group' => 'Delivery Slots', 'type' => 'string'],
        'delivery_slot_3_start' => ['label' => 'Slot 3 Start Time', 'default' => '17:00', 'group' => 'Delivery Slots', 'type' => 'time'],
        'delivery_slot_3_end' => ['label' => 'Slot 3 End Time', 'default' => '20:00', 'group' => 'Delivery Slots', 'type' => 'time'],

        'hero_stat_1_value' => ['label' => 'Stat 1 Value', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_1_label' => ['label' => 'Stat 1 Label', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_2_value' => ['label' => 'Stat 2 Value', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_2_label' => ['label' => 'Stat 2 Label', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_3_value' => ['label' => 'Stat 3 Value', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_3_label' => ['label' => 'Stat 3 Label', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_4_value' => ['label' => 'Stat 4 Value', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
        'hero_stat_4_label' => ['label' => 'Stat 4 Label', 'default' => '', 'group' => 'Landing Page', 'type' => 'string'],
    ];

    public function index()
    {
        $groups = [];
        foreach ($this->fields as $key => $meta) {
            $groups[$meta['group']][] = array_merge($meta, [
                'key' => $key,
                'value' => Setting::get($key, $meta['default']),
            ]);
        }

        return response()->json($groups);
    }

    public function update(Request $request)
    {
        $rules = [];
        foreach ($this->fields as $key => $meta) {
            $rules[$key] = match ($meta['type'] ?? 'string') {
                'number' => 'nullable|numeric|min:0',
                'time' => 'nullable|date_format:H:i',
                default => 'nullable|string|max:50',
            };
        }

        $validated = $request->validate($rules);

        foreach ($this->fields as $key => $meta) {
            if (isset($validated[$key]) && $validated[$key] !== null && $validated[$key] !== '') {
                Setting::set($key, $validated[$key]);
            }
        }

        return $this->index();
    }
}
