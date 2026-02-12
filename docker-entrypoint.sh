#!/bin/sh
set -e

# Replace env vars in the built JS files at runtime
# This eliminates the need for build-time VITE_ args
echo "🔧 Injecting runtime environment variables..."

# Find all JS files and replace placeholders
find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
  -e "s|__RUNTIME_SUPABASE_URL__|${VITE_SUPABASE_URL:-http://localhost:8000}|g" \
  -e "s|__RUNTIME_SUPABASE_KEY__|${VITE_SUPABASE_PUBLISHABLE_KEY:-missing-key}|g" \
  {} +

echo "✅ Environment variables injected successfully"
echo "   SUPABASE_URL: ${VITE_SUPABASE_URL:-http://localhost:8000}"

exec nginx -g 'daemon off;'
