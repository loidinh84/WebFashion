const Banner = require("../models/Banner");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Lấy banner active
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();

    const banners = await Banner.findAll({
      where: {
        trang_thai: "active",
        vi_tri: req.query.vi_tri || "main_slider",
        [Op.and]: [
          {
            [Op.or]: [
              { ngay_bat_dau: null },
              { ngay_bat_dau: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { ngay_ket_thuc: null },
              { ngay_ket_thuc: { [Op.gte]: now } },
            ],
          },
        ],
      },
      order: [["thu_tu", "ASC"]],
    });

    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách banner" });
  }
};

// Lấy banner Admin
exports.getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [
        ["vi_tri", "ASC"],
        ["thu_tu", "ASC"],
      ],
    });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách banner" });
  }
};

// API CHO ADMIN: THÊM BANNER MỚI
exports.createBanner = async (req, res) => {
  try {
    const {
      tieu_de,
      duong_dan,
      vi_tri,
      thu_tu,
      ngay_bat_dau,
      ngay_ket_thuc,
      trang_thai,
    } = req.body;
    let hinh_anh_url = null;

    if (req.file) {
      hinh_anh_url = `/uploads/${req.file.filename}`;
    }

    const newBanner = await Banner.create({
      tieu_de,
      hinh_anh_url,
      duong_dan,
      vi_tri: vi_tri || "homepage",
      thu_tu: thu_tu || 0,
      ngay_bat_dau: ngay_bat_dau || null,
      ngay_ket_thuc: ngay_ket_thuc || null,
      trang_thai: trang_thai || "active",
    });

    res.status(201).json({ message: "Tạo banner thành công", data: newBanner });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo banner" });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { tieu_de, duong_dan, thu_tu, vi_tri } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    banner.tieu_de = tieu_de;
    banner.duong_dan = duong_dan;
    banner.thu_tu = thu_tu || banner.thu_tu;
    banner.vi_tri = vi_tri || banner.vi_tri;

    if (req.file) {
      banner.hinh_anh_url = `/uploads/${req.file.filename}`;
    }
    await banner.save();

    res
      .status(200)
      .json({ message: "Cập nhật banner thành công", data: banner });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật banner" });
  }
};

// ĐỔI TRẠNG THÁI
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner)
      return res.status(404).json({ message: "Không tìm thấy banner" });

    banner.trang_thai = banner.trang_thai === "active" ? "inactive" : "active";
    await banner.save();

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      trang_thai: banner.trang_thai,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
  }
};

// XÓA BANNER
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner)
      return res.status(404).json({ message: "Không tìm thấy banner" });
    const filePath = path.join(__dirname, "../", banner.hinh_anh_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await banner.destroy();
    res.status(200).json({ message: "Đã xóa banner" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa banner" });
  }
};
