FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Seeding is idempotent (skips invoice creation if any already exist), so it
# is safe to run on every container start, not just the first.
CMD ["sh", "-c", "node dist/database/seed/seed.js && node dist/main.js"]
