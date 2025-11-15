# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json tsconfig.json ./

# Install production dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose backend port
EXPOSE 5000

# Run the compiled JS
CMD ["node", "dist/index.js"]
