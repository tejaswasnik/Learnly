# Learnly MVP — Build Prompts

How to use: open the Learnly folder in your coding agent, paste **Session preamble** once, then paste the prompts **in order**, one per session or one at a time. Do not move to the next prompt until the current one's **Verify** list passes and you have committed.

Version control: everything is committed to https://github.com/tejaswasnik/Learnly.git (branch `main`). Each prompt ends with a commit and a push, so the repo history reads as the build order. Make sure you are signed in to GitHub on this machine (`gh auth status` or a configured credential manager) before Prompt 0.

Scope and decisions live in `docs/mvp.md`. The full spec is `docs/Learnly – Product & Technical Specification.docx`. If a prompt and `mvp.md` disagree, `mvp.md` wins.

Manual setup you need before Prompt 9 and Prompt 7:

- MongoDB: a local instance or a free Atlas cluster. Put the URI in `.env.local`.
- ImageKit account: public key, private key, URL endpoint.
- Razorpay account in **test mode**: key id and secret.

---

## Session preamble (paste once at the start of every session)

```
You are building the Learnly MVP, a full-stack LMS in one Next.js app, in this folder.

Before doing anything, read:
- docs/mvp.md (scope, decisions, data model, API, pages). It overrides the spec where they differ.
- docs/Learnly – Product & Technical Specification.docx (use it for detail; convert with pandoc if needed).
- landing-page/index.html and landing-page/fonts/ (the visual identity: colors, type, spacing).

Rules:
- JavaScript with ES modules, Next.js App Router, "@/" import alias. No TypeScript.
- Follow the folder layout in the spec: app/, components/, lib/server/, lib/client/, models/. Nothing outside docs/ for markdown files; keep every document and md file in docs/.
- Build only what the current prompt asks. Do not add deferred features (see mvp.md section 3).
- Every API response uses the envelope in mvp.md section 7. Every Route Handler is wrapped in withErrors() and sets runtime = "nodejs".
- Validate every request body, query and ObjectId with Zod / parseId. Never trust the client for role, ownership or price.
- Never put secrets in client code or commit .env.local.
- Prefer small, focused files. No dead code, no TODO placeholders in finished work.
- When a library API is uncertain (ImageKit, Razorpay, Next.js, Tailwind 4, Zod 4, Mongoose 9), read its current docs or the installed package types instead of guessing.
- Git: the remote is https://github.com/tejaswasnik/Learnly.git and `main` is the integration branch. Never force-push, never rewrite history, never commit .env.local or any secret, and never commit node_modules or .next.
- When finished: run npm run lint and npm run build, fix everything, then list what you changed and how you verified it. Then commit and push as described below.

Commit convention (end of every prompt, after the Verify list passes):
1. `git status` and check that only files related to this prompt are staged; no secrets, no scratch scripts.
2. `git add -A && git commit -m "feat: <short summary> (prompt N)"` using a clear message; use `fix:` or `docs:` where more accurate.
3. `git push origin main`. If the push is rejected, run `git pull --rebase origin main`, resolve conflicts, rerun lint and build, then push again.
```

---

## Prompt 0 — Scaffold the project

