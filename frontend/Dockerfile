# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_AI_API_URL
ENV NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL

ARG NEXT_PUBLIC_AI_IMAGE_API_URL
ENV NEXT_PUBLIC_AI_IMAGE_API_URL=$NEXT_PUBLIC_AI_IMAGE_API_URL

# Build the Next.js app
# Note: For Vercel deployment, this Dockerfile isn't used (Vercel uses its own build system).
# This is primarily for local testing via docker-compose.
# If you want to run this in production locally/elsewhere:
# RUN npm run build
# CMD ["npm", "start"]

# For development (docker-compose default):
CMD ["npm", "run", "dev"]
