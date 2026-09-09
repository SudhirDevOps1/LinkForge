# =============================================================================
# 🐳 LinkForge — Production Dockerfile (multi-stage, slim)
# =============================================================================
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Standalone output for minimal runtime image
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S linkforge && adduser -S linkforge -G linkforge

COPY --from=builder /app/public ./public
COPY --from=builder --chown=linkforge:linkforge /app/.next/standalone ./
COPY --from=builder --chown=linkforge:linkforge /app/.next/static ./.next/static
RUN mkdir -p /data/uploads && chown linkforge:linkforge /data

USER linkforge
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
