# Sourced by production deploy/diagnose scripts — not executed directly.
# Local dev defaults stay :3000 / :5173 (see restart_servers.sh).
# Rule: mms-production-ports — production must not use 3000 or 3001.

# Fastify listen port on Hetzner (Apache ProxyPass upstream).
MMS_PROD_BACKEND_PORT="${MMS_PROD_BACKEND_PORT:-5002}"

# Optional separate vite preview PM2 process (most deploys serve SPA from backend).
MMS_PROD_FRONTEND_PORT="${MMS_PROD_FRONTEND_PORT:-4173}"

MMS_PROD_FORBIDDEN_PORTS=(3000 3001)

# Fail when production would listen on a forbidden dev port.
assert_production_backend_port() {
  local port="$1"
  local context="${2:-Production backend}"
  local forbidden
  for forbidden in "${MMS_PROD_FORBIDDEN_PORTS[@]}"; do
    if [[ "$port" == "$forbidden" ]]; then
      echo "ERROR: ${context} must not use port ${port}. Set PORT=${MMS_PROD_BACKEND_PORT} (mms-production-ports)."
      return 1
    fi
  done
  return 0
}

# Fail when MMS_PROD_BACKEND_PORT itself is misconfigured to a forbidden value.
assert_prod_backend_port_default() {
  assert_production_backend_port "$MMS_PROD_BACKEND_PORT" "MMS_PROD_BACKEND_PORT" || return 1
  return 0
}
