FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/workers/package.json ./apps/workers/package.json

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/workers/ ./apps/workers/

RUN cd packages/db && pnpm db:generate
RUN cd apps/workers && pnpm build

CMD ["node", "apps/workers/dist/index.js"]
