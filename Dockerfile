# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Backend bağımlılıklarını kopyala ve yükle
COPY backend/package*.json ./
RUN npm install

# Prisma schema kopyala ve client oluştur
COPY backend/prisma ./prisma
RUN npx prisma generate

# TypeScript kaynak kodunu kopyala ve derle
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Sadece production bağımlılıkları
COPY backend/package*.json ./
RUN npm install --omit=dev

# Build output ve Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma ./prisma

EXPOSE 4000

# DB push + Start
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
