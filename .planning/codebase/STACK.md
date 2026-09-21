---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Technology Stack Summary

**Analysis Date:** 2026-09-21

## Core Technologies & Runtimes

- **Monorepo Architecture**: npm Workspaces (`frontend`, `backend`, root orchestrator)
- **Node.js**: Node 22.x
- **Frontend Framework**: Next.js 16.3.2 App Router, React 19.2.8, TypeScript 5.x
- **Frontend Styling & UI**: Tailwind CSS 4.x, Framer Motion 13.1.1, Lucide React icons, CVA (`class-variance-authority`), `clsx`, `tailwind-merge`, Sonner toast notifications
- **Frontend State & Validation**: React Hook Form 7.86.0, Zod 3.25.76, Axios 1.19.0, Socket.io Client 4.8.3
- **Backend Framework**: NestJS 11.0.1 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/websockets`, `@nestjs/passport`)
- **Database & ORM**: PostgreSQL database managed via Prisma ORM 5.22.0 (`@prisma/client`)
- **Backend Auth & Security**: JWT (`@nestjs/jwt`, `passport-jwt`), bcrypt 6.0.0, Helmet 8.3.0, Express Rate Limit
- **Real-Time WebSockets**: Socket.io Server 4.8.3 (`@nestjs/platform-socket.io`, `@nestjs/websockets`)
- **Payments & Invoicing**: Razorpay Node SDK 2.9.8, PDFKit 0.20.1 (Automated GST Invoicing)
- **Email Services**: Nodemailer 9.0.5, `@nestjs-modules/mailer`

## Build & Deployment Infrastructure

- **Monorepo Task Runner**: `concurrently ^9.1.2`
- **Cloud Deployment**: Render Web Service & PostgreSQL (`RENDER_DEPLOYMENT.md`)
- **Schema Management**: Prisma CLI (`npx prisma generate`, `npx prisma db push`)

---
*Codebase stack analysis: 2026-09-21*
