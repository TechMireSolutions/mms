/** @type {import('pm2').StartOptions} */
const path = require('path');
const fs = require('fs');

const root = __dirname;
const backendEnvPath = path.join(root, 'apps/backend/.env');
const backendPort = process.env.PORT || '5002';

/** @type {Record<string, string>} */
const backendEnv = {
  NODE_ENV: 'production',
  PORT: backendPort,
  PUPPETEER_SKIP_DOWNLOAD: 'true',
};

if (fs.existsSync(backendEnvPath)) {
  for (const line of fs.readFileSync(backendEnvPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    backendEnv[key] = value;
  }
}

module.exports = {
  apps: [
    {
      name: 'mmsv2-backend',
      cwd: root,
      script: path.join(root, 'apps/backend/dist/index.js'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 15,
      min_uptime: '10s',
      max_memory_restart: '768M',
      time: true,
      merge_logs: true,
      error_file: path.join(root, '.logs/pm2-backend-error.log'),
      out_file: path.join(root, '.logs/pm2-backend-out.log'),
      env: backendEnv,
    },
  ],
};
