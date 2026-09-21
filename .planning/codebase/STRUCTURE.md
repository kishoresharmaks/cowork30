---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Directory Structure Summary

**Analysis Date:** 2026-09-21

## Directory Layout & Key Locations

```text
/
├── frontend/                     # Next.js 16 App Router Client
│   ├── src/
│   │   ├── app/                  # Thin App Router routes (public, member, admin, staff)
│   │   │   ├── (auth)/           # Login, Register pages
│   │   │   ├── admin/            # Admin management portal
│   │   │   ├── staff/            # Staff portal pages
│   │   │   ├── bookings/         # Desk & meeting room booking flows
│   │   │   ├── dashboard/        # Member dashboard
│   │   │   └── page.tsx          # Marketing homepage
│   │   ├── components/
│   │   │   ├── layout/           # Header, Footer, AdminSidebar, MobileNav
│   │   │   └── ui/               # Reusable UI primitives (Buttons, Modals, Cards)
│   │   ├── context/              # AuthContext, ThemeContext
│   │   ├── features/             # Feature domain modules
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── meeting-rooms/
│   │   │   ├── floor-map/
│   │   │   ├── wallet-billing/
│   │   │   ├── community/
│   │   │   ├── cms/
│   │   │   └── notifications/
│   │   └── lib/                  # api-client.ts, utils.ts
│   └── next.config.ts            # Next.js rewrites and config
│
├── backend/                      # NestJS 11 Application Server
│   ├── src/
│   │   ├── modules/              # Modular NestJS Feature Modules
│   │   │   ├── auth/             # Controller, Service, DTOs, Guards, Decorators
│   │   │   ├── bookings/         # Booking management
│   │   │   ├── meeting-rooms/    # Meeting room booking engine
│   │   │   ├── floor-map/        # Desk map gateway & controller
│   │   │   ├── wallet-billing/   # Wallet transactions & Razorpay checkout
│   │   │   ├── cms/              # Settings, slides, gallery & file uploads
│   │   │   ├── branches/         # Branch location management
│   │   │   ├── community/        # Social feed & member networking
│   │   │   ├── notifications/    # System alerts & Socket.io push gateway
│   │   │   ├── pricing/          # Membership pricing plans
│   │   │   └── services/         # Space services & inquiry chat gateway
│   │   ├── shared/               # Shared services & utilities
│   │   │   ├── prisma/           # PrismaService database client
│   │   │   └── utils/            # cors.util.ts
│   │   ├── app.module.ts         # Main NestJS Application Module
│   │   └── main.ts               # Entry point, Helmet, CORS & Swagger setup
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.ts               # Seed data generator
│   │   └── migrations/           # Schema migration history
│   └── public/uploads/           # Served media & asset upload destination
│
├── docs/                         # Specifications & deployment guides
├── RENDER_DEPLOYMENT.md          # Cloud deployment guide
└── package.json                  # Root monorepo workspace manifest
```

## Naming Conventions

- **Backend Files**: Kebab-case with suffix (`auth.controller.ts`, `create-booking.dto.ts`, `cors.util.ts`).
- **Frontend Components**: PascalCase (`AdminSidebar.tsx`, `RazorpayGatewayModal.tsx`).
- **NestJS Classes**: PascalCase (`AuthController`, `BookingsService`, `JwtAuthGuard`).

---
*Codebase structure analysis: 2026-09-21*
