// sport.js
const express = require("express");
const db = require("../database/db");
const router = express.Router();

router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pct-project-finals`.loan_details";

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
  const query = "DELETE FROM loan_details WHERE ID = ?";

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
    equipment_name,
    equipment_type,
    quantity_borrowed,
    borrower_name,
    borrow_date,
    return_date,
    loan_status,
  } = req.body;

  const query = `
    UPDATE loan_details
    SET
      equipment_name = ?,
      equipment_type = ?,
      quantity_borrowed = ?,
      borrower_name = ?,
      borrow_date = ?,
      return_date = ?,
      loan_status = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      equipment_name,
      equipment_type,
      quantity_borrowed,
      borrower_name,
      borrow_date,
      return_date,
      loan_status,
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
