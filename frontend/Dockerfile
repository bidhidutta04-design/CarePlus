# CarePlus web frontend — minimal production image (Next.js standalone).
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci
COPY frontend/ ./frontend/
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w @careplus/frontend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
# NOTE: standalone nests under frontend/ because outputFileTracingRoot points
# at the monorepo root — hence the extra path segment below.
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next/standalone/frontend/ ./
COPY --from=builder /app/frontend/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1
CMD ["node", "server.js"]
