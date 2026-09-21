---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Codebase Concerns & Known Issues

**Analysis Date:** 2026-09-21

## Technical Debt & Gotchas

1. **Custom Domain CORS Exception Handling**:
   - *Status*: Resolved in `backend/src/shared/utils/cors.util.ts`.
   - *Details*: Previously, calling `callback(new Error(...))` when CORS origin check failed caused Express to treat CORS rejection as an uncaught exception, returning `500 Internal Server Error` on requests from custom domains like `https://cowork30.com`. The `corsOriginDelegate` utility now returns `callback(null, false)` and includes `cowork30.com` natively to prevent server crashes.

2. **Dual Frontend Directories (`frontend` vs `frontend-vite`)**:
   - *Details*: The project contains both Next.js App Router (`frontend/`) and a legacy Vite frontend (`frontend-vite/`). Production build scripts in root `package.json` and Render configuration target `frontend/`. Ensure new UI features and page routes are built inside `frontend/`.

3. **Concurrency & Race Conditions in Booking Engine**:
   - *Details*: High-concurrency desk and meeting room reservations require explicit Prisma `$transaction` isolations to guarantee two simultaneous users cannot book the same seat or time slot.

4. **Render Environment Configuration Sync**:
   - *Details*: Render environment variables (`FRONTEND_URL`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`) must be kept in sync when updating custom domains or SSL certificates.

---
*Codebase concerns analysis: 2026-09-21*
