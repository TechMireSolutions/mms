/** @type {import('pm2').StartOptions} */
const path = require('path');

const root = __dirname;
const backendPort = process.env.PORT || '5002';

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
      env: {
        NODE_ENV: 'production',
        PORT: backendPort,
        PUPPETEER_SKIP_DOWNLOAD: 'true',
      },
    },
  ],
};
