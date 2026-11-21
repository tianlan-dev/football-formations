FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV npm_config_cache=/tmp/.npm

RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.output ./.output

RUN chmod -R a+rX /app/.output

ENV npm_config_cache=/tmp/.npm
ENV NODE_ENV=production

USER node
CMD ["npm", "run", "start"]
