FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/webhooks/package.json ./apps/webhooks/package.json

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/webhooks/ ./apps/webhooks/

RUN cd packages/db && pnpm db:generate
RUN cd apps/webhooks && pnpm build

EXPOSE 4000
CMD ["node", "apps/webhooks/dist/index.js"]
