FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g npm@11.8.0

COPY SmartCV.fr/package*.json .
RUN npm ci

COPY SmartCV.fr/ .
RUN npm run build -- --configuration production

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/SmartCV.fr/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.sh /docker-entrypoint.d/40-env-substitution.sh
RUN chmod +x /docker-entrypoint.d/40-env-substitution.sh

EXPOSE 80