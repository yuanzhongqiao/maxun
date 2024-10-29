# --- Base Stage ---
FROM node:18 AS base
WORKDIR /app

# Copy shared package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# --- Backend Stage ---
FROM base AS backend
WORKDIR /app/server

# Copy backend code
COPY server/src ./src
COPY maxun-core ./maxun-core

EXPOSE 8080
CMD ["npm", "run", "start:server"]  # Add an npm script for backend start in package.json

# --- Frontend Stage ---
FROM base AS frontend
WORKDIR /app

# Copy frontend code, including root-level index.html
COPY src ./src
COPY index.html ./index.html
COPY public ./public
COPY vite.config.js ./

# Run the Vite build
RUN npm run build && \
ls -la && \
ls -la build  # This will help us verify the build output

# --- Final Stage: Nginx ---
FROM nginx:alpine
COPY --from=frontend /app/build /usr/share/nginx/html
COPY --from=frontend /app/public/img /usr/share/nginx/html/img

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
    