# Coworking Space Platform - Project Master Implementation Plan

> **Version & Architecture Lock Document**
> - **Frontend Framework**: Next.js 14.2+ / 15.x (App Router, TypeScript)
> - **UI Component Suite**: Shadcn UI + Magic UI / Aceternity UI + HeroUI (NextUI) + Tremor + Tailwind CSS v4
> - **Backend API Framework**: NestJS 10.x (TypeScript, Node.js v20 LTS)
> - **Database & ORM**: MySQL 8.0+ with Prisma ORM v5.14+
> - **Real-Time Communication**: `@nestjs/websockets` + Socket.io v4.7+
> - **Payment Gateway**: Razorpay Node SDK v2.9+
> - **Email Transport**: `@nestjs-modules/mailer` + Nodemailer v6.9+ (SMTP Transport)
> - **State & Form Validation**: Zod v3.23+ & `class-validator` + Swagger UI (`@nestjs/swagger`)

---

## 1. Modular Feature Architecture & Isolation Guidelines

To ensure **enterprise-grade code quality**, **zero-side-effect upgrades**, and **independent developer workflows**, the project is partitioned into decoupled NestJS feature modules. If one module is being refactored, updated, or temporarily disabled, it will **never break or block** other features.

```
Frontend Architecture (Next.js):
src/
├── app/                        # Next.js App Router (Page routes & layouts ONLY)
│   ├── (auth)/                 # Login / Register routes
│   ├── (public)/               # Homepage, Pricing, Services, Gallery, About
│   ├── (booking)/              # Tour booking, Meeting Room booking, Receipt routes
│   └── admin/                  # Admin Dashboard routes
├── features/                   # Self-Contained Domain Feature Modules
│   ├── auth/                   # Login, Register, JWT, Profile Hooks & Components
│   ├── services/               # Workspace Catalog, Service Cards & Detail Views
│   ├── pricing/                # Plan comparison tables & Tour booking forms
│   ├── meeting-rooms/          # Hourly slot availability, room details, checkout
│   ├── floor-map/              # Interactive SVG/Canvas 2D Desk Picker & Tooltips
│   ├── wallet-billing/         # Wallet balance, Credits, GST PDF Invoice Generator
│   ├── community/              # Member directory & noticeboard feed
│   └── cms/                    # Admin CMS (Hero Sliders, Custom Pages, Menu Builder)
├── components/                 # Shared Design System Components
│   ├── ui/                     # Shared Atomic UI Primitives (Button, Modal, Input, Badge)
│   └── layout/                 # Global Navbar, Footer, Mobile Sidebar
├── lib/                        # Core Utilities (Axios client, Theme tokens, Formatters)
└── styles/                     # Tailwind v4 globals & Brand CSS Variables

Backend Architecture (NestJS Framework):
src/
├── app.module.ts               # Root NestJS Module importing feature modules
├── main.ts                     # Application bootstrap & Swagger OpenAPI config
├── modules/                    # Self-Contained NestJS Feature Modules
│   ├── auth/                   # auth.module.ts, auth.controller.ts, auth.service.ts, dto/, guards/
│   ├── branches/               # branches.module.ts, branches.controller.ts, branches.service.ts
│   ├── services/               # services.module.ts, services.controller.ts, services.service.ts
│   ├── pricing/                # pricing.module.ts, pricing.controller.ts, pricing.service.ts
│   ├── meeting-rooms/          # meeting-rooms.module.ts, meeting-rooms.controller.ts, availability.service.ts
│   ├── floor-map/              # floor-map.module.ts, floor-map.controller.ts, floor-map.gateway.ts
│   ├── bookings/               # bookings.module.ts, bookings.controller.ts, bookings.service.ts
│   ├── meeting-bookings/       # meeting-bookings.module.ts, receipt.service.ts, qr-pass.service.ts
│   ├── wallet-billing/         # wallet-billing.module.ts, razorpay.service.ts, pdf-invoice.service.ts
│   ├── community/              # community.module.ts, community.controller.ts, community.service.ts
│   └── cms/                    # cms.module.ts, cms.controller.ts, cms.service.ts
├── shared/                     # Shared Kernel Modules (PrismaModule, MailerModule, ExceptionsFilter)
└── config/                     # Environment configuration & JWT strategy setup
```

---

## 2. Dynamic Brand Logo & Color Theme Engine

The user interface automatically inherits and reflects the active **Logo & Brand Color System** configured in the Admin Panel or Database:

```
                  ┌──────────────────────────────────────────┐
                  │ Admin Logo & Brand Settings (DB / API)   │
                  └─────────────────────┬────────────────────┘
                                        │
                                        ▼
                  ┌──────────────────────────────────────────┐
                  │ Global Theme Provider (Next.js Root)     │
                  │ Injects Dynamic CSS Custom Properties    │
                  └─────────────────────┬────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌───────────────────────────┐                       ┌───────────────────────────┐
│ Light Theme Design Tokens │                       │ Dark Theme Design Tokens  │
│ --brand-primary: #4F46E5  │                       │ --brand-primary: #6366F1  │
│ --brand-secondary:#06B6D4 │                       │ --brand-secondary:#22D3EE │
│ --brand-surface:  #FFFFFF │                       │ --brand-surface:  #0B0F17 │
│ --brand-card:     #F9FAFB │                       │ --brand-card:     #111827 │
└───────────────────────────┘                       └───────────────────────────┘
```

* **Tailwind CSS v4 Integration**: All components consume utility classes mapped to CSS variables (e.g. `bg-brand-primary`, `text-brand-secondary`, `border-brand-card`).
* **Logo Switcher Component**: Automatically renders `light_logo_url` or `dark_logo_url` based on the user's active theme mode with exact height/width dimensions specified in admin settings.

