FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY apps/processor/package.json ./apps/processor/package.json

RUN pnpm install --no-frozen-lockfile

COPY packages/ ./packages/
COPY apps/processor/ ./apps/processor/

RUN cd packages/db && pnpm db:generate
RUN cd packages/db && pnpm build
RUN cd apps/processor && pnpm build

# Drop root privileges (node:alpine ships a non-root `node` user).
# Kafka certs are mounted read-only at runtime (see docker-compose.yml),
# never baked into the image.
RUN chown -R node:node /app
USER node

CMD ["node", "apps/processor/dist/index.js"]
