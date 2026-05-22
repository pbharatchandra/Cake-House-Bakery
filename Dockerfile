# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for caching purposes
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend and backend (Vite)
RUN npm run build
# Compile TypeScript server to ensure standard execution
RUN npx --no-install tsc server.ts --outDir dist --module CommonJS --esModuleInterop

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts 
# (Note: running via tsx in prod is acceptable but compiling is better. 
# We'll use tsx for simplicity in this Node setup, or 'node dist/server.js' if compiled)

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start custom Express server
CMD ["node", "dist/server.js"]
