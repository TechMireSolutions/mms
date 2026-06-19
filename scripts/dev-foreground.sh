#!/usr/bin/env bash
# Deprecated wrapper — use ./restart_servers.sh --foreground
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$ROOT/restart_servers.sh" --foreground "$@"
