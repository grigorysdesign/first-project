FROM node:20-alpine

WORKDIR /runner

RUN apk add --no-cache docker-cli

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --legacy-peer-deps || true
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start"]
