module.exports = {
  apps: [
    {
      name: "back-end-finals-project",
      script: "./index.js",
      interpreter: "node",
      exec_mode: "cluster",
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_uat: {
        NODE_ENV: "uat",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};