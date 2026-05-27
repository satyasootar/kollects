FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.0 turbo@2.7.2
COPY . .
RUN turbo prune @repo/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN npm install -g pnpm@9.0.0
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo build --filter=@repo/api...

FROM base AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs expressjs
USER expressjs

COPY --from=installer --chown=expressjs:nodejs /app .

EXPOSE 8000

ENV PORT=8000
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
