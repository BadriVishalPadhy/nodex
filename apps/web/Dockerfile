FROM node:20-alpine
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN cd apps/web && pnpm build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
