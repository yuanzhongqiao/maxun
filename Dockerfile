# --- Base Stage ---
FROM node:18 AS base
WORKDIR /app

# Copy shared package.json and install dependencies
COPY package.json package-lock.json ./
COPY maxun-core/package.json ./maxun-core/package.json
RUN npm install

# --- Backend Build Stage ---
FROM base AS backend-build
WORKDIR /app

# Copy TypeScript configs
COPY tsconfig*.json ./
COPY server/tsconfig.json ./server/

# Copy ALL source code (both frontend and backend)
COPY src ./src
# Copy backend code and maxun-core
COPY server/src ./server/src
COPY maxun-core ./maxun-core

# Install TypeScript globally and build
RUN npm install -g typescript
RUN npm run build:server

# --- Frontend Build Stage ---
FROM base AS frontend-build
WORKDIR /app

# Define the environment variable to make it available at build time
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Copy frontend code and configs
COPY src ./src
COPY index.html ./index.html
COPY public ./public
COPY vite.config.js ./
COPY tsconfig.json ./

# Build frontend
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine AS production

# Install Node.js in the production image
RUN apk add --update nodejs npm

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=frontend-build /app/build /usr/share/nginx/html
COPY --from=frontend-build /app/public/img /usr/share/nginx/html/img

# Copy built backend and its dependencies
WORKDIR /app
COPY --from=backend-build /app/package*.json ./
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/maxun-core ./maxun-core
COPY --from=backend-build /app/node_modules ./node_modules

# Copy start script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 8080

# Start both nginx and node server
ENTRYPOINT ["/docker-entrypoint.sh"]
    