const express = require("express");
const db = require("../database/db");

const router = express.Router();

router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pctdb`.users";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});
router.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM users WHERE ID = ?";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting data from database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json({ message: "Deleted successfully" });
  });
});

router.put("/update/:id", (req, res) => {
  let {
    username,
    password,
    full_name,
    email,
    registration_date,
    last_login,
    is_admin,
    cellNum,
  } = req.body;

  // Convert 'is_admin' from 'Admin'/'User' to 1/0
  is_admin = is_admin === "Admin" ? 1 : 0;

  const query = `
    UPDATE users
    SET
      username = ?,
      password = ?,
      full_name = ?,
      email = ?,
      registration_date = ?,
      last_login = ?,
      is_admin = ?,
      cellNum = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      username,
      password,
      full_name,
      email,
      registration_date,
      last_login,
      is_admin,
      cellNum,
      req.params.id,
    ],
    (error, results) => {
      if (error) {
        console.error("Error updating data in the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      // Handle successful update, such as sending a response back
      res.json({ message: "Updated successfully" });
    }
  );
});

router.post("/add", (req, res) => {
  let { username, password, full_name, email, is_admin,cellNum } = req.body;

  // Sanitize and validate data as needed
  is_admin = is_admin === "Admin" ? 1 : 0;

  const query =
    "INSERT INTO users (username, password, full_name, email,last_update, registration_date, is_admin,cellNum) VALUES (?, ?, ?, ?,NOW(), NOW(), ?,?)";
  const values = [username, password, full_name, email, is_admin,cellNum];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Failed to insert data" });
    } else {
      res.status(200).json({ message: "Data inserted successfully" });
    }
  });
});

module.exports = router;
