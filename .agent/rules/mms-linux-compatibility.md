---
trigger: always_on
---

# Linux & Ubuntu VPS Compatibility

Rules to ensure seamless local-to-production deployment on Ubuntu VPS systems.

## 1. Case-Sensitive File Imports
Linux filesystems (ext4) are case-sensitive, unlike macOS (APFS by default) and Windows (NTFS).
- **Rule**: Every import path must match the exact casing of the filename on disk.
- **Example**: `import { userService } from './userService.js'` will fail on Linux if the filename is actually `UserService.ts`.
- **Action**: Always double check file casing when creating new files or imports. Run `pnpm typecheck` which enforces case correctness.

## 2. Line Endings (LF vs CRLF)
Bash script execution on Linux fails with syntax errors (e.g. `\r: command not found`) if scripts contain Windows-style CRLF line endings.
- **Rule**: All shell scripts (`.sh` files) and process configurations must use Unix-style LF (`\n`) line endings.
- **Action**: Configure your git client to preserve LF endings: `git config core.autocrlf input`.

## 3. Path Formatting & Separators
- **Rule**: Never use hardcoded backslashes `\` as path separators in strings. Always use forward slashes `/` or the standard `node:path` utilities (`join`, `resolve`, `dirname`).
- **Example**:
  - `const p = join(__dirname, '..', 'data')` (Correct)
  - `const p = __dirname + '\\..\\data'` (Incorrect - breaks on Linux)

## 4. Permissions & Non-Root Execution
- **Rule**: Never run application processes or PM2 daemons as the `root` user in production.
- **Action**:
  - Run all node servers as a dedicated non-privileged user (e.g. `node` or `www-data` or the deploy user `syedaalin`).
  - Restrict write permissions of directories: only `/var/www/mmsv2/data` and `/var/www/mmsv2/.logs` should be writable by the application process. Keep the source code files read-only for the running application node process.

## 5. Persistent Storage & SQLite
- **Rule**: Always write production SQLite databases to a persistent data directory outside the workspace root or inside a dedicated `data` folder (e.g., `DATABASE_URL=sqlite://data/mms.db`).
- **Pragmas**: Run SQLite with WAL mode and `busy_timeout = 5000` to prevent write collision locks on production servers.
