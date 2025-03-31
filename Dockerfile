# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml* ./

# Install dependencies without running scripts
RUN npm install --ignore-scripts

# Copy remaining project files
COPY tsconfig.json ./
COPY src ./src
COPY README.md ./README.md

# Build the project
RUN npm run build

# Expose port if necessary, though MCP uses stdio typically

CMD ["node", "build/index.js"]
