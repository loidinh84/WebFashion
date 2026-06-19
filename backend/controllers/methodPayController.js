const PhuongThucThanhToan = require("../models/PhuongThucThanhToan");
const fs = require("fs");
const path = require("path");

// Lấy danh sách đang hoạt động
exports.getActivePayments = async (req, res) => {
  try {
    const payments = await PhuongThucThanhToan.findAll({
      where: { trang_thai: "active" },
      order: [["id", "ASC"]],
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tất cả
exports.getAllPaymentsAdmin = async (req, res) => {
  try {
    const payments = await PhuongThucThanhToan.findAll({
      order: [["id", "DESC"]],
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm mới
exports.createPayment = async (req, res) => {
  try {
    const { ten_phuong_thuc, ma, loai, trang_thai } = req.body || {};

    let logo_url = null;
    if (req.file) {
      logo_url = `/uploads/${req.file.filename}`;
    }

    const newPayment = await PhuongThucThanhToan.create({
      ten_phuong_thuc,
      ma,
      loai,
      logo_url,
      trang_thai: trang_thai || "active",
    });

    res.status(201).json({ message: "Thêm thành công", data: newPayment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi thêm phương thức" });
  }
};

// Sửa
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_phuong_thuc, ma, loai, trang_thai } = req.body || {};

    const payment = await PhuongThucThanhToan.findByPk(id);
    if (!payment) return res.status(404).json({ message: "Không tìm thấy" });

    payment.ten_phuong_thuc = ten_phuong_thuc || payment.ten_phuong_thuc;
    payment.ma = ma || payment.ma;
    payment.loai = loai || payment.loai;
    if (trang_thai) payment.trang_thai = trang_thai;

    if (req.file) {
      if (payment.logo_url) {
        const oldPath = path.join(__dirname, "../", payment.logo_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      payment.logo_url = `/uploads/${req.file.filename}`;
    }

    await payment.save();
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

// Bật/Tắt
exports.togglePaymentStatus = async (req, res) => {
  try {
    const payment = await PhuongThucThanhToan.findByPk(req.params.id);
    payment.trang_thai =
      payment.trang_thai === "active" ? "inactive" : "active";
    await payment.save();
    res.status(200).json({ message: "Đã đổi trạng thái" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa
exports.deletePayment = async (req, res) => {
  try {
    const payment = await PhuongThucThanhToan.findByPk(req.params.id);
    if (payment.logo_url) {
      const filePath = path.join(__dirname, "../", payment.logo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await payment.destroy();
    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa" });
  }
};
