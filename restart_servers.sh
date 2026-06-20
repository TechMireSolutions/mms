#!/usr/bin/env bash
#
# MMS — single entry point for local dev (PostgreSQL → backend :3000 → frontend :5173)
#
# Usage:
#   ./restart_servers.sh              # start in GNU screen (default, survives agent exit)
#   ./restart_servers.sh status       # ports, screen session, health
#   ./restart_servers.sh stop         # stop screen + servers
#   ./restart_servers.sh --foreground # run in this terminal (Ctrl+C stops)
#   ./restart_servers.sh --turbo      # legacy turbo detached (not recommended)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_PORT="${MMS_BACKEND_PORT:-3000}"
FRONTEND_PORT="${MMS_FRONTEND_PORT:-5173}"
PG_CONTAINER="${MMS_PG_CONTAINER:-mms-postgres}"
PG_IMAGE="${MMS_PG_IMAGE:-postgres:17-alpine}"
PG_USER="${MMS_PG_USER:-postgres}"
PG_PASSWORD="${MMS_PG_PASSWORD:-postgres}"
PG_DB="${MMS_PG_DB:-mms}"
LOG_DIR="$ROOT_DIR/.logs"
SCREEN_SESSION="${MMS_DEV_SCREEN_SESSION:-mms-dev}"
MAX_LOG_BYTES="${MMS_MAX_LOG_BYTES:-52428800}"

QUICK=false
NO_DOCKER=false
MODE="screen"
CMD="restart"

usage() {
  cat <<EOF
MMS restart_servers.sh — local development stack (single source of truth)

Commands:
  (none)|start|restart   Start dev servers (default: GNU screen)
  status                 Postgres, screen session, ports, recent logs
  stop                   Stop screen session and free ports

Options:
  --foreground           Run backend + frontend in this terminal (blocks; Ctrl+C stops)
  --turbo                Legacy: detached turbo (fragile — prefer default screen mode)
  --quick                Skip Vite cache clear / shorten health wait
  --no-docker            Skip PostgreSQL container start
  --help                 Show this help

URLs:
  Frontend  http://localhost:5173
  Backend   http://localhost:3000/health

Screen (default):
  Attach    screen -r ${SCREEN_SESSION}
  Detach    Ctrl+A then D
  Logs      tail -f .logs/frontend.log .logs/backend.log
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    restart|start|stop|status) CMD="$1"; shift ;;
    --foreground) MODE=foreground; shift ;;
    --turbo) MODE=turbo; shift ;;
    --quick) QUICK=true; shift ;;
    --no-docker) NO_DOCKER=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

