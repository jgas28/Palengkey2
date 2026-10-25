<?php

/*
 | Which websites may call this API from a browser.
 | Set CORS_ALLOWED_ORIGINS in .env (comma-separated) to override the list below.
 | The Android/iOS app (Capacitor) calls from https://localhost / capacitor://localhost.
 | Note: logins use Bearer tokens, not cookies, so this limits other websites
 | from using the API in a visitor's browser; it is not an authentication layer.
 */
$origins = array_values(array_filter(array_map('trim', explode(',', (string) env(
    'CORS_ALLOWED_ORIGINS',
    implode(',', [
        'https://palengkey.com',
        'https://www.palengkey.com',
        'https://staging.palengkey.com',
        'https://localhost',          // Android app (Capacitor)
        'http://localhost',           // Android app, older WebView scheme
        'capacitor://localhost',      // iOS app (Capacitor)
        'http://localhost:5173',      // local development (Vite)
        'http://localhost:5174', 
    ]),
)))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    // Lets the maintenance page read "back online at" during `php artisan down --retry`.
    'exposed_headers' => ['Retry-After'],
    'max_age' => 600,
    'supports_credentials' => false,
];
