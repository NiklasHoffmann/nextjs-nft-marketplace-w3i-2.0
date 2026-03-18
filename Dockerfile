FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm install --include=dev

FROM deps AS source
COPY . .

FROM source AS builder
ENV NODE_ENV=production
RUN npm run build

FROM base AS web-runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder /app/sentry.edge.config.ts ./sentry.edge.config.ts
COPY --from=builder /app/sentry.server.config.ts ./sentry.server.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
EXPOSE 3000
CMD ["npm", "run", "start:web"]

FROM base AS worker-runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=source /app/package.json ./package.json
COPY --from=source /app/package-lock.json ./package-lock.json
COPY --from=source /app/tsconfig.json ./tsconfig.json
COPY --from=source /app/src ./src
COPY --from=source /app/scripts ./scripts
COPY --from=source /app/public ./public
COPY --from=source /app/instrumentation.ts ./instrumentation.ts
COPY --from=source /app/next.config.ts ./next.config.ts
COPY --from=source /app/next-env.d.ts ./next-env.d.ts
COPY --from=source /app/sentry.edge.config.ts ./sentry.edge.config.ts
COPY --from=source /app/sentry.server.config.ts ./sentry.server.config.ts
CMD ["npm", "run", "worker:start"]

FROM web-runner AS runner
