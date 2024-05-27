const express = require("express");
const db = require("../database/db");
const cors = require("cors");

const router = express.Router();

router.use(cors());

router.put("/return", (req, res) => {
  const { id, equipment_name, quantity_borrowed } = req.body;

  // Start a database transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Step 1: Update the loan_details to mark the item as returned
    const updateLoanDetailsQuery = `
    UPDATE loan_details
    SET loan_status = 'คืน'
    WHERE id = ? AND equipment_name = ? AND loan_status = 'ยืม';
        `;

    db.query(updateLoanDetailsQuery, [id, equipment_name], (error, results) => {
      if (error) {
        return db.rollback(() => {
          console.error("Error updating loan_details:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      // Check if any rows were affected (means update was successful)
      if (results.affectedRows === 0) {
        return db.rollback(() => {
          res.status(404).json({
            message:
              "No active loan found with provided ID and equipment name, or item is already returned.",
          });
        });
      }

      // Step 2: Decrease quantity in equipment_recreational
      const updateRecreationalQuery = `
        UPDATE equipment_recreational
        SET  Eq_quantity_in_stock = Eq_quantity_in_stock + ?
        WHERE equipment_name = ?
      `;
      db.query(
        updateRecreationalQuery,
        [quantity_borrowed, equipment_name],
        (error, results) => {
          if (error) {
            return db.rollback(() => {
              console.error("Error updating equipment_recreational:", error);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }
          const updateSportQuery = `
          UPDATE equipment_sport
          SET Sp_quantity_in_stock = Sp_quantity_in_stock + ?
          WHERE equipment_name = ? 
        `;

          db.query(
            updateSportQuery,
            [quantity_borrowed, equipment_name],
            (error, results) => {
              if (error) {
                return db.rollback(() => {
                  console.error("Error updating equipment_sport:", error);
                  res.status(500).json({ error: "Internal Server Error" });
                });
              }
            }
          );

          const updateBorrowedQuery = `
                UPDATE loan_details
                SET quantity_borrowed = quantity_borrowed - ?
                WHERE equipment_name = ? AND id = ?
              `;

          db.query(
            updateBorrowedQuery,
            [quantity_borrowed, equipment_name, id],
            (error, results) => {
              if (error) {
                return db.rollback(() => {
                  console.error("Error updating equipment_sport:", error);
                  res.status(500).json({ error: "Internal Server Error" });
                });
              }
            }
          );

          // Commit the transaction if all updates succeed
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }
            res.status(200).json({
              message: "Item returned successfully and stock updated",
              details: results,
            });
          });
        }
      );
    });
  });
});

router.post("/borrow", (req, res) => {
  const {
    equipment_name,
    equipment_type,
    quantity_borrowed,
    borrower_name,
    borrow_date,
    return_date,
    loan_status,
    id,
  } = req.body;

  // Start a database transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Step 1: Insert into loan_details
    const insertQuery = `
      INSERT INTO loan_details (
        id,
        equipment_name,
        equipment_type,
        quantity_borrowed,
        borrower_name,
        borrow_date,
        return_date,
        loan_status,
        quantity_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the insert query
    db.query(
      insertQuery,
      [
        id,
        equipment_name,
        equipment_type,
        quantity_borrowed,
        borrower_name,
        borrow_date,
        return_date,
        loan_status,
        quantity_borrowed, // Initial quantity_data is set to quantity_borrowed
      ],
      (insertError, insertResults) => {
        if (insertError) {
          return db.rollback(() => {
            console.error(
              "Error when inserting borrowing record:",
              insertError
            );
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // Step 2: Decrease quantity in equipment_recreational
        const updateRecreationalQuery = `
       UPDATE equipment_recreational
       SET  Eq_quantity_in_stock = Eq_quantity_in_stock - ?
       WHERE equipment_name = ?
     `;

        db.query(
          updateRecreationalQuery,
          [quantity_borrowed, equipment_name],
          (error, results) => {
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

            db.query(
              updateSportQuery,
              [quantity_borrowed, equipment_name],
              (error, results) => {
                if (error) {
                  return db.rollback(() => {
                    console.error("Error updating equipment_sport:", error);
                    res.status(500).json({ error: "Internal Server Error" });
                  });
                }

                // Step 4: Calculate and update the quantity_data for the equipment
                const sumQuantityQuery = `
                SELECT SUM(quantity_data) AS total
                FROM loan_details
                WHERE equipment_name = ? ;
      `;

                // Execute the sum query
                db.query(
                  sumQuantityQuery,
                  [equipment_name],
                  (sumError, sumResults) => {
                    if (sumError) {
                      return db.rollback(() => {
                        console.error(
                          "Error summing quantity_borrowed:",
                          sumError
                        );
                        res
                          .status(500)
                          .json({ error: "Internal Server Error" });
                      });
                    }

                    // Get the total quantity borrowed
                    const totalQuantityBorrowed = sumResults[0].total;
                    const updateQuantityDataQuery = `
          UPDATE loan_details
          SET quantity_data = ?
          WHERE equipment_name = ? ;
        `;

                    // Execute the update query
                    db.query(
                      updateQuantityDataQuery,
                      [totalQuantityBorrowed, equipment_name],
                      (updateError, updateResults) => {
                        if (updateError) {
                          return db.rollback(() => {
                            console.error(
                              "Error updating quantity_data:",
                              updateError
                            );
                            res
                              .status(500)
                              .json({ error: "Internal Server Error" });
                          });
                        }

                        // Commit the transaction if everything is successful
                        db.commit((commitErr) => {
                          if (commitErr) {
                            return db.rollback(() => {
                              console.error(
                                "Error committing transaction:",
                                commitErr
                              );
                              res
                                .status(500)
                                .json({ error: "Internal Server Error" });
                            });
                          }

                          // Respond to the client with success message
                          res.status(201).json({
                            message:
                              "Borrowing record created and stock updated successfully",
                            borrowingId: insertResults.insertId,
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

router.put("/adminsubmit/:equipment_name/:id", (req, res) => {
  const equipment_name = req.params.equipment_name;
  const id = req.params.id;

  const updateStatus = `
    UPDATE loan_details
    SET loan_status = 'ยืม'
    WHERE equipment_name = ? AND id = ?
  `;

  db.query(updateStatus, [equipment_name, id], (updateError, updateResults) => {
    if (updateError) {
      console.error("Error updating loan_status:", updateError);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(200).json({ message: "Loan status updated successfully." });
  });
});

module.exports = router;