```
Goal: an empty but running Next.js app with our config, design tokens and health check.

Do:
0. Git setup first. If this folder is not a git repo, run `git init -b main` and `git remote add origin https://github.com/tejaswasnik/Learnly.git`. Then `git fetch origin`. If the remote already has commits, do NOT overwrite them: run `git pull origin main --allow-unrelated-histories` (or check out the remote branch) and tell me what was there before continuing. Add a .gitignore (node_modules, .next, .env*.local, .DS_Store, *.log) before the first commit.
1. In the current folder (keep landing-page/ and docs/ untouched), create the Next.js app: App Router, JavaScript, ESLint, Tailwind CSS 4, no src/ folder, "@/*" alias, Turbopack dev. Resolve conflicts with the existing folder sensibly (create in a temp folder and move files in if needed).
2. Install: mongoose, jose, jsonwebtoken, bcryptjs, zod, sonner, @imagekit/nodejs, razorpay.
3. Create the structure from the spec section 3 (empty folders can hold a .gitkeep): app/, components/, lib/server/, lib/client/, models/.
4. lib/server/config.js: reads and validates MONGO_URI, JWT_SECRET, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, APP_URL with Zod; throws a clear message on first use if one is missing. Export a lazy getter, do not validate at import time (so `next build` works without secrets).
5. lib/server/db.js: cached Mongoose connection on globalThis, connects lazily.
6. lib/server/http.js: `ok(data, init)`, `fail(message, status, errors)`, `withErrors(handler)` (logs, returns {success:false,message}, hides details when NODE_ENV=production), `parseBody(schema, req)`, `parseId(value)` returning 400 on a bad ObjectId.
7. app/api/health/route.js returning {success:true, status:"ok"}; add a rewrite from /health to /api/health in next.config.js.
8. next.config.js: images.remotePatterns for the ImageKit endpoint host, security headers (X-Frame-Options, Referrer-Policy, X-Content-Type-Options; a CSP that allows Razorpay checkout.js and ImageKit media).
9. Port the design tokens from landing-page/index.html (colors --bg, --surface, --ink, --accent, etc., Bricolage Grotesque font via next/font/local using landing-page/fonts/bricolage.woff2 copied into app/fonts) into app/globals.css as Tailwind 4 @theme tokens. Dark theme only.
10. app/layout.js with the font, base metadata, and a Toaster from sonner. app/page.js can be a simple placeholder for now.
11. .env.example listing every variable, and .gitignore covering .env*.local. Do not write a README yet (it is docs/README.md in Prompt 13). If create-next-app generated a root README.md, delete it.

Verify:
- npm run dev starts; http://localhost:3000/api/health and /health return the JSON.
- npm run lint and npm run build pass with no .env.local present.
- Page background and font match the landing page.
- `git log` shows the first commit and `git remote -v` shows the Learnly repo. First commit includes docs/ and landing-page/ (if present) and the scaffold, with message `chore: scaffold Next.js app (prompt 0)`. Push to origin main.
```

---

## Prompt 1 — Models and shared validators

```
Goal: Mongoose models and Zod schemas that every later prompt reuses.

Do:
1. models/ for user, course, lecture, order, enrollment exactly as in docs/mvp.md section 6. Use the `mongoose.models.X || mongoose.model(...)` pattern. No lectures[]/enrolledStudents[]/enrolledCourses[] arrays.
2. User: lowercase+trim email, bcrypt (10 rounds) password hashing in a pre-save hook only when modified, password field select:false, tokenVersion, default avatar URL constant.
3. Enrollment: unique compound index (userId, courseId). Lecture: index on courseId. Course: index (isPublished, createdAt).
4. lib/shared/constants.js (importable by client and server): CATEGORIES (the 6 from mvp.md), CURRENCIES ["INR","USD","EUR"], CURRENCY_SYMBOLS, SORT_OPTIONS, ROLES allowed at signup, image limits (5 MB, JPEG/PNG/WebP), video cap 500 MB, page size 12 / max 50.
5. lib/server/validators/: auth (register, login, change password: min 8 chars, role only student|instructor), user (update name), course (create/update with z.enum from constants; price.amount >= 0 as a number; update treats "" as clearing subtitle/description), lecture (create/update with the refinement "exactly one of videoUrl or fileId+filePath"; duration is a non-negative integer of seconds; isPreviewFree boolean), payment (courseId). Reuse the same schemas on the client for form validation where sensible.
6. lib/shared/format.js: formatPrice(amount, currency) using the symbols, formatDuration(seconds) as m:ss or h:mm:ss.

Verify:
- A scratch script or node REPL can import every model and create/save a user (password gets hashed, comparePassword works), then delete it. Delete the scratch script afterwards.
- Saving two enrollments with the same (userId, courseId) fails with a duplicate-key error.
- npm run lint and npm run build pass.
```

---

## Prompt 2 — Auth API

```
Goal: register, login, logout, getme and the auth helpers, with no Redis.

Do:
1. lib/server/auth.js:
   - signToken(user): jsonwebtoken, payload {id, email, role, tv: user.tokenVersion}, 7 days.
   - setSessionCookie / clearSessionCookie: cookie name "token", httpOnly, sameSite=lax, secure in production, path "/", 7 days. Use next/headers cookies().
   - getCurrentUser(req): reads the cookie or Authorization: Bearer, verifies, loads the user from the database, and returns null if the user is missing or payload.tv !== user.tokenVersion.
   - requireUser(req), requireRole(req, ...roles) (401 if none, 403 if wrong role), both throw an HttpError that withErrors turns into the envelope.
