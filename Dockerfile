FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install PostgreSQL client for health check
RUN apk add --no-cache postgresql-client

# Create a non-root user to run the app and own app files
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built app
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

# Copy needed config files
COPY --from=builder --chown=appuser:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=appuser:nodejs /app/drizzle.config.ts ./drizzle.config.ts

# Copy and set permissions for our entrypoint script
COPY --chown=appuser:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENV PORT 3000

# Set the correct permission for prerender cache
USER appuser

# Use our entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]