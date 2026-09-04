FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci
COPY backend ./backend
COPY prettier.config.cjs ./
RUN npm run build -w @careplus/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/.env.example ./backend/.env.example
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