2. Update lib/server/http.js with an HttpError class if you have not already.
3. Routes:
   - POST /api/auth/register: validates with the Zod schema, rejects an existing email with 409, creates the user, sets the cookie, returns {success, user}. Never return the password.
   - POST /api/auth/login: unknown email and wrong password both return 401 "Invalid credentials". Sets the cookie. Returns {success, user, redirectTo: "/instructor/dashboard" | "/dashboard"}.
   - POST /api/auth/logout: clears the cookie, always succeeds.
   - GET /api/auth/getme: requireUser, returns {success, user}.
   The user object returned everywhere is: id, name, email, role, photourl.

Verify (use the browser, Postman, or a short script; report exactly what you ran):
- Register a student and an instructor; duplicate email returns 409; role "admin" returns 400; password under 8 chars returns 400.
- Login with a wrong password and with an unknown email returns the same 401 body.
- getme with the cookie returns the user; without it returns 401; after logout the cookie is gone.
- After manually bumping tokenVersion in the database, the old cookie returns 401.
- npm run lint and npm run build pass.
```

---

## Prompt 3 — Middleware, session in layout, auth pages, navbar

```
Goal: working sign-up/sign-in UI and role-based page guards.

Do:
1. middleware.js (Edge): verify the "token" cookie with jose using JWT_SECRET. Apply the page guards in docs/mvp.md section 8: signed-out users to /login (with ?next= for the original path), signed-in users away from /login and /register, wrong role to their own dashboard. Use a matcher that skips _next, static files and /api.
2. app/layout.js (Server Component) reads the session on the server via a server-only helper (getCurrentUser using next/headers) and passes the user to <Providers>.
3. components/providers.js (client): AuthProvider context exposing {user, setUser, logout}; Toaster stays in the layout. lib/client/api.js: fetch wrapper that uses relative /api URLs, sends JSON, returns parsed envelopes, and throws an Error with the server message on success:false.
4. Pages: app/(auth)/login/page.js and app/(auth)/register/page.js. Register has name, email, password, and a Student / Instructor choice. Use the shared Zod schemas for client validation with inline errors, a loading state on the button, sonner toasts for server errors, redirect after success (use `next` param if present and safe, otherwise by role).
5. components/navbar.js: logo, Courses link, a search box that navigates to /courses?search=..., and either Login / Sign up buttons or an avatar menu (Dashboard, Profile, Log out). Add it to the layout. Mobile-friendly.
6. Minimal temporary pages so guards can be seen working: /dashboard, /instructor/dashboard, /me each showing "Hello {name}" (they get replaced in later prompts).

Verify:
- Signed out: visiting /dashboard redirects to /login?next=/dashboard.
- Register as a student lands on /dashboard; as an instructor on /instructor/dashboard.
- A student visiting /instructor/dashboard is redirected to /dashboard, and the reverse.
- Reload on /dashboard keeps you signed in with no signed-out flash. Log out works.
- Signed in, /login redirects away.
- npm run lint and npm run build pass.
```

---

## Prompt 4 — Public course API, catalog and course details

```
Goal: anyone can browse and open published courses.

Do:
1. lib/server/services/courses.js with functions shared by Route Handlers and Server Components:
   - listPublishedCourses({search, category, sort, page, limit}): always filters isPublished:true; escapes regex input; searches courseTitle, subTitle, category; sorts newest / price asc / price desc; limit capped at 50; returns {courses, page, totalPages, total}. Each course has creator {name, photourl} and enrolledCount (use an aggregation or a single grouped count query, no N+1). Never return student ids.
   - getCourseDetails(courseId, viewer): 404 unless published or viewer is the creator or admin. Returns the course, creator, lecture summaries (id, title, duration, isPreviewFree), `isEnrolled` for the viewer, and for lectures flagged isPreviewFree the playable URL (signed if it is an ImageKit file, using the signing helper you add to lib/server/services/imagekit.js, 1 hour expiry). Locked lectures never include a URL.
