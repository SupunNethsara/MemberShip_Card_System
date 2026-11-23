# Jeewanasaviya (ජීවනසවිය) — User Manual

**Membership Card Business Portal & Partner Ecosystem**
Version 1.0 · November 2026

---

## Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Public Website (Visitors)](#3-public-website-visitors)
4. [Member Portal (Card Holders)](#4-member-portal-card-holders)
5. [Partner Staff — Verifying a Card](#5-partner-staff--verifying-a-card)
6. [Admin Console Overview](#6-admin-console-overview)
7. [Dashboard](#7-dashboard)
8. [Members](#8-members)
9. [Membership Tiers](#9-membership-tiers)
10. [Payments & Invoices](#10-payments--invoices)
11. [Partner Businesses](#11-partner-businesses)
12. [Offers & Benefits](#12-offers--benefits)
13. [SMS Templates](#13-sms-templates)
14. [SMS Delivery Logs](#14-sms-delivery-logs)
15. [CMS & Localization](#15-cms--localization)
16. [Payment Gateways](#16-payment-gateways)
17. [SMS Gateways](#17-sms-gateways)
18. [Roles & Permissions](#18-roles--permissions)
19. [Staff Accounts](#19-staff-accounts)
20. [Audit Log](#20-audit-log)
21. [Automated Tasks](#21-automated-tasks)
22. [Common Workflows (Step-by-Step)](#22-common-workflows-step-by-step)
23. [Troubleshooting & FAQ](#23-troubleshooting--faq)
24. [Appendix](#24-appendix)

---

## 1. Introduction

Jeewanasaviya (ජීවනසවිය — *ආරක්ෂාව • ඉතුරුම් • වටිනා ජීවන රටාව*) is a membership platform. People buy a membership tier (for example Silver, Gold or Platinum), receive a digital card with a QR code, and use it to get discounts at partner businesses such as hotels, salons, clinics, gyms and shops.

Everything is managed from the **Admin Console**, without code changes:

- Membership tiers, prices and validity periods
- Partner businesses, branches and the offers they provide
- Which tiers unlock which offers
- Website text in **English, Sinhala (සිංහල) and Tamil (தமிழ்)**
- Payment gateways (PayHere, Stripe, WebXPay, bank transfer)
- SMS gateways and SMS message templates
- Staff accounts and exactly what each role is allowed to do

### 1.1 Who uses the system

| User | Where they work | What they do |
|---|---|---|
| **Visitor** | Public website | Browses plans and partners, registers |
| **Member** | Member Portal (`/portal`) | Pays for a plan, shows the digital card, views benefits and invoices |
| **Partner staff** | Card verification page | Scans a member's QR code to confirm the membership |
| **Staff / Admin** | Admin Console (`/admin`) | Runs the business, according to their role |

### 1.2 Default staff roles

| Role | Typical responsibilities |
|---|---|
| **Super Admin** | Full access to everything, including permissions and staff |
| **Operations Manager** | Members, tiers, SMS templates, website content |
| **Partner Manager** | Partner businesses and offers |
| **Finance & Gateways Admin** | Payments, slip approvals, payment and SMS gateway setup, audit log |
| **Support Staff** | Looks up members, payments and SMS history; edits member profiles |
| **Member** | Card holder (no admin access) |

The Super Admin can change any of these in **Roles & Permissions** (Section 18).

---

## 2. Getting Started

### 2.1 Web addresses

| Area | Address (local installation) |
|---|---|
| Public website | `http://localhost:5173` |
| Sign in | `http://localhost:5173/login` |
| Member Portal | `http://localhost:5173/portal` |
| Admin Console | `http://localhost:5173/admin` |

In production, replace `http://localhost:5173` with your own domain.

### 2.2 Signing in

1. Open the website and click **Sign in** (top-right).
2. Enter your email address and password, then click **Sign in**.
3. You are taken to the right place automatically:
   - Staff accounts go to the **Admin Console**.
   - Member accounts go to the **Member Portal**.

> **Demo accounts (local installation only):** the sign-in details for the seeded demo staff and member accounts are in **`docs/Demo_Accounts.pdf`**. They are not shown on the sign-in page. Change or remove these accounts before going live.

### 2.3 Signing out

- **Admin Console:** click the sign-out icon next to your name at the bottom of the left sidebar.
- **Member Portal:** click the sign-out icon at the top-right.

### 2.4 Changing the language

Use the **EN | සිං | தமி** switch in the page header. The page changes language instantly, with no reload. Your choice is remembered on that device.

Where a Sinhala or Tamil translation hasn't been entered yet, the English text is shown instead.

> The Admin Console itself is in English. The language switch applies to the public website and Member Portal.

---

## 3. Public Website (Visitors)

### 3.1 Home page

The home page has these sections, all editable by admins in **CMS & Localization**:

- **Hero**: headline, short description and two buttons (*Become a member* and *Browse partners*), plus live counts of partners, offers and members.
- **How it works**: three steps.
- **Choose your tier**: one card per active tier with price, validity, feature list and number of offers unlocked. Click **Select plan** to start.
- **Compare tiers**: a table showing price, validity, offer count and every live offer, with a tick (✓) or lock (🔒) for each tier.
- **Where your card works**: a preview of partners. Use the tier switch (e.g. *Silver | Gold | Platinum*) to see which offers are **Unlocked** or **Locked** for that tier.
- **Frequently asked questions**: click a question to expand the answer.

### 3.2 Partner directory

Open **Partners** in the top menu.

- **Search** by partner name, city or offer.
- **Filter by category** using the chips (Hotels, Salons, etc.).
- **Choose a tier** from the drop-down to see Unlocked/Locked badges for that tier. Signed-in members see their own tier by default.
- Click the navigation icon on a partner card to open its Google Maps location.

### 3.3 Registering

1. Click **Join now** (or **Select plan** on a tier).
2. Fill in:
   - **Full name**
   - **Email address**
   - **Mobile number**: a Sri Lankan mobile number, e.g. `0771234567`
   - **NIC** (optional)
   - **Preferred language for SMS**: English, Sinhala or Tamil
   - **Password**: at least 8 characters, including letters and numbers
3. Click **Create account**.

You are signed in immediately and taken to checkout. Your permanent **Member ID** (for example `JHMS 1251 3428`) is created now, and a welcome SMS is sent in your chosen language.

### 3.4 Terms & Conditions

The **Terms** page shows the current terms in the selected language.

---

## 4. Member Portal (Card Holders)

The Member Portal has four tabs: **My card**, **Benefits**, **Billing** and **Profile**.

### 4.1 My card

This is the member's digital membership card. It shows:

- Member name
- **Member ID** (e.g. `JHMS 4807 2215`)
- Current **tier**, as a coloured badge
- **Valid until** date
- A **QR code** that partner staff scan to verify the card

The side panel shows how many **days are left**, with buttons to **Renew** or **Upgrade** to a higher tier.

- If the membership expires within 30 days, an amber warning with a **Renew** button appears.
- If the member has no active plan, the card shows **Inactive** and a **Choose a plan** button appears.
- **Print card** prints a physical copy of the card (or saves it as a PDF). Only the card is printed, not the rest of the page:
  - Real bank-card size (CR80, 85.6 × 54 mm) on one A4 page.
  - **Front:** brand, tier badge, name, Member ID, valid-until date and QR code.
  - **Back:** how to use the card, member-since date, Member ID, support phone and email, and terms.
  - Dashed cut guides around both sides. Cut them out, then fold or laminate them back-to-back.
  - Printed in the language currently selected (EN / සිං / தமி).
  - Tip: in the print dialog, keep the scale at **100%** (not "Fit to page") so the card prints at the correct size.
- **Membership history** lists past and current memberships.

> **Using the card at a partner:** open *My card* on your phone and show the QR code at the counter.

### 4.2 Buying, renewing or upgrading (Checkout)

1. Click **Choose a plan**, **Renew** or **Upgrade**.
2. **Step 1, Select tier:** click a tier. The order summary shows whether this is a *New membership*, a *Renewal* or an *Upgrade*.
3. **Step 2, Payment method:** choose one of the active gateways. The default is pre-selected.
4. Click **Proceed to payment**.

What happens next depends on the payment method.

**Card / online payment (PayHere, Stripe, WebXPay)**
1. You are sent to the provider's secure payment page.
2. Complete the payment there.
3. You return to the **payment result** page, which checks the status automatically. Within a few seconds it shows **Payment successful**, and the membership is active straight away.
4. You receive SMS confirmations for the payment receipt and the activation.

**Bank transfer**
1. The bank account details and your **payment reference** (your invoice number) are shown.
2. Transfer the **exact amount** shown, using the invoice number as the reference.
3. Upload a photo or PDF of the deposit slip (JPG, PNG or PDF, max 5 MB) and click **Submit slip**.
4. The invoice status becomes **Awaiting approval**. Once the finance team approves it, the card activates and you receive an SMS.

> You can also upload the slip later from **Billing → Upload slip**.

**How the expiry date is calculated**

| Type | Rule |
|---|---|
| New membership | Starts today and lasts for the tier's validity period |
| Renewal (same tier) | The new period is **added on top of** the current expiry date, so no days are lost |
| Upgrade (higher tier) | The new tier starts today with a fresh validity period. The old membership is closed |

### 4.3 Benefits

Shows the partner offers available to the member.

- **Unlocked only** shows offers your tier includes. **All offers** also shows offers marked **Locked** (available on higher tiers).
- Search by offer, partner or city, and filter by category.
- Each offer shows the partner, the discount (e.g. *25% off*, *LKR 3,000 off*, *Complimentary*), which tiers unlock it, the validity date and its terms.

### 4.4 Billing

Lists every invoice with its number, tier, date, payment method, amount and status.

| Status | Meaning |
|---|---|
| **Paid** | Payment confirmed. Click **Receipt** to download it |
| **Pending** | Checkout started but not completed. For bank transfers, click **Upload slip** |
| **Awaiting approval** | Slip uploaded; waiting for the finance team |
| **Failed** | Payment failed or the slip was rejected. Upload a new slip or try again |
| **Cancelled** | Replaced by a newer checkout |

**Receipts** download as an HTML file. Open it in a browser and click **Print / Save as PDF**.

### 4.5 Profile

Members can update:

- Full name
- Mobile number
- Preferred SMS language (this also changes the portal language)
- Password: enter the current password, then the new password twice

Email address and Member ID can't be changed by the member. Ask support if these need to change.

---

## 5. Partner Staff — Verifying a Card

1. Ask the member to show the QR code from **My card**.
2. Scan it with any phone camera. It opens the **Membership verification** page.
3. Check the result:

| Result | Meaning |
|---|---|
| ✅ **Valid membership** (green) | Membership is active. Check the tier against the offer's requirement |
| ⚠️ **Membership expired** (amber) | Membership has lapsed. Don't apply member pricing |
| ❌ **Not valid / Card not recognised** (red) | Account suspended, or the QR code isn't genuine |

The page shows the member's **name, Member ID, tier and expiry date**, plus the time of the check. Partners may also ask to see photo ID.

---

## 6. Admin Console Overview

### 6.1 Layout

- **Left sidebar:** menu grouped into *Overview*, *Membership*, *Partner ecosystem*, *Communication* and *Settings*. **You only see the menu items your role allows.**
- An amber number next to **Payments & Invoices** shows how many bank slips are waiting for approval.
- At the bottom: **View public site**, your name and roles, and **Sign out**.
- On mobile, open the menu with the ☰ button.

If you open a page your role can't use, you'll see **"You don't have access to this area"**, along with the permission that page needs.

### 6.2 Working with tables

Most admin lists use the same table:

- **Search box:** type to search; results update automatically.
- **Filter pills:** dashed buttons such as *Status* or *Tier*. Choose a value to filter, click × on the pill to clear it, or click **Clear filters**.
- **Sorting:** click a column heading that has the ⇅ icon. Click again to reverse the order, a third time to reset.
- **Pagination:** at the bottom you can change rows per page (10–100) and move between pages.
- **Row click:** where available, clicking a row opens its details in a side panel.

### 6.3 Side panels and dialogs

- Editing usually opens a **side panel** from the right. Save with the button at the bottom, or close with **×** or the **Esc** key.
- Delete actions always ask for **confirmation** first.
- Short messages (toasts) confirm success or explain an error in the bottom-right corner.

### 6.4 Entering text in three languages (Multilingual Input)

Fields such as tier names, offer titles and website text have tabs: **EN | සිං | தமி**.

- Click a tab to type that language.
- **✓ (green tick):** a translation has been entered.
- **● (grey dot):** no translation yet; English will be shown to visitors.
- **⚠ (red icon):** that language has a validation error.
- **English is required.** Sinhala and Tamil are optional but recommended.
- Some fields show a character counter (e.g. `27/80`).

---

## 7. Dashboard

**Permission:** `dashboard.view`

| Item | Description |
|---|---|
| **Active members** | Members with a current, unexpired plan, plus how many joined this month |
| **Total revenue** | All paid invoices, this month's total, and the % change from last month |
| **Expiring in 30 days** | Active memberships ending within 30 days |
| **Active partners** | Partner businesses currently active |
| **SMS sent (month)** | SMS segments sent this month, plus any failures |
| **Revenue chart** | Paid revenue per month for the last 12 months. Hover a bar for the exact value |
| **Active members by tier** | Distribution across tiers |
| **Membership growth** | New memberships activated per month |
| **Recent payments** | The latest paid invoices |

If bank slips are waiting, an amber banner appears with a **Review** button.

The dashboard refreshes automatically every minute.

> Staff without dashboard access are taken straight to the first page they can use (for example, Members).

---

## 8. Members

**Permissions:** `members.view`, `members.create`, `members.update`, `members.delete`, `members.override`

### 8.1 Finding members

- **Search** by name, email, mobile number, Member ID or NIC.
- **Status filter:** Active · Expiring ≤ 30d · Expired · No plan · Suspended
- **Tier filter:** members currently on a specific tier.
- Sortable by name, Member ID and join date.

### 8.2 Member details

Click a member to open their profile panel:

- Current tier, expiry date (with days left) and account status
- **Profile** tab: contact details, SMS language, join date, last login
- **Memberships** tab: full membership history, including how each one started (payment, renewal or manual) and any notes
- **Invoices** tab: recent invoices
- **SMS** tab: messages sent to this member, with their status

### 8.3 Adding a member

1. Click **Add member**.
2. Enter name, email, mobile, NIC (optional), SMS language and a temporary password.
3. Choose whether to **Send welcome SMS**.
4. Click **Create member**.

The member is created **without a plan**. To give them one without payment, use a Manual Override (8.5).

### 8.4 Editing, suspending and deleting

- **Edit profile:** change contact details, SMS language or reset the password.
- **Suspend:** blocks the member from signing in, signs them out everywhere, and makes their card show *Not valid*. Click **Reactivate** to undo.
- **Delete:** permanently removes the member, including memberships and invoices. This **cannot be undone**.

### 8.5 Manual membership override

Use this to grant, change, extend or cancel a membership **without payment**, for example a VIP, a goodwill gesture, or a correction.

1. Open the member and click **Override membership**.
2. Choose the **Action**:
   - **Grant / replace active membership:** choose a **Tier**, a **Start date**, and optionally an **Expiry date**. If you leave the expiry blank, the tier's standard duration is used.
   - **Cancel current membership:** ends the active membership.
3. Enter a **Reason**. This is required and is saved in the Audit Log.
4. Optionally tick **Send 'Membership Activated' SMS**.
5. Click **Apply override**.

Every override is recorded in the **Audit Log**, with who made it, the before/after values and the reason.

### 8.6 Member Cards — print queue

**Menu:** Membership → **Member Cards** · **Permissions:** `cards.view` (see queue & history), `cards.print` (preview, print, reprint), `cards.issue` (mark as handed over).

Physical PVC cards (CR80, 85.6 × 54 mm) are printed by staff. Only members with an **active account and a current membership** appear here — the system refuses to generate a card for anyone else.

**Card status**

| Status | Meaning |
|---|---|
| **Pending print** | Card needs printing — a new member, or *Reprint due* after a renewal / upgrade / manual override (the printed tier or validity changed) |
| **Printed** | Printed and confirmed by staff, waiting to be handed over |
| **Issued** | Handed over to the member |

**Print one card**
1. Click **Preview & print** on the row (or **Preview & print card** in the member's profile on the *Members* page).
2. Check the front and back preview (name, Member ID, NIC, joined date, valid until, tier and QR code).
3. Choose the layout: **Card printer · CR80** (one card per page, for PVC card printers) or **A4 sheet**. Toggle **Print back side** as needed.
4. Click **Print**. In the browser print dialog keep scale at **100%**, margins **None**, and enable **Background graphics**.
5. When printing finishes, the window asks **"Did the card print correctly?"** → **Yes, mark as printed**. Nothing changes until you confirm.

**Bulk print**
1. Tick members (or the header box for the whole page) → **Bulk print selected**.
2. **A4 sheet** places **10 cards per page** (2 × 5) with dashed cut guides. With *Print back side* on, a back page follows each front page, mirrored for **long-edge duplex** so each back lands behind its front.
3. Print, then confirm to mark all as printed. One batch reference is recorded for the run.

**Reprints** — a card that was printed before shows **Reprint**. Confirming a reprint increases the **Reprints** count and logs who reprinted it.

**Issue** — click **Issue** on a printed card (or select several printed cards → **Mark issued**), optionally add a note (e.g. "Collected at Colombo office, ID checked").

**History** — the clock icon on each row shows every event: queued, printed, reprinted, issued — with staff name, time, batch and what was printed (tier and validity). All print and issue actions also appear in the **Audit Log**.

---

## 9. Membership Tiers

**Permissions:** `tiers.view` (view), `tiers.manage` (create, edit, delete)

Each tier card shows its name in all three languages, price, validity, priority, active member count and number of mapped offers.

### 9.1 Creating or editing a tier

Click **New tier**, or **Edit** on an existing tier.

| Field | Notes |
|---|---|
| **Tier name** | Required in English; add Sinhala and Tamil |
| **Description** | Short text shown on the plan card |
| **Price (LKR)** | Amount charged per period |
| **Validity + Unit** | e.g. `12` Months or `30` Days |
| **Card theme colour** | Pick a swatch or any custom colour. Used on the card, badges and charts |
| **Priority rank** | Higher number = more premium. Determines plan order and what counts as an *upgrade* |
| **Feature bullets** | Add, edit or remove bullet points (multilingual) |
| **Active** | Inactive tiers are hidden from the website and checkout |
| **Highlight as Most popular** | Shows the *Most popular* label on the website |

### 9.2 Deleting a tier

A tier that has ever had memberships **can't be deleted**, to protect history. Turn **Active** off instead.

---

## 10. Payments & Invoices

**Permissions:** `payments.view` (view), `payments.manage` (approve or reject)

### 10.1 Summary cards

- **Collected (all time):** total of paid invoices
- **Awaiting slip approval:** bank transfers waiting for review
- **Open checkouts:** invoices that were started but not completed

### 10.2 Invoices tab

Search by invoice number, member name, email or Member ID. Filter by **Status** and **Gateway**.

| Status | Meaning |
|---|---|
| Pending | Checkout started, not yet paid |
| Awaiting approval | Bank slip uploaded; needs review |
| Paid | Payment confirmed; membership activated |
| Failed | Payment failed or slip rejected |
| Cancelled | Replaced by a newer checkout from the same member |

### 10.3 Invoice details

Click an invoice to see:

- Member, plan, type (new / renewal / upgrade), gateway, amount and dates
- The uploaded **deposit slip** (images show inline; PDFs open in a new tab)
- A **transaction log**: a timeline of every gateway event (initiate, webhook, return, manual) with its result. Click **View raw payload** to see the exact data received from the gateway.

### 10.4 Approving a bank transfer

1. Open an invoice with status **Awaiting approval**.
2. Compare the slip with your bank statement: amount, date and reference (the invoice number).
3. Click **Approve & activate**.

The system then:
- marks the invoice **Paid**;
- activates, renews or upgrades the membership;
- sends the **Payment Receipt** and **Membership Activated/Renewed** SMS;
- records the approval in the Audit Log.

### 10.5 Rejecting a payment

1. Click **Reject**.
2. Enter a reason (e.g. *"Amount on slip doesn't match invoice"*).
3. Click **Reject payment**.

The invoice becomes **Failed**. The member can upload a new slip from Billing.

### 10.6 Gateway transactions tab

A technical log of every gateway event, showing time, invoice, gateway, event type, reference, result and message. Filter by result: success, initiated, pending, failed or **invalid signature**.

> **Invalid signature** means a payment notification failed the security check and was **ignored**. Repeated occurrences may mean wrong credentials or a fraud attempt.

---

## 11. Partner Businesses

**Permissions:** `partners.view` (view), `partners.manage` (create, edit, delete, categories)

### 11.1 Partner list

Shows logo, name, category, city, contact, number of offers (click the number to see them) and status. Filter by **Category** and **Status**.

### 11.2 Adding or editing a partner

Click **Add partner**, or click a row.

| Field | Notes |
|---|---|
| **Logo** | PNG, JPG or WebP, square, max 2 MB. Click the box to upload; **Remove logo** to clear it |
| **Business name** | Multilingual; English required |
| **Description** | Multilingual |
| **Business category** | e.g. Hotels & Resorts |
| **Contact person, Phone, Email, Website** | Contact details |
| **City, Head office address** | Location |
| **Google Maps link** | Paste a Maps URL; members get a *Directions* button |
| **Branch locations** | Click **Add branch** for each outlet (name, city, address, phone, Maps link) |
| **Active** | Inactive partners and all their offers are hidden everywhere |
| **Featured** | Shown first in the public directory |

### 11.3 Deleting a partner

Deleting a partner also deletes **all its offers and branches**. To pause a partner temporarily, turn **Active** off instead.

### 11.4 Business categories

Click **Categories** to manage them:

- Add a category: multilingual name, plus an icon from the icon picker.
- Click ✎ to edit or 🗑 to delete. Partners in a deleted category become *uncategorised*.

---

## 12. Offers & Benefits

**Permissions:** `offers.view` (view), `offers.manage` (create, edit, delete)

### 12.1 Offer list

Shows offer title, partner, benefit, the tiers that unlock it, validity and status (**Active**, **Inactive** or **Expired**). Filter by **Partner**, **Tier** and **Status**.

### 12.2 Creating or editing an offer

Click **New offer**, or click a row.

1. **Partner business:** who provides the offer.
2. **Offer title:** multilingual, e.g. *"25% off room rates"*.
3. **Benefit type:**
   - **Percentage:** enter 1–100 (e.g. `25` → *25% off*)
   - **Fixed LKR:** enter an amount (e.g. `3000` → *LKR 3,000 off*)
   - **Complimentary:** a free item or service; no value needed
4. **Unlocked for tiers:** tick each tier that gets this offer, or use **All tiers**. **At least one tier is required.**
5. **Starts / Ends:** optional dates. Leave *Ends* blank for an ongoing offer.
6. **Description** and **Terms & conditions:** multilingual.
7. **Active:** turn off to hide the offer without deleting it.
8. Click **Create offer** / **Save offer**.

> An offer is visible to members only when it is **Active**, today's date is **within its dates**, and its **partner is active**.

---

## 13. SMS Templates

**Permissions:** `sms.templates.manage` (edit); `gateways.sms.view` (view only)

Templates are the messages sent automatically on each event:

| Event | When it's sent |
|---|---|
| Registration Welcome | A new member registers (or is added with *Send welcome SMS*) |
| Payment Receipt | A payment is confirmed |
| Membership Activated | A new or upgraded membership starts (or a manual override with SMS ticked) |
| Expiry Reminder (7 Days) | Automatically, 7 days before expiry |
| Membership Renewed | A renewal is confirmed |
| One-Time Password | Reserved for verification codes |

### 13.1 Editing a template

1. Choose a template from the list on the left.
2. Choose a language tab (**English / සිංහල / தமிழ்**). An amber dot means that language is missing and English will be sent.
3. Edit the text. Click a **variable** chip to insert it at the cursor.
4. Check the **Preview**: it shows the message with sample data, the character count, the encoding and the number of SMS segments.
5. Use the toggle at the top-right to enable or disable the template.
6. Click **Save template**.

### 13.2 Variables

| Variable | Replaced with |
|---|---|
| `{member_name}` | Member's full name |
| `{member_id}` | Member ID, e.g. JHMS 1251 3428 |
| `{tier_name}` | Tier name in the member's language |
| `{expiry_date}` | Expiry date (YYYY-MM-DD) |
| `{amount}` | Payment amount |
| `{invoice_no}` | Invoice number |
| `{otp_code}` | One-time code |
| `{site_name}` | Brand name from Site settings |

### 13.3 SMS length and cost

- Messages in English (GSM-7): **160** characters for one segment, then 153 per segment.
- Messages in Sinhala or Tamil (Unicode): **70** characters for one segment, then 67 per segment.
- Providers charge **per segment**. Keep messages short, especially in Sinhala and Tamil. The preview turns amber when a message needs more than 2 segments.

---

## 14. SMS Delivery Logs

**Permission:** `sms.logs.view`

Every SMS attempt is recorded, including retries on the fallback gateway.

- **Summary cards:** delivered to provider, failed, segments this month.
- **Columns:** sent time, recipient, event, message, gateway, status (**Sent** / **Failed**), provider response.
- **Filters:** status, event and gateway. Search by number, member or message text.
- Click a row to see the full message and the formatted provider response.
- The page refreshes every 30 seconds.

> **Sent** means the provider **accepted** the message. Final delivery to the handset depends on the provider and network.

---

## 15. CMS & Localization

**Permissions:** `cms.view` (view), `cms.manage` (edit)

Changes go live **immediately**; no deployment is needed. Click **View site** to check them.

### 15.0 Hero slides tab

The large banner at the top of the home page is a slider. Each slide has a **badge**, **headline**, **sub-headline**, two **buttons** (label + link) and a **background image**, all in EN / සිං / தமி.

- **Add slide** / ✎ edit / 🗑 delete; ↑ ↓ change the order; the toggle publishes or hides a slide.
- **Gold words:** wrap words in `*asterisks*` in the headline, e.g. `One card for your *family’s* protection` — the starred word shows in gold.
- **Links:** use a site path (`/register`, `/partners`, `/#plans`) or a full `https://` link.
- **Background image:** wide artwork (about 1800 × 860), with the left ~45% dark and empty so the text stays readable. It is shown on desktop screens; phones and tablets show solid navy so the text is always legible. *Use default* restores the standard artwork.
- Slides change every 7 seconds and pause while a visitor hovers or uses the keyboard. With only one active slide, the arrows and dots are hidden.
- The live numbers under the buttons (partners, offers, members) update automatically.

### 15.1 Page content tab

Editable blocks are grouped by section: *Homepage hero*, *How it works*, *Contact info*, *Terms & Conditions* and *Footer*. Each block has an EN / සිං / தமி editor.

- A warning at the top counts any missing Sinhala or Tamil translations.
- When you change something, a bar appears at the bottom: **Discard** or **Publish changes**.

**Terms & Conditions formatting:** separate sections with a blank line. The first line of each section is shown as its heading.

### 15.2 FAQs tab

- **Add FAQ:** enter the question and answer in each language, and choose whether it's **Published**.
- Use ↑ ↓ to change the order.
- The EN / SI / TA chips show which translations are complete (green) or missing (amber).
- Use ✎ to edit and 🗑 to delete.

### 15.3 Site settings tab

| Setting | Used for |
|---|---|
| **Site / brand name** | Header, footer, digital card, receipts and the `{site_name}` SMS variable |
| **Support email** | Footer and receipts |
| **Support phone** | Footer and receipts |

**Brand logo** (same tab): upload a **Full logo** (shown in the home page hero, footer and receipts) and a **Square mark** (shown at small sizes: header, digital card, printed card). PNG, JPG or WebP only. Click **Upload logo** to publish. The brand name and tagline in each language are edited under **Page content › Brand name & tagline**.

**Footer: contact & social media** (same tab): everything shown in the website footer.

- **Social media:** Facebook, Instagram, YouTube, TikTok, LinkedIn and X — paste the full `https://` link to your page. **WhatsApp:** enter the number with country code (e.g. `+94 77 123 4567`); visitors tap it to open a WhatsApp chat. Leave any field empty to hide that icon.
- **Additional emails & phone numbers:** click **Add contact**, choose **Email** or **Phone**, enter it, and optionally add a label in EN / සිං / தமி (e.g. *Partnerships*, *Hotline*). Use ↑ ↓ to set the order, 🗑 to remove. Up to 12 contacts.
- The main **Support email** and **Support phone** above always appear first; the office address and hours come from **Page content › Contact info**.
- Click **Save footer** — changes are live immediately. Emails open the visitor's mail app and phone numbers can be tapped to call.

---

## 16. Payment Gateways

**Menu:** Settings → Payment Gateways
**Permissions:** `gateways.payment.view` (view), `gateways.payment.manage` (configure)

### 16.1 Gateway list

Each gateway shows its name, **Default** badge, **Sandbox/Live** mode, configuration status and transaction count.

- **Active toggle:** shows or hides the gateway at checkout.
- **↑ ↓ arrows:** change the order members see.
- **Configure:** opens the settings panel.

### 16.2 Supported gateways

| Gateway | Use | Credentials needed |
|---|---|---|
| **PayHere** | Sri Lankan cards, eZ Cash, mCash, bank | Merchant ID, Merchant Secret |
| **Stripe** | International cards, Apple Pay, Google Pay | Secret Key, Webhook Signing Secret (Publishable Key optional) |
| **WebXPay** | Sri Lankan cards and wallets | Secret Key, RSA Public Key (PEM) |
| **Manual Bank Transfer** | Offline transfer with slip upload | None; enter the bank account details |

### 16.3 Adding a gateway

1. Click **Add gateway** and choose a driver.
2. It is created **inactive** in **Sandbox** mode, and the configuration panel opens.

### 16.4 Configuring a gateway

**Status & mode**
- **Environment:** *Sandbox* (test) or *Live* (real money). A warning appears when switching to Live.
- **Active at checkout:** members can choose it.
- **Default gateway:** pre-selected at checkout. Only one gateway can be the default.

**Internal name, Display order and Label shown to members** (the label is multilingual).

**API credentials**
- Enter the values from your provider's merchant dashboard.
- Credentials are **encrypted** before they're stored.
- Saved credentials show **"Stored · encrypted"** and are masked (e.g. `••••••••••••1234`). Nobody can view the full value again.
- **Leave a field blank to keep the stored value.** Type a new value only when replacing it.

**Bank account details** (Manual Bank Transfer only): bank name, account name, account number, branch, SWIFT code and extra instructions. Members see these at checkout.

**Webhook / Notify URL**
- Click **Copy** and paste the URL into your provider's dashboard so payments are confirmed automatically.
- **Stripe:** create a webhook endpoint with this URL and subscribe to `checkout.session.completed` and `checkout.session.expired`.
- **PayHere:** the URL is sent automatically with each payment, but you must add your domain in the PayHere merchant portal.
- **WebXPay:** also shows a **Return URL**.

Click **Save gateway**.

> **Important:** for webhooks to work, the API must be reachable from the internet over HTTPS. Online payments won't confirm automatically on a local computer; use Bank Transfer for local testing.

### 16.5 Deleting a gateway

Old invoices keep their history, but members can no longer pay with that gateway.

---

## 17. SMS Gateways

**Menu:** Settings → SMS Gateways
**Permissions:** `gateways.sms.view` (view), `gateways.sms.manage` (configure and test)

### 17.1 SMS service switch

The **SMS service enabled / paused** toggle turns all **automated** SMS on or off. Test messages still work while it is paused.

### 17.2 Delivery chain

Shows **Primary → Fallback**. Every automated SMS tries the **Primary** gateway first. If that fails, it automatically retries on the **Fallback**.

### 17.3 Supported providers

| Driver | Credentials | Notes |
|---|---|---|
| **Notify.lk** | User ID, API Key | Supports Sinhala/Tamil Unicode |
| **Dialog eSMS** | Username, Password | Optional custom API base URL |
| **Mobitel eSMS (HTTP)** | Username, Password | Optional custom endpoint |
| **Hutch BSMS (HTTP)** | Username, Password | Optional custom API base URL |
| **Twilio** | Account SID, Auth Token | Optional Messaging Service SID |
| **Custom HTTP / REST** | Optional API key, username, password | Connect any provider (see 17.5) |
| **Log (Development)** | None | Writes messages to the application log instead of sending them |

### 17.4 Configuring a gateway

1. Click **Add gateway** and choose a provider, or click **Configure** on an existing one.
2. Enter a **Name** and the **Sender ID / Mask**. The Sender ID must be approved by your provider.
3. **Routing:** turn on **Active**, and choose **Primary** or **Fallback**. Only one gateway can be each.
4. **Credentials:** encrypted and masked, like payment gateways. Leave a field blank to keep the stored value.
5. Click **Save gateway**.

### 17.5 Custom HTTP / REST gateway

Use this for providers not listed above.

| Setting | Example |
|---|---|
| Endpoint URL | `https://api.provider.lk/send` |
| HTTP Method | GET, POST or PUT |
| Payload Format | `json`, `form` or `query` (GET always uses query) |
| Headers | `Authorization` = `Bearer {api_key}` |
| Payload Mapping | `to` = `{to}`, `text` = `{message}`, `from` = `{sender}` |
| Success Indicator | Text expected in the response, e.g. `"status":"ok"`. Leave blank to accept any 2xx response |

**Placeholders:** `{to}` (e.g. 94771234567), `{to_local}` (e.g. 0771234567), `{message}`, `{sender}`, `{api_key}`, `{username}`, `{password}`.

### 17.6 Send test SMS

1. Choose a **Gateway**.
2. Enter a **Mobile number**.
3. Optionally type a **Message**. The character count and encoding are shown.
4. Click **Send test**.

The **Response log** shows the result, the response time, the HTTP status and the provider's raw response. Use it to diagnose credential or Sender ID problems. Each test is also recorded in SMS Delivery Logs and the Audit Log.

> Phone numbers are converted to international format automatically (`0771234567` → `94771234567`).

---

## 18. Roles & Permissions

**Menu:** Settings → Roles & Permissions
**Permissions:** `roles.view` (view), `roles.manage` (change)

### 18.1 The permission matrix

- **Rows:** permissions, grouped by module (Dashboard & Audit, Members, Membership Tiers, Partner Businesses, Offers & Benefits, Payments & Invoices, Payment Gateways, SMS Gateways, CMS & Localization, Roles & Staff).
- **Columns:** roles, with a count of permissions held (e.g. `15/27`).
- The chips above the matrix show how many users hold each role.

### 18.2 Changing permissions

| Control | What it does |
|---|---|
| A cell tick box | Grants or removes one permission for one role |
| Tick box in a **module row** (left) | Grants or removes the whole module for **every** role |
| Tick box in a module row **under a role** | Grants or removes the whole module for **that** role |
| Tick box in a **column header** | Grants or removes **all** permissions for that role |
| ▾ next to a module name | Collapses or expands the module |

A dash (–) means *partially selected*. Changed cells are highlighted in amber.

When there are unsaved changes, an amber bar shows how many. Click **Save matrix** to apply them, or **Discard** to undo. Your browser will warn you if you try to leave with unsaved changes.

> **Super Admin** always has every permission. Its column is locked (🛡).

Changes apply **immediately** across the system, and each save is recorded in the Audit Log with a list of exactly what was added or removed.

### 18.3 Custom roles

1. Click **Custom role**.
2. Enter a name and description.
3. Optionally **Copy permissions from** an existing role as a starting point.
4. Click **Create role**. It appears as a new column in the matrix.

To delete a custom role, click 🗑 on its chip. System roles can't be deleted, and a role still assigned to staff must be removed from those staff first.

### 18.4 Permission reference

| Module | Permission | Allows |
|---|---|---|
| Dashboard & Audit | `dashboard.view` | View the executive dashboard |
| | `audit.view` | View the audit log |
| Members | `members.view` | View members |
| | `members.create` | Add members |
| | `members.update` | Edit member profiles, suspend/reactivate |
| | `members.delete` | Delete members |
| | `members.override` | Manual membership override |
| Membership Tiers | `tiers.view` | View tiers |
| | `tiers.manage` | Create, edit and delete tiers |
| Partner Businesses | `partners.view` | View partners |
| | `partners.manage` | Create, edit and delete partners and categories |
| Offers & Benefits | `offers.view` | View offers |
| | `offers.manage` | Create, edit and delete offers and tier mapping |
| Payments & Invoices | `payments.view` | View invoices and transactions |
| | `payments.manage` | Approve or reject payments |
| Payment Gateways | `gateways.payment.view` | View gateway configuration |
| | `gateways.payment.manage` | Configure gateways and credentials |
| SMS Gateways | `gateways.sms.view` | View SMS gateway configuration |
| | `gateways.sms.manage` | Configure SMS gateways, send tests, SMS on/off switch |
| | `sms.templates.manage` | Edit SMS templates |
| | `sms.logs.view` | View SMS delivery logs |
| CMS & Localization | `cms.view` | View CMS content |
| | `cms.manage` | Edit website content, FAQs and site settings |
| Roles & Staff | `roles.view` | View roles and the matrix |
| | `roles.manage` | Create roles and change the matrix |
| | `staff.view` | View staff accounts |
| | `staff.manage` | Create, edit and delete staff accounts |

---

## 19. Staff Accounts

**Permissions:** `staff.view` (view), `staff.manage` (manage)

### 19.1 Adding a staff member

1. Click **Invite staff**.
2. Enter full name, email, phone and a password (at least 8 characters, with letters and numbers).
3. Set **Status** to *Active*.
4. Tick one or more **Roles**.
5. Click **Create account**, then share the sign-in details securely.

### 19.2 Editing or removing staff

Click a staff member to change their details or roles, reset their password (leave it blank to keep the current one), set them to **Suspended**, or **Delete** them.

### 19.3 Safety rules

- Only a **Super Admin** can grant the Super Admin role, or edit or delete another Super Admin.
- You can't delete your own account, or remove Super Admin from yourself.
- There must always be **at least one Super Admin**.
- Staff accounts can't hold the *Member* role.

---

## 20. Audit Log

**Permission:** `audit.view`

A permanent record of sensitive actions. Entries **cannot be edited or deleted**.

**What is recorded:** permission matrix updates; role changes; staff account creation, role changes and deletion; gateway creation, changes, deletion and **credential changes**; SMS tests and the SMS on/off switch; manual membership overrides; payment approvals and rejections; member suspension and deletion; tier, partner and offer changes; CMS and SMS template updates.

Each entry shows **when**, **what action**, a **description**, **who** did it and their **IP address**. Click an entry for full details: the record affected, the browser used, and the change data (for example, permissions added and removed, or before/after membership values).

Filter by category: Permission updates, Roles, Gateway changes, Manual overrides, Payment approvals, Staff accounts, CMS, Tiers, Partners, Offers.

> For security, **secret values are never written to the audit log**. Only the *names* of the credential fields that changed are recorded.

---

## 21. Automated Tasks

These run automatically when the scheduler is active on the server:

| Task | Schedule | What it does |
|---|---|---|
| Expire memberships | Every hour | Marks memberships past their expiry date as *Expired* |
| Expiry reminders | Daily at 09:00 | Sends the *Expiry Reminder* SMS to members whose plan ends within 7 days (once per membership) |

> **For the technical administrator:** run `php artisan schedule:work` during development. In production, add a cron entry that runs `php artisan schedule:run` every minute. Either task can be run by hand with `php artisan memberships:expire` or `php artisan memberships:remind --days=7`.

---

## 22. Common Workflows (Step-by-Step)

### 22.1 Launch a new tier with partner offers
1. **Membership Tiers → New tier:** enter the name (EN/SI/TA), price, validity, colour and features. Keep it **Active**.
2. **Partner Businesses → Add partner:** add each new partner, with logo, category, branches and Maps link.
3. **Offers & Benefits → New offer:** create each offer and **tick the new tier** (plus any others) under *Unlocked for tiers*.
4. Check the home page: the new tier appears in the plans and the comparison table.

### 22.2 Approve today's bank transfers
1. Click the amber badge on **Payments & Invoices** (or **Review** on the Dashboard).
2. Filter **Status: Awaiting approval**.
3. For each invoice, open it, check the slip against your bank statement, and click **Approve & activate** or **Reject** with a reason.

### 22.3 Switch PayHere from Sandbox to Live
1. **Settings → Payment Gateways → PayHere → Configure.**
2. Enter the **live** Merchant ID and Merchant Secret.
3. Set **Environment: Live**, turn on **Active at checkout**, and optionally **Default gateway**.
4. **Save gateway.**
5. In the PayHere merchant portal, add your website domain.
6. Make a small real payment to confirm it works, and check the result in **Payments & Invoices → Gateway transactions**.

### 22.4 Set up a production SMS provider
1. **Settings → SMS Gateways → Add gateway → Notify.lk** (for example).
2. Enter the credentials and the approved **Sender ID**, set it **Active** and **Primary**, then **Save**.
3. Use **Send test SMS** with your own number in English, then in Sinhala.
4. Configure a second provider as **Fallback**.
5. Turn off **Active** on the *Development Log* gateway.

### 22.5 Give a member a free 3-month extension
1. **Members** → search for the member → open them.
2. **Override membership** → *Grant / replace* → keep the same tier → set **Expires** to 3 months after the current expiry date.
3. Enter the reason, tick **Send SMS** if wanted, then **Apply override**.

### 22.6 Give a new employee limited access
1. If no existing role fits: **Roles & Permissions → Custom role**, copy from the closest role, then adjust the ticks and **Save matrix**.
2. **Staff Accounts → Invite staff:** assign that role.
3. Ask the employee to sign in and confirm they see only the intended menu items.

### 22.7 Update website text for a promotion
1. **CMS & Localization → Page content**.
2. Edit *Hero headline* and *Hero sub-headline* in all three languages.
3. **Publish changes**, then **View site** to check.

---

## 23. Troubleshooting & FAQ

**I can't see a menu item, or I get "You don't have access to this area".**
Your role doesn't include that permission. Ask a Super Admin to grant it in **Roles & Permissions**. The message shows which permission is needed.

**A member paid online but their card isn't active.**
Open the invoice → **Transaction log**.
- No *webhook* entry: the gateway couldn't reach your server. Check that the Webhook URL is set in the provider's dashboard and that the API is reachable over public HTTPS.
- *Invalid signature*: the credentials (e.g. Merchant Secret or Webhook Secret) are wrong or out of date. Re-enter them.
- *Amount mismatch* note: the amount paid differs from the invoice. Investigate before approving manually.

**SMS messages aren't arriving.**
1. Check that **SMS service** is *enabled* on the SMS Gateways page.
2. Check that a gateway is **Active** and set as **Primary**.
3. Use **Send test SMS** and read the provider response.
4. Check **SMS Delivery Logs** for *Failed* entries.
5. Check that the member has a mobile number, and that the template for that event is enabled.
6. If the *Log (Development)* gateway is primary, messages are only written to the log file.

**A member receives English instead of Sinhala or Tamil.**
The template has no translation for that language. Add it in **SMS Templates**. Also check the member's **SMS language** in their profile.

**A tier can't be deleted.**
It has membership history. Turn **Active** off instead.

**An offer doesn't appear for members.**
Check that the offer is **Active**, today's date is within its **Starts / Ends** dates, its **partner is Active**, and the member's tier is ticked under *Unlocked for tiers*.

**A role can't be deleted.**
It's a system role, or staff still hold it. Reassign those staff first.

**I changed a gateway credential. Can I see the old value?**
No. Credentials are encrypted and only shown masked. The Audit Log records which fields changed, but not their values.

**A member forgot their password.**
Staff with `members.update` can set a temporary password using **Members → Edit profile → Reset password**.

**The QR code shows "Not valid" for a paying member.**
Their account may be **Suspended** (check the member's profile), or the membership may have expired. Check **Membership history**.

---

## 24. Appendix

### 24.1 Status colours

| Colour | Meaning |
|---|---|
| 🟢 Green (emerald) | Active, paid, sent, success |
| 🟡 Amber | Pending, awaiting approval, expiring soon, sandbox |
| 🔴 Red (rose) | Failed, expired, suspended, invalid signature |
| ⚪ Grey (slate) | Inactive, disabled, neutral |

### 24.2 Number formats

| Item | Format | Example |
|---|---|---|
| Member ID | `JHMS NNNN NNNN` (8 random digits) | JHMS 1251 3428 |
| Invoice number | `INV-YYYY-NNNNNN` | INV-2026-000128 |
| Phone (stored) | International without + | 94771234567 |
| Currency | LKR, two decimals | LKR 6,500.00 |

### 24.3 File upload limits

| Upload | Allowed types | Max size |
|---|---|---|
| Partner logo | PNG, JPG, WebP | 2 MB |
| Deposit slip | JPG, PNG, PDF | 5 MB |

### 24.4 Security summary

- Passwords are stored hashed; nobody can see them.
- Gateway credentials are encrypted at rest and always shown masked.
- Access is checked three times: on the server route, by a server-side policy, and in the user interface.
- Payment notifications are checked cryptographically before any membership is activated. Each payment can activate a membership only once.
- Sensitive actions are permanently recorded in the Audit Log.
- Suspended accounts are signed out immediately and their cards show as not valid.

### 24.5 Glossary

| Term | Meaning |
|---|---|
| **Tier** | A membership plan (e.g. Gold) with a price, validity and set of benefits |
| **Offer** | A discount or freebie from a partner, unlocked by one or more tiers |
| **Gateway** | A third-party service that processes payments or sends SMS |
| **Sandbox** | A provider's test mode; no real money moves and no real SMS are sent |
| **Webhook** | An automatic, secure message from a payment provider confirming a payment |
| **Sender ID / Mask** | The name shown as the SMS sender (e.g. PRIVILEGE) |
| **Segment** | One billable SMS unit (160 GSM or 70 Unicode characters) |
| **Override** | A staff-made membership change without payment |
| **Primary / Fallback** | The first SMS gateway tried, and the backup used if it fails |

---

*For installation and technical setup, see `README.md` in the project root.*
