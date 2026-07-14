# ----------------------------------------------------------------------
# Multi-stage Dockerfile for the AlgoVision AI backend.
#
# Stage 1 (deps):  install all deps
# Stage 2 (runtime): install ONLY production deps, copy source, run as
#                    non-root, drop all capabilities, install curl for
#                    the HEALTHCHECK, expose 5000.
# ----------------------------------------------------------------------
ARG NODE_VERSION=20-alpine

# -------- stage 1: deps --------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# -------- stage 2: runtime --------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install curl for the healthcheck. Keep it small.
RUN apk add --no-cache curl tini

# Non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --chown=app:app --from=deps /app/node_modules ./node_modules
COPY --chown=app:app . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:5000/health/live || exit 1

# tini gives us a real PID 1 that reaps zombies and forwards signals.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