2. GET /api/courses and GET /api/courses/[courseId] call those services (the API remains the public contract).
3. app/courses/page.js (Server Component): reads searchParams (search, category, sort, page), calls the service directly, renders a grid. A small client component handles the debounced (500 ms) search input, category chips (All + 6), sort select, "clear filters", and pagination by updating the URL. Cards: thumbnail via next/image, title, creator, price (formatPrice), "★ Enrolled" badge when the viewer is enrolled.
4. app/courses/[courseId]/page.js (Server Component): hero, description, curriculum list with expand/collapse and lock icons, instructor card, free-preview player for preview lectures (HTML5 video, or YouTube iframe for YouTube URLs; download button disabled via controlsList="nodownload"), "Draft" banner for the owner/admin viewing an unpublished course. The sticky purchase card shows price and the right button (Buy Now / Enroll Now / Start Course); for now the buy/enroll button only needs to send signed-out users to /login?next=... and show a toast "coming in the payments step" otherwise. generateMetadata sets title/description/Open Graph from the course.
5. app/courses/loading.js and an error boundary for both routes. Use not-found.js for missing or hidden courses.

Verify (insert 2–3 courses directly in the database or via a temporary seed script that you delete afterwards):
- /courses lists only published courses; ?isPublished=false on the API does not leak drafts.
- Search, category, sort and pagination change the results and survive reload; navbar search works.
- API responses contain enrolledCount and no student ids.
- An anonymous GET of a draft course id returns 404.
- Locked lectures have no URL anywhere in the HTML or the JSON; a preview lecture does.
- npm run lint and npm run build pass.
```

---

## Prompt 5 — Instructor course API and image service

```
Goal: instructors can create, edit, list, publish and delete their own courses through the API.

Do:
1. lib/server/services/imagekit.js: a configured ImageKit client; uploadImage(file, folder) returning {url, fileId}; deleteFile(fileId) that ignores "not found"; signedUrl(path, expiresInSeconds) if not already done in Prompt 4. Read the installed @imagekit/nodejs docs for the correct method names.
2. lib/server/validators/image.js: validateImageFile(file): max 5 MB; MIME in JPEG/PNG/WebP; and check the file's magic bytes (JPEG FF D8 FF, PNG 89 50 4E 47, WebP RIFF....WEBP). Throws HttpError 400.
3. Routes (all use requireRole(req, "instructor") and ownership checks where relevant):
   - POST /api/courses/create (multipart): validates fields with the Zod schema, requires courseThumbnail, uploads it to ImageKit folder courses/, creates the course as a draft with creator = session user, stores thumbnailFileId.
   - PATCH /api/courses/update/[courseId] (multipart, all fields optional): only the creator (admin not needed); "" clears subTitle/description; replacing the thumbnail uploads the new one then deletes the old file; isPublished can be toggled. A course cannot be published without at least one lecture.
   - DELETE /api/courses/[courseId]: owner only; 409 with message "This course has students. Unpublish it instead." if any enrollment exists; otherwise delete its lectures (and their ImageKit videos), the thumbnail, and the course.
   - GET /api/courses/instructor/courses: own courses with search, status filter (all/published/draft), page/limit, plus totals {courses, published, students} computed over ALL of the instructor's courses (students = count of enrollments across them), and per-course enrolledCount and lectureCount.
4. Add `app/api/courses/instructor/courses/route.js` so it does not collide with `[courseId]` routing (static segment wins).

Verify (script or API client; report exactly what you ran):
- A student gets 403 on every instructor route; anonymous gets 401.
- Create with a .txt renamed to .png returns 400 (signature check); a >5 MB image returns 400; a valid image creates a draft.
- Another instructor gets 403 updating or deleting your course.
- Clearing subtitle with "" works; replacing the thumbnail removes the old file from ImageKit.
- Totals stay correct when you request page 2.
- npm run lint and npm run build pass.
```

---

## Prompt 6 — Instructor dashboard and course forms

```
Goal: the instructor UI for managing courses.

