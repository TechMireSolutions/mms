---
name: mms-linux-compatibility
description: Workflow to check and enforce Linux and Ubuntu VPS deployment compatibility (casing, line endings, permissions, PM2 management).
---

# Linux VPS Compatibility Verification Workflow

Follow this workflow to verify that code and scripts are compatible with a Linux environment before deploying them to the Ubuntu VPS.

## 1. Line Ending Verification
Ensure all script files have Unix-style LF line endings.
- Run the following command to check if any script contains CRLF line endings:
  ```bash
  git grep -I -I $'\r' -- 'scripts/**/*.sh' || echo "All scripts clean of CRLF"
  ```
- If a file is found with CRLF, convert it to LF using `sed` or `tr`:
  ```bash
  tr -d '\r' < script.sh > script_clean.sh && mv script_clean.sh script.sh
  chmod +x script.sh
  ```

## 2. File and Folder Name Casing Check
Verify that all TypeScript import statements match the exact filename casing on disk.
- Since Mac OS filesystems are case-insensitive by default, running typechecks locally using `pnpm typecheck` compiles strict casing.
- Enforce casing check by building the shared package first and compiling the backend:
  ```bash
  pnpm --filter @mms/shared build && pnpm --filter mms-backend typecheck
  ```

## 3. Directory and Permissions Setup on Ubuntu VPS
When provisioning the server directory structure, apply strict ownership and permissions.
- Make all source directories read-only for the running Node process.
- Only the `data` and `.logs` directories should be writable:
  ```bash
  # Execute on VPS
  sudo chown -R deploy-user:deploy-user /var/www/mmsv2
  chmod -R 755 /var/www/mmsv2
  chmod -R 775 /var/www/mmsv2/data
  chmod -R 775 /var/www/mmsv2/.logs
  ```

## 4. PM2 Process Management on VPS
To manage application processes securely and ensure they survive reboots:
- Start the server under PM2:
  ```bash
  pm2 start ecosystem.config.cjs --only mmsv2-backend --update-env
  ```
- Configure PM2 to start on system boot:
  ```bash
  pm2 startup
  pm2 save
  ```
- Check logs and monitor performance:
  ```bash
  pm2 logs mmsv2-backend --lines 50
  pm2 status
  ```
