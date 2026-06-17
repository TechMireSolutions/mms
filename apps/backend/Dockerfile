# Build from repository root:
#   docker build -f apps/backend/Dockerfile -t mms-backend .
#
# Run (PostgreSQL required):
#   docker run -p 3000:3000 -e JWT_SECRET=... -e DATABASE_URL=postgresql://... mms-backend

FROM node:22-alpine AS base
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
RUN pnpm --filter @mms/shared build && pnpm --filter mms-backend build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

RUN pnpm install --frozen-lockfile --prod --filter mms-backend

WORKDIR /app/apps/backend

# Override at runtime — must point to a reachable PostgreSQL instance
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mms

EXPOSE 3000

CMD ["node", "dist/index.js"]
