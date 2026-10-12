<?php

namespace App\Http\Middleware;

use App\Models\Rider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Rider app endpoints identify the rider by an `email` field (the app's original
 * contract). When a rider Sanctum token is sent its owner must match that email
 * (403 otherwise), and a missing email is filled in from the token.
 *
 * Token-less requests are rejected only once RIDER_API_AUTH_ENFORCED=true; until
 * then they're let through and logged so riders on an old APK keep working.
 */
class RiderOwnsRequest
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth('sanctum')->user();

        if ($user !== null && ! $user instanceof Rider) {
            return response()->json(['message' => 'Rider account required.'], 403);
        }

        if ($user === null) {
            if (config('services.rider_api.enforce')) {
                return response()->json(['message' => 'Unauthenticated. Please log in again.'], 401);
            }

            Log::warning('Rider API request without token', [
                'path' => $request->path(),
                'email' => $request->input('email', $request->query('email')),
            ]);

            return $next($request);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Your rider account is inactive. Please contact your market admin.'], 403);
        }

        $email = $request->input('email', $request->query('email'));

        if ($email !== null && $email !== ''
            && strcasecmp(trim((string) $email), (string) $user->email) !== 0) {
            return response()->json(['message' => 'This request does not belong to the logged-in rider.'], 403);
        }

        if ($email === null || $email === '') {
            $request->merge(['email' => $user->email]);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
