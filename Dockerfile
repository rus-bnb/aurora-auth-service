# ---------- build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# сначала только манифесты — кеш слоёв не сбрасывается при правке src/
COPY package*.json ./
RUN npm install --no-audit --no-fund

# исходники
COPY . .

# production-сборка в /app/dist
RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine

# свой конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# только собранные артефакты
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx уже имеет CMD ["nginx", "-g", "daemon off;"]