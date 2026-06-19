const { MauIn } = require("../models");

// Lấy tất cả mẫu in
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await MauIn.findAll();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách mẫu in" });
  }
};

// Lấy 1 mẫu in theo mã
exports.getTemplateByCode = async (req, res) => {
  try {
    const template = await MauIn.findOne({ where: { loai: req.params.code } });
    if (!template) return res.status(404).json({ message: "Không tìm thấy mẫu in" });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy mẫu in" });
  }
};

// Tạo hoặc Cập nhật mẫu in
exports.saveTemplate = async (req, res) => {
  try {
    const { loai, ten_mau, noi_dung_html, la_mac_dinh, trang_thai } = req.body;
    let template = await MauIn.findOne({ where: { loai } });

    if (template) {
      await template.update({ ten_mau, noi_dung_html, la_mac_dinh, trang_thai });
      res.json({ message: "Cập nhật mẫu in thành công", data: template });
    } else {
      template = await MauIn.create({ loai, ten_mau, noi_dung_html, la_mac_dinh, trang_thai });
      res.status(201).json({ message: "Tạo mẫu in thành công", data: template });
    }
  } catch (error) {
    console.error("Lỗi khi lưu mẫu in:", error);
    res.status(500).json({ message: "Lỗi khi lưu mẫu in", error: error.message });
  }
};

// Xóa mẫu in
exports.deleteTemplate = async (req, res) => {
  try {
    const result = await MauIn.destroy({ where: { id: req.params.id } });
    if (result === 0) return res.status(404).json({ message: "Không tìm thấy mẫu in để xóa" });
    res.json({ message: "Đã xóa mẫu in thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa mẫu in" });
  }
};

// Khởi tạo các mẫu in mặc định nếu chưa có
exports.initDefaultTemplates = async (req, res) => {
  try {
    const defaults = [
      { loai: "ORDER_INVOICE", ten_mau: "Hóa đơn bán hàng" },
      { loai: "IMPORT_RECEIPT", ten_mau: "Phiếu nhập hàng" },
      { loai: "CHECK_REPORT", ten_mau: "Phiếu kiểm kho" },
    ];

    for (const d of defaults) {
      const exists = await MauIn.findOne({ where: { loai: d.loai } });
      if (!exists) {
        await MauIn.create({
          ...d,
          noi_dung_html: "{}",
          la_mac_dinh: true,
          trang_thai: "active"
        });
      }
    }

    res.json({ message: "Đã khởi tạo các mẫu mặc định" });
  } catch (error) {
    console.error("Lỗi khởi tạo mẫu in:", error);
    res.status(500).json({ message: "Lỗi khởi tạo mẫu in", error: error.message });
  }
};
