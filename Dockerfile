FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4001)+'/health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
