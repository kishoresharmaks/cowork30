# Fix BookingsService — Complete Production Logic Audit & Implementation

You are working on a NestJS + Prisma booking system.

I need you to **fully audit and fix the booking logic**, not just explain the problems.

IMPORTANT:

* Do NOT summarize or skip any requirement below.
* Do NOT implement only the first issue.
* Do NOT shrink this prompt into a partial implementation.
* Inspect the existing Prisma schema, enums, controllers, DTOs, payment/webhook logic, QR/check-in logic, and all usages of `BookingsService` before modifying code.
* Preserve existing functionality that is correct.
* Do not blindly change database schema unless absolutely necessary.
* If the current schema already has a suitable field for a requirement, use it.
* Do not invent fields without checking the Prisma schema first.
* After implementation, run TypeScript type-check/build/tests and fix resulting errors.
* Search the entire project for related booking/payment/status logic so another service does not reintroduce the same bug.

---

# PRIMARY BUSINESS RULE

The most important rule:

## PAYMENT STATUS and CHECK-IN/BOOKING STATUS ARE COMPLETELY SEPARATE.

Payment being `paid` MUST NOT mean the customer checked in.

Therefore this state MUST NEVER happen automatically:

```text
paymentStatus = paid
customer did NOT check in
booking time expired
        ↓
status = completed
```

Instead:

```text
PAID + NOT CHECKED IN + EXPIRED
        ↓
not_checked_in
```

And:

```text
PAID + ACTUALLY CHECKED IN + EXPIRED
        ↓
completed
```

Do NOT use `paymentStatus === paid` as evidence that a customer checked in.

---

# 1. FIX autoCompleteExpiredBookings()

Audit and completely fix:

```ts
autoCompleteExpiredBookings()
```

## Current bug

The existing logic effectively does:

```ts
if (
  booking.status === BookingStatus.confirmed ||
  booking.paymentStatus === PaymentStatus.paid
) {
  completeBooking();
} else {
  markNotCheckedIn();
}
```

This is WRONG.

A paid booking may never have been checked in.

## Required logic

Determine check-in eligibility using the actual booking/check-in state in the database.

Do NOT infer check-in from payment.

The final logic must conceptually be:

```text
Booking expired
      |
      +-- customer actually checked in?
      |        |
      |        +-- YES → completed
      |        |
      |        +-- NO  → not_checked_in
```

Payment status must remain unchanged.

For example:

```text
paymentStatus = paid
status = pending
expired
not checked in
        ↓
status = not_checked_in
paymentStatus = paid
```

Another example:

```text
paymentStatus = paid
status = confirmed
actually checked in
expired
        ↓
status = completed
paymentStatus = paid
```

DO NOT do:

```ts
paymentStatus === PaymentStatus.paid
```

as a check-in condition.

---

# 2. NEVER automatically change paymentStatus when completing a booking

Current logic does this:

```ts
data: {
  status: BookingStatus.completed,
  paymentStatus: PaymentStatus.paid,
}
```

Remove this behavior.

When a booking becomes completed:

```ts
data: {
  status: BookingStatus.completed,
}
```

The existing payment status must be preserved.

Examples:

```text
completed + paid       → valid
completed + unpaid     → possible if business rules allow it
completed + pending    → possible if business rules allow it
```

Completion itself must NOT modify payment.

Apply this to BOTH:

* regular/desk bookings
* meeting-room bookings

---

# 3. Fix updateStatus()

Audit:

```ts
updateStatus()
updateMeetingStatus()
```

The current implementation automatically does:

```ts
if (
  status === BookingStatus.confirmed ||
  status === BookingStatus.completed
) {
  nextPaymentStatus = PaymentStatus.paid;
}
```

This is WRONG.

Changing booking status must NOT automatically mark payment as paid.

For example:

```text
Admin changes:

status = confirmed
paymentStatus = unpaid
```

must NOT become:

```text
status = confirmed
paymentStatus = paid
```

Instead:

```ts
if (paymentStatus !== undefined) {
  nextPaymentStatus = paymentStatus;
} else {
  nextPaymentStatus = existingPaymentStatus;
}
```

Payment should become `paid` only through the legitimate payment flow/payment confirmation/webhook or an explicit authorized payment operation.

Apply the same separation to:

```ts
updateStatus()
updateMeetingStatus()
```

---

# 4. Audit verifyAndCheckIn()

Completely audit:

```ts
verifyAndCheckIn(code)
```

This is an access-control-critical function.

Current behavior can turn a booking into:

```text
pending + unpaid
        ↓
QR scanned
        ↓
confirmed
```

Do NOT allow QR scanning alone to incorrectly authorize a booking.

First inspect the application's intended payment model.

Determine whether this system supports:

* online prepaid bookings
* pay-at-desk bookings
* wallet/credits
* unpaid reservations

