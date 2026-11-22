module.exports = {
  apps: [
    {
      name: 'react-cicd-bg',
      script: 'dist/main.js',
      cwd: '/var/www/react-cicd-bg/current',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        SERVICE_PUBLIC_IP: '18.60.99.194',
      },
      time: true,
      error_file: '/var/log/react-cicd-bg/error.log',
      out_file: '/var/log/react-cicd-bg/output.log',
      merge_logs: true,
    },
  ],
};
