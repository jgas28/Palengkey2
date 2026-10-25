<?php

use App\Http\Controllers\Api\BpiPaymentController;
use App\Http\Controllers\Api\CareerApiController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\CustomerAddressApiController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\CustomerFeedbackController;
use App\Http\Controllers\Api\CustomerProfileController;
use App\Http\Controllers\Api\CustomerSupportController;
use App\Http\Controllers\Api\CuratedProductController;
use App\Http\Controllers\Api\CustomerVerificationController;
use App\Http\Controllers\Api\ItemApiController;
use App\Http\Controllers\Api\MarketApiController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PalutoApiController;
use App\Http\Controllers\Api\PayMongoController;
use App\Http\Controllers\Api\PopupAdController;
use App\Http\Controllers\Api\RecipeApiController;
use App\Http\Controllers\Api\RecipeTypeApiController;
use App\Http\Controllers\Api\RiderAppController;
use App\Http\Controllers\Api\RiderAuthController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TypeApiController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['message' => 'pong']));

// Public, unprefixed (matches the reference contract exactly — do not nest under /customer or /admin).
Route::get('/popup-ads', [PopupAdController::class, 'index'])->middleware('customer.maintenance');

// Customer API — closed while super admin turns on maintenance mode (admin, rider
// and webhook routes stay open).
Route::prefix('customer')->middleware('customer.maintenance')->group(function () {
    // Public catalog (no auth).
    Route::get('/markets', [MarketApiController::class, 'index']);
    Route::get('/categories', [CategoryApiController::class, 'index']);
    Route::get('/types', [TypeApiController::class, 'index']);
    Route::get('/items', [ItemApiController::class, 'index']);
    Route::get('/items/{item}', [ItemApiController::class, 'show']);
    Route::get('/curated-products', [CuratedProductController::class, 'index']);
    Route::get('/recipes', [RecipeApiController::class, 'index']);
    Route::get('/recipes/{recipe}', [RecipeApiController::class, 'show']);
    Route::get('/recipe-types', [RecipeTypeApiController::class, 'index']);
    Route::get('/paluto/stalls', [PalutoApiController::class, 'stalls']);
    Route::get('/paluto/stalls/{stall}', [PalutoApiController::class, 'stall']);
    Route::get('/delivery-areas', [ContentController::class, 'deliveryAreas']);
    Route::get('/featured-reviews', [ContentController::class, 'featuredReviews']);
    Route::get('/review-stats', [ContentController::class, 'reviewStats']);
    Route::get('/hero-stats', [ContentController::class, 'heroStats']);
    Route::get('/careers', [CareerApiController::class, 'index']);

    // Public, rate-limited (registration/login/password-reset abuse prevention).
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/register', [CustomerAuthController::class, 'register']);
        Route::post('/login', [CustomerAuthController::class, 'login']);
        Route::post('/auth/google', [CustomerAuthController::class, 'googleLogin']);
        Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword']);
    });

    // Public (OTP verify/resend aren't behind auth — they're how a token gets issued).
    Route::post('/verify/otp', [CustomerAuthController::class, 'verifyOtp']);
    Route::post('/resend/otp', [CustomerAuthController::class, 'resendOtp']);

    // Cart — open to both guests (identified by the X-Device-Id header) and
    // authenticated customers; CartController::resolveCart() branches on which.
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/add', [CartController::class, 'add']);
    Route::patch('/cart/item/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/item/{cartItem}', [CartController::class, 'remove']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::post('/cart/add-recipe', [CartController::class, 'addRecipe']);
    Route::post('/cart/add-paluto-dish', [CartController::class, 'addPalutoDish']);
    Route::delete('/cart/recipe-bundle/{bundle}', [CartController::class, 'removeRecipeBundle']);

    // Authenticated (Sanctum bearer token) — customer tokens only.
    Route::middleware(['auth:sanctum', 'token.type:customer'])->group(function () {
        Route::get('/me', [CustomerAuthController::class, 'me']);
        Route::post('/logout', [CustomerAuthController::class, 'logout']);
        Route::post('/logout-all', [CustomerAuthController::class, 'logoutAll']);
        Route::post('/change-password', [CustomerAuthController::class, 'changePassword']);
        Route::post('/devices/fcm-token', [CustomerAuthController::class, 'registerPushToken']);

        Route::post('/profile/update', [CustomerProfileController::class, 'update']);
        Route::post('/profile/image', [CustomerProfileController::class, 'updateImage']);
        Route::delete('/profile/image', [CustomerProfileController::class, 'deleteImage']);

        Route::get('/addresses', [CustomerAddressApiController::class, 'index']);
        Route::post('/addresses', [CustomerAddressApiController::class, 'store']);
        Route::put('/addresses/{address}', [CustomerAddressApiController::class, 'update']);
        Route::delete('/addresses/{address}', [CustomerAddressApiController::class, 'destroy']);

        Route::post('/verification/submit', [CustomerVerificationController::class, 'submit']);
        Route::post('/verification/skip', [CustomerVerificationController::class, 'skip']);
        Route::get('/verification/status', [CustomerVerificationController::class, 'status']);

        Route::get('/settings', [SettingsController::class, 'index']);

        Route::get('/vouchers', [VoucherController::class, 'listVouchers']);
        Route::post('/voucher/validate', [VoucherController::class, 'checkVoucher']);

        Route::get('/notifications', [NotificationController::class, 'getNotifications']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/clear', [NotificationController::class, 'clearAll']);

        Route::get('/support', [CustomerSupportController::class, 'index']);
        Route::post('/support/order/{orderNumber}/open', [CustomerSupportController::class, 'openForOrder']);
        Route::get('/support/threads/{thread}/messages', [CustomerSupportController::class, 'messages']);
        Route::post('/support/threads/{thread}/messages', [CustomerSupportController::class, 'storeMessage']);

        Route::get('/order-feedback', [CustomerFeedbackController::class, 'show']);
        Route::post('/order-feedback', [CustomerFeedbackController::class, 'store']);

        Route::get('/delivery/fee', [CheckoutController::class, 'deliveryFee']);
        Route::post('/checkout', [CheckoutController::class, 'checkout']);

        Route::get('/orders', [OrderController::class, 'myOrders']);
        Route::get('/order-stats', [OrderController::class, 'stats']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::get('/orders/{order}/invoice/download', [OrderController::class, 'downloadInvoice']);
        Route::get('/order/{orderId}/rider-location', [RiderController::class, 'getRiderLocationForOrder']);

        // Account deletion (Apple App Store guideline 5.1.1(v))
        Route::post('/account/delete/request', [CustomerAuthController::class, 'requestAccountDeletion']);
        Route::post('/account/delete/confirm', [CustomerAuthController::class, 'confirmAccountDeletion']);
    });
});

// Hit by PayMongo's servers directly (signature-verified, not Sanctum) and by
// the customer's browser being redirected back from BPI's site (no session or
// token available there) — both live outside the /customer prefix and auth group.
// Rider app (palengkey-rider-mobile) — same URLs as the old backend.
Route::prefix('rider')->group(function () {
    Route::post('/login', [RiderAuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('rider.owns')->group(function () {
        Route::post('/logout', [RiderAuthController::class, 'logout']);
        Route::get('/profile', [RiderAppController::class, 'getProfile']);
        Route::post('/profile/update', [RiderAppController::class, 'updateProfile']);
        Route::post('/location/update', [RiderAppController::class, 'updateLocation']);
        Route::post('/location/background-ping', [RiderAppController::class, 'backgroundPing']);
        Route::get('/dashboard', [RiderAppController::class, 'getDashboard']);
        Route::get('/orders', [RiderAppController::class, 'getOrders']);
        Route::get('/order/details/{id}', [RiderAppController::class, 'getOrder']);
        Route::post('/orders/{order}/start-delivery', [RiderAppController::class, 'startDelivery']);
        Route::post('/order/complete', [RiderAppController::class, 'deliver']);
    });
});

Route::post('/webhooks/paymongo', [PayMongoController::class, 'webhook']);
Route::get('/payment/bpi/{order}/return', [BpiPaymentController::class, 'appReturn'])->name('api.bpi.return');
Route::get('/payment/{order}/return', [BpiPaymentController::class, 'appReturn'])->name('api.payment.return');

// Admin (staff) panel — kept in its own file since it's a large, separate surface.
require __DIR__.'/admin.php';
