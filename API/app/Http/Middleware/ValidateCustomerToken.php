<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Models\CustomerDevice;
use Closure;
use Illuminate\Http\Request;

/**
 * Customer Sanctum tokens are 1-per-device (tracked in customer_devices, keyed by
 * token_id) with a token_version bump on password change to invalidate every other
 * device's session. Runs globally so it also covers future non-customer guards
 * without needing device tracking for them.
 */
class ValidateCustomerToken
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user instanceof Customer) {
            return $next($request);
        }

        $token = $user->currentAccessToken();

        if (! $token) {
            return $next($request);
        }

        $device = CustomerDevice::where('token_id', $token->id)->first();

        if (! $device) {
            $token->delete();
            abort(401, 'Session expired');
        }

        if ($device->token_version !== $user->token_version) {
            $token->delete();
            abort(401, 'Session expired. Please login again.');
        }

        return $next($request);
    }
}