Then enforce the correct business rules.

## QR check-in must validate

Before checking in, validate all applicable conditions:

1. QR/access code is valid.
2. Booking exists.
3. Booking is not cancelled.
4. Booking is not already completed.
5. Booking is not already checked in.
6. Booking date is valid.
7. Booking time/slot is valid.
8. Booking has not expired.
9. Booking belongs to the correct branch where applicable.
10. Payment requirement is satisfied if this booking type requires prepayment.
11. The booking is actually eligible for check-in.

Do NOT use:

```ts
paymentStatus === paid
```

as proof of check-in.

Do NOT use:

```ts
status === confirmed
```

as proof of payment.

Keep those concepts separate.

---

# 5. Prevent expired QR check-in

An expired booking must not be able to get checked in merely because its QR code still exists.

Example:

```text
Booking:
10:00 AM → 6:00 PM

Current time:
8:00 PM

QR scan:
        ↓
DENY
```

Do not allow:

```text
expired booking
        ↓
status = confirmed
```

The exact allowed check-in window should be determined from the existing application's booking rules/schema.

Do not invent arbitrary times.

---

# 6. Fix timezone handling

Audit all date/time logic.

The current `autoCompleteExpiredBookings()` appears to interpret timestamps in two different ways:

1. As an absolute JavaScript Date/UTC timestamp.
2. As a local wall-clock date reconstructed using:

```ts
new Date(year, month, day, hour, minute)
```

Do NOT do both.

Choose one consistent timezone strategy based on how the project stores booking dates/times.

Prefer:

```text
Database:
timezone-aware/UTC-compatible timestamps

Backend:
compare Date objects consistently

Display:
convert to configured business timezone
```

Do not manually parse an ISO string and reinterpret it as local time unless the application's storage model explicitly requires it.

Inspect the existing project timezone configuration before changing this.

---

# 7. Fix regular/desk booking expiry

Current logic uses:

```ts
23:59:59.999
```

of the preferred date.

This can be wrong.

For example:

```text
preferredDate = 2026-09-22
preferredTimeSlot = 10:00 AM
```

If the booking actually ends at 6 PM, it should not remain active until midnight.

Inspect the booking model and pricing-plan/slot configuration.

Use the actual booking end time wherever available.

If the existing system only supports date-level bookings and intentionally treats the entire date as valid, preserve that behavior.

Do not invent an end time.

---

# 8. Automatic expiry must not depend only on API requests

Current code triggers:

```ts
autoCompleteExpiredBookings()
```

from:

```ts
findAll()
findMeetingBookings()
```

This means expiry may not happen until somebody requests those endpoints.

Example:

```text
Booking ends at 6 PM
        ↓
No API request after 6 PM
        ↓
Database still says confirmed/pending
        ↓
8 PM → still not processed
```

Implement a reliable server-side scheduled mechanism if the project already uses NestJS scheduling/background workers.

Inspect package.json and existing scheduler architecture first.

If `@nestjs/schedule` is already available, use the existing pattern.

Otherwise add the minimum required dependency/configuration only if appropriate.

The scheduled process should safely process expired bookings.

Also keep the service method reusable for manual/API-triggered execution if currently needed.

---

# 9. Make auto-completion idempotent

The expiry process may run multiple times.

It must be safe to execute repeatedly.

Example:

```text
run 1:
confirmed + checked-in + expired
→ completed

run 2:
completed
→ no change
```

Do not repeatedly update terminal records.

Do not send duplicate notifications/emails due to repeated scheduler executions.

Use appropriate database conditions.

---

# 10. Do NOT silently swallow auto-completion errors

Current code:

```ts
await this.autoCompleteExpiredBookings().catch(() => {});
```

This hides production failures.

Replace silent swallowing with proper NestJS logging.

Example:

```ts
.catch((error) => {
  this.logger.error(
    'Failed to auto-complete expired bookings',
    error?.stack || error,
  );
});
```

Add `Logger` if appropriate.

Apply to both:

```ts
findAll()
findMeetingBookings()
```

Do not expose sensitive internal error details to API users.

---

# 11. Fix getAdminStats()

Audit:

```ts
getAdminStats()
```

## A. Monthly revenue

Current implementation aggregates all booking revenue but calls it:

```text
monthlyRevenue
```

This is incorrect.

Calculate actual current-month revenue.

Use the appropriate date range:

```text
start of current month
        ↓
start of next month
```

Apply the same date filtering to:

* regular bookings
* meeting bookings

But do not assume `totalAmount` means paid revenue.

Revenue should reflect successful/paid transactions according to the existing payment model.

Inspect the payment relations and payment statuses before implementing.

---

# 12. Remove fake revenue fallback

Current code has:

```ts
monthlyRevenue: monthlyRevenue > 0 ? monthlyRevenue : 2540
```