Do:
1. app/instructor/dashboard/page.js (client): three stat cards from the API totals; All / Published / Draft tabs; search (debounced); infinite scroll or a "Load more" button; per course: thumbnail, title, status pill, enrolled count, publish/unpublish toggle with optimistic update and rollback on error, Edit, "Manage lectures", Delete. Delete opens a confirmation modal; surface the 409 message as a toast.
2. app/courses/create/page.js and app/courses/edit/[courseId]/page.js sharing components/course-form.js: title, subtitle, description, category select (CATEGORIES), currency select, price, thumbnail picker with preview (client checks type and 5 MB), submit uses FormData. Edit loads the current course and shows the current thumbnail. After success, create redirects to that course's lecture management page.
3. Keyboard-accessible modal (focus trap, Escape closes), visible focus states, loading skeletons, empty state with a "Create your first course" button.

Verify (as an instructor in the browser):
- Create a course with a thumbnail; it shows as Draft with 0 lectures and the dashboard stats update after reload.
- Edit title/price/subtitle (including clearing the subtitle); change the thumbnail.
- Publishing a course with no lectures shows the server's error as a toast.
- Delete works for a fresh course.
- Student accounts cannot open these pages.
- npm run lint and npm run build pass.
```

---

## Prompt 7 — Lecture API, signed URLs, upload authorization

```
Goal: lecture CRUD and enrollment-gated playback on the server.

Do:
1. lib/server/services/enrollment.js: isEnrolled(userId, courseId) querying the enrollments collection; requireEnrollment(req, courseId) = signed in AND (enrolled OR creator OR admin), else 403 (404 if the course does not exist).
2. GET /api/lectures/upload-auth (instructor): returns the ImageKit browser-upload parameters {token, signature, expire, publicKey, urlEndpoint} from the server SDK helper. Short-lived.
3. POST /api/lectures/create, PATCH /api/lectures/update/[lectureId], DELETE /api/lectures/[lectureId]: JSON bodies per the validator; the course must belong to the instructor. Store isPreviewFree and duration. On PATCH that swaps the video, delete the previous ImageKit file after saving. DELETE removes the ImageKit file.
4. GET /api/lectures/course/[courseId] and GET /api/lectures/[lectureId]: requireEnrollment, return lectures in createdAt order with playable URLs: ImageKit files get a signed URL that expires in 1 hour; external links (YouTube etc.) are returned as is. Include {id, title, description, duration, isPreviewFree, videoUrl, isExternal}.
5. Anonymous users only ever get URLs for isPreviewFree lectures, and only via the course details service you wrote in Prompt 4. Confirm that the lecture endpoints do not leak anything to non-enrolled users.

Verify:
- Student not enrolled: 403 on both lecture GET routes. Instructor non-owner: 403 on create/update/delete.
- Creating a lecture with both videoUrl and fileId, or neither, returns 400.
- Signed URL works now and the response includes an expiry; a tampered signature fails at ImageKit.
- Swapping the video deletes the old file; deleting a lecture deletes its file.
- npm run lint and npm run build pass.
```

---

## Prompt 8 — Lecture management UI with direct upload

```
Goal: instructors upload lecture videos straight from the browser to ImageKit.

