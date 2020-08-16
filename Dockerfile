FROM node:alpine

COPY . /app
WORKDIR /app
RUN npm install --production

EXPOSE 8080

CMD node index.js