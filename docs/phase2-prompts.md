# Learnly Phase 2 — Launch-Readiness Prompts

How to use: open the Learnly folder in your coding agent, paste **Session preamble** once, then paste the prompts **in order**. Do not move to the next prompt until the current one's **Verify** list passes and you have committed. `docs/prompts.md` is the finished MVP build; this file continues from it.

## Goal and scope

Phase 2 makes Learnly safe to put in front of real users and real payments. It closes the "Consequences we accept" in `docs/mvp.md` section 3 and the first five items of `docs/next-steps.md`. It adds no new product features.

| # | Sub-project | Closes |
|---|---|---|
| 1 | Razorpay webhook | Student pays, closes the tab, is charged but not enrolled |
| 2 | Email service and email verification | Accounts with no proof of email ownership |
| 3 | Password reset | A forgotten password cannot be recovered |
| 4 | Rate limiting and token blacklist | No brute-force protection; a copied token survives logout |
| 5 | Account deletion | No way for a user to leave |
| 6 | ImageKit orphan cleanup | Abandoned uploads accumulate forever |
| 7 | Release check | Docs, env vars, real-service pass, tag |

**Deferred again (do not build):** avatars, lecture progress and resume, admin panel, Docker and replica set, Redis, Google sign-in, automated test suite and CI, refunds, v2 multi-tenant. Redis is replaced by MongoDB-backed stores behind a small interface, so it can be swapped in later.

**Decisions made for Phase 2** (tell the agent if you want any changed before you start):

| Topic | Decision |
|---|---|
| Email provider | Resend over its REST API (plain `fetch`, no SDK). `RESEND_API_KEY` and `EMAIL_FROM` are required in production. Outside production, with no key, emails are printed to the server console. |
| Unverified users | May sign in and browse. May **not** buy or enroll (including free courses), create a course, or publish a course. Those return 403 "Verify your email first". |
| Existing accounts | A one-off script marks every user created before Phase 2 as verified. |
| Rate limiting | MongoDB fixed-window counters with a TTL index. Fails open (logs, allows) if the database errors. |
| Logout | Adds the token's `jti` to a revoked-tokens collection with a TTL equal to the token's remaining life. Tokens issued before Phase 2 have no `jti` and remain valid until they expire (at most 7 days). |
| Account deletion | Anonymize, never hard-delete. Orders and enrollments are financial records and stay. Instructors with any enrolled course cannot delete. |
| Orphan cleanup | Dry-run by default, 24 h grace period, capped per run, triggered by a secret-protected endpoint that a scheduler calls. |

---

## Session preamble (paste once at the start of every session)

```
You are continuing Learnly, a full-stack LMS in one Next.js app, in this folder. The MVP is finished and tagged. You are doing Phase 2, launch readiness.

Before doing anything, read:
- docs/phase2-prompts.md "Goal and scope" and "Decisions made for Phase 2" (these override docs/mvp.md section 3, which listed these features as deferred).
- docs/mvp.md (data model, API envelope, pages and guards) and docs/README.md.
- The existing code you will touch: lib/server/auth.js, lib/server/http.js, lib/server/config.js, proxy.js, models/, lib/server/services/, and the matching Route Handlers.

Rules:
- JavaScript with ES modules, Next.js App Router, "@/" alias. No TypeScript. Keep every markdown file in docs/.
- Build only what the current prompt asks. Do not add anything from the deferred list.
- Every API response uses the envelope in docs/mvp.md section 7. Every Route Handler is wrapped in withErrors() and sets runtime = "nodejs".
- Validate every request body, query and ObjectId with Zod / parseId. Never trust the client for role, ownership, price or user id.
- Secrets live only in environment variables. Never commit .env.local, never put a secret in client code, never log a token, password, reset link or webhook secret.
- Follow existing patterns (services in lib/server/services, validators in lib/server/validators, models in models/). Prefer small focused files. No dead code, no TODO placeholders.
- New environment variables go into lib/server/config.js (Zod, lazy) and .env.example in the same prompt that introduces them.
- Never put a secret token in a database in plain text: store a SHA-256 hash and compare hashes.
- When a library or provider API is uncertain (Razorpay webhooks, Resend, ImageKit list/delete, Next.js 16, Mongoose 9), read its current docs or the installed package types instead of guessing.

Testing policy (important): there are no real MongoDB, ImageKit, Razorpay or email credentials in this environment yet. Run each Verify list against throwaway local mocks (mongodb-memory-server installed with --no-save, a mock ImageKit HTTP server reached with IMAGE_KIT_BASE_URL, a script that signs Razorpay webhook payloads with a test secret, console email transport). Delete every scratch file before committing and never create .env.local with fake values. In every result, state which checks ran against a mock and which could not be run at all, and add each of those to a running "unverified against real services" list that Prompt 7 closes.

Git: remote is https://github.com/tejaswasnik/Learnly.git, branch main. Commits must be authored as tejaswasnik@icloud.com (check `git config user.email` inside this repo before the first commit). Never force-push, never rewrite history, never commit secrets, node_modules or .next.

When finished: run npm run lint and npm run build, fix everything, then list what you changed and how you verified it. Then commit and push:
1. `git status`; only files for this prompt are staged, no secrets, no scratch scripts.
2. `git add -A && git commit -m "feat: <short summary>"` (use fix: or docs: where more accurate). Do NOT put prompt numbers in the message.
3. `git push origin main`. If rejected, `git pull --rebase origin main`, rerun lint and build, push again.
```

