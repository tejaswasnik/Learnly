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
| `APP_URL` | Public origin, used for sitemap and metadata |

Commands: `npm run dev`, `npm run build`, `npm start`, `npm run lint`. Health check: `GET /health`.

## Folder layout
- `app/` routes: `(site)` pages with navbar and footer, `(auth)` login/register, `(player)` course player, `api/` Route Handlers
- `components/` UI (`ui/`, `landing/`, `course/`, `instructor/`, `student/`, `player/`, `profile/`)
- `lib/server/` config, db, auth, validators, services (courses, lectures, enrollment, imagekit, razorpay); `lib/client/`; `lib/shared/`
- `models/` Mongoose models; `proxy.js` route guards; `docs/` specs; `landing-page/` original HTML reference

## Webhook setup
The webhook enrolls students who paid but closed the tab before checkout verification ran.
1. In the Razorpay dashboard (Settings, Webhooks) add `${APP_URL}/api/payments/webhook`. It must be publicly reachable over HTTPS; locally use a tunnel such as ngrok or cloudflared.
2. Subscribe to `payment.captured`, `order.paid` and `payment.failed`.
3. Choose a secret and put the same value in `RAZORPAY_WEBHOOK_SECRET`. Without it the endpoint answers 500.

Deliveries whose signature does not match, or whose amount or currency differs from the stored order, never enroll anyone. Unknown orders and unhandled events get a 200 so Razorpay stops retrying.

## Demo script
1. Register as an **instructor**, create a course with a thumbnail, add lectures (upload a video, or paste a YouTube link) and mark one as a free preview.
2. Turn **Published** on in the instructor dashboard.
3. Register as a **student**, find the course in the catalog, watch the free preview.
4. Buy it with Razorpay test checkout (or enroll if free); the card flips to **Start Course**.
5. Watch every lecture in the player. Buying again is blocked.

## Known limitations
- Uploaded videos that are never attached to a saved lecture stay in ImageKit (no cleanup job).
- No rate limiting.
- No email verification, password reset, Google sign-in or account deletion.
- Player uses native video controls; YouTube lectures do not auto-advance.
- Prices are INR, USD or EUR.
