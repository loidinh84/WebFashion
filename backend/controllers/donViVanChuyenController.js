const DonViVanChuyen = require("../models/DonViVanChuyen");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

// 1. LẤY DANH SÁCH ĐANG HOẠT ĐỘNG
exports.getActiveLogistics = async (req, res) => {
  try {
    const logistics = await DonViVanChuyen.findAll({
      where: { trang_thai: "active" },
      order: [["id", "ASC"]],
    });
    res.status(200).json(logistics);
  } catch (error) {
    console.error("Lỗi lấy danh sách vận chuyển active:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 2. LẤY TẤT CẢ DANH SÁCH
exports.getAllLogisticsAdmin = async (req, res) => {
  try {
    const logistics = await DonViVanChuyen.findAll({
      order: [["id", "DESC"]],
    });
    res.status(200).json(logistics);
  } catch (error) {
    console.error("Lỗi lấy danh sách vận chuyển admin:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 3. THÊM ĐƠN VỊ VẬN CHUYỂN MỚI
exports.createLogistic = async (req, res) => {
  try {
    const { ten_don_vi, ma, phi_co_ban, thoi_gian_du_kien, trang_thai } =
      req.body;

    let logo_url = null;
    if (req.file) {
      logo_url = `/uploads/${req.file.filename}`;
    }

    const newLogistic = await DonViVanChuyen.create({
      ten_don_vi,
      ma,
      logo_url,
      phi_co_ban: phi_co_ban || 0,
      thoi_gian_du_kien,
      trang_thai: trang_thai || "active",
    });

    res.status(201).json({
      message: "Thêm đơn vị vận chuyển thành công",
      data: newLogistic,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm đơn vị vận chuyển" });
  }
};

// 4. CẬP NHẬT ĐƠN VỊ VẬN CHUYỂN
exports.updateLogistic = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_don_vi, ma, phi_co_ban, thoi_gian_du_kien, trang_thai } =
      req.body;

    const logistic = await DonViVanChuyen.findByPk(id);
    if (!logistic) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn vị vận chuyển" });
    }

    logistic.ten_don_vi = ten_don_vi || logistic.ten_don_vi;
    logistic.ma = ma || logistic.ma;
    logistic.phi_co_ban =
      phi_co_ban !== undefined ? phi_co_ban : logistic.phi_co_ban;
    logistic.thoi_gian_du_kien =
      thoi_gian_du_kien !== undefined
        ? thoi_gian_du_kien
        : logistic.thoi_gian_du_kien;
    if (trang_thai) logistic.trang_thai = trang_thai;

    if (req.file) {
      if (logistic.logo_url) {
        const oldPath = path.join(__dirname, "../", logistic.logo_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      logistic.logo_url = `/uploads/${req.file.filename}`;
    }

    await logistic.save();
    res.status(200).json({ message: "Cập nhật thành công", data: logistic });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật đơn vị vận chuyển" });
  }
};

exports.toggleLogisticStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const logistic = await DonViVanChuyen.findByPk(id);

    if (!logistic) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn vị vận chuyển" });
    }

    logistic.trang_thai =
      logistic.trang_thai === "active" ? "inactive" : "active";
    await logistic.save();

    res.status(200).json({
      message: "Đổi trạng thái thành công",
      trang_thai: logistic.trang_thai,
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 6. XÓA ĐƠN VỊ VẬN CHUYỂN
exports.deleteLogistic = async (req, res) => {
  try {
    const { id } = req.params;
    const logistic = await DonViVanChuyen.findByPk(id);

    if (!logistic) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn vị vận chuyển" });
    }

    // Dọn dẹp rác: Xóa file ảnh logo vật lý
    if (logistic.logo_url) {
      const filePath = path.join(__dirname, "../", logistic.logo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await logistic.destroy();
    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Lỗi xóa đơn vị vận chuyển:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
