# Requirements: Cowork30 Platform

**Defined:** 2026-09-21
**Core Value:** Ensure 100% data integrity, strict multi-domain CORS security, error-free booking transactions, and seamless member/admin UI experience ready for production deployment.

## v1 Requirements

### Security & CORS

- [ ] **SEC-01**: Centralized CORS delegate validates requests from `cowork30.com`, `onrender.com`, and custom domains without throwing 500 exceptions on unauthorized origins.
- [ ] **SEC-02**: Helmet security headers and strict JWT Bearer authentication active across API routes.

### Auth & User Management

- [ ] **AUTH-01**: User registration grants ₹500 welcome bonus logged in wallet transaction.
- [ ] **AUTH-02**: Admin login verifies administrator role explicitly and issues JWT token.

### Meeting Room & Desk Engine

- [ ] **MTG-01**: Meeting room booking calculates seat-based/hourly rates, service charges, credit deductions, and generates QR access tokens.
- [ ] **DSK-01**: Interactive 2D floor map renders desk SVG coordinates and broadcasts live WebSocket status changes via `FloorMapGateway`.

### Wallet, Payments & Invoicing

- [ ] **WLT-01**: Manual wallet credit/debit adjustments by admin log auditable wallet transactions.
- [ ] **PAY-01**: Razorpay checkout & webhook verification execute transactionally and auto-generate GST PDF invoices.

### Verification & Production Readiness

- [ ] **VER-01**: Monorepo builds cleanly with zero TypeScript errors or broken imports in `backend/` and `frontend/`.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| MTG-01 | Phase 1 | Complete |
| DSK-01 | Phase 1 | Complete |
| WLT-01 | Phase 1 | Complete |
| PAY-01 | Phase 1 | Complete |
| VER-01 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-21*
*Last updated: 2026-09-21 after initial definition*