---

## 3. Detailed Locked Feature Breakdown & Division

### Module 1: AuthModule (`src/modules/auth`)
- Guest booking vs Member registration & login.
- JWT Access Tokens & Refresh Tokens in HTTP-Only SameSite Cookies.
- NestJS Guards (`@UseGuards(JwtAuthGuard, RolesGuard)`) for RBAC (`admin`, `staff`, `member`, `guest`).
- Profile management & GSTIN settings.

### Module 2: FloorMapModule (`src/modules/floor-map`)
- Visual SVG / Canvas floor layout per branch location.
- Live status indicators (🟢 Available, 🔴 Occupied, 🟡 Reserved, ⚙️ Maintenance).
- WebSocket Gateway (`@WebSocketGateway()`) pushing live desk status updates to connected clients.

### Module 3: MeetingRoomsModule (`src/modules/meeting-rooms`)
- Room showcase (capacity, hourly price, amenities tags).
- Slot availability checker (`POST /api/v1/meeting-rooms/:slug/availability`): Datepicker + hourly grid preventing overlapping reservations.
- Add-on service selection (Tea/Coffee, Lunch boxes, Projectors, Whiteboard kit).
- Tokenized digital receipt page with QR Code entry pass (`/booking/view/[token]`).

### Module 4: PricingModule (`src/modules/pricing`)
- Interactive pricing matrix with monthly vs daily rates and featured badges.
- Tour booking wizard (`/book-tour/[planId]`): Customer details, preferred visit date, time slot, and custom notes.

### Module 5: WalletBillingModule (`src/modules/wallet-billing`)
- Member Credit Allowance: Auto-seeds monthly room credits based on tier.
- Prepaid Wallet: Top-up funds via Razorpay for 1-click checkout.
- Automated GST PDF Invoices: Captures GSTIN, calculates CGST (9%) + SGST (9%) or IGST (18%), generates PDF invoice, and sends email attachment.

### Module 6: ServicesModule (`src/modules/services`)
- Service catalog grid & dynamic SEO detail pages (`/services/[slug]`) with image gallery lightboxes.

### Module 7: CommunityModule (`src/modules/community`)
- Member directory (opt-in profile search by skill/industry).
- Community noticeboard feed (announcements, jobs, perks).

### Module 8: Shared MailerModule (`src/shared/mailer`)
- `@nestjs-modules/mailer` + Nodemailer SMTP transporter.
- Responsive HTML templates for: Tour Request Confirmation, Room Receipt + QR Code, GST PDF Invoice attachment, Contact Form Auto-responder.

### Module 9: CmsModule & Admin Gateway (`src/modules/cms`, `src/modules/admin`)
- Executive Analytics Dashboard (Revenue graphs, occupancy rates via Tremor/Recharts).
- Desk/Tour Bookings Manager (Search, filter, status updates, staff notes, CSV export).
- Meeting Room Reservations Manager & FullCalendar View.
- Add-on Store Manager.
- CMS Managers (Hero Sliders, Custom Pages, Navigation Menu Builder, Photo Gallery).
- Site Branding & Logo Configuration (Upload light/dark logos, width/height dimensions, SMTP setup).

### Module 10: IoT Smart Lock Gateway (*Phase 2 - Optional*)
- Webhook trigger endpoint for IoT door controllers (Kisi, Salto, Yale Smart Lock API). (Deferred to Phase 2, schema-ready).

---

## 4. Phase-by-Phase Implementation Roadmap

### Phase 1: NestJS Core Setup & Database Initialization
1. Initialize Next.js 14/15 App Router project with TypeScript & Tailwind CSS v4.
2. Initialize NestJS 10.x framework project with Prisma ORM, Swagger OpenAPI setup, and MySQL schema migrations.
3. Configure design tokens, CSS variables, and Shadcn UI / Magic UI component primitives.
4. Set up central NestJS Exception Filters, JWT Auth Guards, and `@nestjs-modules/mailer` SMTP setup.

### Phase 2: Catalog, CMS & Public UI
1. Implement CMS modules: Hero sliders, dynamic custom pages, photo gallery, navigation menu builder.
2. Implement Services catalog & dynamic detail pages (`/services/[slug]`).
3. Implement Pricing Plans comparison table & Tour Booking inquiry form (`/book-tour`).

### Phase 3: Meeting Room Booking Engine & Razorpay Payments
1. Build Meeting Room catalog & slot availability checker algorithm in `MeetingRoomsModule`.
2. Implement Add-on store (Coffee, Catering, Equipment).
3. Integrate Razorpay payment modal, order generation, and signature verification API.
4. Build tokenized digital receipt page with QR Code pass view (`/booking/view/[token]`).
5. Implement automated GST PDF Invoice generator & SMTP email dispatch.

### Phase 4: Interactive Floor Map & Wallet System
1. Build visual SVG/Canvas Floor Map rendering component with real-time desk status tooltips and NestJS WebSocket Gateway.
2. Build Member Wallet & Credits system (credit top-up via Razorpay, 1-click checkout).

### Phase 5: Admin Control Panel & Analytics
1. Build Admin Dashboard with Tremor/Recharts analytics charts.
2. Build Desk/Tour Bookings & Meeting Room Bookings data tables (filters, staff notes, CSV exports, FullCalendar view).
3. Build Site Branding & Logo configuration center.

### Phase 6: Testing, Polish & Deployment Verification
1. Run automated build checks (`npm run build` for Next.js & NestJS).
2. Verify responsive layout, dark/light theme switching, and smooth Framer Motion animations.
