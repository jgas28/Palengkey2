<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Super-admin maintenance switch (Admin → Settings → Maintenance mode).
 *
 * Only the customer API is gated — the admin panel, rider app and payment
 * webhooks keep working, so staff can always turn it back off and riders can
 * finish deliveries. Customers get a 503 and the app shows /maintenance.
 */
class CustomerMaintenance
{
    public function handle(Request $request, Closure $next)
    {
        if (! filter_var(Setting::get('maintenance_enabled', false), FILTER_VALIDATE_BOOLEAN)) {
            return $next($request);
        }

        $until = Setting::get('maintenance_until');
        $backAt = $until ? Carbon::parse($until) : null;

        $response = response()->json([
            'message' => 'Palengkey is under maintenance. Please check back shortly.',
            'error_code' => 'maintenance',
            'back_at' => $backAt?->toIso8601String(),
        ], 503);

        if ($backAt && $backAt->isFuture()) {
            $response->headers->set('Retry-After', (string) max(60, (int) ceil(now()->diffInSeconds($backAt))));
        }

        return $response;
    }
}
