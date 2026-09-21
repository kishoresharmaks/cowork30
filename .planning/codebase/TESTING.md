---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Testing Infrastructure Summary

**Analysis Date:** 2026-09-21

## Testing Framework & Configuration

- **Backend Testing Framework**: Jest `^30.0.0`, `@nestjs/testing`, `supertest` `^7.0.0`, `ts-jest` `^29.2.5`.
- **Configuration File**: Defined within `backend/package.json` under the `"jest"` configuration key and `backend/test/jest-e2e.json`.
- **Test Runner Scripts**:
  - `npm run test`: Executes Jest unit & integration tests (`src/**/*.spec.ts`)
  - `npm run test:watch`: Runs Jest in interactive watch mode
  - `npm run test:cov`: Generates code coverage reports in `backend/coverage/`
  - `npm run test:e2e`: Runs end-to-end API tests against NestJS test application
- **Code Quality & Linting**: ESLint `^9.18.0` with `@typescript-eslint` rules, Prettier `^3.4.2`.

---
*Codebase testing analysis: 2026-09-21*
