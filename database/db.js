require('dotenv').config();
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 20000, // Increase timeout to 20 seconds
  timeout: 20000, // Increase timeout to 20 seconds
});


// Removed the connection.end() from the connect callback
connection.connect(error => {
  if (error) {
    console.error('Connection error:', error);
    // Handle connection error (perhaps retry connection or exit process)
  } else {
    console.log('Connected successfully to the database.');
    // Do not close the connection here if you plan to use it for queries later
  }
});

module.exports = connection;
