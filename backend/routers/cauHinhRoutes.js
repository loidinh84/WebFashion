const express = require("express");
const router = express.Router();
const cauHinhController = require("../controllers/cauHinhController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

router.get("/home", cauHinhController.getHomeConfiguration);
router.post("/home", verifyToken, isAdmin, cauHinhController.updateHomeConfiguration);

// Route upload icon cho dải tiện ích
router.post("/upload", verifyToken, isAdmin, upload.single("icon"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Không có file nào được tải lên!" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});

module.exports = router;
