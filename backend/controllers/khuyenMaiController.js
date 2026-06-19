const KhuyenMai = require("../models/KhuyenMai");
const { Op } = require("sequelize");

// 1. Lấy toàn bộ danh sách Khuyến mãi
exports.getAllKhuyenMai = async (req, res) => {
  try {
    const list = await KhuyenMai.findAll({
      order: [["id", "DESC"]],
    });
    res.status(200).json(list);
  } catch (error) {
    console.error("Lỗi lấy danh sách KM:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách khuyến mãi!" });
  }
};

// 2. Tạo Mã Khuyến Mãi mới
exports.createKhuyenMai = async (req, res) => {
  try {
    const {
      ma_khuyen_mai,
      ten_chuong_trinh,
      loai,
      gia_tri,
      gia_tri_toi_da,
      don_hang_toi_thieu,
      so_luong_ma,
      ngay_bat_dau,
      ngay_ket_thuc,
    } = req.body;

    const exists = await KhuyenMai.findOne({ where: { ma_khuyen_mai } });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Mã khuyến mãi này đã tồn tại trong hệ thống!" });
    }

    const newVoucher = await KhuyenMai.create({
      ma_khuyen_mai: ma_khuyen_mai.toUpperCase(),
      ten_chuong_trinh,
      loai,
      gia_tri: Number(gia_tri) || 0,
      gia_tri_toi_da: gia_tri_toi_da ? Number(gia_tri_toi_da) : null,
      don_hang_toi_thieu: don_hang_toi_thieu ? Number(don_hang_toi_thieu) : 0,
      so_luong_ma: Number(so_luong_ma) || 0,
      da_su_dung: 0,
      ngay_bat_dau,
      ngay_ket_thuc,
      trang_thai: "active",
    });

    res
      .status(201)
      .json({ message: "Tạo mã khuyến mãi thành công!", data: newVoucher });
  } catch (error) {
    console.error("Lỗi tạo KM:", error);
    res.status(500).json({ message: "Lỗi tạo khuyến mãi!" });
  }
};

// 3. Cập nhật Mã Khuyến Mãi
exports.updateKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ma_khuyen_mai,
      ten_chuong_trinh,
      loai,
      gia_tri,
      gia_tri_toi_da,
      don_hang_toi_thieu,
      so_luong_ma,
      ngay_bat_dau,
      ngay_ket_thuc,
    } = req.body;

    const voucher = await KhuyenMai.findByPk(id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi!" });
    }

    if (ma_khuyen_mai !== voucher.ma_khuyen_mai) {
      const exists = await KhuyenMai.findOne({ where: { ma_khuyen_mai } });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Mã khuyến mãi mới đã tồn tại!" });
      }
    }

    await voucher.update({
      ma_khuyen_mai: ma_khuyen_mai.toUpperCase(),
      ten_chuong_trinh,
      loai,
      gia_tri: Number(gia_tri) || 0,
      gia_tri_toi_da: gia_tri_toi_da ? Number(gia_tri_toi_da) : null,
      don_hang_toi_thieu: don_hang_toi_thieu ? Number(don_hang_toi_thieu) : 0,
      so_luong_ma: Number(so_luong_ma) || 0,
      ngay_bat_dau,
      ngay_ket_thuc,
    });

    res.status(200).json({ message: "Cập nhật mã thành công!", data: voucher });
  } catch (error) {
    console.error("Lỗi update KM:", error);
    res.status(500).json({ message: "Lỗi cập nhật khuyến mãi!" });
  }
};

// 4. Bật/Tắt trạng thái hoạt động của mã
exports.toggleTrangThai = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await KhuyenMai.findByPk(id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy mã!" });
    }

    const newStatus = voucher.trang_thai === "active" ? "inactive" : "active";
    await voucher.update({ trang_thai: newStatus });

    res
      .status(200)
      .json({
        message: "Cập nhật trạng thái thành công!",
        trang_thai: newStatus,
      });
  } catch (error) {
    console.error("Lỗi toggle KM:", error);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái!" });
  }
};

// 5. Xóa Mã Khuyến Mãi
exports.deleteKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await KhuyenMai.findByPk(id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy mã!" });
    }

    await voucher.destroy();
    res.status(200).json({ message: "Đã xóa mã khuyến mãi khỏi hệ thống!" });
  } catch (error) {
    console.error("Lỗi xóa KM:", error);
    res.status(500).json({ message: "Lỗi xóa mã khuyến mãi!" });
  }
};
