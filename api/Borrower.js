const express = require("express");
const db = require("../database/db");
const cors = require("cors");

const router = express.Router();

router.use(cors());

router.put("/return", (req, res) => {
  const returnRequests = Array.isArray(req.body) ? req.body : [req.body];

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const updatePromises = returnRequests.map((request) => {
      return new Promise((resolve, reject) => {
        const { id, equipment_name, quantity_borrowed } = request;

        const updateLoanDetailsQuery = `
          UPDATE loan_details
          SET loan_status = 'คืน'
          WHERE id = ? AND equipment_name = ?;
        `;

        db.query(
          updateLoanDetailsQuery,
          [id, equipment_name],
          (error, results) => {
            if (error) {
              reject(error);
              return;
            }

            if (results.affectedRows === 0) {
              reject(
                new Error("No active loan found or item already returned.")
              );
              return;
            }

            const updateStockQuery = `
            UPDATE equipment_recreational
            SET Eq_quantity_in_stock = Eq_quantity_in_stock + ?
            WHERE equipment_name = ?;
            
            UPDATE equipment_sport
            SET Sp_quantity_in_stock = Sp_quantity_in_stock + ?
            WHERE equipment_name = ?;
          `;

            db.query(
              updateStockQuery,
              [
                quantity_borrowed,
                equipment_name,
                quantity_borrowed,
                equipment_name,
              ],
              (error, results) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(results);
                }
              }
            );
          }
        );
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => {
              console.error("Error committing transaction:", commitErr);
              res.status(500).json({ error: "Internal Server Error" });
            });
          }
          res.status(200).json({
            message: "Items returned successfully and stock updated",
          });
        });
      })
      .catch((error) => {
        db.rollback(() => {
          console.error("Error updating loan statuses or stock:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      });
  });
});

router.post("/borrow-multiple", (req, res) => {
  const { id, borrower_name, identifier_number, borrow_date, return_date, loan_status, items } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!id || !borrower_name || !borrow_date || !return_date || !loan_status || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // สร้าง loan_details
    const insertDetailsQuery = `
      INSERT INTO loan_details (loan_id, borrower_name, identifier_number, borrow_date, return_date, loan_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertDetailsQuery,
      [id, borrower_name, identifier_number || null, borrow_date, return_date, loan_status],
      (detailsError, detailsResults) => {
        if (detailsError) {
          return db.rollback(() => {
            console.error("Error inserting loan details:", detailsError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // สร้าง loan_items สำหรับแต่ละอุปกรณ์
        const insertItemsQuery = `
          INSERT INTO loan_items (loan_id, equipment_name, equipment_type, quantity_borrowed)
          VALUES (?, ?, ?, ?)
        `;

        const itemPromises = items.map(item => {
          return new Promise((resolve, reject) => {
            db.query(
              insertItemsQuery,
              [id, item.equipment_name, item.equipment_type, item.quantity_borrowed],
              (itemError, itemResults) => {
                if (itemError) {
                  reject(itemError);
                } else {
                  resolve(itemResults);
                }
              }
            );
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  console.error("Error committing transaction:", commitErr);
                  res.status(500).json({ error: "Internal Server Error" });
                });
              }
              res.status(201).json({
                message: "Borrowing records created successfully",
                loan_id: id
              });
            });
          })
          .catch(error => {
            db.rollback(() => {
              console.error("Error inserting loan items:", error);
              res.status(500).json({ error: "Internal Server Error" });
            });
          });
      }
    );
  });
});

router.post("/borrow", (req, res) => {
  const {
    id,
    borrower_name,
    identifier_number,
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

    const insertDetailsQuery = `
      INSERT INTO loan_details (
        loan_id,
        borrower_name,
        identifier_number,
        borrow_date,
        return_date,
        loan_status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertDetailsQuery,
      [
        id,
        borrower_name,
        identifier_number,
        borrow_date,
        return_date,
        loan_status
      ],
      (detailsError, detailsResults) => {
        if (detailsError) {
          return db.rollback(() => {
            console.error("Error inserting loan details:", detailsError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }
        
        const insertItemsQuery = `
          INSERT INTO loan_items (
            loan_id,
            equipment_name,
            equipment_type,
            quantity_borrowed
          ) VALUES ?
        `;

        const itemsValues = items.map(item => [
          id,
          item.equipment_name,
          item.equipment_type,
          item.quantity_borrowed
        ]);

        db.query(
          insertItemsQuery,
          [itemsValues],
          (itemsError, itemsResults) => {
            if (itemsError) {
              return db.rollback(() => {
                console.error("Error inserting loan items:", itemsError);
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

              res.status(201).json({
                message: "Borrowing record created successfully",
                borrowingId: id,
              });
            });
          }
        );
      }
    );
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

    // Step 1: Get current data and check current stock
    const getCurrentDataQuery = `
      SELECT 
        li.quantity_borrowed,
        COALESCE(es.Sp_quantity_in_stock, er.Eq_quantity_in_stock) AS current_stock,
        CASE 
          WHEN es.equipment_name IS NOT NULL THEN 'sport'
          WHEN er.equipment_name IS NOT NULL THEN 'recreational'
          ELSE NULL
        END AS equipment_type
      FROM loan_details ld
      JOIN loan_items li ON ld.loan_id = li.loan_id
      LEFT JOIN equipment_sport es ON li.equipment_name = es.equipment_name
      LEFT JOIN equipment_recreational er ON li.equipment_name = er.equipment_name
      WHERE li.equipment_name = ? AND ld.loan_id = ?
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

      const {
        quantity_borrowed: currentQuantityBorrowed,
        current_stock,
        equipment_type,
      } = getResults[0];
      const newStock = current_stock - currentQuantityBorrowed;

      if (newStock < 0) {
        return db.rollback(() => {
          console.error("Insufficient stock");
          res.status(400).json({ error: "Insufficient stock" });
        });
      }

      // Step 2: Update loan status
      const updateLoanQuery = `
        UPDATE loan_details
        SET loan_status = 'ยืม'
        WHERE loan_id = ?
      `;

      db.query(updateLoanQuery, [id], (updateError, updateResults) => {
        if (updateError) {
          return db.rollback(() => {
            console.error("Error updating loan details:", updateError);
            res.status(500).json({ error: "Internal Server Error" });
          });
        }

        // Step 3: Update stock
        let updateStockQuery;
        if (equipment_type === "sport") {
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
              newQuantityBorrowed: currentQuantityBorrowed,
              newStock: newStock,
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
    WHERE loan_id = ?
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
