---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# External Integrations Summary

**Analysis Date:** 2026-09-21

## Third-Party Services & APIs

- **Razorpay Payment Gateway**:
  - Implementation: `backend/src/modules/wallet-billing/wallet-billing.service.ts`
  - UI Component: `frontend/src/components/ui/RazorpayGatewayModal.tsx`
  - Capabilities: Wallet top-up payments, direct desk & meeting room checkout, payment verification, and webhook handling.

- **PostgreSQL Database**:
  - Connection & Schema: `backend/prisma/schema.prisma`
  - Key Domain Entities: Users, Branch, Desk, MeetingRoom, Booking, MeetingBooking, WalletTransaction, Payment, Invoice, CommunityPost, Notification.

- **SMTP Email Delivery**:
  - Engine: Nodemailer & `@nestjs-modules/mailer`
  - Usage: User registration welcome emails, automated booking confirmations, PDF invoice delivery, and staff notifications.

- **Socket.io Real-time Infrastructure**:
  - Gateways:
    - `FloorMapGateway`: Live desk occupancy updates (`backend/src/modules/floor-map/floor-map.gateway.ts`)
    - `NotificationsGateway`: Real-time user notification badges (`backend/src/modules/notifications/notifications.gateway.ts`)
    - `ServicesChatGateway`: Live inquiry chat threads (`backend/src/modules/services/services-chat.gateway.ts`)
  - Access Control: Centralized `corsOriginDelegate` (`backend/src/shared/utils/cors.util.ts`) supporting `cowork30.com` and `onrender.com`.

- **Multer Disk Storage & Static Asset Serving**:
  - Location: `backend/src/modules/cms/cms.controller.ts`
  - Usage: Uploaded user avatars, floor plan SVGs, gallery images, and branding assets served under `/uploads/`.

---
*Codebase integrations analysis: 2026-09-21*
