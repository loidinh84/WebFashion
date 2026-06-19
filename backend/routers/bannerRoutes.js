const express = require("express");
const router = express.Router();
const BannerController = require("../controllers/bannerController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

router.get("/", BannerController.getActiveBanners);
router.get(
  "/admin-banner",
  verifyToken,
  isAdmin,
  BannerController.getAllBannersAdmin,
);
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("hinh_anh"),
  BannerController.createBanner,
);
router.put(
  "/:id/toggle",
  verifyToken,
  isAdmin,
  BannerController.toggleBannerStatus,
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("hinh_anh"),
  BannerController.updateBanner,
);
router.delete("/:id", verifyToken, isAdmin, BannerController.deleteBanner);

module.exports = router;
