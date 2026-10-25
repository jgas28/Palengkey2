<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\CustomerDevice;
use App\Models\DeletedAccountCooldown;
use App\Services\CustomerAccountDeletionService;
use App\Services\CustomerOtpService;
use App\Services\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class CustomerAuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */
    public function register(Request $request)
    {
        $this->normalizePhoneInput($request);

        $data = $request->validate([
            'fname' => 'required|string|max:255',
            'mname' => 'nullable|string|max:255',
            'lname' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => ['required', 'string', 'regex:'.PhoneNumber::PHILIPPINE_E164_REGEX],
            'password' => 'required|min:8|max:50|confirmed',
            'privacy_policy' => 'required|accepted',
            'terms_conditions' => 'required|accepted',
            'device_id' => 'nullable|string',
        ], [
            'phone.regex' => 'Phone number must use +63 followed by 10 digits, e.g. +639171234567.',
        ]);

        $email = strtolower(trim($data['email']));
        $phone = PhoneNumber::normalizePhilippineMobile($data['phone']);

        if (Customer::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'Email already registered'], 409);
        }

        if ($phone && Customer::whereIn('phone', PhoneNumber::databaseLookupVariants($phone))->exists()) {
            return response()->json(['message' => 'Phone already registered'], 409);
        }

        // Block re-registration for a cooldown period after this email/phone
        // was used on a deleted account.
        if ($cooldown = DeletedAccountCooldown::blocking($email, $phone)) {
            $daysLeft = max(1, now()->diffInDays($cooldown->expires_at, false));
            return response()->json([
                'message' => "This email or phone was recently used on a deleted account. You can register again in {$daysLeft} day(s).",
            ], 409);
        }

        $customer = DB::transaction(function () use ($data, $email, $phone) {
            $customer = Customer::create([
                'fname' => trim($data['fname']),
                'mname' => trim($data['mname'] ?? ''),
                'lname' => trim($data['lname']),
                'email' => $email,
                'phone' => $phone,
                'password' => Hash::make($data['password']),
                'verification_status' => 'pending_admin_approval',
            ]);

            // token_version (and any other DB-level column defaults) aren't reflected
            // on the in-memory model after create() — refresh so issueDeviceToken()
            // below doesn't try to insert a NULL into customer_devices.token_version
            // (NOT NULL, default 1).
            $customer->refresh();

            // OTP is generated but not sent yet — sent once the client picks a
            // delivery channel via /customer/resend/otp.
            $customer->update([
                'otp_code' => (string) random_int(100000, 999999),
                'otp_expires_at' => now()->addMinutes(5),
                'otp_attempts' => 0,
                'otp_last_sent_at' => now(),
            ]);

            return $customer;
        });

        $token = $this->issueDeviceToken($customer, $request);
        $this->mergeGuestCart($customer, $data['device_id'] ?? null);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($customer),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_id' => 'required|string',
            'device_name' => 'nullable|string',
            'platform' => 'nullable|string',
        ]);

        $email = strtolower(trim($data['email']));
        $customer = Customer::whereRaw('LOWER(email) = ?', [$email])->first();

        // Signed up with Google and never set a password: say so instead of "wrong password".
        if ($customer && ! $customer->password) {
            return response()->json([
                'message' => 'This account uses Google sign-in. Tap "Continue with Google", or use "Forgot password?" to set a password.',
                'error_code' => 'google_account',
            ], 401);
        }

        // Same message for unknown email and wrong password (don't reveal which accounts exist).
        if (! $customer || ! Hash::check($data['password'], $customer->password)) {
            return response()->json(['message' => 'Incorrect email or password.', 'error_code' => 'invalid_credentials'], 401);
        }

        // Every login requires a fresh OTP challenge (2FA) — withhold the token
        // until it's verified via /customer/verify/otp. The device_id carried in
        // that verification call is what actually issues the token/device record
        // (see verifyOtp() below) and merges any guest cart.
        $this->resetOtpIfExpired($customer);

        return response()->json([
            'token' => null,
            'user' => $this->userPayload($customer, forceEmailUnverified: true),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GOOGLE SIGN-IN (web, Android, iOS)
    |--------------------------------------------------------------------------
    | The app sends Google's ID token; we verify it with Google (signature,
    | expiry, audience = one of our client IDs, verified email) rather than
    | trusting an email/Google ID sent by the client. New Google users get an
    | account; then — exactly like password login — an email OTP is required
    | before the session token is issued (/customer/verify/otp).
    */
    public function googleLogin(Request $request)
    {
        $data = $request->validate([
            'id_token' => 'required|string',
            'device_id' => 'required|string',
            'device_name' => 'nullable|string',
            'platform' => 'nullable|string',
        ]);

        $google = $this->verifyGoogleIdToken($data['id_token']);
        if (! $google) {
            return response()->json(['message' => 'Google sign-in failed. Please try again.'], 401);
        }

        $email = strtolower($google['email']);
        $customer = Customer::where('google_id', $google['sub'])->first()
            ?? Customer::whereRaw('LOWER(email) = ?', [$email])->first();

        // An email already linked to a different Google account can't be taken over.
        if ($customer && $customer->google_id && $customer->google_id !== $google['sub']) {
            return response()->json(['message' => 'This email is linked to a different Google account.'], 409);
        }

        if ($customer && $customer->verification_status === 'rejected') {
            return response()->json(['message' => 'Your account was not approved. Please contact support.'], 403);
        }

        if (! $customer && ($cooldown = DeletedAccountCooldown::blocking($email))) {
            $daysLeft = max(1, (int) now()->diffInDays($cooldown->expires_at, false));

            return response()->json([
                'message' => "This email was recently used on a deleted account. You can register again in {$daysLeft} day(s).",
            ], 409);
        }

        $fname = trim((string) ($google['given_name'] ?? ''));

        if (! $customer) {
            $customer = Customer::create([
                'email' => $email,
                'fname' => $fname !== '' ? $fname : ucfirst(explode('@', $email)[0]),
                'lname' => trim((string) ($google['family_name'] ?? '')),
                'google_id' => $google['sub'],
                'provider' => 'google',
                'password' => null,
                'verification_status' => 'approved',
            ]);
        } elseif (! $customer->google_id) {
            // Existing email/password account — link Google to it.
            $customer->update(['google_id' => $google['sub']]);
        }

        // Same as password login: withhold the token until the OTP is verified.
        $this->resetOtpIfExpired($customer);

        return response()->json([
            'token' => null,
            'user' => $this->userPayload($customer, forceEmailUnverified: true),
        ]);
    }

    /** Google's verdict on an ID token, or null if it isn't valid for this app. */
    private function verifyGoogleIdToken(string $idToken): ?array
    {
        $clientIds = config('services.google.client_ids', []);
        if (empty($clientIds)) {
            report(new \RuntimeException('Google sign-in: no GOOGLE_CLIENT_ID configured.'));

            return null;
        }

        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }

        $claims = $response->successful() ? $response->json() : null;

        $valid = is_array($claims)
            && in_array($claims['aud'] ?? null, $clientIds, true)
            && in_array($claims['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
            && (int) ($claims['exp'] ?? 0) > time()
            && filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            && ! empty($claims['email'])
            && ! empty($claims['sub']);

        return $valid ? $claims : null;
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP (post-registration email verification, or approved-account 2FA)
    |--------------------------------------------------------------------------
    */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'device_id' => 'nullable|string',
            'device_name' => 'nullable|string',
            'platform' => 'nullable|string',
        ]);

        $customer = Customer::whereRaw('LOWER(email) = ?', [strtolower($request->email)])->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        if (! $customer->otp_code || ! $customer->otp_expires_at) {
            return response()->json(['message' => 'No OTP has been sent. Please request a code first.'], 422);
        }

        if (now()->gt($customer->otp_expires_at)) {
            return response()->json(['message' => 'OTP has expired.'], 422);
        }

        if ($request->otp !== $customer->otp_code) {
            $customer->increment('otp_attempts');

            if ($customer->otp_attempts >= 5) {
                return response()->json(['message' => 'Too many attempts. Please resend a new code.'], 429);
            }

            return response()->json(['message' => 'Invalid OTP.'], 422);
        }

        $customer->update([
            'email_verified_at' => now(),
            'phone_verified_at' => $customer->phone ? now() : $customer->phone_verified_at,
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_attempts' => 0,
        ]);

        // Every login() withholds its token pending this OTP — issue it now, per
        // device, same as a normal login would have. Distinguished from a plain
        // post-registration verification (where register() already issued a
        // token, so the request arrives already authenticated) by whether this
        // request carries a valid session already — not by verification_status,
        // since OTP is required for every login regardless of status.
        if (! $request->user('sanctum') && $request->filled('device_id')) {
            $tokenId = $this->extractTokenId(
                $token = $customer->createToken($request->device_id, ['*'], now()->addYears(1))->plainTextToken
            );

            CustomerDevice::updateOrCreate(
                ['customer_id' => $customer->id, 'device_id' => $request->device_id],
                [
                    'device_name' => $request->device_name,
                    'platform' => $request->platform,
                    'token_id' => $tokenId,
                    'last_used_at' => now(),
                    'token_version' => $customer->token_version,
                ]
            );

            $this->mergeGuestCart($customer, $request->device_id);

            return response()->json([
                'token' => $token,
                'user' => $this->userPayload($customer),
            ]);
        }

        // Plain post-registration verification — no token yet, caller re-fetches me().
        return response()->json($customer->fresh());
    }

    /*
    |--------------------------------------------------------------------------
    | RESEND OTP
    |--------------------------------------------------------------------------
    */
    public function resendOtp(Request $request, CustomerOtpService $otpService)
    {
        $request->validate([
            'email' => 'required|email',
            'channel' => 'nullable|string|in:email,sms',
        ]);

        $customer = Customer::whereRaw('LOWER(email) = ?', [strtolower($request->email)])->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        if ($customer->otp_last_sent_at) {
            // Explicit absolute + fixed direction: Carbon 3 changed diffInSeconds() to
            // signed-by-default (and flipped which side is subtracted from which vs
            // Carbon 2), so this must not rely on the old "now()->diffInSeconds(past)
            // is a positive elapsed count" assumption.
            $secondsSince = $customer->otp_last_sent_at->diffInSeconds(now(), absolute: true);

            if ($secondsSince < 60) {
                return response()->json([
                    'message' => 'Please wait '.(60 - (int) ceil($secondsSince)).' seconds before requesting a new code.',
                ], 429);
            }
        }

        $otp = (string) random_int(100000, 999999);
        $channel = $request->input('channel');

        $customer->update([
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(10),
            'otp_last_sent_at' => now(),
            'otp_attempts' => 0,
        ]);

        $result = $otpService->sendVerificationCode($customer, $otp, 10, $channel);

        if (! $result['delivered']) {
            return response()->json(['message' => $result['error']], 502);
        }

        return response()->json(['message' => 'A new 6-digit code has been sent to your email.']);
    }

    /*
    |--------------------------------------------------------------------------
    | FORGOT / RESET PASSWORD
    |--------------------------------------------------------------------------
    */
    public function forgotPassword(Request $request, CustomerOtpService $otpService)
    {
        $request->validate([
            'email' => 'required|email',
            'channel' => 'nullable|string|in:email,sms',
        ]);

        $customer = Customer::whereRaw('LOWER(email) = ?', [strtolower($request->email)])->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        $otp = (string) random_int(100000, 999999);
        $channel = $request->input('channel');

        $customer->update([
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(15),
        ]);

        $result = $otpService->sendPasswordResetCode($customer, $otp, 15, $channel);

        if (! $result['delivered']) {
            return response()->json(['message' => $result['error']], 502);
        }

        return response()->json(['message' => 'Password reset code sent to your email.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|min:6|confirmed',
        ]);

        $customer = Customer::whereRaw('LOWER(email) = ?', [strtolower($request->email)])->first();

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        if ($request->otp !== $customer->otp_code || ! $customer->otp_expires_at || now()->gt($customer->otp_expires_at)) {
            return response()->json(['message' => 'Invalid or expired reset code.'], 422);
        }

        $customer->update([
            'password' => Hash::make($request->password),
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        return response()->json(['message' => 'Password has been reset successfully.']);
    }

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED CUSTOMER
    |--------------------------------------------------------------------------
    */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->userPayload($request->user(), withProfileImage: true),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        CustomerDevice::where('token_id', $token->id)->delete();
        $token->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function logoutAll(Request $request)
    {
        $customer = $request->user();

        $customer->tokens()->delete();
        $customer->devices()->delete();

        return response()->json(['message' => 'Logged out from all devices']);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required',
            'password' => [
                'required',
                'min:12',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/',
                'confirmed',
            ],
        ], [
            'password.regex' => 'Password must contain uppercase, lowercase, number, and special character',
        ]);

        $customer = $request->user();

        if (! Hash::check($data['current_password'], $customer->password)) {
            return response()->json(['message' => 'Wrong password'], 422);
        }

        DB::transaction(function () use ($customer, $data, $request) {
            $customer->update([
                'password' => Hash::make($data['password']),
                'token_version' => $customer->token_version + 1,
            ]);

            $customer->tokens()->delete();
            $customer->devices()->delete();

            $this->issueDeviceToken($customer, $request);
        });

        return response()->json(['message' => 'Password changed. Please login again.']);
    }

    public function registerPushToken(Request $request)
    {
        $data = $request->validate(['fcm_token' => 'required|string']);

        $token = $request->user()->currentAccessToken();

        CustomerDevice::where('token_id', $token->id)->update([
            'fcm_token' => $data['fcm_token'],
        ]);

        return response()->json(['message' => 'Push token registered.']);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */
    private function normalizePhoneInput(Request $request): void
    {
        if ($request->filled('phone')) {
            $request->merge([
                'phone' => PhoneNumber::normalizePhilippineMobile($request->input('phone')),
            ]);
        }
    }

    /**
     * A signed-out visitor's cart is keyed by device_id (Cart::device_id,
     * CartController::resolveCart). Once that device authenticates, fold its
     * guest cart into the customer's own cart so nothing added while
     * browsing signed-out is lost.
     */
    private function mergeGuestCart(Customer $customer, ?string $deviceId): void
    {
        if (! $deviceId) {
            return;
        }

        $guestCart = Cart::where('device_id', $deviceId)->whereNull('customer_id')->first();

        if (! $guestCart) {
            return;
        }

        DB::transaction(function () use ($customer, $guestCart) {
            $existingCart = Cart::where('customer_id', $customer->id)->first();

            if ($existingCart) {
                $guestCart->items()->update(['cart_id' => $existingCart->id]);
                $guestCart->recipeBundles()->update(['cart_id' => $existingCart->id]);
                $guestCart->delete();
            } else {
                $guestCart->update(['customer_id' => $customer->id, 'device_id' => null]);
            }
        });
    }

    /** Registration and post-password-change both issue a token keyed to the browser/app UA. */
    private function issueDeviceToken(Customer $customer, Request $request): string
    {
        $device = substr($request->userAgent() ?? 'device', 0, 120);
        $tokenId = $this->extractTokenId($token = $customer->createToken($device, ['*'], now()->addYears(1))->plainTextToken);

        CustomerDevice::updateOrCreate(
            ['customer_id' => $customer->id, 'device_id' => md5($request->userAgent() ?? 'device')],
            [
                'device_name' => $request->userAgent(),
                'platform' => 'web',
                'token_id' => $tokenId,
                'last_used_at' => now(),
                'token_version' => $customer->token_version,
            ]
        );

        return $token;
    }

    /** Sanctum plainTextToken is "{id}|{random}" — token_id in customer_devices stores just the id. */
    private function extractTokenId(string $plainTextToken): string
    {
        return explode('|', $plainTextToken)[0];
    }

    private function resetOtpIfExpired(Customer $customer): void
    {
        $hasValidOtp = $customer->otp_code
            && $customer->otp_expires_at
            && now()->lessThan($customer->otp_expires_at);

        if (! $hasValidOtp) {
            $customer->update([
                'otp_code' => null,
                'otp_expires_at' => null,
                'otp_attempts' => 0,
                'otp_last_sent_at' => null,
            ]);
        }
    }

    private function userPayload(Customer $customer, bool $forceEmailUnverified = false, bool $withProfileImage = false): array
    {
        return [
            'id' => $customer->id,
            'fname' => $customer->fname,
            'mname' => $customer->mname,
            'lname' => $customer->lname,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'email_verified_at' => $forceEmailUnverified ? null : $customer->email_verified_at,
            'phone_verified_at' => $customer->phone_verified_at,
            'verification_status' => $customer->verification_status,
            'profile_image' => $withProfileImage ? $this->profileImageUrl($customer) : null,
            ...$customer->verificationFlags(),
        ];
    }

    private function profileImageUrl(Customer $customer): ?string
    {
        // Mirrors CustomerProfileController's disk selection — S3 once AWS creds
        // are configured, the local public disk until then.
        $disk = config('filesystems.disks.s3.key') ? 's3' : 'public';

        try {
            $folder = 'customers/'.$customer->id.'/profile_image';
            $files = Storage::disk($disk)->files($folder);

            return ! empty($files) ? Storage::disk($disk)->url($files[0]) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT DELETION — REQUEST (Apple App Store guideline 5.1.1(v))
    |--------------------------------------------------------------------------
    */
    public function requestAccountDeletion(Request $request, CustomerOtpService $otpService)
    {
        $request->validate([
            'channel' => 'nullable|string|in:email,sms',
        ]);

        $customer = $request->user();

        if (app(CustomerAccountDeletionService::class)->hasBlockingOrders($customer)) {
            return response()->json([
                'message' => 'You have an order in progress or awaiting payment. Please wait until it is completed or cancelled before deleting your account.',
            ], 409);
        }

        if ($customer->otp_last_sent_at) {
            $diff = now()->diffInSeconds($customer->otp_last_sent_at, true);

            if ($diff < 60) {
                $secondsLeft = 60 - $diff;
                return response()->json([
                    'message' => 'Please wait '.ceil($secondsLeft).' seconds before requesting a new code.',
                ], 429);
            }
        }

        $channel = $request->input('channel');
        $otp = (string) random_int(100000, 999999);

        $customer->update([
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(10),
            'otp_last_sent_at' => now(),
            'otp_attempts' => 0,
        ]);

        $result = $otpService->sendAccountDeletionCode($customer, $otp, 10, $channel);

        if (! $result['delivered']) {
            return response()->json(['message' => $result['error']], 502);
        }

        return response()->json(['message' => 'A confirmation code has been sent to your email.']);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT DELETION — CONFIRM
    |--------------------------------------------------------------------------
    | Scrubs the customer's personal data (name, email, phone, password,
    | Google link, profile image, saved addresses, ID/KYC documents) and
    | revokes all sessions. Orders, order items, and payment records are left
    | untouched — they carry their own snapshot of contact/address info and
    | stay linked via customer_id for financial/tax filing.
    */
    public function confirmAccountDeletion(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $customer = $request->user();

        if (! $customer->otp_code || ! $customer->otp_expires_at) {
            return response()->json(['message' => 'No confirmation code has been sent. Please request one first.'], 422);
        }

        if (now()->gt($customer->otp_expires_at)) {
            return response()->json(['message' => 'Confirmation code has expired.'], 422);
        }

        if ($request->otp !== $customer->otp_code) {
            $customer->increment('otp_attempts');

            if ($customer->otp_attempts >= 5) {
                return response()->json(['message' => 'Too many attempts. Please request a new code.'], 429);
            }

            return response()->json(['message' => 'Invalid confirmation code.'], 422);
        }

        $deletionService = app(CustomerAccountDeletionService::class);

        if ($deletionService->hasBlockingOrders($customer)) {
            return response()->json([
                'message' => 'You have an order in progress or awaiting payment. Please wait until it is completed or cancelled before deleting your account.',
            ], 409);
        }

        try {
            $deletionService->delete($customer);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Failed to delete account. Please try again.'], 500);
        }

        return response()->json(['message' => 'Your account has been deleted.']);
    }
}
