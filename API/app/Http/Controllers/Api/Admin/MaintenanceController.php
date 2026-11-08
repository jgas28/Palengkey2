<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/** Super admin: switch the customer site/app into maintenance mode and back. */
class MaintenanceController extends Controller
{
    public function show()
    {
        return response()->json($this->state());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'required|boolean',
            // Expected back-online time shown to customers; optional.
            'until' => 'nullable|date|after:now',
            // Show "Coming soon" instead of a back-online time.
            'coming_soon' => 'sometimes|boolean',
        ]);

        $before = $this->state();

        Setting::set('maintenance_enabled', $data['enabled'] ? '1' : '0');
        Setting::set('maintenance_until', $data['enabled'] && ! empty($data['until'])
            ? Carbon::parse($data['until'])->utc()->toIso8601String()
            : null);
        Setting::set('maintenance_coming_soon', $data['enabled'] && ! empty($data['coming_soon']) ? '1' : '0');
        Setting::set('maintenance_changed_by', $request->user()->name ?? $request->user()->email);
        Setting::set('maintenance_changed_at', now()->toIso8601String());

        AuditLogger::custom($data['enabled'] ? 'maintenance_enabled' : 'maintenance_disabled', [
            'before' => $before,
            'until' => $data['until'] ?? null,
            'coming_soon' => (bool) ($data['coming_soon'] ?? false),
        ]);

        return response()->json([
            'message' => $data['enabled']
                ? 'Maintenance mode is on. Customers now see the maintenance page.'
                : 'Maintenance mode is off. The customer site is live again.',
            ...$this->state(),
        ]);
    }

    private function state(): array
    {
        return [
            'enabled' => filter_var(Setting::get('maintenance_enabled', false), FILTER_VALIDATE_BOOLEAN),
            'until' => Setting::get('maintenance_until'),
            'coming_soon' => filter_var(Setting::get('maintenance_coming_soon', false), FILTER_VALIDATE_BOOLEAN),
            'changed_by' => Setting::get('maintenance_changed_by'),
            'changed_at' => Setting::get('maintenance_changed_at'),
        ];
    }
}