log() { printf '▸ %s\n' "$*"; }
ok()  { printf '✓ %s\n' "$*"; }
warn(){ printf '⚠ %s\n' "$*" >&2; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

port_listener_pids() {
  lsof -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

port_in_use() {
  [ -n "$(port_listener_pids "$1")" ]
}

port_open() {
  nc -z localhost "$1" 2>/dev/null
}

session_running() {
  local list
  list="$(screen -ls 2>/dev/null || true)"
  grep -qF ".${SCREEN_SESSION}" <<<"$list"
}

save_port_pid() {
  local port="$1" file="$2" pid
  pid="$(port_listener_pids "$port" | head -1)"
  [ -n "$pid" ] && echo "$pid" >"$file"
}

kill_pid_file() {
  local file="$1" label="$2" pid
  [ -f "$file" ] || return 0
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
  [ -f "$1" ] || { echo 0; return; }
  stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0
}

rotate_log_if_huge() {
  local file="$1" size backup
  [ -f "$file" ] || return 0
  size="$(log_file_size "$file")"
  if [ "$size" -gt "$MAX_LOG_BYTES" ]; then
    backup="${file}.$(date +%Y%m%d-%H%M%S).bak"
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
  [ -n "$1" ] && kill -0 "$1" 2>/dev/null
}

stop_screen_session() {
  if session_running; then
    log "Stopping screen session '$SCREEN_SESSION'..."
    screen -S "$SCREEN_SESSION" -X quit 2>/dev/null || true
    sleep 0.5
  fi
}

kill_all_on_port() {
  local port="$1" name="$2" pids pid attempt=0
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
  port_in_use "$port" && warn "Port $port still in use after stop attempts" && return 1
}

kill_repo_dev_processes() {
  local pid cmd
  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    [[ "$cmd" == *"$ROOT_DIR"* ]] || continue
    case "$cmd" in
      *"turbo"*"run dev"*|*"$ROOT_DIR"*"pnpm dev"*|\
      *"pnpm"*"--filter"*"mms-frontend"*"dev"*|*"pnpm"*"--filter"*"mms-backend"*"dev"*|\
      *"$ROOT_DIR/apps/frontend"*"vite"*|*"$ROOT_DIR/apps/backend"*"tsx"*)
        log "Stopping orphan dev process (pid $pid)..."
        kill -TERM "$pid" 2>/dev/null || true
        ;;
    esac
  done < <(pgrep -f "pnpm|turbo|vite|tsx" 2>/dev/null || true)
  sleep 0.4
  while IFS= read -r pid; do
    [ -z "$pid" ] && continue
    cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    [[ "$cmd" == *"$ROOT_DIR"* ]] || continue
    case "$cmd" in
      *"turbo"*"run dev"*|*"$ROOT_DIR"*"pnpm dev"*|\
      *"pnpm"*"--filter"*"mms-frontend"*"dev"*|*"pnpm"*"--filter"*"mms-backend"*"dev"*|\
      *"$ROOT_DIR/apps/frontend"*"vite"*|*"$ROOT_DIR/apps/backend"*"tsx"*)
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        ;;
    esac
  done < <(pgrep -f "pnpm|turbo|vite|tsx" 2>/dev/null || true)
}

stop_servers() {
  local quiet="${1:-false}" ports_clear=true
  [ "$quiet" != true ] && log "Stopping MMS dev servers..."
  stop_screen_session
  kill_pid_file "$LOG_DIR/dev.pid" "turbo dev"
  kill_pid_file "$LOG_DIR/backend.pid" "backend"
  kill_pid_file "$LOG_DIR/frontend.pid" "frontend"
  kill_all_on_port "$BACKEND_PORT" "backend" || ports_clear=false
  kill_all_on_port "$FRONTEND_PORT" "frontend" || ports_clear=false
  kill_repo_dev_processes
  kill_all_on_port "$BACKEND_PORT" "backend" || ports_clear=false
  kill_all_on_port "$FRONTEND_PORT" "frontend" || ports_clear=false
  rm -f "$LOG_DIR/dev.pid" "$LOG_DIR/backend.pid" "$LOG_DIR/frontend.pid"
  if [ "$quiet" != true ]; then
    if [ "$ports_clear" = true ] && ! port_in_use "$BACKEND_PORT" && ! port_in_use "$FRONTEND_PORT"; then
      ok "Servers stopped (ports $BACKEND_PORT and $FRONTEND_PORT free)"
    else
      warn "Ports may still be in use — run: lsof -iTCP:$BACKEND_PORT,$FRONTEND_PORT -sTCP:LISTEN"
    fi
  fi
}

