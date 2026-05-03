FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g npm@11.8.0

COPY SmartCV.fr/package*.json .
RUN npm ci

COPY SmartCV.fr/ .
ARG BUILD_CONFIG=production
  RUN npm run build -- --configuration $BUILD_CONFIG

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/SmartCV/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80