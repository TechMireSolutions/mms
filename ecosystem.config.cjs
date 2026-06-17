const path = require('path');

const root = __dirname;

/** PM2 apps for Hetzner deploy — paths relative to repo root (/var/www/mmsv2). */
module.exports = {
  apps: [
    {
      name: 'mmsv2-backend',
      cwd: path.join(root, 'apps/backend'),
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
