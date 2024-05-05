// sport.js
const express = require("express");
const db = require("../database/db");
const router = express.Router();

router.get("/table", (req, res) => {
  const query = "SELECT * FROM `pctdb`.loan_details";

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

router.get("/search", (req, res) => {
  // Get the search term from query parameters
  const searchTerm = req.query.term;

  // Protect against SQL injection by using parameterized queries
  const searchQuery = `
    SELECT * FROM loan_details
    WHERE equipment_name LIKE CONCAT('%', ?, '%');
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
    equipment_name,
    equipment_type,
    new_quantity_borrowed, // Changed variable name for clarity
    borrower_name,
    borrow_date,
    return_date,
    loan_status,
  } = req.body;

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    // Get the current details for the loan to find out the old quantity borrowed
    const currentLoanQuery = `SELECT quantity_borrowed FROM loan_details WHERE id = ?`;
    db.query(currentLoanQuery, [id], (error, loanResults) => {
      if (error) {
        return db.rollback(() => {
          console.error("Error fetching current loan details:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      const old_quantity_borrowed = loanResults[0].quantity_borrowed;
      const difference = new_quantity_borrowed - old_quantity_borrowed;

      // Update the equipment_details table
      const updateEquipmentQuery = `
      UPDATE equipment_recreational
        SET Eq_quantity_in_stock = Eq_quantity_in_stock - (?)
        WHERE equipment_name = ?
      `;
      db.query(updateEquipmentQuery, [difference, equipment_name], (updateError, updateResults) => {
        if (updateError) {
          return db.rollback(() => {
            console.error("Error updating equipment stock:", updateError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // Update the loan_details table
        const updateLoanQuery = `
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
        db.query(updateLoanQuery, [
          equipment_name,
          equipment_type,
          new_quantity_borrowed,
          borrower_name,
          borrow_date,
          return_date,
          loan_status,
          id
        ], (loanError, loanResults) => {
          if (loanError) {
            return db.rollback(() => {
              console.error("Error updating loan details:", loanError);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

          // If everything is successful, commit the transaction
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error("Error committing transaction:", commitErr);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }
            res.json({ message: "Loan updated successfully and stock adjusted" });
          });
        });
      });
    });
  });
});


module.exports = router;
