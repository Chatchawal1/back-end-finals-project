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

    // Step 1: Calculate sum of quantity_data for the equipment
    const sumQuery = `
      SELECT COALESCE(SUM(quantity_data), 0) as total_quantity
      FROM loan_details
      WHERE equipment_name = ? AND loan_status != 'คืนแล้ว'
    `;

    db.query(sumQuery, [equipment_name], (sumError, sumResults) => {
      if (sumError) {
        return db.rollback(() => {
          console.error("Error calculating sum of quantity_data:", sumError);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      const total_quantity = sumResults[0].total_quantity;
      const new_quantity_data = total_quantity + parseInt(quantity_borrowed, 10);

      // Step 2: Insert into loan_details
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
          new_quantity_data,
        ],
        (insertError, insertResults) => {
          if (insertError) {
            return db.rollback(() => {
              console.error("Error when inserting borrowing record:", insertError);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

        // Commit the transaction if everything is successful
        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => {
              console.error("Error committing transaction:", commitErr);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

          // Respond to the client with success message
          res.status(201).json({
            message: "Borrowing record created successfully",
            borrowingId: insertResults.insertId,
          });
        });
      }
    );
  });
});
});

router.put("/adminsubmit/:equipment_name/:id", (req, res) => {
  const equipment_name = req.params.equipment_name;
  const id = req.params.id;
  const { quantity_borrowed } = req.body;

  // Validate quantity_borrowed
  if (isNaN(quantity_borrowed) || quantity_borrowed <= 0) {
    return res.status(400).json({ error: "Invalid quantity borrowed" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Step 1: Get current quantity_data and check current stock
    const getCurrentDataQuery = `
      SELECT ld.quantity_data, 
             COALESCE(es.Sp_quantity_in_stock, er.Eq_quantity_in_stock) AS current_stock,
             CASE 
               WHEN es.equipment_name IS NOT NULL THEN 'sport'
               WHEN er.equipment_name IS NOT NULL THEN 'recreational'
               ELSE NULL
             END AS equipment_type
      FROM loan_details ld
      LEFT JOIN equipment_sport es ON ld.equipment_name = es.equipment_name
      LEFT JOIN equipment_recreational er ON ld.equipment_name = er.equipment_name
      WHERE ld.equipment_name = ? AND ld.id = ?
    `;

    db.query(getCurrentDataQuery, [equipment_name, id], (getError, getResults) => {
      if (getError) {
        return db.rollback(() => {
          console.error("Error getting current data:", getError);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }

      if (getResults.length === 0) {
        return db.rollback(() => {
          console.error("Equipment not found");
          res.status(404).json({ error: "Equipment not found" });
        });
      }

      const { quantity_data: currentQuantityData, current_stock, equipment_type } = getResults[0];
      const newQuantityData = parseInt(currentQuantityData, 10);
      const newStock = current_stock - newQuantityData;

      console.log(currentQuantityData,newStock);
      if (newStock < 0) {
        return db.rollback(() => {
          console.error("Insufficient stock");
          res.status(400).json({ error: "Insufficient stock" });
        });
      }

      // Step 2: Update loan status and quantity_data
      const updateLoanQuery = `
        UPDATE loan_details
        SET loan_status = 'ยืม', quantity_data = ?
        WHERE equipment_name = ?
      `;

      db.query(updateLoanQuery, [newQuantityData, equipment_name], (updateError, updateResults) => {
        if (updateError) {
          return db.rollback(() => {
            console.error("Error updating loan details:", updateError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // Step 3: Update stock
        let updateStockQuery;
        if (equipment_type === 'sport') {
          updateStockQuery = `
            UPDATE equipment_sport
            SET Sp_quantity_in_stock = ?
            WHERE equipment_name = ?
          `;
        } else {
          updateStockQuery = `
            UPDATE equipment_recreational
            SET Eq_quantity_in_stock = ?
            WHERE equipment_name = ?
          `;
        }

        db.query(updateStockQuery, [newStock, equipment_name], (stockError, stockResults) => {
          if (stockError) {
            return db.rollback(() => {
              console.error("Error updating equipment stock:", stockError);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error("Error committing transaction:", commitErr);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }

            res.status(200).json({ 
              message: "Loan approved and stock updated successfully.",
              newQuantityData: newQuantityData,
              newStock: newStock
            });
          });
        });
      });
    });
  });
});


router.get("/loan/:id", (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT * FROM loan_details
    WHERE id = ?
  `;

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error fetching loan details:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json(results[0]);
  });
});

module.exports = router;
