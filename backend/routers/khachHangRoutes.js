const express = require("express");
const router = express.Router();
const KhachHangController = require("../controllers/KhachHangController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, isAdmin, KhachHangController.getCustomers);
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  KhachHangController.toggleStatus,
);
router.post(
  "/send-email",
  verifyToken,
  isAdmin,
  KhachHangController.sendEmailToCustomer,
);

module.exports = router;
