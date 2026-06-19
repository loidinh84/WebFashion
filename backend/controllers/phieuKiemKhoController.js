const { Op } = require("sequelize");
const PhieuKiemKho = require("../models/PhieuKiemKho");
const ChiTietKiemKho = require("../models/ChiTietKiemKho");
const BienTheSanPham = require("../models/BienTheSanPham");
const SanPham = require("../models/SanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const TaiKhoan = require("../models/TaiKhoan");
const sequelize = require("../config/db");

// Tự động sinh mã: KK000001
const generateMaPhieu = async () => {
  const last = await PhieuKiemKho.findOne({ order: [["id", "DESC"]] });
  const nextNum = last ? parseInt(last.ma_phieu.replace("KK", "")) + 1 : 1;
  return "KK" + String(nextNum).padStart(6, "0");
};

// ── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      search = "",
      trang_thai,
      ngay_tu,
      ngay_den,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (trang_thai && trang_thai !== "all") where.trang_thai = trang_thai;
    if (search) where.ma_phieu = { [Op.like]: `%${search}%` };
    if (ngay_tu || ngay_den) {
      where.created_at = {};
      if (ngay_tu) where.created_at[Op.gte] = new Date(ngay_tu + "T00:00:00");
      if (ngay_den) where.created_at[Op.lte] = new Date(ngay_den + "T23:59:59");
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await PhieuKiemKho.findAndCountAll({
      where,
      include: [{ model: TaiKhoan, as: "nguoi_tao_tk", attributes: ["id", "ho_ten"] }],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({ data: rows, total: count, page: parseInt(page) });
  } catch (error) {
    console.error("getAll PhieuKiemKho error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const phieu = await PhieuKiemKho.findByPk(req.params.id, {
      include: [
        { model: TaiKhoan, as: "nguoi_tao_tk", attributes: ["id", "ho_ten"] },
        {
          model: ChiTietKiemKho,
          as: "chi_tiet",
          include: [{
            model: BienTheSanPham,
            as: "bien_the",
            attributes: ["id", "sku", "mau_sac", "dung_luong", "ram", "ton_kho"],
            include: [{
              model: SanPham,
              as: "san_pham",
              attributes: ["id", "ten_san_pham"],
              include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
            }],
          }],
        },
      ],
    });
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu kiểm kho!" });
    res.json(phieu);
  } catch (error) {
    console.error("getById PhieuKiemKho error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// ── CREATE + CÂN BẰNG KHO (balanced) ────────────────────────────────────────
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ghi_chu = "", trang_thai = "balanced", items = [] } = req.body;
    const nguoi_tao = req.user?.id || null;

    if (items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 hàng hóa để kiểm!" });
    }

    const ma_phieu = await generateMaPhieu();

    // Tính thống kê
    let lenh_tang = 0, lenh_giam = 0, tong_chenh_lech = 0;
    for (const item of items) {
      const cl = item.so_luong_thuc_te - item.so_luong_he_thong;
      tong_chenh_lech += cl;
      if (cl > 0) lenh_tang += cl;
      if (cl < 0) lenh_giam += Math.abs(cl);
    }

    const phieu = await PhieuKiemKho.create(
      { ma_phieu, nguoi_tao, trang_thai, ghi_chu, tong_chenh_lech, lenh_tang, lenh_giam },
      { transaction: t }
    );

    const chiTiet = items.map((i) => ({
      phieu_kiem_id: phieu.id,
      bien_the_id: i.bien_the_id,
      so_luong_he_thong: i.so_luong_he_thong,
      so_luong_thuc_te: i.so_luong_thuc_te,
    }));
    await ChiTietKiemKho.bulkCreate(chiTiet, { transaction: t });

    // Nếu cân bằng kho → cập nhật tồn kho thực tế
    if (trang_thai === "balanced") {
      await _capNhatTonKho(items, t);
    }

    await t.commit();
    res.status(201).json({ message: "Tạo phiếu kiểm kho thành công!", data: { id: phieu.id, ma_phieu } });
  } catch (error) {
    await t.rollback();
    console.error("create PhieuKiemKho error:", error);
    res.status(500).json({ message: "Lỗi server khi tạo phiếu kiểm kho!" });
  }
};

// ── CANCEL ───────────────────────────────────────────────────────────────────
exports.cancel = async (req, res) => {
  try {
    const phieu = await PhieuKiemKho.findByPk(req.params.id);
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu kiểm kho!" });
    if (phieu.trang_thai === "cancelled") return res.status(400).json({ message: "Phiếu đã hủy rồi!" });

    await phieu.update({ trang_thai: "cancelled" });
    res.json({ message: "Đã hủy phiếu kiểm kho!" });
  } catch (error) {
    console.error("cancel PhieuKiemKho error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// ── SEARCH BIẾN THỂ (tìm sản phẩm để thêm vào phiếu kiểm) ──────────────────
exports.searchBienThe = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json([]);

    const byName = await BienTheSanPham.findAll({
      include: [{
        model: SanPham,
        as: "san_pham",
        attributes: ["id", "ten_san_pham"],
        where: { ten_san_pham: { [Op.like]: `%${q}%` } },
        required: true,
        include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
      }],
      limit: 15,
    });

    const bySku = await BienTheSanPham.findAll({
      where: { sku: { [Op.like]: `%${q}%` } },
      include: [{
        model: SanPham,
        as: "san_pham",
        attributes: ["id", "ten_san_pham"],
        required: false,
        include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
      }],
      limit: 10,
    });

    const all = [...byName, ...bySku];
    const seen = new Set();
    const unique = all.filter((b) => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });

    res.json(unique.slice(0, 20));
  } catch (error) {
    console.error("searchBienThe KiemKho error:", error);
    res.status(500).json({ message: "Lỗi tìm kiếm!" });
  }
};

// ── HELPER: Cập nhật tồn kho theo thực tế ───────────────────────────────────
async function _capNhatTonKho(items, t) {
  for (const item of items) {
    const { bien_the_id, so_luong_thuc_te } = item;

    // Cập nhật BienTheSanPham.ton_kho = thực tế
    await BienTheSanPham.update(
      { ton_kho: so_luong_thuc_te },
      { where: { id: bien_the_id }, transaction: t }
    );

    // Cập nhật hoặc tạo bảng Kho
    const [khoRow] = await sequelize.query(
      `SELECT id FROM Kho WHERE bien_the_id = :bien_the_id`,
      { replacements: { bien_the_id }, transaction: t, type: sequelize.QueryTypes.SELECT }
    );

    if (khoRow) {
      await sequelize.query(
        `UPDATE Kho SET so_luong_ton = :so_luong, updated_at = GETDATE() WHERE bien_the_id = :bien_the_id`,
        { replacements: { so_luong: so_luong_thuc_te, bien_the_id }, transaction: t }
      );
    } else {
      await sequelize.query(
        `INSERT INTO Kho (bien_the_id, so_luong_ton, updated_at) VALUES (:bien_the_id, :so_luong, GETDATE())`,
        { replacements: { bien_the_id, so_luong: so_luong_thuc_te }, transaction: t }
      );
    }
  }
}
