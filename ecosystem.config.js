


module.exports = {
  apps: [{
    name: 'morela-bot',
    script: 'utama.js',
    
    
    instances: 1,
    exec_mode: 'fork',
    
    
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    
    
    
    
    
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    
    env: {
      NODE_ENV: 'production',
      DEBUG: false
    },
    env_development: {
      NODE_ENV: 'development',
      DEBUG: true
    },
    
    
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    
    cron_restart: '0 3 * * *',
    
    
    exp_backoff_restart_delay: 100,
  }]
};


