# builder
FROM node:16 AS builder

COPY . /build
WORKDIR /build

RUN yarn && npm run build

# runner
FROM node:16

WORKDIR /
COPY --from=builder /build/dist ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/src/TokenMigrationInterface.aes ./TokenMigrationInterface.aes
COPY --from=builder /build/src/data/final-token-holders-sorted.json ./data/final-token-holders-sorted.json

CMD [ "node", "app.js"]
