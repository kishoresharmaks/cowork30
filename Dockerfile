# Multi-stage Production Dockerfile for Cowork30 Monorepo (NestJS + Next.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy full application codebase
COPY . .

# Set environment for build phase
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and build backend & frontend
RUN cd backend && npx prisma generate && npm run build
RUN cd frontend && npm run build

# --- Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000 4000

CMD ["node", "scripts/start-production.js"]
