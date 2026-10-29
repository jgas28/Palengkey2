<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Google sign-in: ID tokens are accepted only when issued for one of these
    // OAuth client IDs (web, Android, iOS — Google Cloud Console > Credentials).
    'google' => [
        'client_ids' => array_values(array_filter([
            env('GOOGLE_CLIENT_ID'),
            env('GOOGLE_ANDROID_CLIENT_ID'),
            env('GOOGLE_IOS_CLIENT_ID'),
        ])),
    ],

    // Read through config() so the keys survive `php artisan config:cache`
    // (env() returns null outside config files once the config is cached).
    'paymongo' => [
        'secret_key' => env('PAYMONGO_SECRET_KEY'),
        'public_key' => env('PAYMONGO_PUBLIC_KEY'),
        // Dashboard > Developers > Webhooks: the whsk_... secret of the webhook.
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    ],

    // Rider app: reject token-less /rider requests once every rider has the updated APK.
    'rider_api' => [
        'enforce' => env('RIDER_API_AUTH_ENFORCED', false),
    ],

];
