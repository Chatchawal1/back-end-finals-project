// db.js
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "aws.connect.psdb.cloud",
  user: "udwlgx5rq4b4n4z3njha",
  password: "pscale_pw_CQI1rNvop0sP8aZcet01kcR1GHWaAAvnjewT1j91m1t",
  port: 3306,
  database: "pct-project-finals",
  ssl: {
    // Replace with the path to your CA certificate
    rejectUnauthorized: true,
  },
});
module.exports = connection;
