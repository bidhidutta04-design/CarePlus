FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci
COPY backend ./backend
RUN npm run build -w @careplus/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force \
  && addgroup -S careplus && adduser -S careplus -G careplus \
  && chown -R careplus:careplus /app
COPY --from=builder /app/backend/dist ./backend/dist
USER careplus
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/ready | grep -q '"status":"ok"' || exit 1
CMD ["node", "backend/dist/index.js"]
