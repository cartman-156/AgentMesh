FROM node:18-alpine AS build

ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
    RUN npm install
# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config if needed, but default should work

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]