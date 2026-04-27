module.exports = {
  apps: [
    {
      name: 'pharmacy-pos-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'pharmacy-pos-scheduler',
      script: 'src/jobs/scheduler.js',
      instances: 1,
      cron_restart: '0 0 * * *',
      env: { NODE_ENV: 'production' }
    }
  ]
};
