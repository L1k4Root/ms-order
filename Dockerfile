FROM node:22-alpine3.19


WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install

EXPOSE 3002


# CMD ["node", "dist/main.js"]