Do:
1. app/courses/[courseId]/lectures/page.js: lists lectures (title search, counts of total lectures and free previews, duration display, preview badge), buttons to create, edit, delete (confirm modal).
2. app/courses/[courseId]/lectures/create and /edit/[lectureId] pages sharing components/lecture-form.js: title, description, a free-preview toggle, and a choice of "Upload video" or "Paste video URL".
   - Upload: validate type (video/*) and the 500 MB cap in the browser, read the duration from the file with a hidden <video> element's loadedmetadata, fetch /api/lectures/upload-auth, then upload directly to ImageKit with @imagekit/javascript (install it). Show real progress, support cancel, then call POST /api/lectures/create with fileId + filePath.
   - Paste URL: validate it is a URL; duration is a manual minutes/seconds field in this mode.
   - Edit: can change fields, toggle preview, or replace the video.
3. If the upload succeeds but the create call fails, tell the user and offer retry without re-uploading.

Verify:
- Upload a small MP4 and a pasted YouTube URL to one course; both appear with durations.
- The browser network tab shows the video going to ImageKit, not to your /api.
- Toggle free preview on one lecture; it plays on the public course page while the others stay locked.
- Publish the course from the dashboard now succeeds.
- A 500 MB+ file is rejected before upload starts.
- npm run lint and npm run build pass.
```

---

## Prompt 9 — Payments and enrollment

```
Goal: students can buy paid courses with Razorpay and enroll in free ones.

Do:
1. lib/server/services/razorpay.js: configured Razorpay client; verifySignature(orderId, paymentId, signature) using HMAC-SHA256 over `${orderId}|${paymentId}` with RAZORPAY_KEY_SECRET and crypto.timingSafeEqual.
2. enrollment service addition: enrollUser({userId, courseId, orderId}) does an upsert on (userId, courseId) so repeated calls are harmless.
3. POST /api/payments/create-order (requireUser): body {courseId}. Course must exist and be published. If the user is already enrolled return 409. If price.amount is 0, enroll directly (no order) and return {success, enrolled: true}. Otherwise create a Razorpay order for amount*100 in the course's ISO currency, save an orders row (status created), and return {orderId, amount, currency, keyId}. The price is read from the database, never from the client. Rate limit is deferred.
4. POST /api/payments/verify (requireUser): body {razorpay_order_id, razorpay_payment_id, razorpay_signature}. Find the order; 404 if missing; 403 if order.userId is not the session user; if already paid return success (idempotent); verify the signature (400 on mismatch and set status failed); mark paid with payment id and signature; enroll; return {success, courseId}.
5. Client: components/purchase-card.js (client) replaces the placeholder from Prompt 4. It loads Razorpay Checkout with next/script, calls create-order, opens checkout with the returned keyId, then calls verify in the handler. On success it shows a toast and router.refresh() so the card flips to "Start Course" with no second purchase possible. If checkout is dismissed or verify fails, show a clear message; if verify fails after payment was captured, show the order and payment ids and tell the student to contact support.
6. Add GET /api/enrollments/me (requireUser) returning the signed-in user's enrolled courses (course summary + enrolledAt), newest first.

Verify (Razorpay test mode):
- Free course: Enroll Now enrolls immediately; the button becomes Start Course.
- Paid course with a test card/UPI: checkout opens, payment succeeds, enrollment exists once, order is paid.
- Calling verify twice is harmless; verify with another user's session returns 403; a wrong signature returns 400 and creates no enrollment.
- Buying an already-owned course returns 409 and the UI never shows Buy Now for it after refresh.
- npm run lint and npm run build pass.
```

---

## Prompt 10 — Course player and student dashboard

```
Goal: students watch what they own.

Do:
1. app/learn/[courseId]/page.js (client, signed in): loads GET /api/lectures/course/[courseId]; on 403 or 404 redirect to /courses/[courseId]. Layout: video area plus a collapsible right sidebar listing lectures with the active one highlighted, duration shown, auto-select the first lecture, next/previous buttons, autoplay-next when a video ends. HTML5 <video controls controlsList="nodownload"> for uploaded files; a sandboxed YouTube iframe for external YouTube links; otherwise a plain link. Refresh the lecture list when a signed URL is about to expire (re-fetch the lecture on a media error).
2. app/dashboard/page.js (client, student): greeting by time of day, stats (total enrolled; leave out "completed" and "in progress" since progress tracking is deferred), and a grid of enrolled courses from GET /api/enrollments/me with a "Continue" link to /learn/[id]. Empty state linking to /courses.
3. Instructors are sent to /instructor/dashboard if they open /dashboard (already in middleware); an instructor who owns the course can open /learn/[courseId] for their own courses.
4. Keyboard use: sidebar toggle and lecture list are reachable and operable with the keyboard; the video has an accessible name.

Verify:
- Enrolled student plays every lecture, including a YouTube one; next/previous work.
- A non-enrolled user typing /learn/<id> is bounced to the course page; a direct request to the lecture API returns 403.
- Student dashboard shows exactly the purchased/free courses.
- npm run lint and npm run build pass.
```

---

## Prompt 11 — Profile

```
Goal: users can manage their basic account.

Do:
1. PATCH /api/users/me: update name only (Zod). Returns the updated user.
2. PATCH /api/users/me/password: requires currentPassword and newPassword (min 8, different from the current one). Verifies the current password, saves the new one, increments tokenVersion, and sets a fresh cookie so the current session keeps working while every other session is invalidated. Returns {success} and leaves the client's user unchanged.
3. app/me/page.js: shows name, email (read-only), role; forms to change the name and the password, with inline validation and toasts. The navbar updates immediately after a name change (update the AuthProvider user).
4. No avatar upload, no account deletion, no notifications toggle (deferred).

Verify:
- Name change shows in the navbar without reload.
- Wrong current password returns 400/401 with a clear message; success works.
- Open the app in a second browser, sign in, change the password in the first one: the second browser's next request is signed out, the first stays signed in.
- npm run lint and npm run build pass.
```

---

## Prompt 12 — Landing page, 404, metadata

```
Goal: the public face of the app.

Do:
1. Port landing-page/index.html into app/page.js as React components in components/landing/ (hero, category explorer, featured courses, how it works, feature showcase, testimonials, FAQ, closing CTA, footer). Keep the visual design exactly: same tokens, type scale, spacing, motion. Use next/link and next/image where appropriate. Keep the page a Server Component; only interactive pieces (FAQ accordion, any carousel) are client components.
2. Replace static course cards in "Learn from the best" with real data: the 3–6 newest published courses via listPublishedCourses; fall back gracefully to nothing if there are none. Category tiles link to /courses?category=....
3. Hero buttons: "Browse courses" to /courses, "Teach on Learnly" to /register. Signed-in users see Dashboard instead of Sign up in the navbar (already handled).
4. Remove invented stats or testimonials that read as real customers; make them clearly illustrative or drop them.
5. app/not-found.js in the same style with links home and to /courses.
6. Metadata: root layout title template, description, Open Graph defaults; landing, /courses and course pages have their own titles. Add app/robots.js and app/sitemap.js (landing, /courses, published course URLs).
7. Check keyboard focus, alt text, and contrast on every section; respect prefers-reduced-motion.

Verify:
- Side-by-side with landing-page/index.html at desktop and mobile widths, nothing visibly regressed.
- Lighthouse (or equivalent) accessibility score is 90+ on /, /courses and a course page.
- /sitemap.xml lists only published courses.
- npm run lint and npm run build pass.
```

---

## Prompt 13 — Hardening, README, release check

```
Goal: make the MVP safe to demo and easy to run.

Do:
1. Review every Route Handler against this checklist and fix gaps: withErrors wrapper present; role/ownership/enrollment checks present; request validated; no password hash, student id or locked URL ever returned; consistent envelope and status codes.
2. Review middleware matcher and guards against docs/mvp.md section 8.
3. Do not add rate limiting (deferred), but include a short "Known limitations" section in docs/README.md listing the accepted risks from docs/mvp.md section 3.
4. Write docs/README.md (not at the root, per our rule): what Learnly is, requirements, how to get MongoDB / ImageKit / Razorpay test keys, how to create .env.local from .env.example, commands (npm install, npm run dev, npm run build, npm start, npm run lint), the folder layout, and the end-to-end demo script from docs/mvp.md section 1. If a root README.md is required by tooling, make it one line pointing to docs/README.md.
5. Make sure .env.example is complete and nothing secret is committed.
6. Run the full end-to-end script from docs/mvp.md section 1 on a fresh database and report each step as pass/fail. Fix anything that fails.
7. Write docs/next-steps.md: ordered list of what to build after the MVP (webhook, email verification + reset, Redis rate limits and blacklist, account deletion, avatars, progress tracking, Docker with replica set, tests and CI, admin panel), each with a one-line reason.

Verify:
- Fresh `git clone https://github.com/tejaswasnik/Learnly.git` in a new folder + README steps => running app.
- Everything is pushed; `git status` is clean and `git log --oneline` shows one commit per prompt. Tag the release: `git tag v0.1.0-mvp && git push origin v0.1.0-mvp`.
- npm run lint and npm run build pass with zero warnings you cannot justify.
- End-to-end script passes completely.
```

---

## After the MVP

See `docs/next-steps.md` (created in Prompt 13). v2 (multi-tenant stores) starts only after the MVP is stable and the deferred safety items (email verification, webhook, rate limits) are done.
