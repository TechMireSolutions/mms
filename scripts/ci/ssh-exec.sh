#!/usr/bin/env bash
# Run a local script on the production host over SSH, forwarding the named
# environment variables. Values travel over stdin as `export NAME=<%q>` lines,
# so secrets never appear on the ssh argv (remote `ps`) and cannot break quoting.
#
#   SERVER_USER=... SERVER_IP=... scripts/ci/ssh-exec.sh <remote-script> [VAR ...]
#
# Expects ~/.ssh/deploy_key and ~/.ssh/known_hosts (.github/actions/ssh-setup).
set -euo pipefail

remote_script="${1:?usage: ssh-exec.sh <remote-script> [VAR ...]}"
shift
: "${SERVER_USER:?SERVER_USER is required}"
: "${SERVER_IP:?SERVER_IP is required}"
[ -f "${remote_script}" ] || { echo "ssh-exec: ${remote_script} not found" >&2; exit 1; }

{
  for name in "$@"; do
    printf 'export %s=%q\n' "${name}" "${!name-}"
  done
  cat "${remote_script}"
} | ssh -i ~/.ssh/deploy_key \
  -o StrictHostKeyChecking=yes -o BatchMode=yes \
  -o ConnectTimeout=15 -o ServerAliveInterval=30 \
  "${SERVER_USER}@${SERVER_IP}" 'bash -s'
