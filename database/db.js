// db.js
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "aws.connect.psdb.cloud",
  user: "ldfegjyya6o9z4os1b1f",
  password: "pscale_pw_zx8Hi7oIanFaFBqXxRvz6y4deN1Jfb9iWP2VApd2SOh",
  port: 3306,
  database: "pct-project-finals",
  ssl: {
    // Replace with the path to your CA certificate
    rejectUnauthorized: true,
  },
});

module.exports = connection;
