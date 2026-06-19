const express = require("express");
const router = express.Router();
const yeuThichController = require("../controllers/yeuThichController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/user/:userId", verifyToken, yeuThichController.getWishlistByUser);

router.get("/check/:userId/:productId", yeuThichController.checkIsLiked);

router.post("/toggle", verifyToken, yeuThichController.toggleWishlist);

module.exports = router;
