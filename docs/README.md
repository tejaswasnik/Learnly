# Learnly

A course marketplace. Instructors publish video courses; students buy them with Razorpay (or enroll free) and watch every lecture in one player. Lecture videos are served through signed, expiring ImageKit URLs and only to enrolled students.

## Requirements
- Node.js 20+
- MongoDB (local or Atlas)
- ImageKit account (public/private key, URL endpoint)
- Razorpay account in **test mode** (key id and secret)

## Setup
```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign session cookies |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | Thumbnails, direct video upload, signed URLs |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Checkout (use `rzp_test_` keys) |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhook deliveries (a different secret from the key secret) |
| `APP_URL` | Public origin, used for sitemap, metadata and every link in emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Transactional email over SMTP (nodemailer). `SMTP_HOST` and `EMAIL_FROM` are **required in production**; `SMTP_USER` and `SMTP_PASS` go together (leave both empty for a relay that needs no login). `SMTP_PORT` defaults to 587 and `SMTP_SECURE` to true only on port 465. In development leave `SMTP_HOST` empty and emails (with their links) are printed to the server console |
| `CRON_SECRET` | Bearer secret for the scheduled upload cleanup (16+ characters) |
| `DNS_SERVERS` | Optional. Only if `querySrv ECONNREFUSED` appears locally; leave unset in production |

Commands: `npm run dev`, `npm run build`, `npm start`, `npm run lint`. Health check: `GET /health`.

## Folder layout
- `app/` routes: `(site)` pages with navbar and footer, `(auth)` login/register, `(player)` course player, `api/` Route Handlers
- `components/` UI (`ui/`, `landing/`, `course/`, `instructor/`, `student/`, `player/`, `profile/`)
- `lib/server/` config, db, auth, validators, services (courses, lectures, enrollment, imagekit, razorpay); `lib/client/`; `lib/shared/`
- `models/` Mongoose models; `proxy.js` route guards; `docs/` specs; `landing-page/` original HTML reference

## Email verification and password reset
New accounts get a verification email (link valid 24 h, works once). Until verified, a user can browse, sign in and watch what they already own, but **cannot buy or enroll (including free courses), create a course or publish one**; the API answers 403 "Verify your email first" and a banner offers to resend (60 s cooldown, 3 per hour). Admins are exempt.

"Forgot password?" on the login page emails a reset link (valid 1 h, works once; asking again invalidates the previous link). The response is identical whether or not the account exists. Resetting signs out every session, sends a "your password was changed" notice and also marks the email verified. Tokens are stored only as SHA-256 hashes.

**Upgrading an existing database:** accounts created before email verification would all be treated as unverified. Run once:
```bash
MONGO_URI="your-connection-string" node scripts/mark-existing-users-verified.mjs
```
It only touches users that have no `emailVerified` field, so running it again changes nothing.

## Webhook setup
The webhook enrolls students who paid but closed the tab before checkout verification ran.
1. In the Razorpay dashboard (Settings, Webhooks) add `${APP_URL}/api/payments/webhook`. It must be publicly reachable over HTTPS; locally use a tunnel such as ngrok or cloudflared.
2. Subscribe to `payment.captured`, `order.paid` and `payment.failed`.
3. Choose a secret and put the same value in `RAZORPAY_WEBHOOK_SECRET`. Without it the endpoint answers 500.

Deliveries whose signature does not match, or whose amount or currency differs from the stored order, never enroll anyone. Unknown orders and unhandled events get a 200 so Razorpay stops retrying.

## Rate limits
Counters live in the `ratelimits` collection (a TTL index removes finished windows). Over a limit the API answers `429` with a `Retry-After` header.

| Route | Limit |
| --- | --- |
| `POST /api/auth/login` | 10 / 15 min per IP + email, and 50 / 15 min per IP |
| `POST /api/auth/register` | 5 / hour per IP |
| `POST /api/auth/forgot-password` | 5 / hour per IP, and 3 / hour per email |
| `POST /api/auth/reset-password`, `/verify-email` | 10 / hour per IP |
| `POST /api/auth/resend-verification` | 3 / hour per user (plus a 60 s cooldown) |
| `PATCH /api/users/me/password` | 5 / hour per user |
| `POST /api/payments/create-order` | 20 / hour per user |
| `POST /api/payments/verify` | 30 / hour per user |
| `GET /api/lectures/upload-auth` | 60 / hour per user |

The Razorpay webhook and `/health` are not limited. IP limits use the first value of `x-forwarded-for` (then `x-real-ip`). **Your hosting platform must overwrite that header**, otherwise a client can forge it and dodge the limits. If the platform does not forward the client address, every visitor appears as the proxy and shares one bucket.

Logout stores the token's id (`jti`) in the `revokedtokens` collection until the token would have expired, so a copied cookie stops working at once.

## Account deletion
Profile, Danger zone: the user confirms with their password and by typing `DELETE`. The account is **anonymized, not deleted**: name, email, avatar and sign-in are removed (the email is replaced by `deleted-<id>@learnly.invalid`), every session stops working, and the original address can register again as a new account. **Orders and enrollments are kept** because they are payment records. An instructor can delete only if none of their courses has students; their courses, lectures and ImageKit files are then removed. Otherwise the request fails with 409 and nothing changes. Admin accounts cannot be deleted this way.

## Orphan cleanup
Lecture videos go from the browser straight to ImageKit before the lecture is saved, so an abandoned form leaves an orphan file. `POST /api/internal/cleanup-uploads` finds files in `/lectures` and `/courses` that no lecture or course references and are older than 24 hours.
- Auth: `Authorization: Bearer $CRON_SECRET` (set `CRON_SECRET` to a long random string). No cookie access.
- **Dry run by default**: it only reports `{ scanned, referenced, orphans, deleted, skippedRecent, truncated }`. Run that first and read the numbers.
- `?apply=true` deletes, at most 100 files per run (`&max=N`, up to 500). If `truncated` is true, run again.
- A second run started while one is active gets 409.
- Schedule it daily with anything that can send an authenticated POST (your host's cron, GitHub Actions, cron-job.org), for example `curl -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/internal/cleanup-uploads?apply=true"`.

