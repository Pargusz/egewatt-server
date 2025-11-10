const express = require("express");
const { getDailyData, getMonthlyData } = require("../controllers/measurementController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/daily", authenticate, requireRole("admin"), getDailyData);
router.get("/monthly", authenticate, requireRole("admin"), getMonthlyData);

module.exports = router;