FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @zyvon/database db:generate
RUN pnpm --filter @zyvon/api build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @zyvon/database db:push && pnpm --filter @zyvon/api start"]
