const express = require("express");
const router = express.Router();
const mauInController = require("../controllers/mauInController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// Tất cả route đều yêu cầu Admin
router.use(verifyToken, isAdmin);

router.get("/", mauInController.getAllTemplates);
router.get("/init-defaults", mauInController.initDefaultTemplates);
router.get("/:code", mauInController.getTemplateByCode);
router.post("/", mauInController.saveTemplate);
router.delete("/:id", mauInController.deleteTemplate);

module.exports = router;
