require('dotenv').config();

const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    // Replace with the path to your CA certificate
    rejectUnauthorized: true,
  },
});

module.exports = connection;
