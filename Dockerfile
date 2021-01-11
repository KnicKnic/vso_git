FROM node:alpine@sha256:1e3bdcc2099b001106176405334c78948c03aaa6d95d214626a1fac97c0b0345

COPY . /app
WORKDIR /app
RUN npm install --production

EXPOSE 8080

CMD node index.js