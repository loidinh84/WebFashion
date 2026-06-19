const express = require("express");
const router = express.Router();
const gioHangController = require("../controllers/GioHangController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Áp dụng middleware verifyToken cho tất cả các tuyến đường giỏ hàng
router.use(verifyToken);

router.get("/", gioHangController.getCart);
router.post("/", gioHangController.addToCart);
router.put("/", gioHangController.updateQuantity);
router.delete("/:bien_the_id", gioHangController.removeFromCart);
router.post("/sync", gioHangController.syncCart);
router.post("/clear-selected", gioHangController.clearSelected);

module.exports = router;
