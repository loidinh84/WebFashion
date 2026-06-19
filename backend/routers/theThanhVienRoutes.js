const TheThanhVienController = require("../controllers/theThanhVienController");
const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get(
  "/",
  verifyToken,
  isAdmin,
  TheThanhVienController.getAllTheThanhVien,
);
router.post(
  "/",
  verifyToken,
  isAdmin,
  TheThanhVienController.createTheThanhVien,
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  TheThanhVienController.updateTheThanhVien,
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  TheThanhVienController.deleteTheThanhVien,
);

module.exports = router;
