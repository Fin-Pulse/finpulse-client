# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Копируем оба файла для лучшего кэширования
COPY package.json package-lock.json ./

# Используем npm install вместо npm ci
RUN npm install --silent

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]