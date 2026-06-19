const { Op, fn, col, literal } = require("sequelize");
const PhieuNhapHang = require("../models/PhieuNhapHang");
const ChiTietPhieuNhap = require("../models/ChiTietPhieuNhap");
const BienTheSanPham = require("../models/BienTheSanPham");
const SanPham = require("../models/SanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const NhaCungCap = require("../models/NhaCungCap");
const TaiKhoan = require("../models/TaiKhoan");
const sequelize = require("../config/db");

// Tự động sinh mã phiếu: PNxxxxxx
const generateMaPhieu = async () => {
  const last = await PhieuNhapHang.findOne({ order: [["id", "DESC"]] });
  const nextNum = last ? parseInt(last.ma_phieu.replace("PN", "")) + 1 : 1;
  return "PN" + String(nextNum).padStart(6, "0");
};

// ── GET ALL (danh sách + filter) ─────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      search_ma = "",
      search_hang = "",
      search_ncc = "",
      trang_thai,   // "draft","completed","cancelled" hoặc undefined
      ngay_tu,
      ngay_den,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    // Lọc trạng thái (có thể multi: "draft,completed")
    if (trang_thai) {
      const statuses = trang_thai.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) where.trang_thai = { [Op.in]: statuses };
    }

    // Lọc theo mã phiếu
    if (search_ma) where.ma_phieu = { [Op.like]: `%${search_ma}%` };

    // Lọc thời gian
    if (ngay_tu || ngay_den) {
      where.created_at = {};
      if (ngay_tu) where.created_at[Op.gte] = new Date(ngay_tu + "T00:00:00");
      if (ngay_den) where.created_at[Op.lte] = new Date(ngay_den + "T23:59:59");
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await PhieuNhapHang.findAndCountAll({
      where,
      include: [
        {
          model: NhaCungCap,
          as: "nha_cung_cap",
          attributes: ["id", "ten_nha_cc"],
          where: search_ncc ? { ten_nha_cc: { [Op.like]: `%${search_ncc}%` } } : undefined,
          required: !!search_ncc,
        },
        {
          model: TaiKhoan,
          as: "nguoi_tao_tk",
          attributes: ["id", "ho_ten"],
        },
        {
          model: ChiTietPhieuNhap,
          as: "chi_tiet",
          include: [
            {
              model: BienTheSanPham,
              as: "bien_the",
              attributes: ["id", "sku", "mau_sac", "dung_luong"],
              include: [
                {
                  model: SanPham,
                  as: "san_pham",
                  attributes: ["id", "ten_san_pham"],
                  where: search_hang ? { ten_san_pham: { [Op.like]: `%${search_hang}%` } } : undefined,
                  required: !!search_hang,
                },
              ],
            },
          ],
          required: !!search_hang,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error("getAll PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách phiếu nhập!" });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const phieu = await PhieuNhapHang.findByPk(req.params.id, {
      include: [
        {
          model: NhaCungCap,
          as: "nha_cung_cap",
          attributes: ["id", "ten_nha_cc", "so_dien_thoai", "email"],
        },
        {
          model: TaiKhoan,
          as: "nguoi_tao_tk",
          attributes: ["id", "ho_ten"],
        },
        {
          model: ChiTietPhieuNhap,
          as: "chi_tiet",
          include: [
            {
              model: BienTheSanPham,
              as: "bien_the",
              attributes: ["id", "sku", "mau_sac", "dung_luong", "ram"],
              include: [
                {
                  model: SanPham,
                  as: "san_pham",
                  attributes: ["id", "ten_san_pham"],
                  include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
                },
              ],
            },
          ],
        },
      ],
    });
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu nhập!" });
    res.json(phieu);
  } catch (error) {
    console.error("getById PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nha_cc_id, giam_gia = 0, ghi_chu = "", trang_thai = "draft", items = [] } = req.body;
    const nguoi_tao = req.user?.id || null;

    const ma_phieu = await generateMaPhieu();

    // Tính tổng tiền
    const tong_tien = items.reduce((sum, i) => sum + (i.so_luong * i.don_gia_nhap - (i.giam_gia || 0)), 0) - Number(giam_gia);

    const phieu = await PhieuNhapHang.create(
      { ma_phieu, nha_cc_id: nha_cc_id || null, nguoi_tao, trang_thai, giam_gia, tong_tien, ghi_chu },
      { transaction: t }
    );

    if (items.length > 0) {
      const chiTiet = items.map((i) => ({
        phieu_nhap_id: phieu.id,
        bien_the_id: i.bien_the_id,
        so_luong: i.so_luong,
        don_gia_nhap: i.don_gia_nhap,
        giam_gia: i.giam_gia || 0,
      }));
      await ChiTietPhieuNhap.bulkCreate(chiTiet, { transaction: t });
    }

    // Nếu hoàn thành ngay thì cập nhật tồn kho
    if (trang_thai === "completed") {
      await _updateTonKho(items, t);
    }

    await t.commit();
    res.status(201).json({ message: "Tạo phiếu nhập thành công!", data: { id: phieu.id, ma_phieu } });
  } catch (error) {
    await t.rollback();
    console.error("create PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server khi tạo phiếu nhập!" });
  }
};

// ── UPDATE (chỉ khi draft) ───────────────────────────────────────────────────
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const phieu = await PhieuNhapHang.findByPk(id);
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu!" });
    if (phieu.trang_thai !== "draft") return res.status(400).json({ message: "Chỉ có thể sửa phiếu tạm!" });

    const { nha_cc_id, giam_gia = 0, ghi_chu = "", items = [] } = req.body;

    // Xóa chi tiết cũ và tạo lại
    await ChiTietPhieuNhap.destroy({ where: { phieu_nhap_id: id }, transaction: t });

    const tong_tien = items.reduce((sum, i) => sum + (i.so_luong * i.don_gia_nhap - (i.giam_gia || 0)), 0) - Number(giam_gia);

    await phieu.update({ nha_cc_id: nha_cc_id || null, giam_gia, tong_tien, ghi_chu }, { transaction: t });

    if (items.length > 0) {
      const chiTiet = items.map((i) => ({
        phieu_nhap_id: id,
        bien_the_id: i.bien_the_id,
        so_luong: i.so_luong,
        don_gia_nhap: i.don_gia_nhap,
        giam_gia: i.giam_gia || 0,
      }));
      await ChiTietPhieuNhap.bulkCreate(chiTiet, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Cập nhật phiếu thành công!" });
  } catch (error) {
    await t.rollback();
    console.error("update PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật phiếu!" });
  }
};

// ── COMPLETE (hoàn thành → cập nhật tồn kho) ────────────────────────────────
exports.complete = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const phieu = await PhieuNhapHang.findByPk(id, {
      include: [{ model: ChiTietPhieuNhap, as: "chi_tiet" }],
    });
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu!" });
    if (phieu.trang_thai !== "draft") return res.status(400).json({ message: "Phiếu này không thể hoàn thành!" });

    // Cập nhật tồn kho
    await _updateTonKho(phieu.chi_tiet, t);

    await phieu.update({ trang_thai: "completed" }, { transaction: t });
    await t.commit();
    res.json({ message: "Hoàn thành phiếu nhập thành công! Tồn kho đã được cập nhật." });
  } catch (error) {
    await t.rollback();
    console.error("complete PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server khi hoàn thành phiếu!" });
  }
};

