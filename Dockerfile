# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend and combine
FROM node:20-slim
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./backend/
# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for volumes
RUN mkdir -p backend/data uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose the backend port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/backend/data/study.db

CMD ["node", "backend/server.js"]
