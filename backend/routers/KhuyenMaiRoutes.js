const express = require("express");
const router = express.Router();
const khuyenMaiController = require("../controllers/khuyenMaiController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, isAdmin, khuyenMaiController.getAllKhuyenMai);
router.post("/", verifyToken, isAdmin, khuyenMaiController.createKhuyenMai);
router.put("/:id", verifyToken, isAdmin, khuyenMaiController.updateKhuyenMai);
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  khuyenMaiController.toggleTrangThai,
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  khuyenMaiController.deleteKhuyenMai,
);

module.exports = router;