---

## Prompt 1 — Razorpay webhook

```
Goal: a student who pays is always enrolled, even if they close the tab before /api/payments/verify runs.

Do:
1. lib/server/services/payments.js with settleOrder({ order, paymentId, signature }): atomically moves an order to "paid" (findOneAndUpdate with status: { $ne: "paid" }, so two concurrent callers cannot both win), stores razorpayPaymentId (and razorpaySignature when given), then calls enrollUser. When the order is already paid it still calls enrollUser, so a crash between "paid" and "enrolled" heals on the next call. Returns { courseId, alreadyPaid }.
2. Refactor POST /api/payments/verify to use settleOrder. Keep its current contract and checks exactly (401, 404, 403 for another user's order, 400 on a bad signature with status "failed", idempotent success).
3. Add RAZORPAY_WEBHOOK_SECRET to lib/server/config.js and .env.example. It is a different secret from RAZORPAY_KEY_SECRET (set in the Razorpay dashboard when creating the webhook).
4. POST /api/payments/webhook (no session; Razorpay calls it):
   - Read the raw body with await req.text(), before any JSON parsing. Compute HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET and compare to the X-Razorpay-Signature header with crypto.timingSafeEqual (equal-length check first). Bad or missing signature returns 400 and does nothing else.
   - Parse the JSON only after the signature passes. Handle payment.captured and order.paid: take the order id and payment id from the payload, find the Order by razorpayOrderId, and require payload amount and currency to equal the stored order's amount and currency. On a mismatch log it and return 200 without settling.
   - Settle orders whose status is "created" or "failed" (a bad client-side signature must not block a payment Razorpay confirms). Do not require a session or the order owner: the webhook signature is the authority.
   - payment.failed: mark a "created" order "failed", never touch a "paid" one.
   - Unknown order id, unhandled event types, and already-settled orders return 200 {success:true} so Razorpay does not retry forever. A genuine server or database error returns 500 so Razorpay retries.
   - Never log the raw body or the signature. Log only event name, order id and outcome.
5. The proxy matcher already skips /api, so no change there. Confirm it, and confirm the route needs no CSRF-style origin check (it is server-to-server).
6. docs/README.md: a short "Webhook setup" section: dashboard URL `${APP_URL}/api/payments/webhook`, events to subscribe (payment.captured, order.paid, payment.failed), set the secret, and how to test locally with a tunnel. Note that the endpoint must be publicly reachable over HTTPS.

Verify (mock: a scratch script signs payloads with a test secret and posts them to the route):
- Valid payment.captured for a "created" order: order becomes paid, one enrollment exists, response 200.
- Same event sent twice, and the webhook followed by /verify (and the reverse): still exactly one enrollment, still paid.
- Tampered body, wrong secret, missing header: 400, nothing changes. A header with a different length does not throw.
- Amount or currency mismatch: 200, order not settled, a log line.
- Unknown order id: 200. payment.failed on a created order marks it failed; on a paid order does nothing.
- An order left "failed" by a bad /verify signature is settled by a later valid webhook.
- /verify still passes every check from the MVP Verify list (401, 403 other user, 400 wrong signature, idempotent).
- npm run lint and npm run build pass.
- Cannot be verified here: a real Razorpay-delivered event through a public URL. Add it to the unverified list.
```

---

## Prompt 2 — Email service and email verification