wait_for_port() {
  local port="$1" label="$2" max="${3:-45}" i=1
  while [ "$i" -le "$max" ]; do
    if port_open "$port"; then
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
  local url="$1" label="$2" max="${3:-45}" i=1
  while [ "$i" -le "$max" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "$label healthy ($url)"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  warn "$label not healthy at $url"
  return 1
}

ensure_docker_daemon() {
  command -v docker &>/dev/null || { warn "docker not installed — ensure PostgreSQL is on localhost:5432"; return 1; }
  docker info >/dev/null 2>&1 && return 0
  log "Docker daemon not running — starting Docker Desktop..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open -a Docker >/dev/null 2>&1 || true
    local i=1
    while [ "$i" -le 30 ]; do
      docker info >/dev/null 2>&1 && { ok "Docker daemon ready"; return 0; }
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
    docker run -d --name "$PG_CONTAINER" \
      -e "POSTGRES_USER=$PG_USER" -e "POSTGRES_PASSWORD=$PG_PASSWORD" -e "POSTGRES_DB=$PG_DB" \
      -p "5432:5432" "$PG_IMAGE" >/dev/null
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
    [ -f "apps/backend/.env.example" ] || die "Missing apps/backend/.env"
    log "Creating apps/backend/.env from .env.example..."
    cp apps/backend/.env.example apps/backend/.env
    ok "Created apps/backend/.env — review JWT_SECRET before production"
  fi
  grep -q '^JWT_SECRET=.\+' apps/backend/.env 2>/dev/null || die "JWT_SECRET missing in apps/backend/.env"
}

maybe_clear_vite_cache() {
  if [ "$QUICK" = false ]; then
    log "Clearing Vite cache..."
    rm -rf apps/frontend/node_modules/.vite 2>/dev/null || true
  fi
}

wait_for_dev_ports() {
  if [ "$QUICK" = true ]; then
    sleep 4
    return 0
  fi
  wait_for_http "http://localhost:$BACKEND_PORT/health" "Backend" 90 || true
  wait_for_port "$FRONTEND_PORT" "Frontend" 45 || true
  sleep 3
  port_in_use "$BACKEND_PORT" && port_in_use "$FRONTEND_PORT" || {
    warn "Servers died shortly after start — check: screen -r $SCREEN_SESSION"
    tail -15 "$LOG_DIR/frontend.log" 2>/dev/null >&2 || true
    return 1
  }
}

run_dev_foreground() {
  log "MMS dev (foreground) — Ctrl+C to stop"
  echo "  Frontend  http://localhost:$FRONTEND_PORT"
  echo "  Backend   http://localhost:$BACKEND_PORT/health"
  echo ""
  trap 'kill 0 2>/dev/null; exit 0' INT TERM
  pnpm --filter mms-backend dev &
  pnpm --filter mms-frontend dev &
  wait
}

launch_detached() {
  local logfile="$1" pidfile="$2" workdir="$3"
  shift 3
  local launcher_pid prev_dir="$PWD" cmd_quoted="" arg
  for arg in "$@"; do cmd_quoted+="$(printf '%q' "$arg") "; done
  cd "$workdir" || die "Cannot cd to $workdir"
  nohup bash -lc "cd $(printf '%q' "$workdir") && exec $cmd_quoted" >>"$logfile" 2>&1 </dev/null &
  launcher_pid=$!
  echo "$launcher_pid" >"$pidfile"
  disown -h "$launcher_pid" 2>/dev/null || true
  cd "$prev_dir" || cd "$ROOT_DIR"
}

start_servers_turbo() {
  mkdir -p "$LOG_DIR"
  rotate_logs_if_huge
  stop_servers true
  maybe_clear_vite_cache
  warn "Turbo detached mode is fragile — prefer default screen mode"
  log "Starting dev stack (pnpm dev / turbo) → $LOG_DIR/dev.log"
  launch_detached "$LOG_DIR/dev.log" "$LOG_DIR/dev.pid" "$ROOT_DIR" pnpm dev
  wait_for_dev_ports || die "Turbo dev failed — run: ./restart_servers.sh status"
  save_port_pid "$BACKEND_PORT" "$LOG_DIR/backend.pid"
  save_port_pid "$FRONTEND_PORT" "$LOG_DIR/frontend.pid"
  port_in_use "$BACKEND_PORT" && port_in_use "$FRONTEND_PORT" || die "Servers failed to start"
}

start_servers_screen() {
  command -v screen >/dev/null 2>&1 || die "GNU screen required — install screen or use: ./restart_servers.sh --foreground"

  if session_running && port_open "$BACKEND_PORT" && port_open "$FRONTEND_PORT"; then
    ok "Dev session '$SCREEN_SESSION' already running"
    print_summary
    return 0
  fi

  mkdir -p "$LOG_DIR"
  rotate_logs_if_huge
  stop_servers true
  maybe_clear_vite_cache
  check_prerequisites
  ensure_postgres_container

  log "Starting dev in screen session '$SCREEN_SESSION'..."
  screen -dmS "$SCREEN_SESSION" bash -lc \
    "cd '$ROOT_DIR' && MMS_FOREGROUND_WORKER=1 exec ./restart_servers.sh --foreground --no-docker --quick"

  wait_for_dev_ports || die "Dev servers did not start — run: screen -r $SCREEN_SESSION"
  save_port_pid "$BACKEND_PORT" "$LOG_DIR/backend.pid"
  save_port_pid "$FRONTEND_PORT" "$LOG_DIR/frontend.pid"
  port_in_use "$BACKEND_PORT" && port_in_use "$FRONTEND_PORT" || die "Servers failed to start"
}

start_servers_foreground() {
  mkdir -p "$LOG_DIR"
  rotate_logs_if_huge
  stop_servers true
  maybe_clear_vite_cache
  check_prerequisites
  ensure_postgres_container
  run_dev_foreground
}

show_status() {
  echo "══ MMS status ══"
  if session_running; then
    ok "Screen session '$SCREEN_SESSION' running (attach: screen -r $SCREEN_SESSION)"
  else
    warn "Screen session '$SCREEN_SESSION' not running"
  fi
  if command -v docker &>/dev/null && docker info >/dev/null 2>&1; then
    docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$PG_CONTAINER" \
      && ok "PostgreSQL: $PG_CONTAINER running" \
      || warn "PostgreSQL: container '$PG_CONTAINER' not running"
  else
    warn "Docker: not available"
  fi

  local be fe
  be="$(port_listener_pids "$BACKEND_PORT" | tr '\n' ' ' | sed 's/ $//')"
  fe="$(port_listener_pids "$FRONTEND_PORT" | tr '\n' ' ' | sed 's/ $//')"

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

  if [ -z "$be" ] && [ -z "$fe" ]; then
    echo ""
    echo "── fix ──"
    echo "  ./restart_servers.sh          # start (screen)"
    echo "  ./restart_servers.sh --foreground   # this terminal, blocks"
  fi

  echo ""
  if [ -f "$LOG_DIR/frontend.log" ]; then
    echo "── frontend.log (last 5 lines) ──"
    tail -5 "$LOG_DIR/frontend.log" 2>/dev/null || true
  fi
  if [ -f "$LOG_DIR/backend.log" ]; then
    echo "── backend.log (last 5 lines) ──"
    tail -5 "$LOG_DIR/backend.log" 2>/dev/null || true
  fi
  if [ -f "$LOG_DIR/dev.log" ]; then
    echo "── dev.log (last 5 lines) ──"
    tail -5 "$LOG_DIR/dev.log" 2>/dev/null || true
  fi
}

print_summary() {
  cat <<EOF

════════════════════════════════════════
  MMS is running
════════════════════════════════════════
  New madrasa  http://localhost:$FRONTEND_PORT
  Backend      http://localhost:$BACKEND_PORT/health
  Status       ./restart_servers.sh status
  Stop         ./restart_servers.sh stop
  Attach       screen -r $SCREEN_SESSION
  Logs         tail -f .logs/frontend.log .logs/backend.log

  Tip: open a NEW browser tab after start (not chrome-error:// refresh).
════════════════════════════════════════
EOF
}

main() {
  if [ "${MMS_FOREGROUND_WORKER:-}" = "1" ]; then
    check_prerequisites
    ensure_postgres_container
    run_dev_foreground
    exit 0
  fi

  case "$CMD" in
    stop) stop_servers ;;
    status) show_status ;;
    restart|start)
      log "MMS $CMD — $ROOT_DIR"
      case "$MODE" in
        foreground) start_servers_foreground ;;
        turbo)
          check_prerequisites
          ensure_postgres_container
          start_servers_turbo
          print_summary
          ;;
        screen|*)
          start_servers_screen
          print_summary
          ;;
      esac
      ;;
  esac
}

main
