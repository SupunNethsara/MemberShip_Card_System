# Membership Card Business Portal & Partner Ecosystem

Admin-configurable membership card platform: tiers, partner businesses, offers, multilingual CMS (English / සිංහල / தமிழ்), payment gateways and SMS gateways, all managed from the dashboard under granular RBAC.

```
membership-portal/
├── backend/    Laravel 13 REST API · PHP 8.3+ · MySQL 8 · Sanctum · Spatie Permission
└── frontend/   React 18 · Vite 5 · Tailwind 3 · Redux Toolkit + RTK Query · React Router 6 · lucide-react
```

## Run locally (WAMP)

```bash
# 1. Database (MySQL on 127.0.0.1:3306, root / no password)
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS membership_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 2. API  →  http://127.0.0.1:8000
cd backend
composer install
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve

# 3. SPA  →  http://localhost:5173   (Vite proxies /api and /storage to :8000)
cd frontend
npm install
npm run dev
```

Partner logos: sample logos live in `backend/database/seeders/assets/partners/{slug}.png` and are used first when seeding (two spares are in `spare/`). Partners without a bundled logo get a generated initials logo from a public image URL (DiceBear); offline seeding skips those. Re-apply the bundled logos with `php artisan partners:fetch-logos --bundled --force`, or use `--partner=<slug> --url=https://…/logo.png` for any public PNG/JPEG/WebP image. **The bundled samples come from a stock logo template; replace them with real partner logos (or licensed artwork) before going live.**

Scheduled jobs (`php artisan schedule:work` in development, cron in production):
`memberships:expire` runs hourly; `memberships:remind --days=7` sends expiry SMS reminders daily at 09:00.

## Demo accounts

Sign-in details for the seeded demo staff and member accounts are in **[`docs/Demo_Accounts.pdf`](docs/Demo_Accounts.pdf)** (they are no longer shown on the sign-in page). Change or remove them before going live.

The seeded **Bank Transfer** gateway and **Development Log** SMS driver let you run the full flow locally with no third-party accounts: register → checkout → upload slip → approve as Finance → card activates → SMS appears in *SMS Delivery Logs* (and `storage/logs/laravel.log`).

## Architecture

**Backend** (`backend/app`)
- `Repositories/`: data access with whitelisted search/sort and server-side pagination (`BaseRepository`).
- `Services/`: business logic in DB transactions (`MembershipService`, `CatalogService`, `UserService`, `RoleService`, `GatewayConfigService`, `DashboardService`, `AuditLogger`).
- `Services/Payments/`: strategy/adapter pattern. `PaymentGatewayFactory` resolves `PayHereDriver`, `StripeDriver`, `WebXPayDriver` or `ManualTransferDriver`. Each driver verifies webhook signatures (PayHere md5sig, Stripe HMAC-SHA256 with timestamp tolerance, WebXPay RSA). `PaymentService` logs every raw payload to `payment_transactions`, checks amounts, and activates idempotently under a row lock.
- `Services/Sms/`: drivers for Notify.lk, Dialog eSMS, Mobitel, Hutch, Twilio, a custom HTTP/REST mapper, and a dev log driver. `SmsService` tries the primary gateway, then the fallback, renders templates in the member's language, and logs every attempt.
- Credentials are stored with `Crypt::encryptString` (`HasEncryptedCredentials`). The API returns them masked (`••••••••••••1234`), and re-submitting a masked value keeps the stored secret. Audit entries record only the *names* of changed keys.
- Localization: translatable columns are JSON `{en, si, ta}` (`HasTranslations`). The API returns every locale, so the SPA switches language instantly.
- RBAC is enforced in three layers: `permission:<slug>` route middleware, Policy classes (`Gate::authorize`), and frontend guards plus `<Can perform="…">`. Permissions and default grants live in `app/Support/PermissionRegistry.php`.

**Frontend** (`frontend/src`)
- `app/api.js`: every endpoint as an RTK Query hook, with tag-based cache invalidation.
- `components/ui/`: `DataTable`, `Modal`, `SlideOverDrawer`, `StatusBadge`, `StatCard`, `MultilingualInput`, `PermissionMatrix`, `Can`, plus form primitives.
- `pages/public`, `pages/portal`, `pages/admin`: route-level screens, lazy-loaded.

## Going live

1. In **Settings › Payment Gateways**, enter the real credentials, switch the mode to *Live*, and copy the Webhook URL into the provider's dashboard. The API must be reachable over public HTTPS for webhooks to arrive.
2. In **Settings › SMS Gateways**, configure a provider, set it as Primary, and use **Send test SMS** to confirm delivery. Then deactivate the Development Log driver.
3. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` and `FRONTEND_URL` in `backend/.env`, and run `npm run build` to deploy `frontend/dist`.

## Documentation

- **User manual:** [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) — step-by-step guide for members, partner staff and every admin role.