```
Goal: every account proves it owns its email, and unverified accounts cannot spend money or publish.

Do:
1. Env: RESEND_API_KEY and EMAIL_FROM in lib/server/config.js (required when NODE_ENV is production, optional otherwise) and .env.example. The product name "Learnly" is a constant, not a variable.
2. lib/server/services/email.js: sendEmail({ to, subject, html, text }). With a key, POST to the Resend REST API using fetch with a timeout; without a key outside production, print the message (including links) to the server console instead. A send failure throws an HttpError 502 from sendEmail, and callers decide whether to swallow it. lib/server/email-templates.js: small plain-HTML templates (verify email, and later reset and deletion). Every link is built from APP_URL. HTML-escape any user-supplied value (the name) in templates.
3. models/auth-token.js: userId (indexed), type ("verify-email" | "reset-password"), tokenHash (unique), expiresAt (TTL index so Mongo removes expired rows), usedAt. lib/server/services/auth-tokens.js: createToken(userId, type, ttlMs) generates 32 random bytes (base64url), stores only the SHA-256 hash, returns the raw token and deletes the user's older unused tokens of that type; consumeToken(rawToken, type) finds by hash, checks expiry and unused, marks used atomically (findOneAndUpdate), returns the userId or throws a 400 "This link is invalid or has expired".
4. User model: emailVerified (Boolean, default false) and emailVerifiedAt. publicUser() and the AuthProvider user include emailVerified. Add scripts/mark-existing-users-verified.mjs (one-off, reads MONGO_URI, sets emailVerified:true on users that have no emailVerified field; prints the count; documented in docs/README.md). This is the only file allowed in a scripts/ folder.
5. Routes:
   - POST /api/auth/register: after creating the user, create a verify-email token (24 h) and send the email. A send failure must NOT fail registration; log it and return success.
   - POST /api/auth/verify-email { token }: consumeToken, set emailVerified, return the updated user. Idempotent for an already verified user. Works signed in or out.
   - POST /api/auth/resend-verification (requireUser): 409 if already verified; 429-style cooldown of 60 s based on the newest token's createdAt (the real rate limiter comes in Prompt 4); sends a fresh token and invalidates the old one.
6. lib/server/auth.js: requireVerified(req) = requireUser plus 403 "Verify your email first" when emailVerified is false (and role is not admin). Apply it to POST /api/payments/create-order (including free enrollment), POST /api/courses/create and the PATCH that sets isPublished: true. Leave browsing, the player for already-enrolled courses, profile and logout alone.
7. UI: app/(auth)/verify-email/page.js reads ?token, calls the API on mount, shows success/failure with links onward; a slim banner in the layout for signed-in unverified users ("Verify your email" with a Resend button, cooldown shown); the purchase card and the instructor "create course"/publish toggle show the server's 403 message as a toast and point to the banner. /verify-email must be reachable both signed in and signed out (do not add it to the proxy's guest-only list).

Verify (mock: console email transport, mongodb-memory-server):
- Register prints a verification link; opening it verifies; the banner disappears without a full reload.
- Link reuse, expired link (edit expiresAt in the scratch DB), tampered token: all 400 with the same message.
- An unverified student gets 403 on create-order for a free and a paid course; after verifying, both work. Same for an unverified instructor on course create and publish.
- Resend: a second call inside 60 s is refused; after that a new link works and the old one does not.
- Registration still succeeds when the email transport throws.
- Raw tokens are never in the database (inspect a token row) or in any log other than the dev console email.
- The migration script verifies pre-existing users and is a no-op on a second run.
- npm run lint and npm run build pass.
- Cannot be verified here: delivery through real Resend, spam-folder placement, the verified sending domain. Add to the unverified list.
```

---

## Prompt 3 — Password reset

