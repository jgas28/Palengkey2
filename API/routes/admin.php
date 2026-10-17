<?php

use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\CareerController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CuratedProductController;
use App\Http\Controllers\Api\Admin\CustomerVerificationController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\EmailBlastController;
use App\Http\Controllers\Api\Admin\FeedbackController;
use App\Http\Controllers\Api\Admin\HeroContentController;
use App\Http\Controllers\Api\Admin\IdSubmissionController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\ItemController;
use App\Http\Controllers\Api\Admin\ItemImageController;
use App\Http\Controllers\Api\Admin\LookupController;
use App\Http\Controllers\Api\Admin\MarketController;
use App\Http\Controllers\Api\Admin\MarketItemController;
use App\Http\Controllers\Api\Admin\OrderController;
use App\Http\Controllers\Api\Admin\PalutoDishController;
use App\Http\Controllers\Api\Admin\PalutoStallController;
use App\Http\Controllers\Api\Admin\PopupAdController;
use App\Http\Controllers\Api\Admin\PushBlastController;
use App\Http\Controllers\Api\Admin\RecipeController;
use App\Http\Controllers\Api\Admin\RecipeTypeController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\RiderController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\SmsBlastController;
use App\Http\Controllers\Api\Admin\SupportController;
use App\Http\Controllers\Api\Admin\TypeController;
use App\Http\Controllers\Api\Admin\UnitController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\VoucherController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::middleware('admin.role:admin,marketing,finance')->group(function () {
            Route::get('/categories', [LookupController::class, 'categories']);
            Route::get('/types', [LookupController::class, 'types']);
            Route::get('/units', [LookupController::class, 'units']);
            Route::get('/markets', [LookupController::class, 'markets']);
            Route::get('/recipe-types', [LookupController::class, 'recipeTypes']);
        });

        Route::middleware('admin.role:admin,owner')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);
            Route::get('/dashboard/orders', [DashboardController::class, 'orders']);
        });

        Route::middleware('admin.role:admin')->group(function () {
            Route::get('/items', [ItemController::class, 'index']);
            Route::get('/items/import-template', [ItemController::class, 'importTemplate']);
            Route::post('/items/import', [ItemController::class, 'import']);
            Route::get('/items/{item}', [ItemController::class, 'show']);
            Route::post('/items', [ItemController::class, 'store']);
            Route::patch('/items/{item}', [ItemController::class, 'update']);
            Route::delete('/items/{item}', [ItemController::class, 'destroy']);
            Route::post('/items/{item}/restore', [ItemController::class, 'restore']);
            Route::post('/items/{item}/cover', [ItemController::class, 'replaceCover']);
            Route::patch('/items/{item}/market', [MarketItemController::class, 'update']);
            Route::post('/items/{item}/images', [ItemImageController::class, 'store']);
            Route::delete('/items/{item}/images/{image}', [ItemImageController::class, 'destroy']);

            Route::get('/orders/riders/active', [OrderController::class, 'activeRiders']);
            Route::get('/orders/shoppers/active', [OrderController::class, 'activeShoppers']);
            Route::get('/orders', [OrderController::class, 'index']);
            Route::get('/orders/{order}', [OrderController::class, 'show']);
            Route::get('/orders/{order}/print', [OrderController::class, 'print']);
            Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::patch(
                '/orders/{order}/recipe-bundles/{recipeBundle}/cooking-status',
                [OrderController::class, 'updateRecipeBundleCookingStatus'],
            );
            Route::patch('/orders/{order}/items/{orderItem}/vendor-price', [OrderController::class, 'updateItemVendorPrice']);
            Route::patch('/orders/{order}/items/{orderItem}', [OrderController::class, 'updateItem']);
            Route::delete('/orders/{order}/items/{orderItem}', [OrderController::class, 'destroyItem']);
            Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
            Route::post('/orders/{order}/assign-rider', [OrderController::class, 'assignRider']);
            Route::patch('/orders/{order}/shopper', [OrderController::class, 'assignShopper']);

            Route::get('/riders/tracking', [RiderController::class, 'tracking']);
            Route::get('/riders', [RiderController::class, 'index']);
            Route::post('/riders', [RiderController::class, 'store']);
            Route::patch('/riders/{rider}', [RiderController::class, 'update']);

            Route::get('/inventory/template', [InventoryController::class, 'template']);
            Route::get('/inventory', [InventoryController::class, 'index']);
            Route::post('/inventory/update-board', [InventoryController::class, 'updateBoard']);
            Route::post('/inventory/import', [InventoryController::class, 'import']);

            Route::get('/recipes', [RecipeController::class, 'index']);
            Route::get('/recipes/{recipe}', [RecipeController::class, 'show']);
            Route::post('/recipes', [RecipeController::class, 'store']);
            Route::post('/recipes/{recipe}', [RecipeController::class, 'update']);
            Route::put('/recipes/{recipe}/ingredients', [RecipeController::class, 'updateIngredients']);
            Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy']);
            Route::post('/recipes/{recipe}/restore', [RecipeController::class, 'restore']);

            Route::get('/manage-recipe-types', [RecipeTypeController::class, 'index']);
            Route::post('/manage-recipe-types', [RecipeTypeController::class, 'store']);
            Route::post('/manage-recipe-types/{recipeType}', [RecipeTypeController::class, 'update']);
            Route::delete('/manage-recipe-types/{recipeType}', [RecipeTypeController::class, 'destroy']);
            Route::post('/manage-recipe-types/{recipeType}/restore', [RecipeTypeController::class, 'restore']);

            Route::get('/paluto-stalls', [PalutoStallController::class, 'index']);
            Route::get('/paluto-stalls/{stall}', [PalutoStallController::class, 'show']);
            Route::post('/paluto-stalls', [PalutoStallController::class, 'store']);
            Route::post('/paluto-stalls/{stall}', [PalutoStallController::class, 'update']);
            Route::delete('/paluto-stalls/{stall}', [PalutoStallController::class, 'destroy']);
            Route::post('/paluto-stalls/{stall}/restore', [PalutoStallController::class, 'restore']);

            Route::get('/paluto-stalls/{stall}/dishes', [PalutoDishController::class, 'index']);
            Route::post('/paluto-stalls/{stall}/dishes', [PalutoDishController::class, 'store']);
            Route::get('/paluto-stalls/{stall}/market-prices', [PalutoDishController::class, 'marketPrices']);
            Route::get('/paluto-dishes/{dish}', [PalutoDishController::class, 'show']);
            Route::post('/paluto-dishes/{dish}', [PalutoDishController::class, 'update']);
            Route::put('/paluto-dishes/{dish}/ingredients', [PalutoDishController::class, 'updateIngredients']);
            Route::delete('/paluto-dishes/{dish}', [PalutoDishController::class, 'destroy']);
            Route::post('/paluto-dishes/{dish}/restore', [PalutoDishController::class, 'restore']);
        });

        Route::middleware('admin.role:super_admin')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::patch('/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
            Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);

            Route::get('/manage-categories', [CategoryController::class, 'index']);
            Route::post('/manage-categories', [CategoryController::class, 'store']);
            Route::post('/manage-categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/manage-categories/{category}', [CategoryController::class, 'destroy']);
            Route::post('/manage-categories/{category}/restore', [CategoryController::class, 'restore']);

            Route::get('/manage-types', [TypeController::class, 'index']);
            Route::post('/manage-types', [TypeController::class, 'store']);
            Route::post('/manage-types/{type}', [TypeController::class, 'update']);
            Route::delete('/manage-types/{type}', [TypeController::class, 'destroy']);
            Route::post('/manage-types/{type}/restore', [TypeController::class, 'restore']);

            Route::get('/manage-units', [UnitController::class, 'index']);
            Route::post('/manage-units', [UnitController::class, 'store']);
            Route::post('/manage-units/{unit}', [UnitController::class, 'update']);
            Route::delete('/manage-units/{unit}', [UnitController::class, 'destroy']);
            Route::post('/manage-units/{unit}/restore', [UnitController::class, 'restore']);

            Route::get('/careers', [CareerController::class, 'index']);
            Route::get('/careers/{career}', [CareerController::class, 'show']);
            Route::post('/careers', [CareerController::class, 'store']);
            Route::patch('/careers/{career}', [CareerController::class, 'update']);
            Route::delete('/careers/{career}', [CareerController::class, 'destroy']);

            Route::get('/settings', [SettingController::class, 'index']);
            Route::put('/settings', [SettingController::class, 'update']);

            Route::get('/manage-markets', [MarketController::class, 'index']);
            Route::get('/manage-markets/{market}', [MarketController::class, 'show']);
            Route::post('/manage-markets', [MarketController::class, 'store']);
            Route::post('/manage-markets/{market}', [MarketController::class, 'update']);
            Route::delete('/manage-markets/{market}', [MarketController::class, 'destroy']);

            Route::get('/customer-verifications/stats', [CustomerVerificationController::class, 'stats']);
            Route::get('/customer-verifications/unverified', [CustomerVerificationController::class, 'unverifiedCustomers']);
            Route::get('/customer-verifications', [CustomerVerificationController::class, 'index']);
            Route::get('/customer-verifications/{verification}', [CustomerVerificationController::class, 'show']);
            Route::post('/customer-verifications/{verification}/approve', [CustomerVerificationController::class, 'approve']);
            Route::post('/customer-verifications/{verification}/reject', [CustomerVerificationController::class, 'reject']);
            Route::post('/customer-verifications/customer/{customer}/approve', [CustomerVerificationController::class, 'approveAccount']);
            Route::post('/customer-verifications/customer/{customer}/reject', [CustomerVerificationController::class, 'rejectAccount']);

            Route::get('/id-submissions', [IdSubmissionController::class, 'index']);
            Route::get('/id-submissions/{submission}', [IdSubmissionController::class, 'show']);
            Route::post('/id-submissions/{submission}/approve', [IdSubmissionController::class, 'approve']);
            Route::post('/id-submissions/{submission}/reject', [IdSubmissionController::class, 'reject']);
        });

        Route::middleware('admin.role:marketing')->group(function () {
            Route::get('/vouchers', [VoucherController::class, 'index']);
            Route::post('/vouchers', [VoucherController::class, 'store']);
            Route::patch('/vouchers/{voucher}', [VoucherController::class, 'update']);
            Route::delete('/vouchers/{voucher}', [VoucherController::class, 'destroy']);

            Route::get('/popup-ads', [PopupAdController::class, 'index']);
            Route::get('/popup-ads/vouchers', [PopupAdController::class, 'vouchers']);
            Route::post('/popup-ads', [PopupAdController::class, 'store']);
            Route::post('/popup-ads/{popupAd}', [PopupAdController::class, 'update']);
            Route::delete('/popup-ads/{popupAd}', [PopupAdController::class, 'destroy']);

            Route::get('/hero-content', [HeroContentController::class, 'index']);
            Route::post('/hero-content', [HeroContentController::class, 'store']);
            Route::post('/hero-content/{heroContent}', [HeroContentController::class, 'update']);
            Route::delete('/hero-content/{heroContent}', [HeroContentController::class, 'destroy']);
            Route::post('/hero-content/reorder', [HeroContentController::class, 'reorder']);

            Route::get('/curated-products', [CuratedProductController::class, 'index']);
            Route::post('/curated-products', [CuratedProductController::class, 'store']);
            Route::patch('/curated-products/{curatedProduct}', [CuratedProductController::class, 'update']);
            Route::delete('/curated-products/{curatedProduct}', [CuratedProductController::class, 'destroy']);

            Route::get('/sms-blast/stats', [SmsBlastController::class, 'stats']);
            Route::post('/sms-blast/send', [SmsBlastController::class, 'send']);
            Route::get('/email-blast/stats', [EmailBlastController::class, 'stats']);
            Route::post('/email-blast/send', [EmailBlastController::class, 'send']);
            Route::get('/push-blast/stats', [PushBlastController::class, 'stats']);
            Route::post('/push-blast/send', [PushBlastController::class, 'send']);
        });

        Route::middleware('admin.role:admin')->group(function () {
            Route::get('/feedback', [FeedbackController::class, 'index']);
            Route::get('/feedback/{feedback}', [FeedbackController::class, 'show']);
            Route::post('/feedback/{feedback}/mark-reviewed', [FeedbackController::class, 'markReviewed']);
            Route::post('/feedback/{feedback}/reopen', [FeedbackController::class, 'reopen']);

            // unread-count must be registered before {thread} or it gets swallowed by the wildcard.
            Route::get('/support/unread-count', [SupportController::class, 'unreadCount']);
            Route::get('/support', [SupportController::class, 'index']);
            Route::get('/support/{thread}', [SupportController::class, 'show']);
            Route::get('/support/{thread}/messages', [SupportController::class, 'messages']);
            Route::post('/support/{thread}/messages', [SupportController::class, 'storeMessage']);
            Route::post('/support/{thread}/close', [SupportController::class, 'close']);
            Route::post('/support/{thread}/reopen', [SupportController::class, 'reopen']);
        });

        Route::middleware('admin.role:admin,marketing,finance,owner')->group(function () {
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            Route::get('/audit-logs/users', [AuditLogController::class, 'users']);
        });

        Route::middleware('admin.role:owner')->group(function () {
            Route::get('/reports/sales', [ReportController::class, 'sales']);
            Route::get('/reports/verifications', [ReportController::class, 'verifications']);
            Route::get('/reports/activities', [ReportController::class, 'activities']);
            Route::get('/reports/products', [ReportController::class, 'products']);
            Route::get('/reports/payments', [ReportController::class, 'payments']);
            Route::get('/reports/discounts', [ReportController::class, 'discounts']);
        });
    });
});
