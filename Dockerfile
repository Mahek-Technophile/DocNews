FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy all source files
COPY . .

# Build Vite frontend assets into dist/
RUN npx vite build

# Argument to pass Git SHA during CI build
ARG GIT_SHA=local
ENV RENDER_GIT_COMMIT=$GIT_SHA PORT=3000 NODE_ENV=production

# Switch to non-root node user for container security
USER node

# Expose server port
EXPOSE 3000

# Start server using tsx
CMD ["node", "./node_modules/tsx/dist/cli.mjs", "server.ts"]