```
Goal: a user who forgot their password can recover the account safely.

Do:
1. Reuse the token service and email service from Prompt 2. Add a reset-password email template (1 hour validity, says to ignore the email if the user did not ask) and a "your password was changed" notice template.
2. POST /api/auth/forgot-password { email }: always responds 200 with the same message ("If an account exists for that email, we sent a reset link") whether or not the account exists, and does comparable work in both cases so timing does not reveal existence. If the user exists, create a reset-password token (1 h, older reset tokens for that user are deleted) and send the email; swallow and log send failures.
3. POST /api/auth/reset-password { token, newPassword }: newPassword uses the existing password rule (min 8, max 128). consumeToken, set the password (hashed by the pre-save hook), bump tokenVersion (this signs out every session), set emailVerified true if it was not (they just proved inbox control), delete the user's other unused reset tokens, send the "password was changed" notice. Do NOT sign the user in; redirect to /login with a success toast.
4. Pages: app/(auth)/forgot-password/page.js and app/(auth)/reset-password/page.js (reads ?token). Add a "Forgot password?" link to the login page. Shared Zod schema for the client form. Neither page is guest-only in the proxy, so a signed-in user who clicks a link is not bounced away. The reset page must not leak the token in a Referrer header (the existing Referrer-Policy covers it; confirm) and should remove the token from the visible URL after reading it.
5. Update docs/README.md "Known limitations": remove the password-reset line.

Verify (mock: console email transport):
- Known and unknown email return byte-identical responses.
- The reset link works once; reuse, expiry and tampering give the same 400 message.
- Requesting a second link invalidates the first.
- After a reset, a cookie from before the reset returns 401 (tokenVersion), the old password fails, the new password works.
- A short or too-long new password returns 400.
- An unverified user who resets becomes verified.
- Logged-in user changing password through /me still works as before (no regression).
- npm run lint and npm run build pass.
- Cannot be verified here: real email delivery. Already on the unverified list.
```

---

## Prompt 4 — Rate limiting and token blacklist

```
Goal: slow down abuse and make logout actually revoke the token. MongoDB-backed, behind an interface that Redis could replace later.

Do:
1. models/rate-limit.js: key (unique), count, expiresAt (TTL index). lib/server/services/rate-limit.js: hit({ key, limit, windowMs }) does an atomic upsert-increment in the current fixed window and returns { allowed, remaining, retryAfterSeconds }. If the database errors, log and allow (fail open). Keep the module's exports small and storage-agnostic.
2. lib/server/http.js: withRateLimit(rules, handler) wrapper composed with withErrors. A rule is { name, limit, windowMs, by } where by is "ip", "user", "email" or a function of the request. On rejection return 429 in the standard envelope with a Retry-After header and the message "Too many attempts. Try again in N minutes."
3. Client IP: a getClientIp(req) helper that reads x-forwarded-for's first value, then x-real-ip, then falls back to "unknown". Document in docs/README.md that the deployment platform must overwrite x-forwarded-for, because otherwise clients can forge it. Do not trust it for anything except rate limiting.
4. Apply these limits (per window; adjust only with a stated reason):
   - POST /api/auth/login: 10 per 15 min per ip+email, plus 50 per 15 min per ip.
   - POST /api/auth/register: 5 per hour per ip.
   - POST /api/auth/forgot-password: 5 per hour per ip and 3 per hour per email.
   - POST /api/auth/reset-password and /verify-email: 10 per hour per ip.
   - POST /api/auth/resend-verification: 3 per hour per user (replaces the 60 s cooldown check, keep the cooldown too).
   - PATCH /api/users/me/password: 5 per hour per user.
   - POST /api/payments/create-order: 20 per hour per user. POST /api/payments/verify: 30 per hour per user.
   - GET /api/lectures/upload-auth: 60 per hour per user.
   Do not rate limit the Razorpay webhook (its signature is the protection) or health. A successful login must not be blocked by earlier failures from a different email on the same ip beyond the per-ip ceiling. Never reveal in the response whether the email exists.
5. Token blacklist: signToken adds a jti (crypto.randomUUID()). models/revoked-token.js: jti (unique), expiresAt (TTL index). POST /api/auth/logout reads the token (if any, even an expired-but-valid-signature one is ignored), stores its jti with expiresAt = the token's exp, then clears the cookie; logout always succeeds. getCurrentUser rejects a token whose jti is revoked. Tokens without a jti (issued before this change) keep working until they expire; document that in docs/README.md. Do not add a DB call to proxy.js (Edge); the proxy only guards navigation and every Route Handler already re-checks.
6. Make sure /api/auth/expired (the session-expired route) still behaves correctly with revoked tokens.
7. Update docs/README.md: remove "No rate limiting" from Known limitations; add the limits table.

Verify (mock: mongodb-memory-server):
- 11th wrong login for the same ip+email in 15 min returns 429 with Retry-After; a different email from the same ip is still allowed until the ip ceiling; the window resets after expiry (shorten windowMs in a scratch run).
- Under 20 concurrent login attempts the counter never lets more than the limit through (atomic increment).
- forgot-password stays byte-identical for known and unknown emails, including the 429 behavior.
- After logout, replaying the old cookie returns 401 on getme and on the lectures API; a freshly issued token works. The revoked row expires via TTL (check the index exists).
- With the rate-limit collection unreachable (stop the DB or throw in a scratch run), requests are allowed and an error is logged.
- A pre-change token with no jti still authenticates.
- npm run lint and npm run build pass.
- Cannot be verified here: real client IP behavior behind the production proxy/CDN. Add to the unverified list.
```

