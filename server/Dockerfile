FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the backend code
COPY backend/ ./

# Expose the API port (8080 for the backend)
EXPOSE 8080

# Start the backend server
CMD ["npm", "start"]
