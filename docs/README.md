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
| `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `EMAIL_FROM` | Email through Gmail with OAuth 2.0 (nodemailer), see **Email setup**. The four `GMAIL_*` values go together and are **required in production**; `EMAIL_FROM` is optional and defaults to `Learnly <GMAIL_USER>`. In development leave them empty and emails (with their links) are printed to the server console |
| `CRON_SECRET` | Bearer secret for the scheduled upload cleanup (16+ characters) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. Enables Sign in with Google, see **Sign in with Google**. Set both or neither; without them the button is hidden and the routes answer 404 |
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

## Email setup (Gmail OAuth 2.0)
Verification, reset and notice emails are sent through Gmail's SMTP server with OAuth 2.0, so no account password is stored anywhere. One-time setup, about 10 minutes:
1. In the [Google Cloud Console](https://console.cloud.google.com/) create or pick a project and enable the **Gmail API**.
2. **OAuth consent screen**: user type External, add the Gmail account that will send the mail. Then **publish the app so its status is "In production"**. While the status is "Testing", Google expires refresh tokens after 7 days and sending stops with `invalid_grant`.
3. **Credentials, Create OAuth client ID**: type Web application, with the authorized redirect URI `https://developers.google.com/oauthplayground`. Copy the client ID and secret.
4. Get a refresh token in the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground): open the settings gear, tick "Use your own OAuth credentials" and paste the client ID and secret; for the scope enter `https://mail.google.com/` (SMTP needs this full scope, `gmail.send` is not enough); authorize with the sending account, then "Exchange authorization code for tokens" and copy the **refresh token**.
5. Set `GMAIL_USER` (the sending address), `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` and `GMAIL_REFRESH_TOKEN`.

Things to know:
- Gmail always sends as the authenticated account (or a "Send mail as" alias you set up). A different `EMAIL_FROM` address is rewritten by Gmail.
- A normal Gmail account allows roughly 500 recipients per day; a Google Workspace account allows more.
- If emails stop with `invalid_grant` in the server log, the refresh token was revoked or expired (app still in "Testing", access removed in the Google account, or unused for six months). Repeat steps 4 and 5.
- Google shows an "unverified app" warning during step 4 for the full mail scope. That is expected for your own account.
- A failed send never blocks sign-up or password reset; the user can resend from the banner.

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

## Sign in with Google
Optional. Login and sign-up show a "Continue with Google" button when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Setup (about 5 minutes):
1. In the [Google Cloud Console](https://console.cloud.google.com/) open **APIs and services, OAuth consent screen**, configure it (External) and publish it. The sign-in scopes (`openid`, `email`, `profile`) need no Google review.
2. **Credentials, Create OAuth client ID**, type Web application. Add the authorized redirect URI `<APP_URL>/api/auth/google/callback` (for example `http://localhost:3000/api/auth/google/callback`; add the production one too).
3. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

How it behaves:
- It is the OAuth 2.0 authorization code flow with PKCE (`arctic`). State and the PKCE verifier live in short-lived httpOnly cookies; the state is compared in constant time before anything is exchanged.
- **Known Google account or email:** the person is signed in. An email match links the Google account and marks the email verified, but only because Google reports that email as verified; an unverified Google email is refused. An email already linked to a different Google account is refused.
- **Brand-new person:** a screen asks Student or Instructor first. The account is created when they choose (pre-verified, with their Google name). Until then their Google identity waits in a signed cookie that expires after 10 minutes.
- **Profile photo:** copied into our ImageKit storage (never hot-linked), only from Google's image host, over https, up to 5 MB. If anything fails the account simply has initials.
- **Password:** Google accounts are created with a random password nobody knows. On the profile they can set one (no "current password" asked) or delete the account with just the confirmation. "Forgot password" also works for them.
- Deleting the account releases the Google link, so the same Google account can sign up again as a new person.
- Rate limits: 30 per hour per IP on the start and callback routes, 10 per hour on account creation.

## Sections and lecture order
Instructors can group lectures into **sections** and put both in any order. On the course's lecture page: **Add section**, then rename, delete, or move sections and lectures with the up and down buttons (they work with the keyboard, and screen readers hear where the item ended up). The lecture form has a **Section** field to move a lecture to another section or out of all sections.
- Order everywhere (course page, player, instructor list, lecture API) is: each section in its order with its own lectures, then lectures with no section last, under the heading "Other lectures". A course with no sections looks exactly as before.
- Deleting a section **keeps its lectures**; they move to the end of the course under "Other lectures".
- A course can have up to 50 sections. Empty sections are visible to the instructor only.
- Courses created before sections existed need no migration: lectures without a position sort by creation date, as they always did, and get explicit positions the first time the instructor reorders.
- API (instructor, course owner only): `POST /api/sections/create`, `PATCH /api/sections/update/:id`, `DELETE /api/sections/:id`, and `POST /api/lectures/reorder` which takes the whole new arrangement (`sectionIds` plus `groups`, a map of section id or `none` to ordered lecture ids). It answers 409 if the arrangement does not match the course as it is now (for example it was changed in another tab), and changes nothing. `sectionId` is also accepted by lecture create and update, and returned with every lecture.

## Profile photo
On the profile page a user can upload a JPEG, PNG or WebP photo (up to 5 MB; type and file signature are checked on the server) or remove it. The photo is stored in ImageKit under `/avatars`, shown in the navbar and on course pages (ImageKit resizes it), and the old file is deleted when it is replaced or removed. Without a photo the UI shows initials. API: `PATCH /api/users/me` accepts JSON `{name}` or multipart with `name` and/or `avatar`; `DELETE /api/users/me/avatar` removes it.

## Account deletion
Profile, Danger zone: the user confirms with their password and by typing `DELETE`. The account is **anonymized, not deleted**: name, email, avatar (the ImageKit file is deleted too) and sign-in are removed (the email is replaced by `deleted-<id>@learnly.invalid`), every session stops working, and the original address can register again as a new account. **Orders and enrollments are kept** because they are payment records. An instructor can delete only if none of their courses has students; their courses, lectures and ImageKit files are then removed. Otherwise the request fails with 409 and nothing changes. Admin accounts cannot be deleted this way.

## Orphan cleanup
Lecture videos go from the browser straight to ImageKit before the lecture is saved, so an abandoned form leaves an orphan file. `POST /api/internal/cleanup-uploads` finds files in `/lectures`, `/courses` and `/avatars` that no lecture, course or user references and are older than 24 hours.
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
- Player uses native video controls; YouTube lectures do not auto-advance.
- Prices are INR, USD or EUR.
- No refunds, lecture progress or admin panel.
- A paid order that Razorpay never confirms (no webhook, no checkout verification) stays `created`; there is no reconciliation job.

## Not yet verified against real services
Phase 2 was built and tested against local mocks (in-memory MongoDB, a mock ImageKit server, signed webhook payloads, console email). These have **not** been run for real and should be checked before launch:
- A Razorpay test payment delivered by a real webhook through a public HTTPS URL, including closing the tab before checkout verification.
- A real verification and reset email sent through Gmail OAuth 2.0 (token exchange, `https://mail.google.com/` scope, the 7-day Testing-mode expiry, sender and spam placement).
- A real Sign in with Google round trip (consent screen, redirect URI, token exchange, the real ID token and profile photo URL).
- Real ImageKit behavior for orphan cleanup (list pagination, `createdAt` values) and for deleting files during account deletion; start with a dry run.
- Rate limiting behind the production proxy, to confirm it forwards the real client IP in `x-forwarded-for`.
- Browser upload of lecture videos straight to ImageKit and real Razorpay checkout (unchanged from the MVP, still mock-only here).
