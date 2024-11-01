# Use Node.js with Ubuntu instead of Alpine for better Playwright support
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Install node dependencies
COPY package*.json ./
COPY maxun-core ./maxun-core
COPY src ./src
COPY server ./server
COPY tsconfig.json ./
COPY server/tsconfig.json ./server/

# Install dependencies
RUN npm install

# Install Playwright browsers and dependencies
RUN npx playwright install --with-deps chromium firefox webkit

# Expose the backend port
EXPOSE 8080

# Start the backend using the server script
CMD ["npm", "run", "server"]