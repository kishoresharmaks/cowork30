---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Architecture Overview

**Analysis Date:** 2026-09-21

## System Design & Architectural Patterns

- **Monorepo Structure**:
  - `frontend/`: Next.js 16 App Router client application.
  - `backend/`: NestJS 11 modular REST API & WebSocket backend server.
  - Root `package.json`: Task orchestrator managing concurrent execution and Render deployment scripts.

- **Frontend Architecture**:
  - **Feature-Driven Organization**: Features isolated into `frontend/src/features/` (`auth`, `bookings`, `meeting-rooms`, `floor-map`, `wallet-billing`, `community`, `cms`, `notifications`).
  - **Thin App Router Routes**: Routes in `frontend/src/app/` act as light layout/page wrappers, delegating state & UI to feature components.
  - **Centralized API Client**: `frontend/src/lib/api-client.ts` handles JWT Bearer tokens, dynamic base URLs (`NEXT_PUBLIC_API_URL` / window origin), and error logging.

- **Backend Architecture**:
  - **Modular NestJS Pattern**: Feature modules located in `backend/src/modules/`:
    - `auth`: User registration (with ₹500 welcome bonus), JWT login, role-based access control (`admin`, `staff`, `member`, `guest`).
    - `bookings`: Desk & membership booking engine, inquiry communication, admin notes.
    - `meeting-rooms`: Hourly/daily seat reservation, amenity filtering, QR access tokens.
    - `floor-map`: Visual 2D desk layout engine, SVG coordinates, real-time desk status broadcasts.
    - `wallet-billing`: Credit wallet top-up, Razorpay integration, audit transactions, automated GST invoices.
    - `cms`: Site settings, hero banners, gallery items, navigation menus, image uploads.
    - `branches`: Multi-branch location metadata & operating hours.
    - `community`: Member networking feed and categorized posts.
    - `notifications`: System notifications & Socket.io push broadcasts.
    - `pricing`: Membership pricing tiers and feature lists.
    - `services`: Space services catalog and inquiry chat.

- **Data Flow & Security Layer**:
  - Database access managed via `PrismaService` (`backend/src/shared/prisma/prisma.service.ts`) connected to PostgreSQL.
  - Global validation pipe enforces strong DTO typing via `class-validator` & `class-transformer`.
  - Security headers applied via `helmet`, with origin verification handled by `corsOriginDelegate` in `backend/src/shared/utils/cors.util.ts`.

---
*Codebase architecture analysis: 2026-09-21*
