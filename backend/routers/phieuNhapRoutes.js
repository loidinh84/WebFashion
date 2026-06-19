const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/phieuNhapController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/search-bien-the", verifyToken, isAdmin, ctrl.searchBienThe);
router.get("/", verifyToken, isAdmin, ctrl.getAll);
router.get("/:id", verifyToken, isAdmin, ctrl.getById);
router.post("/", verifyToken, isAdmin, ctrl.create);
router.put("/:id", verifyToken, isAdmin, ctrl.update);
router.patch("/:id/complete", verifyToken, isAdmin, ctrl.complete);
router.patch("/:id/cancel", verifyToken, isAdmin, ctrl.cancel);

module.exports = router;
