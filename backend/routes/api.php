<?php

use App\Http\Controllers\Admin\AccessController;
use App\Http\Controllers\Admin\CatalogController;
use App\Http\Controllers\Admin\CmsController;
use App\Http\Controllers\Admin\ContactInquiryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GatewayController;
use App\Http\Controllers\Admin\HeroSlideController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\MemberCardController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\Admin\SmsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Member\MemberAreaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\Public\ContactInquiryController as PublicContactInquiryController;
use App\Http\Controllers\Public\PublicController;
use Illuminate\Support\Facades\Route;

/*
| Permission enforcement layers:
|   1. Route middleware  — permission:<slug> (Spatie) on every admin route below
|   2. Policy classes    — Gate::authorize() inside controllers (ownership & super-admin rules)
|   3. Frontend          — route guards + <Can perform="..."> components
*/

Route::get('/health', fn () => ['status' => 'ok', 'time' => now()->toIso8601String()]);

// ── Public ────────────────────────────────────────────────────────────
Route::prefix('public')->group(function () {
    Route::get('content', [PublicController::class, 'content']);
    Route::get('tiers', [PublicController::class, 'tiers']);
    Route::get('categories', [PublicController::class, 'categories']);
    Route::get('partners', [PublicController::class, 'partners']);
    Route::get('gateways', [PublicController::class, 'gateways']);
    Route::get('verify/{token}', [PublicController::class, 'verify'])->middleware('throttle:30,1');
    Route::post('contact', [PublicContactInquiryController::class, 'store'])->middleware('throttle:5,1');
});

// ── Auth ──────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('register/send-otp', [AuthController::class, 'sendRegisterOtp'])->middleware('throttle:10,1');
    Route::post('register/resend-otp', [AuthController::class, 'resendRegisterOtp'])->middleware('throttle:10,1');
    Route::post('register/verify-otp', [AuthController::class, 'verifyRegisterOtp'])->middleware('throttle:15,1');
    Route::post('forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp'])->middleware('throttle:10,1');
    Route::post('forgot-password/resend-otp', [AuthController::class, 'resendForgotPasswordOtp'])->middleware('throttle:10,1');
    Route::post('forgot-password/reset', [AuthController::class, 'resetPasswordWithOtp'])->middleware('throttle:15,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// ── Notifications (shared by members and staff) ──────────────────────
Route::middleware(['auth:sanctum', 'active'])->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('{id}', [NotificationController::class, 'destroy']);
});

// ── Payment provider callbacks (signature-verified by drivers) ────────
Route::post('webhooks/payments/{key}', [PaymentWebhookController::class, 'webhook'])->middleware('throttle:120,1');
Route::match(['get', 'post'], 'payments/return/{key}', [PaymentWebhookController::class, 'return']);

// ── Member portal ─────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'active'])->prefix('member')->group(function () {
    Route::get('dashboard', [MemberAreaController::class, 'dashboard']);
    Route::get('benefits', [MemberAreaController::class, 'benefits']);
    Route::get('invoices', [MemberAreaController::class, 'invoices']);
    Route::get('invoices/{invoice}', [MemberAreaController::class, 'showInvoice']);
    Route::get('invoices/{invoice}/receipt', [MemberAreaController::class, 'receipt']);
    Route::post('invoices/{invoice}/slip', [MemberAreaController::class, 'uploadSlip']);
    Route::post('checkout', [MemberAreaController::class, 'checkout'])->middleware('throttle:20,1');
});

