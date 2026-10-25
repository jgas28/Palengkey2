<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Models\Rider;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;

/**
 * Sanctum accepts any valid token on `auth:sanctum` routes — a staff (User) or
 * rider token would otherwise pass on customer routes and be read as "customer
 * #<same id>". This pins each route group to the account type it was built for.
 *
 * Usage: ->middleware(['auth:sanctum', 'token.type:customer'])
 */
class EnsureTokenType
{
    private const TYPES = [
        'customer' => Customer::class,
        'admin' => User::class,
        'rider' => Rider::class,
    ];

    public function handle(Request $request, Closure $next, string $type)
    {
        $expected = self::TYPES[$type] ?? null;
        $user = $request->user();

        if ($expected === null || ! $user instanceof $expected) {
            return response()->json([
                'message' => 'This account cannot use this part of Palengkey.',
                'error_code' => 'wrong_account_type',
            ], 403);
        }

        return $next($request);
    }
}
