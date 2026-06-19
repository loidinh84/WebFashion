const express = require("express");
const router = express.Router();
const controller = require("../controllers/danhGiaCuaHangController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Route công khai lấy đánh giá hiện trang chủ
router.get("/top", controller.getTopReviews);

// Route cho khách hàng gửi đánh giá (cần đăng nhập)
router.post("/", verifyToken, controller.createReview);

// Route lấy đánh giá của riêng user đang đăng nhập
router.get("/user", verifyToken, controller.getUserReviews);

// Route chỉnh sửa đánh giá của user
router.put("/:id", verifyToken, controller.updateReview);

// Route xóa đánh giá của user
router.delete("/:id", verifyToken, controller.deleteReview);

module.exports = router;
