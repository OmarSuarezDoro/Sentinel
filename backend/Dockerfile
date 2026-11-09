FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend
RUN npm run db:generate -w backend && npm run build -w backend
WORKDIR /app/backend
USER node
EXPOSE 4000
CMD ["node","dist/server.js"]
