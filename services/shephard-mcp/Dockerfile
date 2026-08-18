# Build from the repository root:
# docker build -f services/shephard-mcp/Dockerfile -t shephard-mcp .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY services/shephard-mcp ./services/shephard-mcp
RUN npm run mcp:build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/services/shephard-mcp/dist ./services/shephard-mcp/dist
EXPOSE 8787
CMD ["node", "services/shephard-mcp/dist/index.js"]
