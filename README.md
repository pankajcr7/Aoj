# AOJ Punjab — Membership Portal

Online membership portal for the **Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.)**,
Licence No. PB41/253/351836, H.Q. 67-C Ranjit Nagar Near Tiwana Chownk Patiala (147001).

A Junior Engineer opens the registration link, fills the membership form (same fields as the paper form) with a
passport-size photo, and receives a membership number, login ID and password once the Operation Team approves.
New applicants pay their selected membership fee through Razorpay before approval. A physical PVC card can be paid for with membership or after approval.

## Objectives

- Replace paper and WhatsApp onboarding with one secure web flow.
- Give the Operation Team one dashboard to review, approve or reject applications.
- Issue login credentials automatically after approval.
- Give the Admin full control over members, staff and reports.

## Roles

| Role | Sees |
| --- | --- |
| **Admin** | Everything: members, staff accounts, applications, reports |
| **Operation Team** | Application queue: review, approve or reject |
| **Member** | Own profile and membership status |

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | UI and backend in one app, with Server Actions (no separate API layer) |
| Styling | Tailwind CSS v4 + Archivo font | Design tokens live in `globals.css` (dark theme, lime accent) |
| Icons | Phosphor Icons (`@phosphor-icons/react`) | Consistent free icon set; no photos used |
| Database | Neon Postgres (serverless) | Managed Postgres with branching and a free tier |
| ORM | Drizzle ORM + drizzle-kit | Typed SQL and migrations, no runtime overhead |
| Validation | Zod | One schema validates every form on the server |
| Auth | bcryptjs + signed JWT cookie (jose) | Staff-issued credentials only, so no OAuth needed |
| Hosting | Vercel (recommended) | Built for Next.js; Neon has a native integration |

## Structure

```
src/
  app/
    page.tsx                 Landing page (Register Now / Login)
    register/
      page.tsx               Membership form page
      register-form.tsx      Form UI (client)
      actions.ts             Validation + insert (server)
    login/                   Login page + login/logout actions
    dashboard/page.tsx       Role-aware dashboard (protected)
  components/site-header.tsx Logo + header
  db/
    schema.ts                applications, users tables
    index.ts                 Neon + Drizzle client
  lib/session.ts             JWT session cookie
scripts/create-user.mjs      Create admin / operations accounts
drizzle.config.ts
```

## Setup

```bash
npm install
cp .env.example .env          # paste your Neon pooled connection string + a SESSION_SECRET
npm run db:push               # create tables in Neon
npm run user:create -- admin 'StrongPass#1' admin   # first admin; add more staff from the Staff page
npm run dev                   # http://localhost:3000
npm run check                 # self-checks for password/CSV helpers
```

## Membership fees and card requests

The form offers monthly membership at Rs.200/- and yearly membership at Rs.2000/-.
Members may request a card by email and optionally a physical PVC card for a one-time Rs.200/- charge including printing and delivery.
Physical card payment preferences are mutually exclusive: pay now or pay later. Verified payment records are separate from the saved card preference.
Staff can review both choices in the saved form and application list; admin CSV exports include them.
Before deploying against an existing database, run `node scripts/add-pvc-card.mjs` and `node scripts/add-card-preferences.mjs`.
Both migrations are additive and safe to rerun. Older subscription amounts remain valid for corrections to existing applications.

## Dashboards (`/dashboard`)

| Page | Admin | Operation Team | Member |
| --- | --- | --- | --- |
| Overview: stats, review queue, members by zone | ✓ | ✓ | Membership card + details |
| Applications: tabs, search, approve / reject | ✓ | ✓ | |
| Members: list, search, CSV export | ✓ | | |
| Staff: create accounts, reset passwords, turn on/off | ✓ | | |
| Account: change own password | ✓ | ✓ | ✓ |
| Membership card PDF | Any member | Any member | Own card |

Approving an application issues `AOJ-0001`-style membership numbers and a member login (`aoj0001`) with a
generated password, shown once to the reviewer to share. Photos are served only to staff and the member.

## Blood group on membership cards

New applicants select their blood group in Personal Details, including a "Not known" option.
Existing applications can remain blank until an admin updates them. Blood group is shown on the ID card, member details and CSV exports.
Run `node scripts/add-blood-group.mjs` once against an existing database before running this version of the app.

## Corresponding address

New registration forms require a Corresponding Address. Staff can view it, admins can correct it with an audit trail, and it is included in CSV exports. Run `node scripts/add-corresponding-address.mjs` once against an existing database before running this version of the app. Earlier applications can retain a blank address.

## Membership card (PDF)

