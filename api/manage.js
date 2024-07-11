const express = require("express");
const db = require("../database/db");
const router = express.Router();

router.get("/table", (req, res) => {
  const query = `
    SELECT ld.*, li.equipment_name, li.equipment_type, li.quantity_borrowed
    FROM loan_details ld
    JOIN loan_items li ON ld.loan_id = li.loan_id
  `;

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
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const deleteItemsQuery = "DELETE FROM loan_items WHERE loan_id = ?";
    db.query(deleteItemsQuery, [id], (error, results) => {
      if (error) {
        return db.rollback(() => {
          console.error("Error deleting from loan_items:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      const deleteDetailsQuery = "DELETE FROM loan_details WHERE loan_id = ?";
      db.query(deleteDetailsQuery, [id], (error, results) => {
        if (error) {
          return db.rollback(() => {
            console.error("Error deleting from loan_details:", error);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error committing transaction:", err);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }
          res.json({ message: "Deleted successfully" });
        });
      });
    });
  });
});

router.get("/search", (req, res) => {
  const searchTerm = req.query.term;
  const searchQuery = `
    SELECT ld.*, li.equipment_name, li.equipment_type, li.quantity_borrowed
    FROM loan_details ld
    JOIN loan_items li ON ld.loan_id = li.loan_id
    WHERE li.equipment_name LIKE CONCAT('%', ?, '%')
  `;

  db.query(searchQuery, [searchTerm], (error, results) => {
    if (error) {
      console.error("Error searching the database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});

router.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const {
    borrower_name,
    borrow_date,
    return_date,
    loan_status,
    items
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const updateDetailsQuery = `
      UPDATE loan_details
      SET borrower_name = ?, borrow_date = ?, return_date = ?, loan_status = ?
      WHERE loan_id = ?
    `;
    db.query(updateDetailsQuery, [borrower_name, borrow_date, return_date, loan_status, id], (error, results) => {
      if (error) {
        return db.rollback(() => {
          console.error("Error updating loan_details:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      const updateItemsPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          const updateItemQuery = `
            UPDATE loan_items
            SET equipment_name = ?, equipment_type = ?, quantity_borrowed = ?
            WHERE loan_id = ? AND item_id = ?
          `;
          db.query(updateItemQuery, [item.equipment_name, item.equipment_type, item.quantity_borrowed, id, item.item_id], (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
      });

      Promise.all(updateItemsPromises)
        .then(() => {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }
            res.json({ message: "Loan updated successfully" });
          });
        })
        .catch(error => {
          db.rollback(() => {
            console.error("Error updating loan_items:", error);
            res.status(500).json({ error: "Internal Server Error" });
          });
        });
    });
  });
});

module.exports = router;