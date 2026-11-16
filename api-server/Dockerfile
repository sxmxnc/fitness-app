# Autor: Luca Lammers


FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "--no-warnings", "--import", "tsx", "src/app.ts"]
