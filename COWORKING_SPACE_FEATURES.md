# Coworking Space Platform - Ultimate Master Feature Specification

> **Target Tech Stack**:
> - **Frontend**: Next.js 14/15 (App Router, TypeScript, Tailwind CSS, React Hook Form, Framer Motion)
> - **UI & Design System**: **Shadcn UI + Magic UI / Aceternity UI + HeroUI (NextUI) + Tremor (Admin Analytics)**
> - **Backend API**: **NestJS 10.x (Node.js v20 LTS, TypeScript, Modular Architecture, `@nestjs/swagger`, `@nestjs/websockets`)**
> - **Database**: MySQL (Prisma ORM / Drizzle ORM)
> - **Payment & Tax**: Razorpay (Orders API, Webhooks, Signature Verification) + Automated GST PDF Invoice Engine
> - **Email System (Phase 1)**: **Standard SMTP Mailer (`@nestjs-modules/mailer` + Nodemailer / Resend SMTP)**
> - **IoT Access (Phase 2 - Optional)**: *Deferred to future phase (Kisi, Salto, Yale Smart Lock API)*

---

## Executive Summary & System Blueprint

This document represents the **final, complete specification** for building a next-generation Coworking Space platform. It combines core workspace operations (CMS, pricing tiers, desk tours, meeting room booking, payment gateways) with **cutting-edge modern features** including interactive visual floor maps, member networking portals, credit wallets, automated GST invoicing, SMTP email dispatch, and multi-location branch management.

---

## 1. UI & Aesthetic Design System Recommendations (For a WOW First Impression)

To ensure the web app looks state-of-the-art, visually stunning, and extremely premium, we recommend the following UI ecosystem:

### 1.1 UI Component Architecture

| Library / Tool | Purpose & Usage | Why it's the Best Choice |
| :--- | :--- | :--- |
| **Shadcn UI + Tailwind CSS** | Core Component Foundation (Buttons, Modals, Forms, Data Tables, Dropdowns, Sheets) | Zero-bloat, 100% customizable Tailwind components, fully accessible, dark-mode native. |
| **Magic UI / Aceternity UI** | "WOW" Factor Hero & Landing Elements (Bento Grids, Spotlight Cards, Glowing Borders, Animated Beams, Background Beams) | Creates a high-tech, sleek startup feel that immediately wows visitors. |
| **HeroUI (formerly NextUI)** | Card Grids, Avatars, Chips, Tooltips, Accordions | Silky smooth out-of-the-box animations with glassmorphic aesthetic. |
| **Framer Motion** | Micro-Animations & Page Transitions | Smooth layout transitions, modal pop-ins, tab switching animations, interactive hover scaling. |
| **Tremor / Recharts** | Admin Analytics & Dashboard UI | Premium dark-mode financial charts, room occupancy bar charts, and KPI stats cards. |
| **Lucide React** | Modern Icon Suite | Clean, consistent vector icons across customer & admin portals. |

---

## 2. Database Schema & Data Models (MySQL Blueprint)

### 2.1 Multi-Branch & Core System
- `branches`: `id`, `name`, `slug`, `address`, `city`, `state`, `zip`, `latitude`, `longitude`, `phone`, `email`, `opening_time`, `closing_time`, `is_active`
- `users`: `id`, `branch_id` (nullable), `name`, `email`, `password_hash`, `phone`, `company_name`, `gstin`, `role` (`admin`, `staff`, `member`, `guest`), `avatar_url`, `bio`, `skills` (JSON), `linkedin_url`, `wallet_balance`, `created_at`, `updated_at`
- `activity_log`: `id`, `user_id`, `log_name`, `description`, `subject_type`, `subject_id`, `event`, `properties` (JSON), `ip_address`, `created_at`

### 2.2 Interactive Floor Map & Workspace Catalog
- `floor_maps`: `id`, `branch_id`, `floor_name`, `floor_level` (integer), `map_svg_url` / `canvas_json`, `width`, `height`, `is_active`
- `desks`: `id`, `floor_map_id`, `desk_number`, `desk_type` (`hot_desk`, `dedicated_desk`, `private_cabin`, `quiet_booth`), `x_coordinate`, `y_coordinate`, `width`, `height`, `has_power_outlet`, `has_window_view`, `status` (`available`, `occupied`, `reserved`, `maintenance`), `monthly_price`, `daily_price`
- `services`: `id`, `branch_id` (nullable), `name`, `slug`, `short_description`, `detailed_description` (HTML/Markdown), `icon_class`, `featured_image`, `gallery_images` (JSON), `is_active`, `sort_order`
- `pricing_plans`: `id`, `name`, `slug`, `tagline`, `price_monthly`, `price_daily`, `meeting_credits_included`, `desk_credits_included`, `is_popular`, `is_active`, `sort_order`
- `pricing_features`: `id`, `pricing_plan_id`, `feature_text`, `is_included`, `sort_order`

### 2.3 Meeting Rooms & Add-On Store
- `meeting_rooms`: `id`, `branch_id`, `name`, `slug`, `description`, `capacity`, `hourly_rate`, `daily_rate`, `amenities` (JSON), `images` (JSON), `floor_map_id`, `x_coordinate`, `y_coordinate`, `is_active`, `sort_order`
- `addons`: `id`, `name`, `description`, `price`, `unit` (`per_booking`, `per_hour`, `per_person`), `category` (`catering`, `equipment`, `service`), `image_url`, `is_active`