---

## Prompt 5 — Account deletion

```
Goal: a user can permanently remove their personal data without destroying anyone's payment history.

Rules (decided):
- Never hard-delete users. Anonymize them, so orders and enrollments keep valid references.
- A student can always delete. An instructor can delete only if none of their courses has an enrollment; otherwise 409 "You have students enrolled in your courses. Unpublish them instead."
- An instructor's courses (all have zero enrollments at that point), their lectures, and every related ImageKit file (thumbnails and videos) are deleted.

Do:
1. Extract the course-deletion logic that DELETE /api/courses/[courseId] uses (lectures, ImageKit videos, thumbnail, course) into a function in lib/server/services/instructor-courses.js if it is not already one, and reuse it. Do not change that endpoint's behavior.
2. User model: deletedAt (Date). lib/server/services/account.js deleteAccount(userId): checks the instructor rule above first (before changing anything), deletes the instructor's courses through the shared function, then anonymizes: name "Deleted user", email `deleted-<id>@learnly.invalid` (unique), a random unusable bcrypt-hashed password, photourl reset to the default, emailVerified false, tokenVersion + 1, deletedAt set. Order the steps so a failure midway can be retried safely and never leaves an anonymized user with live courses.
3. DELETE /api/users/me { password, confirm }: requireUser, rate limit 3 per hour per user, verify the password with comparePassword (400 on mismatch), require confirm to equal the literal string "DELETE", run deleteAccount, send a "your account was deleted" email to the ORIGINAL address (capture it before anonymizing), clear the session cookie, revoke the token jti. Admins cannot delete themselves through this route (403).
4. getCurrentUser must treat a user with deletedAt as signed out. Login for a deleted account fails with the standard "Invalid credentials".
5. UI: a "Danger zone" card on /me: explains exactly what is removed and what is kept ("Your purchase records are kept for accounting."), requires the password and typing DELETE, shows the instructor 409 message clearly, signs out and redirects to / on success. Keyboard-accessible confirmation modal reusing the existing modal component.
6. Update docs/README.md: remove "account deletion" from Known limitations and describe what deletion keeps and removes.

Verify (mock: mongodb-memory-server and the mock ImageKit server):
- Student with enrollments deletes: user anonymized, old cookie returns 401, login with the old email fails, orders and enrollments still exist and still point at the (anonymized) user, the course page still shows the correct enrolledCount.
- Instructor with an enrolled course gets 409 and nothing changes (check the courses, lectures and ImageKit mock calls).
- Instructor with only unenrolled courses: courses, lectures and the mock ImageKit files are deleted, user anonymized.
- Wrong password, missing or wrong confirm, and the admin case return the right errors and change nothing.
- Registering again with the original email now succeeds and creates a separate account.
- Retry after simulating a failure between steps completes cleanly.
- npm run lint and npm run build pass.
- Cannot be verified here: real ImageKit deletions. Add to the unverified list.
```

---

## Prompt 6 — ImageKit orphan cleanup

