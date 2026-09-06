FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies (needed for prisma generate)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Run migrations then start the compiled server.
# (Migrations run against the DB service defined in docker-compose.)
CMD npx prisma migrate deploy && node dist/server.js
