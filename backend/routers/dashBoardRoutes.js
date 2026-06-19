const express = require("express");
const router = express.Router();
const DashBoardController = require("../controllers/dashboardController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get(
  "/summary",
  verifyToken,
  isAdmin,
  DashBoardController.getDashboardSummary,
);

module.exports = router;