## Demo script
1. Register as an **instructor**, create a course with a thumbnail, add lectures (upload a video, or paste a YouTube link) and mark one as a free preview.
2. Turn **Published** on in the instructor dashboard.
3. Register as a **student**, find the course in the catalog, watch the free preview.
4. Verify the email address from the link in the verification email (console output in development). Then buy with Razorpay test checkout (or enroll if free); the card flips to **Start Course**.
5. Watch every lecture in the player. Buying again is blocked.

## Known limitations
- Rate limiting is a fixed window stored in MongoDB and fails open if the database errors. It is per client IP, so the host must overwrite `x-forwarded-for` (see Rate limits).
- Sessions issued before the logout blacklist existed have no token id and cannot be revoked by logout; they expire within 7 days.
- No Google sign-in.
- Player uses native video controls; YouTube lectures do not auto-advance.
- Prices are INR, USD or EUR.
- No refunds, avatars, lecture progress or admin panel.
- A paid order that Razorpay never confirms (no webhook, no checkout verification) stays `created`; there is no reconciliation job.

## Not yet verified against real services
Phase 2 was built and tested against local mocks (in-memory MongoDB, a mock ImageKit server, signed webhook payloads, console email). These have **not** been run for real and should be checked before launch:
- A Razorpay test payment delivered by a real webhook through a public HTTPS URL, including closing the tab before checkout verification.
- A real verification and reset email through your SMTP provider (authentication, TLS mode, sender domain SPF/DKIM, spam placement).
- Real ImageKit behavior for orphan cleanup (list pagination, `createdAt` values) and for deleting files during account deletion; start with a dry run.
- Rate limiting behind the production proxy, to confirm it forwards the real client IP in `x-forwarded-for`.
- Browser upload of lecture videos straight to ImageKit and real Razorpay checkout (unchanged from the MVP, still mock-only here).