Remove the hardcoded:

```text
2540
```

If actual revenue is zero:

```ts
monthlyRevenue: 0
```

Do not return fake business statistics.

If demo data is required, it must be explicitly isolated to a demo/mock environment and must never affect production API responses.

---

# 13. Fix roomOccupancyRate

Current calculation:

```ts
(activeReservations / (totalRooms * 10)) * 100
```

is not logically correct unless there is an actual documented reason for the `10`.

Do not guess.

Inspect the meeting-room booking model and determine how occupancy should be calculated.

If the intended metric is simply:

```text
occupied rooms / total rooms
```

then use that.

If the intended metric is:

```text
occupied room-hours / available room-hours
```

then calculate room-hours.

Do not hardcode an unexplained multiplier.

Also make sure the result cannot exceed 100%.

---

# 14. Fix activeMembers

Current:

```ts
const activeMembers = await this.prisma.user.count();
```

This counts every user.

Inspect the user model and roles.

If admin stats mean actual members, filter appropriately, for example:

```ts
where: {
  role: 'member'
}
```

If there is an `isActive` field, determine whether "active members" should also require it.

Use the actual project schema rather than inventing fields.

---

# 15. Fix CSV escaping

There are two CSV export functions.

One already uses:

```ts
escapeCsv()
```

The other manually inserts database values into CSV strings.

Make both exports use the same robust CSV escaping function.

Correctly handle:

* commas
* quotes
* newlines
* null/undefined values

Example:

```text
Sharma, Kishore
```

must remain one CSV field.

Example:

```text
Kishore "KS" Sharma
```

must be correctly escaped.

Do not duplicate CSV escaping implementations.

---

# 16. Fix addNote() admin ID fallback

Current:

```ts
adminUserId: adminUserId || 1
```

Do NOT attribute notes to user ID `1` automatically.

If adminUserId is required:

```ts
if (!adminUserId) {
  throw new BadRequestException('Admin user ID is required');
}
```

Then create the note using the authenticated admin's actual ID.

Inspect the controller/authentication layer to ensure the ID is correctly passed.

Do not weaken authorization to make this work.

---

# 17. Review terminal-state protection

Current code prevents changes after:

```text
completed
cancelled
```

Review all booking status transitions.

Ensure:

```text
completed → confirmed
completed → pending
completed → cancelled
completed → unpaid
```

cannot happen accidentally.

Likewise ensure cancelled bookings cannot be reactivated through QR scanning or normal status update APIs unless there is an explicit authorized reactivation workflow.

Review both:

```ts
updateStatus()
updateMeetingStatus()
verifyAndCheckIn()
```

---

# 18. Define status/payment responsibilities clearly

Use this conceptual model:

## Booking lifecycle

```text
pending
   ↓
confirmed
   ↓
completed
```

Possible cancellation:

```text
pending → cancelled
confirmed → cancelled
```

If the project has a separate check-in status/field, use it.

If `confirmed` currently means "checked in", inspect the entire project before changing semantics.

Do NOT introduce a new enum value such as `checked_in` unless the Prisma schema and application architecture genuinely require it.

## Payment lifecycle

```text
unpaid
   ↓
pending
   ↓
paid
```

Possible:

```text
pending → failed
```

Payment status must be independently controlled.

Never automatically perform:

```text
confirmed → paid
completed → paid
paid → checked in
```

---

# 19. Search the entire codebase

Before finalizing the fix, search the complete project for:

```text
BookingStatus.confirmed
BookingStatus.completed
BookingStatus.not_checked_in
PaymentStatus.paid
PaymentStatus.unpaid
PaymentStatus.pending
verifyAndCheckIn
autoCompleteExpiredBookings
updateStatus
updateMeetingStatus
paymentStatus
booking.status
meetingBooking.status
```

Find any other service/controller/job/webhook that can modify these fields.

Make sure there isn't another code path that still does:

```ts
status = completed
paymentStatus = paid
```

or:

```ts
status = confirmed
paymentStatus = paid
```

without actual payment confirmation.

Also inspect payment webhook handling and ensure it only updates payment state and does not incorrectly mark check-in/completion.

---

# 20. Database consistency and race conditions

The expiry/check-in logic can potentially be called simultaneously.

Example:

```text
Request A:
QR check-in

Request B:
expiry scheduler
```

at nearly the same time.

Make the transitions safe against race conditions.

Use appropriate Prisma transaction/update conditions where needed.

Avoid:

```text
read
↓
decide
↓
blind update
```

when another request can change the same booking between those operations.

Where appropriate use conditional updates/transactions.

---

# 21. Notifications

Inspect existing notification behavior.

Do not send:

```text
Booking completed
```

when the customer was actually:

```text
not_checked_in
```

If the system has notifications for:

