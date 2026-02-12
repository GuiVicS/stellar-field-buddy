#!/bin/sh
set -e

# Generate runtime config that overrides import.meta.env values
# This script is loaded BEFORE the main app bundle in index.html
cat > /usr/share/nginx/html/config.js <<EOF
// Runtime environment injection for self-hosted deployments
(function() {
  window.__RUNTIME_CONFIG__ = {
    VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
    VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
  };
})();
EOF

echo "✅ Runtime config generated at /usr/share/nginx/html/config.js"
echo "   SUPABASE_URL: ${VITE_SUPABASE_URL:-NOT SET}"
echo "   KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY:+SET (hidden)}"

exec nginx -g 'daemon off;'
