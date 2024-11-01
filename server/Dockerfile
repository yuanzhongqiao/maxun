FROM node:18-alpine

WORKDIR /app

# Copy all source files first
COPY package*.json ./
COPY maxun-core ./maxun-core
COPY src ./src
COPY server ./server
COPY tsconfig.json ./
COPY server/tsconfig.json ./server/

# Install dependencies
RUN npm install

# Expose the backend port
EXPOSE 8080

# Start the backend using the server script
CMD ["npm", "run", "server"]