* booking confirmation
* check-in
* completion
* cancellation
* not checked in

ensure they are triggered only for the correct transition.

Avoid duplicate notifications when the scheduler runs repeatedly.

---

# 22. Do not break existing API response structures unnecessarily

Preserve existing response structures such as:

```ts
{
  success: true,
  booking: updated
}
```

and:

```ts
{
  success: true,
  stats: ...
}
```

unless a change is genuinely required.

The frontend may already depend on these structures.

---

# 23. Validation

After implementation:

1. Run Prisma validation/generation if required.
2. Run TypeScript type checking.
3. Run lint.
4. Run unit tests if present.
5. Run build.
6. Fix all compilation/type errors.
7. Search again for the dangerous patterns.

Especially search for:

```ts
paymentStatus: PaymentStatus.paid
```

inside booking status transition logic.

Search for:

```ts
status: BookingStatus.completed
```

and verify that it is only used when the booking genuinely qualifies for completion.

---

# 24. Required test scenarios

Create or run tests for at least these cases.

## Test 1 — PAID but NOT checked in

```text
status = pending
paymentStatus = paid
booking expired
not checked in
```

Expected:

```text
status = not_checked_in
paymentStatus = paid
```

NOT:

```text
completed
```

---

## Test 2 — PAID and checked in

```text
status/check-in state = checked in
paymentStatus = paid
booking expired
```

Expected:

```text
status = completed
paymentStatus = paid
```

---

## Test 3 — UNPAID and NOT checked in

```text
status = pending
paymentStatus = unpaid
booking expired
not checked in
```

Expected:

```text
status = not_checked_in
paymentStatus = unpaid
```

---

## Test 4 — Confirmed does NOT automatically mean paid

Given:

```text
status = confirmed
paymentStatus = unpaid
```

calling status update must NOT change payment status to `paid`.

---

## Test 5 — Completed does NOT automatically mean paid

Given:

```text
status = confirmed
paymentStatus = unpaid
```

when legitimately completing the booking:

```text
status = completed
paymentStatus = unpaid
```

unless a separate payment operation has actually marked it paid.

---

## Test 6 — QR cannot check in cancelled booking

Expected:

```text
403/400 business error
```

according to existing API conventions.

---

## Test 7 — QR cannot check in expired booking

Expected:

```text
check-in denied
```

---

## Test 8 — QR cannot check in already completed booking

Expected:

```text
check-in denied
```

or existing appropriate behavior.

---

## Test 9 — QR cannot convert unpaid booking to confirmed unless pay-at-desk is explicitly supported

Follow the project's actual payment/business model.

Do not make assumptions.

---

## Test 10 — Monthly revenue

If database contains:

```text
August revenue = ₹10,000
September revenue = ₹2,000
```

and current month is September:

Expected:

```text
monthlyRevenue = ₹2,000
```

not:

```text
₹12,000
```

---

## Test 11 — Zero revenue

Expected:

```text
monthlyRevenue = 0
```

Never:

```text
2540
```

---

## Test 12 — CSV

Test names/emails/company names containing:

```text
comma
quote
newline
```

and verify valid CSV output.

---

# 25. Final verification report

After making the changes, provide a concise implementation report containing:

### Changed files

List every file modified.

### Booking lifecycle changes

Explain exactly how:

```text
pending
confirmed
not_checked_in
completed
cancelled
```

now behave.

### Payment lifecycle changes

Explain how:

```text
unpaid
pending
paid
failed
```

are handled independently.

### QR/check-in changes

Explain the validation rules.

### Expiry changes

Explain how expired bookings are processed and what happens to checked-in vs non-checked-in bookings.

### Statistics changes

Explain:

* monthly revenue
* active members
* room occupancy

### Tests

List tests executed and their results.

### Build

Confirm whether:

```text
typecheck
lint
tests
build
```

passed.

---

# ABSOLUTE RULES

Do NOT:

```text
PAID → COMPLETED
```

unless the customer actually checked in and the booking has legitimately ended.

Do NOT:

```text
CONFIRMED → PAID
```

just because status was changed.

Do NOT:

```text
COMPLETED → PAID
```

just because the booking expired.

Do NOT:

```text
QR SCAN → CONFIRMED
```

without validating booking eligibility.

Do NOT:

```text
EXPIRED + PAID → COMPLETED
```

when the customer did not check in.

The correct core rule is:

```text
                 BOOKING EXPIRES
                       │
             ┌─────────┴─────────┐
             │                   │
        CHECKED IN?          NOT CHECKED IN
             │                   │
            YES                  NO
             │                   │
             ▼                   ▼
         COMPLETED          NOT_CHECKED_IN
             │                   │
             └─────────┬─────────┘
                       │
                 PAYMENT STATUS
                 remains independent
```

Implement this carefully across the entire application, not only inside `BookingsService`.
