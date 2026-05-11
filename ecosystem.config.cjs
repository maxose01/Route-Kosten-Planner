module.exports = {
  apps: [
    {
      name: "route-cost-api",
      cwd: __dirname,
      script: "./apps/api/dist/index.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        API_HOST: "0.0.0.0"
      }
    },
    {
      name: "route-cost-web",
      cwd: __dirname,
      script: "npm",
      args: "run start:web:prod",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
