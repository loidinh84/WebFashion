const NhaCungCap = require("../models/NhaCungCap");
const { Op } = require("sequelize");

// 1. LẤY DANH SÁCH
exports.getAllNhaCungCap = async (req, res) => {
  try {
    const list = await NhaCungCap.findAll({
      where: {
        trang_thai: { [Op.ne]: "deleted" },
      },
    });
    res.status(200).json(list);
  } catch (error) {
    console.error("Lỗi lấy danh sách NCC:", error);
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu." });
  }
};

// 1. THÊM MỚI NHÀ CUNG CẤP
exports.createNhaCungCap = async (req, res) => {
  try {
    const { ten_nha_cc, trang_thai } = req.body;
    const existingNCC = await NhaCungCap.findOne({
      where: { ten_nha_cc: ten_nha_cc, trang_thai: { [Op.ne]: "deleted" } },
    });

    if (existingNCC) {
      return res.status(400).json({ message: "Nhà cung cấp này đã tồn tại!" });
    }

    // Tiến hành thêm mới
    const newNCC = await NhaCungCap.create({
      ten_nha_cc,
      trang_thai: trang_thai || "active",
    });

    res.status(201).json(newNCC);
  } catch (error) {
    console.error("Lỗi khi thêm nhà cung cấp:", error);
    res.status(500).json({ message: "Lỗi server khi thêm nhà cung cấp." });
  }
};

// 2. CẬP NHẬT NHÀ CUNG CẤP
exports.updateNhaCungCap = async (req, res) => {
  try {
    const id = req.params.id;
    const { ten_nha_cc } = req.body;

    const ncc = await NhaCungCap.findByPk(id);
    if (!ncc || ncc.trang_thai === "deleted") {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp!" });
    }

    const checkDuplicate = await NhaCungCap.findOne({
      where: {
        ten_nha_cc: ten_nha_cc,
        id: { [Op.ne]: id },
        trang_thai: { [Op.ne]: "deleted" },
      },
    });

    if (checkDuplicate) {
      return res
        .status(400)
        .json({ message: "Tên nhà cung cấp đã được sử dụng!" });
    }

    ncc.ten_nha_cc = ten_nha_cc;
    await ncc.save();

    res.status(200).json({ message: "Cập nhật thành công!", data: ncc });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhà cung cấp:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật." });
  }
};

// 3. XÓA NHÀ CUNG CẤP
exports.deleteNhaCungCap = async (req, res) => {
  try {
    const id = req.params.id;

    const ncc = await NhaCungCap.findByPk(id);
    if (!ncc || ncc.trang_thai === "deleted") {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp!" });
    }
    ncc.trang_thai = "deleted";
    await ncc.save();

    res.status(200).json({ message: "Đã xóa nhà cung cấp thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa nhà cung cấp:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: "Không thể xóa! Nhà cung cấp này đang chứa sản phẩm.",
      });
    }

    res.status(500).json({ message: "Lỗi server khi xóa." });
  }
};
