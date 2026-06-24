FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY apps/server/package.json ./apps/server/package.json

RUN pnpm install --no-frozen-lockfile

COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

RUN cd packages/db && pnpm db:generate
RUN cd packages/db && pnpm build
RUN cd apps/server && pnpm build

# Drop root privileges (node:alpine ships a non-root `node` user)
RUN chown -R node:node /app
USER node

EXPOSE 8000
CMD ["node", "apps/server/dist/index.js"]
