# Gateway Setup & Production Go-Live Guide
### Jeewana Saviya Membership Portal

This comprehensive step-by-step guide explains how the client or administrator can set up accounts with each payment provider and SMS gateway, retrieve the live credentials, configure them in the Admin Console, and turn off Sandbox/Test mode for full production use.

---

## Quick Overview: Transitioning from Sandbox to Live

| Area | In Sandbox / Test Mode | In Live / Production Mode |
| :--- | :--- | :--- |
| **Payment Gateways** | Charges fake test cards; displays an amber **"Sandbox"** badge at checkout. | Charges real bank cards/wallets; **"Sandbox" badge is completely hidden**; funds settle to bank account. |
| **SMS Gateways** | `Development Log` stores messages in database logs only (no real SMS sent). | Sends real SMS and OTP messages directly to recipient phones with approved Sender ID. |

---

## 1. PayHere (Sri Lanka: Visa, Mastercard, eZ Cash, mCash, FriMi, Genie)

PayHere is Sri Lanka's leading Central Bank-approved aggregator.

### Step 1: Open and Verify a Merchant Account
1. Visit [payhere.lk](https://www.payhere.lk) and click **Sign Up**.
2. Complete business registration (submit Business Registration - BR, Director NIC, and Bank Account statement/cancelled cheque).
3. Wait for PayHere account verification and activation.

### Step 2: Switch to Live Mode in PayHere
1. Log in to the [PayHere Merchant Portal](https://merchant.payhere.lk).
2. At the top of the PayHere dashboard, make sure you are in **Live Mode** (toggle off Sandbox mode).

### Step 3: Add Your Website Domain & Get Credentials
1. In the PayHere Merchant Portal menu, go to **Settings → Domains & Credentials**.
2. Click **Add Domain** and enter your live website domain (e.g. `portal.yourdomain.lk` or `jeewanasaviya.lk`).
3. PayHere will generate:
   * **Merchant ID** (a 6-digit number, e.g. `123456`)
   * **Merchant Secret** (a long hashed key)
4. Copy both keys.

### Step 4: Configure in Jeewana Saviya Admin
1. Log in to the Admin Console (`/admin`) with a user having `gateways.payment.manage` permission (e.g. Finance Admin or Super Admin).
2. Navigate to **Settings → Payment Gateways**.
3. Click **Configure** on **PayHere**.
4. In **Status & mode**:
   * Change **Environment** from `Sandbox` to **`Live`**.
   * Turn **Active at checkout** to **`ON`**.
   * (Optional) Turn **Default gateway** to **`ON`** if you want PayHere pre-selected.
5. In **API credentials**:
   * Enter your live **Merchant ID**.
   * Enter your live **Merchant Secret**.
6. In **Webhook / Notify URL**:
   * Copy the generated Webhook URL (e.g. `https://yourdomain.lk/api/webhooks/payments/payhere`).
   * (PayHere automatically passes this as `notify_url`, but ensure your domain is whitelisted in PayHere settings).
7. Click **Save gateway**.
8. **Verify:** Open the Member Checkout page (`/portal/billing` or checkout). The **"Sandbox"** badge on PayHere will be gone.

---

## 2. Stripe (International Visa, Mastercard, American Express)

Stripe is ideal for expatriate and international card payments.

### Step 1: Register and Activate Stripe Account
1. Visit [stripe.com](https://stripe.com) and sign up.
2. Complete business verification and link your company bank account.
3. In the top right corner of the Stripe Dashboard, turn off **Test mode** (switch to **Live**).

### Step 2: Retrieve Live API Keys
1. In Stripe Dashboard, go to **Developers → API Keys**.
2. Copy the **Publishable key** (`pk_live_...`).
3. Click **Reveal live key** and copy the **Secret key** (`sk_live_...`).

### Step 3: Create a Webhook Endpoint
1. In Stripe Dashboard, go to **Developers → Webhooks**.
2. Click **Add an endpoint**.
3. In **Endpoint URL**, paste the Webhook URL provided in the Jeewana Saviya Stripe gateway drawer:
   `https://yourdomain.lk/api/webhooks/payments/stripe`
4. Under **Select events to listen to**, choose:
   * `checkout.session.completed`
   * `checkout.session.expired`
5. Click **Add endpoint**.
6. Under **Signing secret**, click **Reveal** and copy the key (`whsec_...`).

### Step 4: Configure in Jeewana Saviya Admin
1. Go to **Settings → Payment Gateways → Stripe → Configure**.
2. Set **Environment** to **`Live`**.
3. Turn **Active at checkout** to **`ON`**.
4. Paste:
   * **Publishable Key**: `pk_live_...`
   * **Secret Key**: `sk_live_...`
   * **Webhook Signing Secret**: `whsec_...`
5. Click **Save gateway**.
6. Check the checkout page: the **"Sandbox"** badge will be removed.

---

## 3. WebXPay (Sri Lanka: Visa, Mastercard, Sampath Vishwa, etc.)

### Step 1: Sign Up with WebXPay
1. Visit [webxpay.com](https://webxpay.com) and contact their sales/onboarding team.
2. Complete merchant underwriting and bank integration.

### Step 2: Retrieve Live Production Keys
1. Log in to your WebXPay Merchant Backoffice in **Live / Production** mode.
2. Under **Integration / API Settings**, obtain:
   * **Secret Key**
   * **RSA Public Key (PEM format)** (begins with `-----BEGIN PUBLIC KEY-----` and ends with `-----END PUBLIC KEY-----`).

### Step 3: Configure in Jeewana Saviya Admin
1. Go to **Settings → Payment Gateways → WebXPay → Configure**.
2. Set **Environment** to **`Live`**.
3. Turn **Active at checkout** to **`ON`**.
4. Enter your live **Secret Key**.
5. Paste the complete **RSA Public Key** including headers and line breaks.
6. Click **Save gateway**.
7. The **"Sandbox"** badge will disappear from checkout.

---

## 4. Manual Bank Transfer / Slip Upload

Allows members to pay directly to the society's bank account via online banking, CDM, or bank branch, then upload a photo or PDF of the receipt.

### Configuration Steps:
1. In Admin Console, go to **Settings → Payment Gateways**.
2. Click **Configure** on **Manual Bank Transfer** (or Bank Transfer).
3. Turn **Active at checkout** to **`ON`**.
4. Enter the actual bank details:
   * **Bank Name**: e.g. `Commercial Bank of Ceylon PLC`
   * **Account Name**: e.g. `Jeewana Saviya Welfare Society`
   * **Account Number**: e.g. `1000123456`
   * **Branch**: e.g. `Colombo 03 / Head Office`
   * **SWIFT Code**: (e.g. `CCEYLKFX` for foreign transfers, or leave blank)
   * **Additional Instructions**: e.g. *"Please deposit the exact membership fee. Use your Invoice Number or Mobile Number as the payment reference and upload the deposit receipt below."*
5. Click **Save gateway**.
6. When members pay with this method, an invoice with status `awaiting_approval` is created and staff receives an instant notification upon slip upload.

---

## 5. Notify.lk (Sri Lanka Bulk SMS Gateway)

Notify.lk provides cost-effective, high-reliability local SMS in English, Sinhala, and Tamil.

### Step 1: Create Account & Top Up
1. Visit [notify.lk](https://app.notify.lk) and register an account.
2. Top up your account balance via card or bank transfer.

### Step 2: Request Approved Sender ID (Mask)
1. In the Notify.lk dashboard, go to **Sender IDs → Request Sender ID**.
2. Enter your desired Sender ID (up to 11 alphanumeric characters, e.g. `JEEWANASV`).
3. Upload TRCSL authorization letter if requested.
4. Wait for operator approval (until approved, you can test with `NotifyDEMO`).

### Step 3: Get API Keys
1. In Notify.lk dashboard, go to **Settings → API Keys**.
2. Note down:
   * **User ID** (e.g. `12345`)
   * **API Key** (e.g. `abc123xyz456...`)

### Step 4: Configure in Jeewana Saviya Admin
1. Go to **Settings → SMS Gateways**.
2. Click **Add gateway** (or configure existing **Notify.lk**).
3. In **Sender ID / Mask**, enter your approved Sender ID (or `NotifyDEMO` during initial setup).
4. Enter:
   * **User ID**: Your Notify.lk User ID
   * **API Key**: Your Notify.lk API Key
5. Turn **Active** to **`ON`**.
6. Click **Save gateway**.
7. Click **Set Primary** on the Notify.lk card to make it the default provider.
8. Click **Test SMS**, enter your personal mobile number (e.g. `0771234567`), enter a test text, and verify receipt on your phone.

---

## 6. Dialog eSMS (Dialog Axiata Corporate Gateway)

### Step 1: Enterprise Contract
1. Contact Dialog Axiata Enterprise team at [esms.dialog.lk](https://esms.dialog.lk).
2. Sign the corporate SMS agreement and register your business Sender Mask.
3. Dialog will provide your corporate portal credentials (Username & Password).

### Step 2: Configure in Jeewana Saviya Admin
1. Go to **Settings → SMS Gateways → Dialog eSMS → Configure**.
2. In **Sender ID / Mask**, enter your approved Dialog Sender Mask.
3. Enter:
   * **Username**: Your Dialog eSMS API username
   * **Password**: Your Dialog eSMS API password
   * **API Base URL**: `https://esms.dialog.lk/api/v2` (default)
4. Turn **Active** to **`ON`**.
5. Click **Save gateway**.
6. Click **Test SMS** to verify delivery.

---

## 7. Custom HTTP / REST Webhook Gateway (ShoutOUT, SMS.lk, etc.)

If you choose any other SMS provider (e.g. ShoutOUT, Textware, SMS.lk, Semaphore, Infobip):

1. Go to **Settings → SMS Gateways → Add gateway → Custom HTTP / REST**.
2. Provide your **Sender ID** and **Credentials** (API Key, Username, or Password).
3. Fill in the driver settings from the provider's API manual:
   * **Endpoint URL**: e.g. `https://api.provider.lk/v1/sms/send`
   * **HTTP Method**: `POST` or `GET`
   * **Payload Format**: `json`, `form`, or `query`
   * **Headers**: e.g. `Authorization` → `Bearer {api_key}`
   * **Payload Mapping**:
     * `to` → `{to}` (or `recipient` → `{to_local}`)
     * `message` → `{message}`
     * `from` → `{sender}`
   * **Success Indicator**: e.g. `success` or `200`
4. Click **Save gateway** and run **Test SMS**.

---

## 8. Final Production Checklist (Turning Off Demo / Sandbox)

Before launching the portal to members:

- [ ] **Turn off `Development Log` SMS Driver**:
  * In **Settings → SMS Gateways**, click Configure on **Development Log**.
  * Turn **Active** to **`OFF`**, and Save.
  * Ensure a live gateway (e.g. Notify.lk or Dialog) is set as **Primary**.
  * (Optional) Set a secondary provider as **Fallback** for 100% uptime redundancy.
- [ ] **Verify Payment Gateways are Live**:
  * In **Settings → Payment Gateways**, confirm all active payment gateways show **`Live`** mode.
  * Confirm that the **"Sandbox"** badge is no longer displayed on `/portal/billing` or the checkout screen.
  * Inactive gateways (methods you do not want to offer) have **Active at checkout** turned **`OFF`**.
- [ ] **Run an End-to-End Test**:
  1. Register a test member with a real mobile number.
  2. Verify the 6-digit SMS OTP arrives on the phone.
  3. Proceed to Checkout and perform a minimal live payment (e.g. LKR 100 or test bank slip).
  4. Verify payment approval, real-time Bell notification, and SMS receipt delivery.
