<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hardening headers on every response. The API only serves JSON, so it never
 * needs to be framed, sniffed as another type, or leak the referring URL.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $headers = $response->headers;
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'no-referrer');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $headers->set('Cross-Origin-Resource-Policy', 'cross-origin');
        $headers->remove('X-Powered-By');
        // PHP itself adds "X-Powered-By: PHP/x.y" (expose_php); drop it here too.
        if (! headers_sent()) {
            header_remove('X-Powered-By');
        }

        // HSTS only over HTTPS (behind the load balancer, isSecure() relies on TrustProxies).
        if ($request->isSecure() || app()->environment('production')) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
