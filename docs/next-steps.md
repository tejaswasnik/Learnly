# Next steps

Phase 2 (launch readiness) is built: payment webhook, email verification, password reset, rate limiting, logout token blacklist, account deletion and orphan cleanup. First, run the checks in docs/README.md "Not yet verified against real services".

What is left, in suggested order:
- Automated tests and CI, so the flows above stop depending on manual scripts
- Lecture progress tracking and resume
- Admin panel
- Docker setup with a MongoDB replica set
- Redis, only if traffic needs it: swap the storage inside `lib/server/services/rate-limit.js` and the revoked-token check in `lib/server/auth.js`
- Refunds and a job that reconciles orders stuck in `created`
- Google sign-in
