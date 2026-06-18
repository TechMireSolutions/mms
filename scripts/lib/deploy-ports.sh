# Sourced by production deploy/diagnose scripts — not executed directly.
# Local dev defaults stay :3000 / :5173 (see restart_servers.sh).

# Fastify listen port on Hetzner (Apache ProxyPass upstream).
MMS_PROD_BACKEND_PORT="${MMS_PROD_BACKEND_PORT:-5002}"

# Optional separate vite preview PM2 process (most deploys serve SPA from backend).
MMS_PROD_FRONTEND_PORT="${MMS_PROD_FRONTEND_PORT:-4173}"
