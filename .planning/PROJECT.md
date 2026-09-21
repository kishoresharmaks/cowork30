# Cowork30 Platform

## What This Is

Cowork30 is an enterprise-grade coworking-space management platform featuring an hourly/daily meeting room engine, interactive 2D floor maps, credit wallet with automated GST invoicing, member community feeds, and an admin control portal. Built with Next.js 16 App Router, NestJS 11, PostgreSQL, and Prisma ORM.

## Core Value

Ensure 100% data integrity, strict multi-domain CORS security, error-free booking transactions, and seamless member/admin UI experience ready for production deployment.

## Business Context

- **Customer**: Coworking space members, enterprise clients, staff managers, and space administrators.
- **Revenue model**: Desk memberships, hourly meeting room bookings, workspace service addons, and wallet top-ups.
- **Success metric**: 0 runtime HTTP 500 exceptions, 100% verified Razorpay webhooks, and sub-100ms API response times.

## Requirements

### Validated

- ✓ [Multi-Domain CORS Delegate] — `backend/src/shared/utils/cors.util.ts` configured for `cowork30.com`, `onrender.com`, and local network IPs
- ✓ [Auth & User Management] — Role-based access control (`admin`, `staff`, `member`, `guest`), JWT authentication, bcrypt password hashing
- ✓ [Meeting Room Engine] — Seat-level pricing, service charges, credit deductions, QR access tokens
- ✓ [2D Floor Map Layout] — SVG desk placement, live WebSocket status updates via `FloorMapGateway`
- ✓ [Credit Wallet & Invoicing] — Manual/Razorpay wallet top-ups, transaction audits, automated PDF GST invoices

### Active

- [ ] [Verification of all API Logics & Schema Constraints] — Comprehensive audit of NestJS controllers, services, DTOs, and Prisma schema
- [ ] [Production Monorepo Build Readiness] — Ensure zero build errors, zero broken imports, and strict TypeScript compliance across frontend & backend

### Out of Scope

- [Redundant Framework Additions] — Sticking strictly to Next.js App Router & NestJS 11 as specified in AGENTS.md rules.

## Context

- Existing monorepo codebase mapped in `.planning/codebase/`.
- Dual frontend structure: `frontend/` (Next.js 16 App Router) is the production target.
- Backend NestJS server configured with Swagger API docs at `/api/docs`.

## Constraints

- **Tech Stack**: Next.js 16, NestJS 11, PostgreSQL, Prisma ORM, Tailwind CSS v4, Socket.io
- **Security**: Must pass strict CORS validation without throwing 500 exceptions on denied origins.
- **Data Integrity**: Financial and booking operations must execute inside Prisma transactions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom CORS Delegate | Prevent Express 500 error when unallowed origins connect | ✓ Good |
| Next.js App Router | Locked baseline for production frontend | ✓ Good |
| Modular NestJS Feature Architecture | Feature isolation and single-responsibility services | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-09-21 after initialization*
