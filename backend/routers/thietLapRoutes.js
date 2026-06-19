const express = require("express");
const router = express.Router();
const ThietLapController = require("../controllers/thietLapController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

router.get("/", ThietLapController.getStoreSettings);
router.put(
  "/",
  verifyToken,
  isAdmin,
  upload.single("logo"),
  ThietLapController.updateStoreSettings,
);
router.post(
  "/test-email",
  verifyToken,
  isAdmin,
  ThietLapController.testEmailConfig,
);

module.exports = router;
