FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @zyvon/database db:generate
RUN pnpm --filter @zyvon/api build
ENV NODE_ENV=production
EXPOSE 4000
# Schema synchronization is destructive-risk tooling and must never run implicitly.
# Enable only for disposable development databases with ALLOW_PRISMA_DB_PUSH=true.
CMD ["sh", "-c", "if [ \"$ALLOW_PRISMA_DB_PUSH\" = \"true\" ]; then pnpm --filter @zyvon/database db:push; fi; exec pnpm --filter @zyvon/api start"]