```
Goal: uploads that were never attached to a saved lecture or course stop piling up in ImageKit.

Background: lecture videos are uploaded from the browser straight to ImageKit before the lecture is saved; if the save fails or the user abandons the form, the file is orphaned.

Do:
1. Read lib/client/video-upload.js and lib/server/services/imagekit.js to find which ImageKit folders the app writes to (lectures and courses thumbnails). Read the installed @imagekit/nodejs types for the exact list and delete methods; do not guess.
2. lib/server/services/orphan-cleanup.js: cleanupOrphans({ apply, graceHours = 24, maxDeletes = 100 }):
   - List files in each app-owned folder page by page.
   - A file is referenced if its fileId equals any Lecture.fileId or Course.thumbnailFileId. Load the referenced ids with one query per collection (select only the id field), not one query per file.
   - A file is an orphan only if it is unreferenced AND older than graceHours (an upload in progress must never be deleted).
   - Without apply, only report. With apply, delete at most maxDeletes per run through the existing deleteFile helper.
   - Return { scanned, referenced, orphans, deleted, skippedRecent, truncated }. Never delete outside the app-owned folders.
3. CRON_SECRET in lib/server/config.js and .env.example. POST /api/internal/cleanup-uploads: requires `Authorization: Bearer <CRON_SECRET>` compared in constant time (500 if the secret is not configured, 401 otherwise), dry run by default, `?apply=true` to delete. Not reachable by a browser session; add no cookie auth to it. Exclude it from rate limiting only if the limiter would block the scheduler; otherwise leave it. Log the summary line.
4. Make the run safe if two overlap (a second concurrent run returns 409, using a simple lock document with a short TTL).
5. docs/README.md: how to schedule it (any scheduler that can send an authenticated POST, such as the hosting platform's cron), the recommended cadence (daily), and to run a dry run first. Remove the orphan-upload line from Known limitations.

Verify (mock ImageKit server with seeded files):
- Seed: one file referenced by a lecture, one by a course thumbnail, one old orphan, one orphan uploaded 1 hour ago. Dry run reports exactly one orphan and one skippedRecent and deletes nothing.
- apply=true deletes only the old orphan; a second run finds nothing.
- maxDeletes is respected and `truncated` is true when more remain.
- Wrong or missing bearer returns 401; unconfigured secret returns 500; GET is rejected.
- Two simultaneous calls: one runs, one gets 409.
- Referenced files are never deleted even when the lecture was created after the listing started (re-check a candidate against the database immediately before deleting).
- npm run lint and npm run build pass.
- Cannot be verified here: ImageKit's real list pagination and file createdAt values. Add to the unverified list.
```

---

## Prompt 7 — Release check

```
Goal: Phase 2 is documented, consistent, and proven against real services.

Do:
1. Review every Route Handler added or changed in Phase 2 against this checklist and fix gaps: withErrors present; runtime nodejs; auth, role, verified-email and ownership checks present; body validated; correct rate limit rule; no password hash, token, reset link, student id or locked URL ever returned or logged; consistent envelope and status codes.
2. Review proxy.js: new pages (/verify-email, /forgot-password, /reset-password) behave as intended signed in and signed out; nothing in /api is caught.
3. Docs: update docs/README.md (variables table: RAZORPAY_WEBHOOK_SECRET, RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; webhook setup; scheduling; rate-limit table; what account deletion keeps; the migration script) and make Known limitations accurate (remaining: Player uses native controls; prices in INR/USD/EUR; tokens issued before the blacklist change; fail-open limiter; no refunds). Rewrite docs/next-steps.md to what is left after Phase 2 (avatars, lecture progress and resume, admin panel, Docker with replica set, Redis if traffic needs it, automated tests and CI, refunds). Add a short "Phase 2 status" section to docs/mvp.md section 3 marking what moved from deferred to done.
4. .env.example complete; nothing secret committed (grep the repo and git history of this phase for keys).
5. Real-service pass. Ask me for the real credentials or for me to run the steps if they are not available; do not fabricate results. For each item on the running "unverified against real services" list, either run it for real and report pass/fail, or leave it listed as NOT verified. At minimum: Razorpay test payment delivered by a real webhook (and the tab-closed-before-verify case); a real verification and reset email through Resend; real ImageKit deletions for account deletion and for orphan cleanup (dry run first); rate-limit behavior behind the real proxy.
6. Run the full MVP end-to-end script (docs/mvp.md section 1) plus the Phase 2 flows on a fresh database: register, verify email, forgot and reset password, buy with the tab closed, logout then replay the old token, delete an account. Report each step as pass or fail with what was real and what was mocked.

Verify:
- Fresh `git clone` + README steps => running app with all variables documented.
- `git status` clean, everything pushed, one commit per prompt with no "(prompt N)" in any Phase 2 message. Tag: `git tag v0.2.0-phase2 && git push origin v0.2.0-phase2`.
- npm run lint and npm run build pass with no unjustified warnings.
- The unverified-against-real-services list is empty, or every remaining item is named in docs/README.md.
```

---

## After Phase 2

See `docs/next-steps.md` (rewritten in Prompt 7). Phase 3 candidates: lecture progress and resume, avatars, admin panel, tests and CI, Docker with a replica set. v2 (multi-tenant) starts only after Phase 2 is verified against real services.
