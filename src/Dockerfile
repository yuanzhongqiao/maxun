# Stage 1: Build the React frontend
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the entire frontend project
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Serve the static files with nginx
FROM nginx:stable-alpine

# Copy build output from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration (if needed)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port NGINX will run on (3000 for React frontend)
EXPOSE 3000

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
