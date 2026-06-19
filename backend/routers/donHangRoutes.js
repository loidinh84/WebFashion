const express = require("express");
const router = express.Router();
const DonHangController = require("../controllers/donHangController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.post("/dat-hang", DonHangController.createDonHang);
router.post("/check-voucher", DonHangController.checkVoucher);
router.get("/", verifyToken, isAdmin, DonHangController.getAdminOrders);
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  DonHangController.updateOrderStatus,
);
router.post(
  "/:id/tracking",
  verifyToken,
  isAdmin,
  DonHangController.addTrackingLog,
);

module.exports = router;
