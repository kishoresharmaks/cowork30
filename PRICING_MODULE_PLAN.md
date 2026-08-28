# Pricing Module Execution Plan

## Goal
Make pricing the source of truth for coworking membership offers, tour requests, and conversion into bookings, without mixing it into payment or room-reservation logic.

## What Pricing Owns
- Membership plans and public plan display.
- Plan features, billing period, popularity, activation, and sort order.
- Tour and membership inquiry requests.
- Quote inputs used by bookings and wallet billing.
- Revenue and conversion data needed by reports.

## What Pricing Does Not Own
- Final booking status transitions.
- Payment capture and webhook verification.
- Meeting room availability logic.
- Desk or floor-map occupancy updates.

## Dependency Order
1. Schema and DTO alignment.
2. Catalog APIs.
3. Quote calculation.
4. Booking handoff.
5. Admin pricing UI.
6. Reports and analytics.

## Phase 1: Schema and DTO Alignment
### Backend changes
- Keep `PricingPlan` and `PricingFeature` as the pricing core tables.
- Expose all commercial fields in API payloads:
  - `priceMonthly`
  - `priceDaily`
  - `billingPeriod`
  - `meetingCreditsIncluded`
  - `deskCreditsIncluded`
  - `isPopular`
  - `isActive`
  - `sortOrder`
- Add validation DTOs for create and update actions.
- Normalize request payloads so admin UI and public UI use the same field names.

### Outcome
- The API stops depending on ad hoc `any` payloads.
- The frontend can edit all pricing fields consistently.

## Phase 2: Catalog APIs
### Public APIs
- `GET /pricing/plans`
- `GET /pricing/plans/:slug`

### Admin APIs
- `POST /pricing/plans`
- `PUT /pricing/plans/:id`
- `DELETE /pricing/plans/:id`
- `PATCH /pricing/plans/:id/toggle-active`
- `PATCH /pricing/plans/:id/toggle-popular`

### Required behavior
- Public requests return only active plans unless `all=true` is provided by admin flows.
- Plans should include ordered features.
- Plan retrieval should support branch-aware defaults if the product later needs branch-specific pricing.

### Outcome
- Pricing becomes a stable catalog service instead of a page-only API.

## Phase 3: Quote Calculation
### Inputs
- Selected plan.
- Billing period.
- Branch.
- Addons.
- Credits.
- Tax rules.

### Outputs
- Base amount.
- Discount amount.
- Tax amount.
- Final total.
- Included credits.
- Human-readable summary.

### Rules
- Monthly should be the default commercial price.
- Daily should be used only when the user selects short-term access.
- Credits and addons should be calculated before tax if they are part of the taxable base.
- Quote generation should be deterministic and reusable by booking, wallet billing, and admin preview screens.

### Outcome
- The same pricing math is used everywhere.

## Phase 4: Booking Handoff
### Flow
- Public user selects a pricing plan.
- Pricing creates a tour or membership inquiry request.
- Booking service owns the final booking lifecycle.
- Wallet billing owns payment capture and invoice generation.

### Required integration
- Pass `pricingPlanId` into booking records.
- Save the quote result into booking totals.
- Mark booking status separately from payment status.

### Outcome
- Pricing becomes the entry point, not the final source of record for reservations.

## Phase 5: Admin Pricing UI
### Screen requirements
- List plans with active/inactive and popular states.
- Create and edit plan name, slug, billing period, prices, credits, and feature list.
- Preview the public-facing card before saving.
- Show feature ordering and plan sort order.

### UX rules
- Keep the public page and admin page consistent in terminology.
- Avoid hardcoded fallback values in the UI.
- Surface validation errors clearly.

### Outcome
- Admins can manage pricing without editing code.

## Phase 6: Reports and Analytics
### Metrics
- Plan views.
- Tour request conversions.
- Booking conversion by plan.
- Revenue by plan.
- Active vs inactive plan usage.

### Outcome
- Pricing can be measured and adjusted based on performance.

## Acceptance Criteria
- Public pricing page loads active plans from the backend.
- Admin can create, edit, deactivate, and highlight plans.
- Tour request flow stores the selected plan correctly.
- Booking and payment flows consume pricing data without duplicating pricing rules.
- Reports can group revenue by plan.

## Suggested Next Build Order
1. Add DTOs and validation.
2. Expand pricing controller/service fields.
3. Make the frontend use the returned pricing structure directly.
4. Add quote calculation.
5. Connect booking and report consumers.
