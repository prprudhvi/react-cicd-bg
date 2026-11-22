module.exports = {
  apps: [
    {
      name: 'react-cicd-bg',
      script: 'dist/main.js',
      cwd: '/var/www/node-service-dev/current',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        SERVICE_PUBLIC_IP: '40.192.69.205',
      },
      time: true,
      error_file: '/var/log/node-service-dev/error.log',
      out_file: '/var/log/node-service-dev/output.log',
      merge_logs: true,
    },
  ],
};
