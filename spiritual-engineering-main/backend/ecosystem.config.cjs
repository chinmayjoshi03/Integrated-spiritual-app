module.exports = {
  apps: [
    {
      name: 'spiritual-backend',
      script: 'index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/ubuntu/logs/spiritual-backend-error.log',
      out_file: '/home/ubuntu/logs/spiritual-backend-out.log',
      log_file: '/home/ubuntu/logs/spiritual-backend-combined.log',
      time: true,
    },
  ],
};
