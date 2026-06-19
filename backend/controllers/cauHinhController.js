const { CauHinhTrangChu, DanhMuc } = require("../models");

exports.getHomeConfiguration = async (req, res) => {
  try {
    const config = await CauHinhTrangChu.findAll({
      where: { trang_thai: "active" },
      order: [["thu_tu", "ASC"]],
    });

    const parsedConfig = config.map(item => {
      const data = item.toJSON();
      if (data.du_lieu_json) {
        try {
          data.du_lieu_json = JSON.parse(data.du_lieu_json);
        } catch (e) {
          data.du_lieu_json = [];
        }
      }
      return data;
    });

    res.status(200).json(parsedConfig);
  } catch (error) {
    console.error("Lỗi lấy cấu hình trang chủ:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

exports.updateHomeConfiguration = async (req, res) => {
  try {
    const { sections } = req.body;

    await CauHinhTrangChu.destroy({ where: {} });
    
    if (sections && sections.length > 0) {
        const data = sections.map((s, index) => ({
            ten_phan: s.ten_phan,
            ten_tab_1: s.ten_tab_1 || null,
            danh_muc_id_1: s.danh_muc_id_1,
            ten_tab_2: s.ten_tab_2 || null,
            danh_muc_id_2: s.danh_muc_id_2,
            loai_hien_thi: s.loai_hien_thi || "ProductSection",
            du_lieu_json: s.du_lieu_json ? JSON.stringify(s.du_lieu_json) : null,
            thu_tu: index + 1,
            trang_thai: "active"
        }));
        await CauHinhTrangChu.bulkCreate(data);
    }

    res.status(200).json({ message: "Cập nhật cấu hình thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật cấu hình:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
