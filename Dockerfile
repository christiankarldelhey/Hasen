# Production build for Hasen backend
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./backend/
COPY domain/package*.json ./domain/

WORKDIR /app/backend
RUN npm ci

# Copy source code
WORKDIR /app
COPY backend ./backend
COPY domain ./domain

WORKDIR /app/backend

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server with tsx
CMD ["npx", "tsx", "src/server.ts"]
