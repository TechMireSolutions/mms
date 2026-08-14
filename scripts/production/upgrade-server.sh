#!/usr/bin/env bash
# Upgrades all dependencies on the Ubuntu VPS production server.
# Run this on the server as a user with sudo privileges.

set -euo pipefail

DEPLOY_USER="${SUDO_USER:-$USER}"
NODE_VERSION="${MMS_NODE_VERSION:-24}"
PNPM_VERSION="${MMS_PNPM_VERSION:-11.15.1}"

echo "══ Upgrading MMS Ubuntu VPS Dependencies ══"

echo "── 1. Upgrading OS Packages (apt-get) ──"
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y

echo "── 2. Upgrading Node.js (nvm) ──"
export NVM_DIR="/home/${DEPLOY_USER}/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  sudo -u "$DEPLOY_USER" bash -lc "
    . \"\$NVM_DIR/nvm.sh\"
    nvm install ${NODE_VERSION} --reinstall-packages-from=current
    nvm alias default ${NODE_VERSION}
    nvm cache clear
  "
else
  echo "WARNING: NVM not found for user $DEPLOY_USER"
fi

echo "── 3. Upgrading pnpm ──"
sudo -u "$DEPLOY_USER" bash -lc "
  . \"\$NVM_DIR/nvm.sh\"
  corepack prepare pnpm@${PNPM_VERSION} --activate
"

echo "── 4. Upgrading PM2 ──"
sudo -u "$DEPLOY_USER" bash -lc "
  . \"\$NVM_DIR/nvm.sh\"
  npm install -g pm2@latest
  pm2 update
"

echo "══ Upgrade Complete! ══"
echo "You may want to restart your server if kernel updates were installed:"
echo "  sudo reboot"
echo "Otherwise, reload the backend to apply changes:"
echo "  pm2 reload mmsv2-backend"
