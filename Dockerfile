# =============================================================================
# VOCASTREAM Dockerfile - Production Ready
# =============================================================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for both frontend and backend
COPY package.json package-lock.json* ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install --prefer-offline

# Copy all source code
COPY backend ./backend/
COPY frontend ./frontend/
COPY ./.gitignore ./
COPY ./README.md ./
COPY ./.env.example ./backend/

# Create production .env from example (should be overridden at runtime)
RUN cp .env.example backend/.env || true

# Expose port
EXPOSE 3001

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start application
CMD ["npm", "run", "production"]