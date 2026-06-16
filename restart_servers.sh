#!/usr/bin/env bash
#
# MMS — manage local dev stack (PostgreSQL → backend :3000 → frontend :5173)
#
# Usage:
#   ./restart_servers.sh              # restart (default)
#   ./restart_servers.sh status       # check what's running
#   ./restart_servers.sh stop         # stop servers
#   ./restart_servers.sh --quick      # skip vite cache clear & health wait
#   ./restart_servers.sh --no-docker  # skip Postgres container
#   ./restart_servers.sh --separate   # backend + frontend as two processes (debug)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_PORT="${MMS_BACKEND_PORT:-3000}"
FRONTEND_PORT="${MMS_FRONTEND_PORT:-5173}"
PG_CONTAINER="${MMS_PG_CONTAINER:-mms-postgres}"
PG_IMAGE="${MMS_PG_IMAGE:-postgres:16-alpine}"
PG_USER="${MMS_PG_USER:-postgres}"
PG_PASSWORD="${MMS_PG_PASSWORD:-postgres}"
PG_DB="${MMS_PG_DB:-mms}"
LOG_DIR="$ROOT_DIR/.logs"
MAX_LOG_BYTES="${MMS_MAX_LOG_BYTES:-52428800}" # 50 MiB — rotate when larger

QUICK=false
NO_DOCKER=false
SEPARATE=false
CMD="restart"

usage() {
  cat <<'EOF'
MMS restart_servers.sh — manage the local development stack

Commands:
  (none)     Restart servers (default)
  status     Show Postgres, ports, health, and recent log errors
  stop       Stop frontend and backend

Options:
  --quick       Skip Vite cache clear and shorten post-start health wait
  --no-docker   Do not start or create the PostgreSQL Docker container
  --separate    Start backend and frontend as two processes (default: pnpm dev / turbo)
  --help        Show this help

After start:
  Frontend  http://localhost:5173
  Backend   http://localhost:3000/health
  Logs      tail -f .logs/dev.log
  Foreground (most stable)  pnpm dev
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    restart|start|stop|status) CMD="$1"; shift ;;
    --quick) QUICK=true; shift ;;
    --no-docker) NO_DOCKER=true; shift ;;
    --separate) SEPARATE=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

