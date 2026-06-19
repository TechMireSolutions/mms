#!/usr/bin/env bash
# Deprecated wrapper — use ./restart_servers.sh
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/restart_servers.sh" "$@"
