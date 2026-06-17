/**
 * PM2 ecosystem — bare-metal / XAMPP deployment (no Docker).
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save && pm2 startup          # auto-start on reboot
 *
 * Assumes:
 *   - pnpm build has been run (dist/ exists)
 *   - .env is present in the monorepo root
 *   - MySQL and Redis are managed by XAMPP / system services
 */

'use strict'

const path = require('path')

// Resolve paths relative to monorepo root (two levels up from apps/api)
const root = path.resolve(__dirname, '../..')

module.exports = {
  apps: [
    {
      name:        'lendora-api',
      script:      path.join(root, 'apps/api/dist/main.js'),
      cwd:         root,
      instances:   'max',          // cluster mode — one worker per CPU
      exec_mode:   'cluster',
      watch:       false,
      autorestart: true,
      max_memory_restart: '512M',

      env_production: {
        NODE_ENV: 'production',
        PORT:     4000,
      },

      // Graceful shutdown: SIGINT then SIGKILL after 5s
      kill_timeout: 5000,
      wait_ready:   true,          // waits for process.send('ready')
      listen_timeout: 10000,

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file:   path.join(root, 'logs/api-error.log'),
      out_file:     path.join(root, 'logs/api-out.log'),
      merge_logs:   true,

      // Rotate logs — requires pm2-logrotate module
      // pm2 install pm2-logrotate
    },
  ],
}