log() { printf '▸ %s\n' "$*"; }
ok()  { printf '✓ %s\n' "$*"; }
warn(){ printf '⚠ %s\n' "$*" >&2; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

port_listener_pids() {
  local port="$1"
  lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

port_in_use() {
  [ -n "$(port_listener_pids "$1")" ]
}

save_port_pid() {
  local port="$1" file="$2"
  local pid
  pid="$(port_listener_pids "$port" | head -1)"
  if [ -n "$pid" ]; then
    echo "$pid" >"$file"
  fi
}

kill_pid_file() {
  local file="$1" label="$2"
  [ -f "$file" ] || return 0
  local pid
  pid="$(tr -d '[:space:]' <"$file")"
  rm -f "$file"
  [ -n "$pid" ] || return 0
  if kill -0 "$pid" 2>/dev/null; then
    log "Stopping saved $label (pid $pid)..."
    kill -TERM "$pid" 2>/dev/null || true
    sleep 0.3
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  fi
}

log_file_size() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo 0
    return
  fi
  stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0
}

rotate_log_if_huge() {
  local file="$1"
  [ -f "$file" ] || return 0
  local size
  size="$(log_file_size "$file")"
  if [ "$size" -gt "$MAX_LOG_BYTES" ]; then
    local backup="${file}.$(date +%Y%m%d-%H%M%S).bak"
    log "Rotating oversized log $(basename "$file") (${size} bytes) → $(basename "$backup")"
    mv "$file" "$backup"
    : >"$file"
  fi
}

rotate_logs_if_huge() {
  rotate_log_if_huge "$LOG_DIR/dev.log"
  rotate_log_if_huge "$LOG_DIR/backend.log"
  rotate_log_if_huge "$LOG_DIR/frontend.log"
}

pid_alive() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

kill_all_on_port() {
  local port="$1" name="$2"
  local pids pid attempt=0

  while [ "$attempt" -lt 8 ]; do
    pids="$(port_listener_pids "$port")"
    [ -z "$pids" ] && return 0

    while IFS= read -r pid; do
      [ -z "$pid" ] && continue
      log "Stopping $name on port $port (pid $pid)..."
      kill -TERM "$pid" 2>/dev/null || true
    done <<<"$pids"

    sleep 0.4

    pids="$(port_listener_pids "$port")"
    if [ -n "$pids" ]; then
      while IFS= read -r pid; do
        [ -z "$pid" ] && continue
        kill -9 "$pid" 2>/dev/null || true
      done <<<"$pids"
      sleep 0.3
    fi

    attempt=$((attempt + 1))
  done

  if port_in_use "$port"; then
    warn "Port $port still in use after stop attempts"
    return 1
  fi
}

# Stop orphaned pnpm / vite / tsx dev processes for this repo (not listening on a port)
kill_repo_dev_processes() {
  local pid cmd label

  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    [[ "$cmd" == *"$ROOT_DIR"* ]] || continue

    case "$cmd" in
      *"turbo"*"run dev"*)                       label="turbo dev" ;;
      *"$ROOT_DIR"*"pnpm dev"*)                  label="pnpm dev" ;;
      *"pnpm"*"--filter"*"mms-frontend"*"dev"*) label="frontend pnpm" ;;
      *"pnpm"*"--filter"*"mms-backend"*"dev"*)  label="backend pnpm" ;;
      *"$ROOT_DIR/apps/frontend"*"vite"*)       label="frontend vite" ;;
      *"$ROOT_DIR/apps/backend"*"tsx"*)          label="backend tsx" ;;
      *) continue ;;
    esac

    log "Stopping orphan $label (pid $pid)..."
    kill -TERM "$pid" 2>/dev/null || true
  done < <(pgrep -f "pnpm|turbo|vite|tsx" 2>/dev/null || true)

  sleep 0.4

  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    [[ "$cmd" == *"$ROOT_DIR"* ]] || continue
    case "$cmd" in
      *"turbo"*"run dev"*|\
      *"$ROOT_DIR"*"pnpm dev"*|\
      *"pnpm"*"--filter"*"mms-frontend"*"dev"*|\
      *"pnpm"*"--filter"*"mms-backend"*"dev"*|\
      *"$ROOT_DIR/apps/frontend"*"vite"*|\
      *"$ROOT_DIR/apps/backend"*"tsx"*)
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        ;;
    esac
  done < <(pgrep -f "pnpm|turbo|vite|tsx" 2>/dev/null || true)
}

stop_servers() {
  local quiet="${1:-false}"
  local ports_clear=true

  if [ "$quiet" != true ]; then
    log "Stopping MMS dev servers..."
  fi

  kill_pid_file "$LOG_DIR/dev.pid" "turbo dev"
  kill_pid_file "$LOG_DIR/backend.pid" "backend"
  kill_pid_file "$LOG_DIR/frontend.pid" "frontend"

  kill_all_on_port "$BACKEND_PORT" "backend" || ports_clear=false
  kill_all_on_port "$FRONTEND_PORT" "frontend" || ports_clear=false

  kill_repo_dev_processes

  # Port holders can respawn from surviving parents — sweep again
  kill_all_on_port "$BACKEND_PORT" "backend" || ports_clear=false
  kill_all_on_port "$FRONTEND_PORT" "frontend" || ports_clear=false

  rm -f "$LOG_DIR/dev.pid" "$LOG_DIR/backend.pid" "$LOG_DIR/frontend.pid"

  if [ "$quiet" != true ]; then
    if [ "$ports_clear" = true ] \
      && ! port_in_use "$BACKEND_PORT" \
      && ! port_in_use "$FRONTEND_PORT"; then
      ok "Servers stopped (ports $BACKEND_PORT and $FRONTEND_PORT free)"
    else
      warn "Ports may still be in use — run: lsof -iTCP:$BACKEND_PORT,$FRONTEND_PORT -sTCP:LISTEN"
    fi
  fi
}

