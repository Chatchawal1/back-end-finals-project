const express = require("express");
const db = require("../database/db");

const router = express.Router();

router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pct-project-finals`.users";

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
  const id = req.params.id;
  const {
    username,
    password,
    full_name,
    email,
    registration_date,
    last_login,
    is_admin,
  } = req.body;

  const query = `
    UPDATE users
    SET
      username = ?,
      password = ?,
      full_name = ?,
      email = ?,
      registration_date = ?,
      last_login = ?,
      is_admin = ?
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
      id,
    ],
    (error, results) => {
      if (error) {
        console.error("Error updating data in the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      res.json({ message: "Updated successfully" });
    }
  );
});
module.exports = router;
