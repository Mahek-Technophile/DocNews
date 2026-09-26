# Stage 1: Build frontend assets
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx vite build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 PATH="/app/node_modules/.bin:$PATH"

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built frontend assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/api.ts ./
COPY --from=builder /app/services ./services

# Non-root user for security
USER node
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]