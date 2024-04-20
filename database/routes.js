// routes.js
const express = require("express");
const db = require("./db");
const sportRoutes = require("../api/sport");
const userRoutes = require("../api/user");
const recreationalRoutes = require("../api/recreational");
const homeRoutes = require("../api/home"); // ตรวจสอบว่าบรรทัดนี้ถูกเพิ่มแล้ว
const reportRoutes = require("../api/manage");
const Borrowed = require("../api/Borrower")

const router = express.Router();

router.use("/sport", sportRoutes);
router.use("/user", userRoutes);
router.use("/recreational", recreationalRoutes);
router.use("/home", homeRoutes);
router.use("/manage", reportRoutes);
router.use("/Borrowed", Borrowed);

module.exports = router;
