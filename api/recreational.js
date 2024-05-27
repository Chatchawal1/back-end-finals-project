const express = require("express");
const db = require("../database/db");

const router = express.Router();

router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pctdb`.equipment_recreational";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});

router.post("/add", (req, res) => {
  const {
    equipment_name,
    quantity_in_stock,
    equipment_type,
    import_date,
    note,
  } = req.body;
  const query = `INSERT INTO equipment_recreational (equipment_name, Eq_quantity_in_stock, equipment_type, import_date, note,last_update) VALUES (?, ?, ?, ?, ?,NOW())`;
  
 
  db.query(
    query,
    [equipment_name, quantity_in_stock, equipment_type, import_date, note],
    (error, results) => {
      if (error) {
        console.error("Error inserting data into the database:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      res.json({ message: "Added successfully" });
    }
  );
});

router.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM equipment_recreational WHERE ID = ?";

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
    quantity_in_stock,
    equipment_type,
    last_update,
    note,
  } = req.body;

  console.log(req.body)
  const query = `
    UPDATE equipment_recreational
    SET
      equipment_name = ?,
      Eq_quantity_in_stock = ?,
      equipment_type = ?,
      last_update = ?,
      note = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [equipment_name, quantity_in_stock, equipment_type, last_update, note, id],
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
