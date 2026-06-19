const express = require("express");
const router = express.Router();
const sanPhamController = require("../controllers/sanPhamController");
const danhMucController = require("../controllers/danhMucController");
const nhaCungCapController = require("../controllers/nhaCungCapController");
const { searchSanPham } = require("../services/searchService");
const upload = require("../config/upload");
const { verifyToken, isAdmin, verifyTokenOptional } = require("../middlewares/authMiddleware");

router.get("/search", async (req, res) => {
  try {
    const { q = "", limit = 30, danhMucId } = req.query;

    const filter = danhMucId ? `danh_muc_id IN (${danhMucId})` : null;

    const result = await searchSanPham(q, {
      limit: Number(limit),
      filter,
    });

    res.json({
      hits: result.hits,
      total: result.estimatedTotalHits || result.hits.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tìm kiếm!" });
  }
});

router.get(
  "/danhMuc-sidebar",
  danhMucController.getPublicSidebarCategories,
);

// 1. CÁC ROUTE CỐ ĐỊNH
// Danh mục
router.get("/danhMuc", verifyToken, isAdmin, sanPhamController.getAllDanhMuc);
router.post("/danhMuc", verifyToken, isAdmin, danhMucController.createDanhMuc);
router.put(
  "/danhMuc/:id",
  verifyToken,
  isAdmin,
  danhMucController.updateDanhMuc,
);
router.delete(
  "/danhMuc/:id",
  verifyToken,
  isAdmin,
  danhMucController.deleteDanhMuc,
);
router.put(
  "/danhMuc/:id/status",
  verifyToken,
  isAdmin,
  danhMucController.toggleTrangThai,
);
// Nhà cung cấp
router.get(
  "/nhaCungCap",
  verifyToken,
  isAdmin,
  nhaCungCapController.getAllNhaCungCap,
);
router.post(
  "/nhaCungCap",
  verifyToken,
  isAdmin,
  nhaCungCapController.createNhaCungCap,
);
router.put(
  "/nhaCungCap/:id",
  verifyToken,
  isAdmin,
  nhaCungCapController.updateNhaCungCap,
);
router.delete(
  "/nhaCungCap/:id",
  verifyToken,
  isAdmin,
  nhaCungCapController.deleteNhaCungCap,
);
// Sản phẩm
router.get("/", sanPhamController.getAllSanPham);
router.get(
  "/tatCaSanPham",
  verifyToken,
  isAdmin,
  sanPhamController.getAdminSanPham,
);

// Thêm mới sản phẩm
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.array("hinh_anh_files", 10),
  sanPhamController.createSanPham,
);

router.get("/boloc/:danhMucId", sanPhamController.getBoLocByDanhMuc);
router.get("/chi-tiet/:slug", sanPhamController.getSanPhamBySlug);
router.get("/danh-muc/tree", danhMucController.getCategoryTree);
router.get("/danh-muc/slug/:slug", danhMucController.getDanhMucBySlug);
router.get("/danh-muc/id/:id", danhMucController.getDanhMucById);
router.get("/thuong-hieu/:danhMucId", sanPhamController.getThuongHieuByDanhMuc);
router.post("/:id/view", sanPhamController.incrementLuotXem);
router.get("/:id", sanPhamController.getSanPhamById);
router.get("/:id/tuong-tu", sanPhamController.getSanPhamTuongTu);
router.get("/:id/danh-gia", verifyTokenOptional, sanPhamController.getDanhGiaBySanPham);
router.post("/danh-gia/:danhGiaId/like", verifyToken, sanPhamController.toggleLikeDanhGia);
router.put("/danh-gia/:id/status", verifyToken, isAdmin, sanPhamController.updateDanhGiaStatus);
router.delete("/danh-gia/:id", verifyToken, isAdmin, sanPhamController.deleteDanhGia);

// User đánh giá
router.post(
  "/:id/danh-gia",
  verifyToken,
  upload.array("hinh_anh", 10),
  sanPhamController.createDanhGia,
);

// Admin
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.array("hinh_anh_files", 10),
  sanPhamController.updateSanPham,
);
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  sanPhamController.toggleTrangThai,
);
router.get(
  "/:id/check-purchased",
  verifyToken,
  sanPhamController.checkPurchased,
);
router.delete("/:id", verifyToken, isAdmin, sanPhamController.deleteSanPham);

module.exports = router;
