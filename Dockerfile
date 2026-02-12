# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build with PLACEHOLDER values (will be replaced at runtime)
ENV VITE_SUPABASE_URL=__RUNTIME_SUPABASE_URL__
ENV VITE_SUPABASE_PUBLISHABLE_KEY=__RUNTIME_SUPABASE_KEY__
ENV VITE_SUPABASE_PROJECT_ID=stellar-print
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