// ── Admin ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'active', 'staff'])->prefix('admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard.view');
    Route::get('dashboard/demo-data-summary', [DashboardController::class, 'demoDataSummary'])->middleware('permission:dashboard.view');
    Route::post('dashboard/clean-demo-data', [DashboardController::class, 'cleanDemoData'])->middleware('permission:dashboard.view');
    Route::get('audit-logs', [DashboardController::class, 'auditLogs'])->middleware('permission:audit.view');

    // Members
    Route::get('members', [MemberController::class, 'index'])->middleware('permission:members.view');
    Route::post('members', [MemberController::class, 'store'])->middleware('permission:members.create');
    Route::post('members/bulk-delete', [MemberController::class, 'bulkDestroy'])->middleware('permission:members.delete');
    Route::get('members/{member}', [MemberController::class, 'show'])->middleware('permission:members.view');
    Route::put('members/{member}', [MemberController::class, 'update'])->middleware('permission:members.update');
    Route::delete('members/{member}', [MemberController::class, 'destroy'])->middleware('permission:members.delete');
    Route::post('members/{member}/membership', [MemberController::class, 'override'])->middleware('permission:members.override');

    // Member cards (print queue)
    Route::get('cards', [MemberCardController::class, 'index'])->middleware('permission:cards.view');
    Route::get('cards/{member}/logs', [MemberCardController::class, 'logs'])->middleware('permission:cards.view');
    Route::post('cards/sheet', [MemberCardController::class, 'sheet'])->middleware('permission:cards.print');
    Route::post('cards/mark-printed', [MemberCardController::class, 'markPrinted'])->middleware('permission:cards.print');
    Route::post('cards/mark-issued', [MemberCardController::class, 'markIssued'])->middleware('permission:cards.issue');

    // Tiers
    Route::get('tiers', [CatalogController::class, 'tiers'])->middleware('permission:tiers.view|offers.view|members.view');
    Route::middleware('permission:tiers.manage')->group(function () {
        Route::post('tiers', [CatalogController::class, 'storeTier']);
        Route::put('tiers/{tier}', [CatalogController::class, 'updateTier']);
        Route::delete('tiers/{tier}', [CatalogController::class, 'destroyTier']);
    });

    // Partners & categories
    Route::get('categories', [CatalogController::class, 'categories'])->middleware('permission:partners.view|offers.view');
    Route::get('partners', [PartnerController::class, 'index'])->middleware('permission:partners.view');
    Route::get('partners/options', [PartnerController::class, 'options'])->middleware('permission:partners.view|offers.view');
    Route::get('partners/{partner}', [PartnerController::class, 'show'])->middleware('permission:partners.view');
    Route::middleware('permission:partners.manage')->group(function () {
        Route::post('categories', [CatalogController::class, 'storeCategory']);
        Route::put('categories/{category}', [CatalogController::class, 'updateCategory']);
        Route::delete('categories/{category}', [CatalogController::class, 'destroyCategory']);
        Route::post('partners', [PartnerController::class, 'store']);
        Route::post('partners/bulk-delete', [PartnerController::class, 'bulkDestroy']);
        Route::post('partners/{partner}', [PartnerController::class, 'update']); // multipart (logo) — POST for PHP file parsing
        Route::delete('partners/{partner}', [PartnerController::class, 'destroy']);
    });

    // Offers
    Route::get('offers', [PartnerController::class, 'offers'])->middleware('permission:offers.view');
    Route::middleware('permission:offers.manage')->group(function () {
        Route::post('offers', [PartnerController::class, 'storeOffer']);
        Route::post('offers/bulk-delete', [PartnerController::class, 'bulkDestroyOffers']);
        Route::put('offers/{offer}', [PartnerController::class, 'updateOffer']);
        Route::delete('offers/{offer}', [PartnerController::class, 'destroyOffer']);
    });

    // Payments & invoices
    Route::middleware('permission:payments.view')->group(function () {
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/pending-count', [InvoiceController::class, 'pendingCount']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('transactions', [InvoiceController::class, 'transactions']);
    });
    Route::middleware('permission:payments.manage')->group(function () {
        Route::post('invoices/{invoice}/approve', [InvoiceController::class, 'approve']);
        Route::post('invoices/{invoice}/reject', [InvoiceController::class, 'reject']);
    });

    // Payment gateways
    Route::get('payment-gateways', [GatewayController::class, 'paymentIndex'])->middleware('permission:gateways.payment.view|gateways.payment.manage');
    Route::middleware('permission:gateways.payment.manage')->group(function () {
        Route::post('payment-gateways', [GatewayController::class, 'paymentStore']);
        Route::put('payment-gateways/{paymentGateway}', [GatewayController::class, 'paymentUpdate']);
        Route::delete('payment-gateways/{paymentGateway}', [GatewayController::class, 'paymentDestroy']);
    });

    // SMS gateways, templates & logs
    Route::get('sms-gateways', [GatewayController::class, 'smsIndex'])->middleware('permission:gateways.sms.view|gateways.sms.manage');
    Route::middleware('permission:gateways.sms.manage')->group(function () {
        Route::put('sms-gateways/service', [GatewayController::class, 'smsService']);
        Route::post('sms-gateways', [GatewayController::class, 'smsStore']);
        Route::put('sms-gateways/{smsGateway}', [GatewayController::class, 'smsUpdate']);
        Route::delete('sms-gateways/{smsGateway}', [GatewayController::class, 'smsDestroy']);
        Route::post('sms-gateways/{smsGateway}/test', [GatewayController::class, 'smsTest'])->middleware('throttle:10,1');
    });
    Route::get('sms-templates', [SmsController::class, 'templates'])->middleware('permission:sms.templates.manage|gateways.sms.view');
    Route::put('sms-templates/{smsTemplate}', [SmsController::class, 'updateTemplate'])->middleware('permission:sms.templates.manage');
    Route::get('sms-logs', [SmsController::class, 'logs'])->middleware('permission:sms.logs.view');

    // Contact inquiries (public "Send an Inquiry" form)
    Route::middleware('permission:inquiries.view')->group(function () {
        Route::get('inquiries', [ContactInquiryController::class, 'index']);
        Route::get('inquiries/new-count', [ContactInquiryController::class, 'newCount']);
        Route::get('inquiries/{inquiry}', [ContactInquiryController::class, 'show']);
    });
    Route::middleware('permission:inquiries.manage')->group(function () {
        Route::put('inquiries/{inquiry}', [ContactInquiryController::class, 'update']);
        Route::delete('inquiries/{inquiry}', [ContactInquiryController::class, 'destroy']);
    });

    // CMS
    Route::get('cms', [CmsController::class, 'index'])->middleware('permission:cms.view');
    Route::put('cms', [CmsController::class, 'update'])->middleware('permission:cms.manage');
    Route::post('cms/logo', [CmsController::class, 'uploadLogo'])->middleware('permission:cms.manage');
    Route::get('faqs', [CmsController::class, 'faqs'])->middleware('permission:cms.view');
    Route::get('hero-slides', [HeroSlideController::class, 'index'])->middleware('permission:cms.view');
    Route::middleware('permission:cms.manage')->group(function () {
        Route::post('faqs', [CmsController::class, 'storeFaq']);
        Route::post('hero-slides', [HeroSlideController::class, 'store']);
        Route::post('hero-slides/{heroSlide}', [HeroSlideController::class, 'update']); // multipart
        Route::delete('hero-slides/{heroSlide}', [HeroSlideController::class, 'destroy']);
        Route::put('faqs/{faq}', [CmsController::class, 'updateFaq']);
        Route::delete('faqs/{faq}', [CmsController::class, 'destroyFaq']);
    });

    // Roles & permissions
    Route::get('roles', [AccessController::class, 'matrix'])->middleware('permission:roles.view');
    Route::middleware('permission:roles.manage')->group(function () {
        Route::put('roles/matrix', [AccessController::class, 'saveMatrix']);
        Route::post('roles', [AccessController::class, 'storeRole']);
        Route::put('roles/{role}', [AccessController::class, 'updateRole']);
        Route::delete('roles/{role}', [AccessController::class, 'destroyRole']);
    });

    // Staff
    Route::get('staff', [AccessController::class, 'staff'])->middleware('permission:staff.view');
    Route::middleware('permission:staff.manage')->group(function () {
        Route::post('staff', [AccessController::class, 'storeStaff']);
        Route::put('staff/{staff}', [AccessController::class, 'updateStaff']);
        Route::delete('staff/{staff}', [AccessController::class, 'destroyStaff']);
    });
});
