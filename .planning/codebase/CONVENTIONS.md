---
last_mapped_commit: ee0adf0c3ba438cb196b31501472cdeee6820b42
last_mapped_at: 2026-09-21
---
# Coding Conventions & Patterns Summary

**Analysis Date:** 2026-09-21

## Code Style & Type Safety

- **Strict TypeScript Enforcement**: Strict type checking enabled in both frontend and backend `tsconfig.json`.
- **Explicit DTO Validation**: Incoming REST API request bodies are validated using `class-validator` annotations (`@IsString()`, `@IsEmail()`, `@IsOptional()`, `@IsEnum()`, `@IsNumber()`).
- **Global Validation Pipe**: NestJS `main.ts` configures automatic DTO transformation and whitelist filtering:
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  ```
- **Error Response Standard**: Machine-readable error codes and error payloads:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid email or password",
      "details": []
    }
  }
  ```
- **Success Response Structure**: APIs return predictable JSON wrappers containing `success: true` alongside payload entities.
- **CORS Security Pattern**: CORS validation is encapsulated in `corsOriginDelegate` (`backend/src/shared/utils/cors.util.ts`), supporting custom domain `cowork30.com`, `onrender.com`, and multi-URL `FRONTEND_URL` environment variables cleanly without server exception crashes.
- **Client Authentication Interceptor**: `frontend/src/lib/api-client.ts` automatically injects `Authorization: Bearer <token>` from `localStorage` into all outgoing HTTP requests.

---
*Codebase conventions analysis: 2026-09-21*
