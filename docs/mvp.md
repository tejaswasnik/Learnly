# Learnly MVP — Scope & Decisions

Source of truth for the full product: `docs/Learnly – Product & Technical Specification.docx` (v1 = sections 1–6, v2 multi-tenant = section 7, **not** part of the MVP).
This file says what we build first, what we skip, and where we deliberately differ from the spec.

## 1. Goal and success criteria

One Next.js app where an instructor publishes a video course and a student buys it (Razorpay) or enrolls for free, then watches the lectures through enrollment-gated, signed video URLs.

The MVP is done when this runs end-to-end on a fresh database:

1. Instructor registers, logs in, creates a course (thumbnail), uploads two lectures (one marked free preview), publishes.
2. Anonymous visitor finds the course in the catalog, opens it, plays the free preview, sees the paid lectures locked.
3. Student registers, buys the course with Razorpay test mode, lands in the player and plays every lecture.
4. A second student enrolls in a free course instantly.
5. A student who has not enrolled cannot get a locked lecture URL (API returns 403, player redirects).
6. Instructor dashboard shows correct totals; student dashboard lists enrolled courses.

## 2. In scope

| Area | MVP includes |
|---|---|
| Auth | Register (student or instructor), login, logout, session via httpOnly JWT cookie (7 days), `getme`, route guards in `middleware.js`, `tokenVersion` revocation |
| Catalog | Public published-course list: search (debounced), category chips, sort, pagination (12/page); `?search=` from navbar works |
| Course page | Details, curriculum with lock/preview, free-preview player, sticky purchase card (Buy Now / Enroll Now / Start Course), draft banner for owner |
| Instructor | Dashboard (totals from API, filter tabs, search, publish toggle, delete), create/edit course with thumbnail, lecture CRUD with browser-to-ImageKit video upload or pasted URL, free-preview toggle, duration |
| Student | Dashboard (enrolled list), course player with lecture sidebar, YouTube embed support |
| Payments | Razorpay order + signature verification, free enrollment, idempotent enrollment |
| Profile | Change name, change password |
| Marketing | Landing page ported from `landing-page/index.html`, 404 page, per-page metadata |

## 3. Deferred (not in the MVP)

Email verification, forgot/reset password, Google sign-in, Redis (rate limits, logout blacklist), Razorpay webhook, avatar upload, account deletion, admin API/UI, progress tracking, Q&A tab, lecture reordering/sections, Docker/compose, tests/CI, SEO beyond basic metadata, all of v2.

Consequences we accept for now:

- Accounts are created without email proof, and a forgotten password cannot be recovered. Fine for a dev/demo MVP; not fine for public launch.
- Logout clears the cookie but a copied token stays valid until it expires or `tokenVersion` is bumped (password change). No Redis needed.
- Without the webhook, a student who pays and closes the tab before `verify` runs is charged but not enrolled. `verify` is idempotent, and the checkout handler calls it immediately. Add the webhook right after the MVP.
- No rate limiting on auth routes.

## 4. Decisions that differ from the spec

| Spec | MVP | Why |
|---|---|---|
| `courses.lectures[]`, `courses.enrolledStudents[]`, `users.enrolledCourses[]` | Removed. `enrollments` and `lectures.courseId` are the only links; counts come from queries | Removes denormalized copies (spec gaps 18, 20) and the need for Mongo transactions, so any MongoDB works, replica set not required |
| Course delete cascades through enrollments in a transaction | Delete allowed only when the course has **no enrollments**; otherwise 409 "Unpublish it instead". Lectures and their ImageKit files are removed | Never destroy something a student paid for; no transaction needed |
| Redux Toolkit + axios + per-feature slices | Plain React: an `AuthProvider` context seeded from the server-read session, a tiny `lib/client/api.js` fetch wrapper, `useState`/`useEffect` per page | Three slices of Redux is overhead for this size. Easy to add later |
| Geist font | Bricolage Grotesque and the dark-red tokens from `landing-page/index.html` | The landing page already defines the brand |
| Categories: 4 on form, 6 on filter | One shared list of 6: Web Development, AI & Machine Learning, Programming & Systems, Data Science, UI/UX & Design Systems, Cloud & DevOps | Gap 9 |
| `GET /auth/getme` populates enrolled courses | `getme` returns the user only; new `GET /api/enrollments/me` returns the student's courses | Cleaner contract |
| Docker/compose | Local MongoDB or Atlas free tier, plain `npm run dev` | Docker is deferred |

## 5. Stack

Next.js (App Router, JavaScript ES modules, `jsconfig.json` with `@/` alias), React 19, Tailwind CSS 4, sonner, Mongoose, jose (middleware) + jsonwebtoken (handlers), bcryptjs, Zod 4, ImageKit (`@imagekit/nodejs` server, browser upload with an auth token), Razorpay SDK + Checkout via `next/script`.

Environment variables (`.env.local`, with a committed `.env.example`):

| Variable | Use |
|---|---|
| `MONGO_URI` | Database |
| `JWT_SECRET` | Token signing, also read by middleware |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | Uploads, signed URLs, deletes |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Orders and checkout verification (test mode) |
| `APP_URL` | Base URL (`http://localhost:3000`) |

## 6. Data model

All ids are Mongo ObjectIds. All collections have timestamps.

