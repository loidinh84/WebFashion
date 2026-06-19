const MethodPayController = require("../controllers/methodPayController");
const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

// API lấy danh sách active (Cho trang thanh toán của khách)
router.get("/", MethodPayController.getActivePayments);

// API Admin
router.get("/admin-pay", verifyToken, isAdmin, MethodPayController.getAllPaymentsAdmin);
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("logo_url"),
  MethodPayController.createPayment,
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("logo_url"),
  MethodPayController.updatePayment,
);
router.put(
  "/:id/toggle",
  verifyToken,
  isAdmin,
  MethodPayController.togglePaymentStatus,
);
router.delete("/:id", verifyToken, isAdmin, MethodPayController.deletePayment);

module.exports = router;
