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
    "SELECT COUNT(*) AS returnedCount FROM loan_details WHERE loan_status = 'Returned'";

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
    "SELECT COUNT(*) AS totalLend FROM loan_details WHERE loan_status = 'Borrowed'";

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
  const query = "SELECT * FROM `pct-project-finals`.loan_details;";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
});

module.exports = router;
