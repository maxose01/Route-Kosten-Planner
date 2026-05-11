module.exports = {
  apps: [
    {
      name: "route-cost-api",
      cwd: __dirname,
      script: "npm",
      args: "run start:api:prod",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "route-cost-web",
      cwd: __dirname,
      script: "npm",
      args: "run start:web:prod",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
