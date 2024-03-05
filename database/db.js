// db.js
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "aws.connect.psdb.cloud",
  user: "6ulxvzpllu969twmu9c7",
  password: "pscale_pw_Xkmc4gBSR2OLTMaXkWEQx9eLQQ6677z1EyCCa6Kzx0p",
  port: 3306,
  database: "pct-project-finals",
  ssl: {
    // Replace with the path to your CA certificate
    rejectUnauthorized: true,
  },
});
module.exports = connection;