### 2.4 Bookings, Digital Receipts & Access
- `bookings` (Desk/Office Tours/Memberships):
  - `id`, `booking_code`, `branch_id`, `pricing_plan_id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `company_name`, `gstin`, `preferred_date`, `preferred_time_slot`, `booking_type` (`tour`, `membership_inquiry`, `direct_booking`), `status` (`pending`, `confirmed`, `cancelled`, `completed`), `payment_status` (`unpaid`, `pending`, `paid`, `refunded`), `total_amount`, `tax_amount`, `created_at`
- `booking_notes`: `id`, `booking_id`, `admin_user_id`, `note_text`, `created_at`
- `meeting_bookings`:
  - `id`, `booking_code`, `branch_id`, `meeting_room_id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `company_name`, `gstin`, `booking_date`, `start_time` (datetime), `end_time` (datetime), `total_hours`, `attendees_count`, `addons_selected` (JSON), `status` (`pending`, `confirmed`, `cancelled`, `completed`), `payment_status` (`pending`, `paid`, `failed`, `refunded`), `total_amount`, `credits_used`, `tax_amount`, `qr_access_code` (encrypted string pass), `view_token`, `created_at`

### 2.5 Transactions, Wallet & Invoices
- `wallet_transactions`: `id`, `user_id`, `type` (`credit_topup`, `debit_booking`, `refund`, `reward`), `amount`, `balance_after`, `description`, `reference_id`, `created_at`
- `payments`: `id`, `booking_id`, `meeting_booking_id`, `user_id`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount`, `tax_amount`, `payment_method` (`razorpay`, `wallet`, `credits`, `cash`), `status` (`created`, `captured`, `failed`), `created_at`
- `invoices`: `id`, `invoice_number` (e.g. `INV-2026-00421`), `payment_id`, `user_id`, `customer_name`, `customer_gstin`, `company_name`, `subtotal`, `cgst`, `sgst`, `igst`, `total_amount`, `pdf_url`, `created_at`

### 2.6 Member Community & Feed
- `community_posts`: `id`, `user_id`, `branch_id`, `title`, `content`, `category` (`announcement`, `networking`, `job_opportunity`, `perk`), `likes_count`, `created_at`
- `reviews`: `id`, `user_id`, `meeting_room_id` / `service_id`, `rating` (1-5), `comment`, `is_published`, `created_at`

### 2.7 CMS & Platform Settings
- `slides`, `pages`, `gallery`, `navigation_menu_items`, `logo_settings`, `site_settings` (including SMTP credentials config), `contacts`

---

## 3. NestJS API Module & Controller Architecture

| NestJS Module | HTTP Controller | WebSocket / Gateway | Key Capabilities |
| :--- | :--- | :--- | :--- |
| `AuthModule` | `/api/v1/auth` | - | Member registration, Admin login, JWT Guard, Profile & GSTIN settings |
| `BranchesModule` | `/api/v1/branches` | - | Multi-branch location switcher & address management |
| `ServicesModule` | `/api/v1/services` | - | Workspace services catalog & dynamic detail pages |
| `PricingModule` | `/api/v1/pricing-plans` | - | Pricing tiers comparison matrix & tour booking handler |
| `MeetingRoomsModule`| `/api/v1/meeting-rooms` | - | Room showcase, hourly slot availability algorithm |
| `FloorMapModule` | `/api/v1/floor-map` | `FloorMapGateway` (Socket.io) | Visual SVG floor map layout & live desk status push |
| `BookingsModule` | `/api/v1/bookings` | - | Desk & tour booking CRUD, CSV data export, staff notes |
| `MeetingBookingsModule`| `/api/v1/meeting-bookings` | - | Room reservations, QR pass generator, token receipt API |
| `WalletBillingModule`| `/api/v1/wallet-billing` | - | Razorpay orders, webhook signature verify, GST PDF invoices |
| `CommunityModule` | `/api/v1/community` | - | Member networking directory & noticeboard discussion board |
| `CmsModule` | `/api/v1/cms` | - | Hero sliders, custom pages, navigation menu builder, settings |

---

## 4. Recommended System Architecture Diagram

```
                                  ┌───────────────────────────┐
                                  │   Next.js 14/15 Frontend  │
                                  │   (App Router + Tailwind) │
                                  └─────────────┬─────────────┘
                                                │
                                    REST API    │  WebSockets (@nestjs/websockets)
                                  ┌─────────────┴─────────────┐
                                  │     NestJS 10 Framework   │
                                  │ (Modular API + Swagger)   │
                                  └──────┬──────────────┬─────┘
                                         │              │
                    Prisma ORM / MySQL   │              │  Razorpay / Nodemailer
                                  ┌──────┴──────┐┌──────┴──────────────┐
                                  │ MySQL DB    ││ External Services   │
                                  │ Relational  ││ Razorpay, SMTP Mail │
                                  └─────────────┘└─────────────────────┘
```
