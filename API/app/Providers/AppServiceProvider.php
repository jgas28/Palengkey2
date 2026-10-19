<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Admin login: 5 tries a minute per email + IP, so staff sharing one
        // office connection don't lock each other out.
        RateLimiter::for('admin-login', fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip())
            ->response(fn () => response()->json([
                'message' => 'Too many login attempts. Please wait a minute, then try again.',
                'error_code' => 'too_many_attempts',
            ], 429)));
    }
}