`/api/card/<applicationId>` returns an A4 PDF with the card at real ID-card size (85.6 x 54 mm): front and back side
by side with crop marks and a fold line. Print at 100%, cut, fold, laminate. Generated by `src/lib/card-pdf.ts`
(pdf-lib). Photos are converted to JPEG in the browser at upload, so any phone photo works and embeds cleanly.

## Email and SMS notifications

| When | Email | SMS |
| --- | --- | --- |
| Application submitted | Confirmation with reference no. | Confirmation with reference no. |
| Approved | Membership no., login ID, password, login button | Membership no., login ID, password |
| Rejected | Full reason | Short reason (DLT limit: 30 characters per variable) |
| Admin resets a member's password | New password | New password |

- Configure in `.env` (see `.env.example`). If a channel is not configured it is skipped, never an error.
- Every attempt is logged in the `notifications` table and shown on the application page under **Messages to applicant**.
- Message content lives in `src/lib/messages.ts`; sending in `src/lib/notify.ts`.

### SMS templates (register on DLT, then in MSG91)

Indian law (TRAI DLT) requires every business SMS text to be pre-approved. Register your sender ID and these
four templates on your DLT portal, add them in MSG91 with the same variable names, and put each template ID in `.env`:

| `.env` key | Template text |
| --- | --- |
| `MSG91_TEMPLATE_RECEIVED` | `Dear ##name##, your AOJ Punjab membership application is received. Ref: ##ref##. You will get your login details after approval. - AOJ Punjab` |
| `MSG91_TEMPLATE_APPROVED` | `Dear ##name##, your AOJ Punjab membership ##number## is approved. Login ID: ##login## Password: ##password## Please change your password after login. - AOJ Punjab` |
| `MSG91_TEMPLATE_REJECTED` | `Dear ##name##, your AOJ Punjab membership application (Ref: ##ref##) was not approved. Reason: ##reason##. Details sent to your email. - AOJ Punjab` |
| `MSG91_TEMPLATE_PASSWORD` | `Dear ##name##, your AOJ Punjab password has been reset. Login ID: ##login## New password: ##password## - AOJ Punjab` |

## Roadmap

- [x] **Phase 1**: landing page, membership form with photo, DB schema, login and sessions
- [x] **Phase 2**: Operation Team review queue, Admin panel, member dashboard, CSV export
- [x] **Phase 3**: email/SMS notifications with delivery log
- [x] **Phase 4**: printable membership card PDF
- [ ] **Next**: login rate limiting, card verification QR code

## Razorpay payments

**Currently paused:** `RAZORPAY_ENABLED` in `src/lib/payment-rules.ts` is `false`. Registration saves applications without creating charges or payment access cookies, payment options and panels are hidden, and staff can approve directly without checking payment. Payment endpoints are disabled. The integration code and existing payment records are retained; set the flag to `true` when ready to restore the flow below.

When online payments are enabled, registration collects Rs.200/- monthly or Rs.2,000/- yearly, plus Rs.200/- only when physical PVC card **pay now** is selected. Email card delivery adds no charge. **Pay later** collects membership now and offers the Rs.200/- card payment on the approved member dashboard. This integration collects one selected membership period; it does not create recurring subscriptions.

1. Run `node scripts/add-payments.mjs` against an existing database before deploying. The additive migration preserves existing applications, which may still be approved without a payment ledger.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` from `.env.example` to `.env.local` or Vercel's Production environment. Use matching test credentials during testing, then live credentials. Keep secret values server-side; never prefix them with `NEXT_PUBLIC_`.
3. In Razorpay Dashboard, enable automatic capture and configure `https://aoj-portal.vercel.app/api/payments/razorpay/webhook` with the same webhook secret. Subscribe to `payment.captured`, `payment.authorized`, `payment.failed`, `order.paid` and `refund.processed`.
4. Redeploy after changing Vercel environment variables. Test the complete flow with Razorpay test mode before switching to live mode.

Applications and charge records are saved atomically before checkout. Cancellation or gateway outages leave the application saved. The original browser can resume at `/register/payment` for seven days using a signed HttpOnly cookie. Approved members access their own card payment through their login. Checkout retries reuse the same order and recover interrupted order creation by its receipt.

The server calculates charges, verifies the checkout signature against its stored order, and fetches the gateway payment to check its amount, currency and capture status. Signed webhooks reconcile captures and refunds; duplicate or older events cannot downgrade confirmed payments. Admins see payment status, amounts and gateway references on applications and CSV exports. If the registration charge is unpaid, reviewers must confirm "Payment is not received. Are you sure you want to accept the application?" before approval. Approval does not mark the charge as paid. Financial choices are fixed once a charge is recorded.

If keys or the webhook secret are missing, checkout displays a temporary-unavailability message; registration remains saved. Payment processing is not active until all three settings are configured.

Run `npm run check:payments` for isolated payment tests; these use mock gateway responses and never charge or notify anyone.
