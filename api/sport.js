// sport.js
const express = require("express");
const db = require("../database/db");
const router = express.Router();

// GET endpoint เพื่อดึงข้อมูลทั้งหมด
router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pct-project-finals`.equipment_sport";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});
// Put endpoint แก้ไขข้อมูล
router.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const {
    equipment_name,
    quantity_in_stock,
    equipment_type,
    import_date,
    note,
  } = req.body;

  const query = `
    UPDATE equipment_sport
    SET
      equipment_name = ?,
      quantity_in_stock = ?,
      equipment_type = ?,
      import_date = ?,
      note = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [equipment_name, quantity_in_stock, equipment_type, import_date, note, id],
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
// DELETE endpoint เพื่อลบข้อมูล
router.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM equipment_sport WHERE ID = ?";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting data from database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json({ message: "Deleted successfully" });
  });
});

module.exports = router;
