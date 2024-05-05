// home.js
const express = require("express");
const db = require("../database/db");

const router = express.Router();

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
}); //จำนวนอุปกรณ์ที่ถูกยืม
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

    const returnedCount = results[0].returnedCount;
    res.json({ returnedCount });
  });
}); //จำนวนผู้ยืมอุปกรณ์ทั้งหมด
router.get("/totalLend", (req, res) => {
  const query =
    "SELECT COUNT(*) AS totalLend FROM loan_details WHERE loan_status = 'ยืม'";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const totalLend = results[0].totalLend;
    res.json({ totalLend });
  });
}); //จำนวนการยืมทั้งหมด


router.get("/management", (req, res) => {
  const query = `
  SELECT 
  ld.*,
  CASE
    WHEN es.equipment_name IS NOT NULL THEN es.Sp_quantity_in_stock
    WHEN er.equipment_name IS NOT NULL THEN er.Eq_quantity_in_stock
    ELSE 0
  END AS total_stock
FROM pctdb.loan_details ld
LEFT JOIN pctdb.equipment_sport es ON ld.equipment_name = es.equipment_name
LEFT JOIN pctdb.equipment_recreational er ON ld.equipment_name = er.equipment_name
ORDER BY ld.equipment_name;
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
    es.equipment_name AS equipment_name, 
    'อุปกรณ์กีฬา' AS equipment_type, 
    MAX(es.Sp_quantity_in_stock) AS max_quantity_in_stock,
    SUM(CASE WHEN ld.loan_status = 'ยืม' THEN ld.quantity_borrowed ELSE 0 END) AS total_quantity_borrowed,
    MAX(es.Sp_quantity_in_stock) > 0 AS is_available
  FROM equipment_sport es
  LEFT JOIN loan_details ld ON es.equipment_name = ld.equipment_name AND ld.loan_status = 'ยืม'
  GROUP BY es.equipment_name

  UNION
  
  SELECT 
    er.equipment_name AS equipment_name, 
    'อุปกรณ์นันทนาการ' AS equipment_type, 
    MAX(er.Eq_quantity_in_stock) AS max_quantity_in_stock,
    SUM(CASE WHEN ld.loan_status = 'ยืม' THEN ld.quantity_borrowed ELSE 0 END) AS total_quantity_borrowed,
    MAX(er.Eq_quantity_in_stock) > 0 AS is_available
  FROM equipment_recreational er
  LEFT JOIN loan_details ld ON er.equipment_name = ld.equipment_name AND ld.loan_status = 'ยืม'
  GROUP BY er.equipment_name;
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
