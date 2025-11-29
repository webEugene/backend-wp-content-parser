# Application Docker file Configuration
# Visit https://docs.docker.com/engine/reference/builder/
# Using multi stage build

# Prepare the image when build
# also use to minimize the docker image
FROM node:21-alpine as builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm install

COPY . .

RUN npm run build


# Stage 2 — Production
FROM node:21-alpine

# Copy only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built files and configuration
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

ENV NODE_ENV=Production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/main.js"]
