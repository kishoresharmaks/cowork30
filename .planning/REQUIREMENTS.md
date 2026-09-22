# Requirements: Cowork30 Platform

**Defined:** 2026-09-22
**Core Value:** Ensure 100% data integrity, strict multi-domain CORS security, automated multi-channel notification engine (Email/In-App/Reminders), admin email configuration & template management, outbound email audit logs, and seamless member/admin UI experience.

## v1 Requirements (Completed)

### Security & CORS
- [x] **SEC-01**: Centralized CORS delegate validates requests from `cowork30.com`, `onrender.com`, and custom domains without throwing 500 exceptions on unauthorized origins.
- [x] **SEC-02**: Helmet security headers and strict JWT Bearer authentication active across API routes.

### Auth & User Management
- [x] **AUTH-01**: User registration grants ₹500 welcome bonus logged in wallet transaction.
- [x] **AUTH-02**: Admin login verifies administrator role explicitly and issues JWT token.
- [x] **AUTH-03**: Admin manual password reset endpoint & modal UI in user directory.

### Meeting Room & Desk Engine
- [x] **MTG-01**: Meeting room booking calculates seat-based/hourly rates, service charges, credit deductions, and generates QR access tokens.
- [x] **DSK-01**: Interactive 2D floor map renders desk SVG coordinates and broadcasts live WebSocket status changes via `FloorMapGateway`.

### Wallet, Payments & Invoicing
- [x] **WLT-01**: Manual wallet credit/debit adjustments by admin log auditable wallet transactions.
- [x] **PAY-01**: Razorpay checkout & webhook verification execute transactionally and auto-generate GST PDF invoices.

### Verification & Production Readiness
- [x] **VER-01**: Monorepo builds cleanly with zero TypeScript errors or broken imports in `backend/` and `frontend/`.

---

## Milestone 2 Requirements: Automated Notification System & Admin Control Center

### Notification Infrastructure & Event Triggers (Phase 2)
- [ ] **NOTIF-01**: NestJS Mailer module with Nodemailer SMTP transport service configured in `backend/src/modules/notifications/`.
- [ ] **NOTIF-02**: Reusable responsive HTML email templates for booking confirmations, wallet receipts, slot reminders, and password reset alerts.
- [ ] **NOTIF-03**: Event-driven notification service hooks automatically sending confirmation emails upon successful reservation or payment.

### Admin Email Configuration, Template Editor & Outbound Audit Logs (Phase 2)
- [ ] **NOTIF-06**: Dynamic SMTP Config & Test Email dispatch endpoint in NestJS backend + `/admin/email-settings` UI page.
- [ ] **NOTIF-07**: Email Template Editor API & Admin UI for editing customizable HTML email templates with dynamic tokens (`{{name}}`, `{{bookingCode}}`, etc.).
- [ ] **NOTIF-08**: Outbound Email Audit Log database entity (`EmailLog`) & Admin Log Viewer table with search, status filters, and resend action.

### Multi-Channel Reminders & In-App Feed (Phase 3)
- [ ] **NOTIF-04**: Cron/Interval reminder service checking upcoming meeting room bookings and sending reminder notifications prior to slot start time.
- [ ] **NOTIF-05**: In-app notification feed & bell component in Next.js header showing real-time member alerts.
- [ ] **VER-02**: End-to-end verification of notification triggers with zero build or type errors.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| MTG-01 | Phase 1 | Complete |
| DSK-01 | Phase 1 | Complete |
| WLT-01 | Phase 1 | Complete |
| PAY-01 | Phase 1 | Complete |
| VER-01 | Phase 1 | Complete |
| NOTIF-01 | Phase 2 | Planned |
| NOTIF-02 | Phase 2 | Planned |
| NOTIF-03 | Phase 2 | Planned |
| NOTIF-06 | Phase 2 | Planned |
| NOTIF-07 | Phase 2 | Planned |
| NOTIF-08 | Phase 2 | Planned |
| NOTIF-04 | Phase 3 | Planned |
| NOTIF-05 | Phase 3 | Planned |
| VER-02 | Phase 3 | Planned |

**Coverage:**
- Milestone 2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Last updated: 2026-09-22 for Milestone 2 Expansion*
