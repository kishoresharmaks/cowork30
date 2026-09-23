# Roadmap: Cowork30 Platform

## Overview

Development roadmap for Cowork30 platform. Milestone 1 (Multi-Domain Security & Core Verification) is complete. Milestone 2 focuses on an Automated Notification System & Admin Email Control Center (SMTP Config, Template Editor, Outbound Logs, In-App Feed, Scheduled Reminders).

## Phases

- [x] **Phase 1: Multi-Domain Security & Core Verification** - Centralized CORS delegate, database transaction integrity, and API build verification.
- [x] **Phase 2: Notification Engine, Admin SMTP Config, Template Editor & Audit Logs** - NestJS Mailer module, HTML email templates, event-driven email dispatch, admin SMTP settings portal, live template editor, and outbound email audit log viewer.
- [x] **Phase 3: In-App Notification Feed & Multi-Channel Reminder Scheduler** - In-app header bell feed, cron reminder scheduler for upcoming bookings, and end-to-end verification.
- [x] **Phase 4: Custom & Professional Business Services Engine** - Loan Syndicate, Land Promoters, Tax Experts, dynamic seat and date requirements in customer and admin portals.

## Phase Details

### Phase 1: Multi-Domain Security & Core Verification
**Goal**: Verify all core business logic, API endpoints, schema constraints, and CORS configurations to make the platform 100% production-ready.
**Depends on**: Nothing
**Requirements**: SEC-01, SEC-02, AUTH-01, AUTH-02, AUTH-03, MTG-01, DSK-01, WLT-01, PAY-01, VER-01
**Success Criteria**:
  1. Requests from `cowork30.com`, `onrender.com`, and custom origins connect cleanly without 500 server crashes.
  2. Monorepo builds cleanly with zero TypeScript errors or broken imports in `backend` and `frontend`.
  3. Booking, meeting room, wallet, and invoicing engines operate deterministically with verified database transaction safety.
**Plans**: 1 plan
- [x] 01-01: Implement centralized CORS delegate and verify backend/frontend monorepo build integrity.

### Phase 2: Notification Engine, Admin SMTP Config, Template Editor & Audit Logs
**Goal**: Build a robust, modular NestJS notification module with Nodemailer/SMTP transport, HTML email templates, event triggers, and complete admin management interfaces for SMTP settings, email templates, and outbound email logs.
**Depends on**: Phase 1
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-06, NOTIF-07, NOTIF-08
**Success Criteria**:
  1. NestJS Mailer / Notifications module is registered cleanly with dynamic SMTP configuration.
  2. Dynamic HTML email templates exist for booking confirmations, wallet top-up receipts, password resets, and slot reminders.
  3. Admin can view and modify SMTP credentials and dispatch instant test emails via `/admin/email-settings`.
  4. Admin can customize email templates with dynamic tokens (`{{name}}`, `{{bookingCode}}`, `{{amount}}`) in the template editor.
  5. Outbound email logs are audited in database and searchable in the admin audit log viewer with resend action.
**Plans**: 1 plan
- [x] 02-01: Create Notifications module, Nodemailer transport service, HTML template engine, Admin SMTP config endpoints, Template Editor, Email Logs audit viewer, and wire event triggers.

### Phase 3: In-App Notification Feed & Multi-Channel Reminder Scheduler
**Goal**: Implement scheduled reminder queues for upcoming bookings and an interactive in-app notification feed in Next.js.
**Depends on**: Phase 2
**Requirements**: NOTIF-04, NOTIF-05, VER-02
**Success Criteria**:
  1. Upcoming booking reminders fire automatically prior to slot start times.
  2. Next.js header renders real-time in-app notification bell and dropdown feed for members.
  3. Full monorepo typecheck and build pass with 0 errors.
**Plans**: 1 plan
- [x] 03-01: Implement cron reminder scheduler, in-app notification feed UI, and complete full build verification.

### Phase 4: Custom & Professional Business Services Engine
**Goal**: Expand service catalog with professional business offerings (Loan Syndicate, Land Promoters, Tax Experts) with dynamic seat rules, flexible date scheduling, and unified customer and admin management.
**Depends on**: Phase 3
**Success Criteria**:
  1. Prisma schema supports `category`, `requiresSeats`, `requiresDate`, `pricingUnit`, `serviceId`, `isSeatNeeded`, `isDateFlexible`, and `consultationType`.
  2. Customer `/services` portal renders category filters, specialized cards, and adaptive inquiry modal (optional/no seats, flexible dates, virtual vs in-person).
  3. Admin `/admin/services` allows configuring custom offerings, seat rules, date rules, and pricing units.
  4. Admin `/admin/service-inquiries` displays category tags, remote vs desk-included status, and live negotiation quotes.
  5. Full backend and frontend production builds pass with 0 errors.
**Plans**: 1 plan
- [x] 04-01: Implement Prisma schema updates, services seeding, adaptive customer inquiry form, and admin offering/inquiry portals.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Multi-Domain Security & Core Verification | 1/1 | Complete | 2026-09-21 |
| 2. Notification Engine & Admin Email Control Center | 1/1 | Complete | 2026-09-22 |
| 3. In-App Notification Feed & Reminder Scheduler | 1/1 | Complete | 2026-09-22 |
| 4. Custom & Professional Business Services Engine | 1/1 | Complete | 2026-09-23 |
