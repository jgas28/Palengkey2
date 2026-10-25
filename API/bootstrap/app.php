<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // Behind the EC2 load balancer / reverse proxy: read HTTPS and the client IP
        // from the forwarded headers (needed for HSTS and per-IP rate limits).
        $middleware->trustProxies(at: '*');

        // API callers have no login page to be sent to — answer 401 JSON instead of
        // redirecting to a non-existent "login" route (which crashed with a 500).
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/');

        $middleware->api(append: [
            \App\Http\Middleware\ValidateCustomerToken::class,
        ]);

        $middleware->alias([
            'admin.role' => \App\Http\Middleware\EnsureAdminRole::class,
            'rider.owns' => \App\Http\Middleware\RiderOwnsRequest::class,
            'customer.maintenance' => \App\Http\Middleware\CustomerMaintenance::class,
            'token.type' => \App\Http\Middleware\EnsureTokenType::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every /api/* error is JSON, never an HTML error page.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // "No query results for model [App\Models\Item] 123" reveals internals; keep it generic.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getPrevious() instanceof ModelNotFoundException) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return null;
        });
    })->create();
