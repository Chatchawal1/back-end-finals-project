// home.js
const express = require("express");
const db = require("../database/db");

const router = express.Router();

router.get("/returnedCount", (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT ld.loan_id) AS returnedCount 
    FROM loan_details ld
    WHERE ld.loan_status = 'คืน'
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const returnedCount = results[0].returnedCount;
    res.json({ returnedCount });
  });
});
router.get("/equipmentCount", (req, res) => {
  const queryRecreational =
    "SELECT COUNT(*) as totalCount FROM equipment_recreational";
  const querySport = "SELECT COUNT(*) as totalCount FROM equipment_sport";

  db.query(queryRecreational, (error1, resultsRecreational) => {
    if (error1) {
      console.error("Error querying recreational table:", error1);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    db.query(querySport, (error2, resultsSport) => {
      if (error2) {
        console.error("Error querying sport table:", error2);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      const totalCount = {
        recreationalCount: resultsRecreational[0].totalCount,
        sportCount: resultsSport[0].totalCount,
        combinedCount:
          resultsRecreational[0].totalCount + resultsSport[0].totalCount,
      };

      res.json(totalCount);
    });
  });
});

router.get("/UserCount", (req, res) => {
  const query = "SELECT COUNT(*) userCount FROM users";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const userCount = results[0].userCount;
    res.json({ userCount });
  });
}); //จำนวนผู้ใช้ทั้งหมด
router.get("/returnedCount", (req, res) => {
  const query =
    "SELECT COUNT(*) AS returnedCount FROM loan_details WHERE loan_status = 'คืน'";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  });
});

router.get("/totalLend", (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT ld.loan_id) AS totalLend 
    FROM loan_details ld
    WHERE ld.loan_status = 'ยืม'
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const totalLend = results[0].totalLend;
    res.json({ totalLend });
  });
});

router.get("/management", (req, res) => {
  const query = `
    SELECT 
      ld.loan_id AS id,
      ld.borrower_name,
      ld.borrow_date,
      ld.return_date,
      ld.loan_status,
      li.item_id,
      li.equipment_name,
      li.equipment_type,
      li.quantity_borrowed,
      ld.identifier_number,  
      CASE
        WHEN es.equipment_name IS NOT NULL THEN es.Sp_quantity_in_stock
        WHEN er.equipment_name IS NOT NULL THEN er.Eq_quantity_in_stock
        ELSE 0
      END AS total_stock,
      (SELECT SUM(quantity_borrowed) 
       FROM loan_items li2 
       JOIN loan_details ld2 ON li2.loan_id = ld2.loan_id 
       WHERE li2.equipment_name = li.equipment_name) AS quantity_data
    FROM loan_details ld
    JOIN loan_items li ON ld.loan_id = li.loan_id
    LEFT JOIN equipment_sport es ON li.equipment_name = es.equipment_name
    LEFT JOIN equipment_recreational er ON li.equipment_name = er.equipment_name
    ORDER BY ld.loan_id, li.equipment_name
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

router.get("/eqloan", (req, res) => {
  const query = `
    SELECT 
      e.equipment_name,
      e.equipment_type,
      e.max_quantity_in_stock,
      COALESCE(SUM(CASE WHEN ld.loan_status = 'ยืม' THEN li.quantity_borrowed ELSE 0 END), 0) AS total_quantity_borrowed,
      e.max_quantity_in_stock > 0 AS is_available
    FROM (
      SELECT equipment_name, 'อุปกรณ์กีฬา' AS equipment_type, Sp_quantity_in_stock AS max_quantity_in_stock
      FROM equipment_sport
      UNION ALL
      SELECT equipment_name, 'อุปกรณ์นันทนาการ' AS equipment_type, Eq_quantity_in_stock AS max_quantity_in_stock
      FROM equipment_recreational
    ) e
    LEFT JOIN loan_items li ON e.equipment_name = li.equipment_name
    LEFT JOIN loan_details ld ON li.loan_id = ld.loan_id AND ld.loan_status = 'ยืม'
    GROUP BY e.equipment_name, e.equipment_type, e.max_quantity_in_stock
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying equipment summary from database:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
