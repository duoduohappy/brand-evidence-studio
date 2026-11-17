FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY cms/package.json cms/package-lock.json cms/.npmrc ./cms/
RUN npm ci --prefix cms --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 DEPLOY_MODE=cloud PORT=10000 STRAPI_TELEMETRY_DISABLED=true
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/cms/node_modules ./cms/node_modules
COPY . .
RUN mkdir -p runtime cms/.tmp cms/public/uploads && chown -R node:node /app
USER node
EXPOSE 10000
CMD ["node", "launch.mjs"]
