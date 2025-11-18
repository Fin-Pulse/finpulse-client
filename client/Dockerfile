# Build stage
FROM --platform=$TARGETPLATFORM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --silent

COPY . .

ENV REACT_APP_API_BASE_URL=http://localhost:8080
ENV REACT_APP_NOTIFICATIONS_WS_URL=ws://localhost:8080/ws/notifications
ENV REACT_APP_FORECASTS_WS_URL=ws://localhost:8080/ws/forecasts

RUN npm run build

# Production stage
FROM --platform=$TARGETPLATFORM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]