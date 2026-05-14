FROM node:18-alpine AS build

ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

WORKDIR /app

# Copy package files
COPY Frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY Frontend/. .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config to support SPA routing
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]