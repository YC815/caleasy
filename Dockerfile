# ==== Stage 1: Builder ====
# The builder stage installs dependencies, generates Prisma client, and builds the Next.js app.
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
# This leverages Docker layer caching.
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate Prisma Client
# This must be done before the build
RUN npx prisma generate

# Build the Next.js application for production
# We need to pass the environment variables at build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN --mount=type=secret,id=clerk_secret_key \
    --mount=type=secret,id=database_url \
    export CLERK_SECRET_KEY=$(cat /run/secrets/clerk_secret_key) && \
    export DATABASE_URL=$(cat /run/secrets/database_url) && \
    npm run build

# ==== Stage 2: Runner ====
# The runner stage takes the build output from the builder stage
# and creates a minimal production-ready image.
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user for security purposes
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy only necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Set the user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the default command to start the app
CMD ["npm", "start"]