- **users**: `name`, `email` (unique, lowercase), `password` (bcrypt, hashed in a pre-save hook, `select: false`), `role` (`student` | `instructor` | `admin`, default `student`; `admin` only via DB), `photourl` (default avatar URL), `tokenVersion` (Number, default 0).
- **courses**: `courseTitle`, `subTitle`, `description`, `category` (enum), `price { amount, currency }` (`amount` in major units, e.g. rupees; `currency` enum `INR` | `USD` | `EUR`), `courseThumbnail` (URL), `thumbnailFileId`, `creator` (ref users), `isPublished` (default false). Index `(isPublished, createdAt)` and text-ish search over title/subtitle/category via escaped regex.
- **lectures**: `lectureTitle`, `description`, `duration` (seconds), `videoUrl` (external link, optional), `fileId` + `filePath` (ImageKit, optional; exactly one of `videoUrl` or `fileId` is required), `isPreviewFree` (default false), `courseId` (indexed). Ordered by `createdAt`.
- **orders**: `userId`, `courseId`, `razorpayOrderId` (unique), `razorpayPaymentId`, `razorpaySignature`, `amount`, `currency`, `status` (`created` | `paid` | `failed`).
- **enrollments**: `userId`, `courseId`, `orderId` (optional, absent for free courses), `progress` (default 0, unused), `enrolledAt`. Unique index `(userId, courseId)`.

## 7. API (base `/api`)

Every response uses one envelope: `{ success: true, message?, ...data }` or `{ success: false, message, errors? }`. Status codes: 400 validation / bad ObjectId, 401 missing or revoked session, 403 wrong role or not enrolled, 404 missing, 409 duplicate.

| Method and path | Access | Purpose |
|---|---|---|
| POST `/auth/register` | Public | Create account (`student` or `instructor` only) and sign in |
| POST `/auth/login` | Public | Sign in. Same 401 "Invalid credentials" for unknown email and wrong password |
| POST `/auth/logout` | Public | Clear cookie |
| GET `/auth/getme` | Auth | Current user |
| PATCH `/users/me` | Auth | Update name |
| PATCH `/users/me/password` | Auth | Change password, bump `tokenVersion`, re-issue cookie |
| GET `/courses` | Public | Published only. `search`, `category`, `sort`, `page`, `limit` (max 50). Returns `enrolledCount`, never student ids |
| GET `/courses/:courseId` | Public | Course + creator + lecture summaries (no locked URLs). 404 for drafts unless owner/admin. Includes `isEnrolled` for the signed-in user |
| GET `/courses/instructor/courses` | Instructor | Own courses with filters, paging, and `totals { courses, published, students }` |
| POST `/courses/create` | Instructor | Multipart with `courseThumbnail` (JPEG/PNG/WebP, 5 MB, signature-checked) |
| PATCH `/courses/update/:courseId` | Owner | Edit, replace thumbnail, publish toggle. Empty string clears subtitle/description |
| DELETE `/courses/:courseId` | Owner | Only if no enrollments |
| GET `/lectures/upload-auth` | Instructor | ImageKit browser-upload parameters |
| POST `/lectures/create` | Owner | JSON: title, description, duration, isPreviewFree, and `fileId`+`filePath` or `videoUrl` |
| PATCH `/lectures/update/:lectureId` | Owner | Same shape. Swapping the video deletes the old ImageKit file |
| DELETE `/lectures/:lectureId` | Owner | Delete lecture and its ImageKit file |
| GET `/lectures/course/:courseId` | Enrolled | All lectures with signed URLs (1 h) |
| GET `/lectures/:lectureId` | Enrolled | One lecture with signed URL |
| GET `/enrollments/me` | Auth | The signed-in user's enrolled courses |
| POST `/payments/create-order` | Auth | Razorpay order, or enroll directly when price is 0 |
| POST `/payments/verify` | Auth | Verify signature (constant-time), order must belong to the user, mark paid, enroll. Idempotent |
| GET `/health` | Public | Liveness |

"Enrolled" means: an enrollment row exists, **or** the user is the course creator, **or** the user is admin. Anonymous users additionally receive the URL of lectures flagged `isPreviewFree` through the course details response.

## 8. Pages and guards

| Path | Guard |
|---|---|
| `/`, `/courses`, `/courses/[courseId]` | Public |
| `/login`, `/register` | Guest only |
| `/dashboard`, `/learn/[courseId]`, `/me` | Signed in (`/dashboard` student-only; instructors go to `/instructor/dashboard`) |
| `/instructor/dashboard`, `/courses/create`, `/courses/edit/[courseId]`, `/courses/[courseId]/lectures` (+ `/create`, `/edit/[lectureId]`) | Instructor |
| `*` | 404 |

`middleware.js` verifies the JWT signature with jose and redirects by role. Every Route Handler re-checks with `requireRole` / `requireEnrollment`, which also compares `tokenVersion` against the database.

## 9. Spec gap fixes included from day one

2 free-preview toggle · 3 refetch user/enrollment after paying · 7 navbar search · 8 and 25 draft visibility · 9 one category list · 10 ISO currency codes · 11 password change keeps user · 12 totals from API · 16 public list always filters published · 17 `tokenVersion` · 18 `enrolledCount` · 19 MIME + signature check on images · 20 enrollment check uses the `enrollments` collection · 21 image files deleted on replace and course delete · 22 duration captured from video metadata · 23 no account enumeration on login · 27 empty string clears fields · 28 order must belong to the signed-in user.

Skipped because their feature is deferred: 1 is solved by design, 4, 5, 6, 13 (ordering), 14, 15, 24, 26, 29.

## 10. Build order

Each step is one prompt in `docs/prompts.md` and must build, lint and be manually checked before the next:

0 scaffold → 1 models and shared validators → 2 auth API → 3 middleware, auth pages, navbar → 4 public course API and catalog/details pages → 5 instructor course API → 6 instructor dashboard and course forms → 7 lecture API → 8 lecture management UI → 9 payments → 10 player and student dashboard → 11 profile → 12 landing page, 404, metadata → 13 hardening and README.
