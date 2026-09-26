FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node server ./server
COPY --chown=node:node .env.example ./

USER node
EXPOSE 4000

CMD ["sh", "-c", "node server/db/migrate.js && node server/db/seed.js && node server/index.js"]