// ── CANCEL ───────────────────────────────────────────────────────────────────
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const phieu = await PhieuNhapHang.findByPk(id);
    if (!phieu) return res.status(404).json({ message: "Không tìm thấy phiếu!" });
    if (phieu.trang_thai === "completed") return res.status(400).json({ message: "Không thể hủy phiếu đã hoàn thành!" });

    await phieu.update({ trang_thai: "cancelled" });
    res.json({ message: "Đã hủy phiếu nhập!" });
  } catch (error) {
    console.error("cancel PhieuNhap error:", error);
    res.status(500).json({ message: "Lỗi server khi hủy phiếu!" });
  }
};

// ── SEARCH BIẾN THỂ (dùng cho trang tạo phiếu nhập) ─────────────────────────
exports.searchBienThe = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const bienThe = await BienTheSanPham.findAll({
      where: {
        [Op.or]: [
          { sku: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [
        {
          model: SanPham,
          as: "san_pham",
          attributes: ["id", "ten_san_pham"],
          where: q ? { ten_san_pham: { [Op.like]: `%${q}%` } } : undefined,
          required: false,
          include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
        },
      ],
      limit: 20,
    });

    // Tìm theo tên SP nếu kết quả ít
    const byName = q ? await BienTheSanPham.findAll({
      include: [
        {
          model: SanPham,
          as: "san_pham",
          attributes: ["id", "ten_san_pham"],
          where: { ten_san_pham: { [Op.like]: `%${q}%` } },
          required: true,
          include: [{ model: HinhAnhSanPham, as: "hinh_anh", limit: 1 }],
        },
      ],
      limit: 20,
    }) : [];

    // Merge và deduplicate
    const all = [...bienThe, ...byName];
    const seen = new Set();
    const unique = all.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    res.json(unique.slice(0, 20));
  } catch (error) {
    console.error("searchBienThe error:", error);
    res.status(500).json({ message: "Lỗi tìm kiếm biến thể!" });
  }
};

// ── HELPER: Cập nhật tồn kho sau khi hoàn thành phiếu ───────────────────────
async function _updateTonKho(items, t) {
  for (const item of items) {
    const bien_the_id = item.bien_the_id;
    const so_luong = Number(item.so_luong);

    // 1. Cập nhật BienTheSanPham.ton_kho
    await BienTheSanPham.increment("ton_kho", {
      by: so_luong,
      where: { id: bien_the_id },
      transaction: t,
    });

    // 2. Cập nhật hoặc tạo mới bảng Kho
    const [khoRow] = await sequelize.query(
      `SELECT id FROM Kho WHERE bien_the_id = :bien_the_id`,
      { replacements: { bien_the_id }, transaction: t, type: sequelize.QueryTypes.SELECT }
    );

    if (khoRow) {
      await sequelize.query(
        `UPDATE Kho SET so_luong_ton = so_luong_ton + :so_luong, updated_at = GETDATE() WHERE bien_the_id = :bien_the_id`,
        { replacements: { so_luong, bien_the_id }, transaction: t }
      );
    } else {
      await sequelize.query(
        `INSERT INTO Kho (bien_the_id, so_luong_ton, updated_at) VALUES (:bien_the_id, :so_luong, GETDATE())`,
        { replacements: { bien_the_id, so_luong }, transaction: t }
      );
    }
  }
}