wait_for_port() {
  local port="$1" label="$2" max="${3:-30}"
  local i=1
  while [ "$i" -le "$max" ]; do
    if nc -z localhost "$port" 2>/dev/null; then
      ok "$label ready on port $port"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  warn "$label did not open port $port within ${max}s"
  return 1
}

wait_for_http() {
  local url="$1" label="$2" max="${3:-45}"
  local i=1
  while [ "$i" -le "$max" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "$label healthy ($url)"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  warn "$label not healthy at $url"
  if [ -f "$LOG_DIR/backend.log" ]; then
    warn "Last backend log lines:"
    tail -5 "$LOG_DIR/backend.log" >&2 || true
  fi
  return 1
}

ensure_docker_daemon() {
  if ! command -v docker &>/dev/null; then
    warn "docker not installed — ensure PostgreSQL is on localhost:5432"
    return 1
  fi
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  log "Docker daemon not running — starting Docker Desktop..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open -a Docker >/dev/null 2>&1 || true
    local i=1
    while [ "$i" -le 30 ]; do
      if docker info >/dev/null 2>&1; then
        ok "Docker daemon ready"
        return 0
      fi
      sleep 2
      i=$((i + 1))
    done
  fi
  warn "Docker daemon unavailable — start Docker Desktop manually"
  return 1
}

ensure_postgres_container() {
  if [ "$NO_DOCKER" = true ]; then
    log "Skipping Docker (--no-docker)"
    return 0
  fi
  ensure_docker_daemon || return 0

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$PG_CONTAINER"; then
    ok "PostgreSQL container '$PG_CONTAINER' running"
    return 0
  fi

  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$PG_CONTAINER"; then
    log "Starting container '$PG_CONTAINER'..."
    docker start "$PG_CONTAINER" >/dev/null
  else
    log "Creating container '$PG_CONTAINER' ($PG_IMAGE)..."
    docker run -d \
      --name "$PG_CONTAINER" \
      -e "POSTGRES_USER=$PG_USER" \
      -e "POSTGRES_PASSWORD=$PG_PASSWORD" \
      -e "POSTGRES_DB=$PG_DB" \
      -p "5432:5432" \
      "$PG_IMAGE" >/dev/null
  fi

  wait_for_port 5432 "PostgreSQL" 30 || die "PostgreSQL not available — backend cannot start"
}

check_prerequisites() {
  [ -f "pnpm-workspace.yaml" ] || die "Run from repo root"

  command -v pnpm &>/dev/null || die "pnpm not installed"
  command -v nc &>/dev/null || warn "nc not found"

  if [ ! -d "node_modules" ]; then
    log "Running pnpm install..."
    pnpm install
  fi

  if [ ! -f "apps/backend/.env" ]; then
    if [ -f "apps/backend/.env.example" ]; then
      log "Creating apps/backend/.env from .env.example..."
      cp apps/backend/.env.example apps/backend/.env
      ok "Created apps/backend/.env — review JWT_SECRET before production"
    else
      die "Missing apps/backend/.env and JWT_SECRET is required"
    fi
  fi

  if ! grep -q '^JWT_SECRET=.\+' apps/backend/.env 2>/dev/null; then
    die "JWT_SECRET missing in apps/backend/.env"
  fi
}

# Start a long-lived dev process detached from this shell (nohup + disown).
# Do not wrap in a subshell — subshell exit can SIGHUP the process tree on macOS.
launch_detached() {
  local logfile="$1"
  local pidfile="$2"
  local workdir="$3"
  shift 3
  local launcher_pid
  local prev_dir="$PWD"

  cd "$workdir" || die "Cannot cd to $workdir"
  nohup "$@" >>"$logfile" 2>&1 </dev/null &
  launcher_pid=$!
  echo "$launcher_pid" >"$pidfile"
  disown -h "$launcher_pid" 2>/dev/null || true
  cd "$prev_dir" || cd "$ROOT_DIR"
}

wait_for_stable_ports() {
  local probe="${1:-3}"
  sleep "$probe"
  if port_in_use "$BACKEND_PORT" && port_in_use "$FRONTEND_PORT"; then
    return 0
  fi
  warn "Servers died within ${probe}s of starting — recent log:"
  if [ -f "$LOG_DIR/dev.log" ]; then
    tail -15 "$LOG_DIR/dev.log" >&2 || true
  else
    tail -8 "$LOG_DIR/backend.log" 2>/dev/null >&2 || true
    tail -8 "$LOG_DIR/frontend.log" 2>/dev/null >&2 || true
  fi
  return 1
}

start_servers_turbo() {
  log "Starting dev stack (pnpm dev / turbo) → $LOG_DIR/dev.log"
  launch_detached "$LOG_DIR/dev.log" "$LOG_DIR/dev.pid" "$ROOT_DIR" \
    pnpm dev
}

start_servers_separate() {
  log "Starting backend → $LOG_DIR/backend.log"
  launch_detached "$LOG_DIR/backend.log" "$LOG_DIR/backend.pid" "$ROOT_DIR/apps/backend" \
    pnpm exec tsx watch src/index.ts

  wait_for_http "http://localhost:$BACKEND_PORT/health" "Backend" 90 || true

  log "Starting frontend → $LOG_DIR/frontend.log"
  launch_detached "$LOG_DIR/frontend.log" "$LOG_DIR/frontend.pid" "$ROOT_DIR/apps/frontend" \
    pnpm exec vite --host

  wait_for_port "$FRONTEND_PORT" "Frontend" 45 || true
}

start_servers() {
  mkdir -p "$LOG_DIR"
  rotate_logs_if_huge
  stop_servers true

  if [ "$QUICK" = false ]; then
    log "Clearing Vite cache..."
    rm -rf apps/frontend/node_modules/.vite 2>/dev/null || true
  fi

  if [ "$SEPARATE" = true ]; then
    start_servers_separate
  else
    start_servers_turbo
  fi

  if [ "$QUICK" = true ]; then
    sleep 4
  else
    wait_for_http "http://localhost:$BACKEND_PORT/health" "Backend" 90 || true
    wait_for_port "$FRONTEND_PORT" "Frontend" 45 || true
    wait_for_stable_ports 5 || die "Servers not stable — run: pnpm dev in a dedicated terminal"
  fi

  save_port_pid "$BACKEND_PORT" "$LOG_DIR/backend.pid"
  save_port_pid "$FRONTEND_PORT" "$LOG_DIR/frontend.pid"

  if ! port_in_use "$BACKEND_PORT" || ! port_in_use "$FRONTEND_PORT"; then
    die "Servers failed to start — run: ./restart_servers.sh status"
  fi
}

show_status() {
  echo "══ MMS status ══"
  if command -v docker &>/dev/null && docker info >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$PG_CONTAINER"; then
      ok "PostgreSQL: $PG_CONTAINER running"
    else
      warn "PostgreSQL: container '$PG_CONTAINER' not running"
    fi
  else
    warn "Docker: not available"
  fi

  local be fe saved_be saved_fe saved_dev
  be="$(port_listener_pids "$BACKEND_PORT" | tr '\n' ' ' | sed 's/ $//')"
  fe="$(port_listener_pids "$FRONTEND_PORT" | tr '\n' ' ' | sed 's/ $//')"

  if [ -f "$LOG_DIR/dev.pid" ]; then
    saved_dev="$(tr -d '[:space:]' <"$LOG_DIR/dev.pid")"
    if [ -n "$saved_dev" ] && ! pid_alive "$saved_dev"; then
      warn "Turbo launcher pid $saved_dev is dead (stale .logs/dev.pid)"
    elif [ -n "$saved_dev" ]; then
      ok "Turbo launcher: pid $saved_dev"
    fi
  fi

  if [ -f "$LOG_DIR/backend.pid" ]; then
    saved_be="$(tr -d '[:space:]' <"$LOG_DIR/backend.pid")"
    if [ -n "$saved_be" ] && [ -z "$be" ] && ! pid_alive "$saved_be"; then
      warn "Saved backend pid $saved_be is dead — run ./restart_servers.sh"
    fi
  fi
  if [ -f "$LOG_DIR/frontend.pid" ]; then
    saved_fe="$(tr -d '[:space:]' <"$LOG_DIR/frontend.pid")"
    if [ -n "$saved_fe" ] && [ -z "$fe" ] && ! pid_alive "$saved_fe"; then
      warn "Saved frontend pid $saved_fe is dead — run ./restart_servers.sh"
    fi
  fi

  if [ -n "$be" ]; then
    ok "Backend:  pid $be  http://localhost:$BACKEND_PORT/health"
    curl -sf "http://localhost:$BACKEND_PORT/health" 2>/dev/null && echo "" || warn "Backend health check failed"
  else
    warn "Backend:  not listening on port $BACKEND_PORT"
  fi
  if [ -n "$fe" ]; then
    ok "Frontend: pid $fe  http://localhost:$FRONTEND_PORT"
    curl -sf -o /dev/null "http://localhost:$FRONTEND_PORT/" 2>/dev/null \
      && ok "Frontend HTTP check passed" \
      || warn "Frontend port open but HTTP check failed"
  else
    warn "Frontend: not listening on port $FRONTEND_PORT"
  fi

  if [ ! -f "$LOG_DIR/dev.log" ] && [ ! -f "$LOG_DIR/backend.log" ]; then
    warn "No logs yet — run ./restart_servers.sh"
    return
  fi
  echo ""
  if [ -f "$LOG_DIR/dev.log" ]; then
    echo "── dev.log (last 10 lines) ──"
    tail -10 "$LOG_DIR/dev.log" 2>/dev/null || true
  else
    echo "── backend.log (last 8 lines) ──"
    tail -8 "$LOG_DIR/backend.log" 2>/dev/null || true
    echo ""
    echo "── frontend.log (last 5 lines) ──"
    tail -5 "$LOG_DIR/frontend.log" 2>/dev/null || true
  fi
}

print_summary() {
  cat <<EOF

════════════════════════════════════════
  MMS is running
════════════════════════════════════════
  New madrasa  http://localhost:$FRONTEND_PORT  → Create your madrasa
  Backend      http://localhost:$BACKEND_PORT/health
  Status       ./restart_servers.sh status
  Stop         ./restart_servers.sh stop
  Logs         tail -f .logs/dev.log
  Foreground   pnpm dev   (most stable — keep terminal open)

  Tip: if the browser shows a blank/error page, open a NEW tab
  (do not refresh chrome-error://) after servers are running.
  ERR_CONNECTION_REFUSED usually means dev servers stopped — run status.

  Existing workspace example: http://dar-ul-quran.localhost:$FRONTEND_PORT/login
  (Each madrasa has its own subdomain — use apex only to create new ones.)
════════════════════════════════════════
EOF
}

main() {
  case "$CMD" in
    stop)
      stop_servers
      ;;
    status)
      show_status
      ;;
    restart|start)
      log "MMS $CMD — $ROOT_DIR"
      check_prerequisites
      ensure_postgres_container
      start_servers
      print_summary
      ;;
  esac
}

main
