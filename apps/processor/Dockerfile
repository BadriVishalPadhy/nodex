FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/processor/package.json ./apps/processor/package.json

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/processor/ ./apps/processor/

RUN cd packages/db && pnpm db:generate
RUN cd apps/processor && pnpm build

CMD ["node", "apps/processor/dist/index.js"]
