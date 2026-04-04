FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/worker/package.json ./packages/worker/

RUN npm ci

COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

COPY packages/api/tsconfig.json ./packages/api/
COPY packages/api/prisma ./packages/api/prisma
COPY packages/api/prisma.config.ts ./packages/api/prisma.config.ts
COPY packages/api/src ./packages/api/src
COPY packages/api/test ./packages/api/test
COPY packages/api/scripts ./packages/api/scripts

COPY packages/worker/tsconfig.json ./packages/worker/
COPY packages/worker/src ./packages/worker/src
COPY packages/worker/test ./packages/worker/test

RUN npm run build -w @sahamai/shared
RUN npm run build -w @sahamai/worker
RUN npm run build -w @sahamai/api
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/api/prisma ./packages/api/prisma
COPY --from=build /app/packages/api/prisma.config.ts ./packages/api/prisma.config.ts
COPY --from=build /app/packages/api/scripts ./packages/api/scripts

EXPOSE 3000
CMD ["node", "packages/api/dist/server.js"]
