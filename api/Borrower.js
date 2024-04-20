const express = require("express");
const db = require("../database/db");

const router = express.Router();

router.post("/borrow", (req, res) => {
  const {
    equipment_name,
    equipment_type,
    quantity_borrowed,
    borrower_name,
    borrow_date,
    return_date,
    loan_status,
  } = req.body;

  // Start a database transaction
  db.beginTransaction(err => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Step 1: Insert into loan_details
    const insertQuery = `
      INSERT INTO loan_details (
        equipment_name,
        equipment_type,
        quantity_borrowed,
        borrower_name,
        borrow_date,
        return_date,
        loan_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        equipment_name,
        equipment_type,
        quantity_borrowed,
        borrower_name,
        borrow_date,
        return_date,
        loan_status,
      ],
      (error, results) => {
        if (error) {
          return db.rollback(() => {
            console.error("Error when inserting borrowing record:", error);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // Step 2: Decrease quantity in equipment_recreational
        const updateRecreationalQuery = `
          UPDATE equipment_recreational
          SET  Eq_quantity_in_stock = Eq_quantity_in_stock - ?
          WHERE equipment_name = ?
        `;

        db.query(updateRecreationalQuery, [quantity_borrowed, equipment_name], (error, results) => {
          if (error) {
            return db.rollback(() => {
              console.error("Error updating equipment_recreational:", error);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

          // Step 3: Decrease quantity in equipment_sport
          const updateSportQuery = `
            UPDATE equipment_sport
            SET Sp_quantity_in_stock = Sp_quantity_in_stock - ?
            WHERE equipment_name = ?
          `;

          db.query(updateSportQuery, [quantity_borrowed, equipment_name], (error, results) => {
            if (error) {
              return db.rollback(() => {
                console.error("Error updating equipment_sport:", error);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }

            // Commit the transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error("Error committing transaction:", err);
                  res.status(500).json({ error: "Internal Server Error" });
                });
              }
              res.status(201).json({
                message: "Borrowing record created and stock updated successfully",
                borrowingId: results.insertId,
              });
            });
          });
        });
      }
    );
  });
});

module.exports = router;

