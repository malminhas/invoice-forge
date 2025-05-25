# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY . .
ARG VITE_API_URL
ARG VITE_BASE
ARG VITE_BASENAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE=$VITE_BASE
ENV VITE_BASENAME=$VITE_BASENAME
RUN npm install && npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8082
CMD ["nginx", "-g", "daemon off;"] 