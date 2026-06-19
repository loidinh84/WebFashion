const DonViVanChuyenController = require("../controllers/donViVanChuyenController");
const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

router.get("/", DonViVanChuyenController.getActiveLogistics);
router.get(
  "/admin-logistics",
  verifyToken,
  isAdmin,
  DonViVanChuyenController.getAllLogisticsAdmin,
);
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("logo_url"),
  DonViVanChuyenController.createLogistic,
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("logo_url"),
  DonViVanChuyenController.updateLogistic,
);
router.put(
  "/:id/toggle",
  verifyToken,
  isAdmin,
  DonViVanChuyenController.toggleLogisticStatus,
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  DonViVanChuyenController.deleteLogistic,
);

module.exports = router;
