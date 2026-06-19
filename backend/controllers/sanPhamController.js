const { Op } = require("sequelize");
const SanPham = require("../models/SanPham");
const BienTheSanPham = require("../models/BienTheSanPham");
const ThuocTinhSanPham = require("../models/ThuocTinhSanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const DanhGiaSanPham = require("../models/DanhGiaSanPham");
const DanhMuc = require("../models/DanhMuc");
const NhaCungCap = require("../models/NhaCungCap");
const TaiKhoan = require("../models/TaiKhoan");
const DonHang = require("../models/DonHang");
const ChiTietDonHang = require("../models/ChiTietDonHang");
const ThichDanhGia = require("../models/ThichDanhGia");
const sequelize = require("../config/db");
const { searchSanPham } = require("../services/searchService");

const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// Hàm đảm bảo Slug duy nhất
const createUniqueSlug = async (name, currentId = null) => {
  let slug = generateSlug(name);
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const condition = { slug: uniqueSlug };
    if (currentId) {
      condition.id = { [Op.ne]: currentId };
    }

    const existing = await SanPham.findOne({ where: condition });
    if (!existing) break;

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
};

// 1. Lấy danh sách sản phẩm
exports.getAllSanPham = async (req, res) => {
  try {
    const {
      danhMucId,
      thuongHieu,
      ram,
      dung_luong,
      mau_sac,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    let whereCondition = { trang_thai: "active" };

    if (search) {
      const { Op } = require("sequelize");
      const searchResults = await searchSanPham(search, { limit: limitNumber });
      if (
        !searchResults ||
        !searchResults.hits ||
        searchResults.hits.length === 0
      ) {
        return res.status(200).json({
          data: [],
          currentPage: pageNumber,
          totalPages: 0,
          totalItems: 0,
        });
      }

      const matchedIds = searchResults.hits.map((hit) => hit.id);

      let products = await SanPham.findAll({
        where: {
          id: { [Op.in]: matchedIds },
          trang_thai: "active",
        },
        include: [
          {
            model: DanhMuc,
            as: "danh_muc",
            attributes: ["ten_danh_muc", "slug"],
          },
          { model: BienTheSanPham, as: "bien_the" },
          { model: HinhAnhSanPham, as: "hinh_anh" },
        ],
      });
      products = products.sort(
        (a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id),
      );
      return res.status(200).json({
        data: products,
        currentPage: pageNumber,
        totalPages: Math.ceil(
          (searchResults.estimatedTotalHits || matchedIds.length) / limitNumber,
        ),
        totalItems: searchResults.estimatedTotalHits || matchedIds.length,
      });
    }

    if (danhMucId) {
      const danhMucCon = await DanhMuc.findAll({
        where: { danh_muc_cha_id: danhMucId },
        attributes: ["id"],
      });
      const danhMucIds = [Number(danhMucId), ...danhMucCon.map((c) => c.id)];
      whereCondition.danh_muc_id = {
        [Op.in]: danhMucIds,
      };
    }

    if (thuongHieu) {
      whereCondition.thuong_hieu = thuongHieu;
    }

    // Điều kiện lọc biến thể
    let bienTheCondition = {};
    if (ram) bienTheCondition.ram = ram;
    if (dung_luong) bienTheCondition.dung_luong = dung_luong;
    if (mau_sac) bienTheCondition.mau_sac = mau_sac;

    const { sort } = req.query;
    let orderCondition = [["created_at", "DESC"]];
    if (sort === "Giá Thấp - Cao") {
      orderCondition = [
        [{ model: BienTheSanPham, as: "bien_the" }, "gia_ban", "ASC"],
      ];
    } else if (sort === "Giá Cao - Thấp") {
      orderCondition = [
        [{ model: BienTheSanPham, as: "bien_the" }, "gia_ban", "DESC"],
      ];
    } else if (sort === "Bán chạy") {
      orderCondition = [["luot_xem", "DESC"]];
    }

    const isFilteringVariant = Object.keys(bienTheCondition).length > 0;

    const { count, rows } = await SanPham.findAndCountAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            SanPham.sequelize.literal(`(
              SELECT COUNT(*)
              FROM DanhGiaSanPham AS dg
              WHERE dg.san_pham_id = SanPham.id AND dg.trang_thai = 'approved'
            )`),
            "tong_danh_gia",
          ],
          [
            SanPham.sequelize.literal(`(
              SELECT ISNULL(ROUND(AVG(CAST(so_sao AS FLOAT)), 1), 0)
              FROM DanhGiaSanPham AS dg
              WHERE dg.san_pham_id = SanPham.id AND dg.trang_thai = 'approved'
            )`),
            "diem_danh_gia",
          ],
        ],
      },
      include: [
        {
          model: BienTheSanPham,
          as: "bien_the",
          where: isFilteringVariant ? bienTheCondition : undefined,
          required: isFilteringVariant,
        },
        { model: ThuocTinhSanPham, as: "thuoc_tinh" },
        { model: HinhAnhSanPham, as: "hinh_anh" },
      ],
      distinct: true,
      order: orderCondition,
      limit: limitNumber,
      offset: offset,
    });

    res.status(200).json({
      data: rows,
      currentPage: pageNumber,
      totalPages: Math.ceil(count / limitNumber),
      totalItems: count,
    });
  } catch (error) {
    console.error("Lỗi server khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

exports.getAdminSanPham = async (req, res) => {
  try {
    const {
      danhMucId,
      nhaCungCapId,
      noiBat,
      trangThai,
      thuongHieu,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);
    const offset = (pageNumber - 1) * limitNumber;

    let whereCondition = { trang_thai: { [Op.ne]: "deleted" } };
    if (danhMucId) whereCondition.danh_muc_id = danhMucId;
    if (nhaCungCapId) whereCondition.nha_cung_cap_id = nhaCungCapId;
    if (trangThai) whereCondition.trang_thai = trangThai;
    if (noiBat === "true") {
      whereCondition.noi_bat = 1;
    }
    if (search) {
      whereCondition.ten_san_pham = { [Op.like]: `%${search}%` };
    }

    if (danhMucId) {
      whereCondition.danh_muc_id = danhMucId;
    }

    if (thuongHieu) {
      whereCondition.thuong_hieu = thuongHieu;
    }

    const { count, rows } = await SanPham.findAndCountAll({
      where: whereCondition,
      include: [
        { model: DanhMuc, as: "danh_muc", attributes: ["id", "ten_danh_muc"] },
        {
          model: NhaCungCap,
          as: "nha_cung_cap",
          attributes: ["id", "ten_nha_cc"],
        },
        { model: BienTheSanPham, as: "bien_the" },
        { model: ThuocTinhSanPham, as: "thuoc_tinh" },
        { model: HinhAnhSanPham, as: "hinh_anh" },
      ],
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: limitNumber,
      offset: offset,
    });

    const totalPages = Math.ceil(count / limitNumber);

    res.status(200).json({
      data: rows,
      currentPage: pageNumber,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    console.error("Lỗi server khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

exports.getAllDanhMuc = async (req, res) => {
  try {
    const list = await DanhMuc.findAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Lỗi!" });
  }
};

// Lấy thông tin chi tiết 1 sản phẩm
exports.getSanPhamById = async (req, res) => {
  try {
    const { id } = req.params;

    const sanPham = await SanPham.findByPk(id, {
      include: [
        { model: DanhMuc, as: "danh_muc", attributes: ["id", "ten_danh_muc", "slug"] },
        { model: BienTheSanPham, as: "bien_the" },
        { model: ThuocTinhSanPham, as: "thuoc_tinh" },
        { model: HinhAnhSanPham, as: "hinh_anh" },
      ],
    });

    if (!sanPham) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
    res.status(200).json(sanPham);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết sản phẩm!" });
  }
};

exports.getSanPhamBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const sanPham = await SanPham.findOne({
      where: { slug: slug },
      include: [
        { model: DanhMuc, as: "danh_muc", attributes: ["id", "ten_danh_muc", "slug", "danh_muc_cha_id"] },
        { model: BienTheSanPham, as: "bien_the" },
        { model: ThuocTinhSanPham, as: "thuoc_tinh" },
        { model: HinhAnhSanPham, as: "hinh_anh" },
      ],
    });

    if (!sanPham) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
    res.status(200).json(sanPham);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết sản phẩm!" });
  }
};

// Tăng lượt xem
exports.incrementLuotXem = async (req, res) => {
  try {
    const { id } = req.params;
    await SanPham.increment("luot_xem", { by: 1, where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 2. Thêm một sản phẩm mới
exports.createSanPham = async (req, res) => {
  const t = await require("../config/db").transaction();

  try {
    const {
      ten_san_pham,
      danh_muc_id,
      nha_cung_cap_id,
      mo_ta_ngan,
      mo_ta_day_du,
      thuong_hieu,
      trang_thai,
      noi_bat,
      can_nang,
      chieu_dai,
      chieu_rong,
      chieu_cao,
      meta_title,
      meta_description,
    } = req.body;

    let bien_the = [];
    let thuoc_tinh = [];

    if (req.body.bien_the) {
      try {
        bien_the = JSON.parse(req.body.bien_the);
      } catch (e) {
        console.error("Lỗi parse bien_the", e);
      }
    }
    if (req.body.thuoc_tinh) {
      try {
        thuoc_tinh = JSON.parse(req.body.thuoc_tinh);
      } catch (e) {
        console.error("Lỗi parse thuoc_tinh", e);
      }
    }

    if (!ten_san_pham) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Tên sản phẩm không được để trống!" });
    }

    const slug = await createUniqueSlug(ten_san_pham);

    // 3. Lưu thông tin chung vào CSDL
    const sanPhamMoi = await SanPham.create(
      {
        ten_san_pham,
        slug,
        danh_muc_id: danh_muc_id ? Number(danh_muc_id) : null,
        nha_cung_cap_id: nha_cung_cap_id ? Number(nha_cung_cap_id) : null,
        mo_ta_ngan,
        mo_ta_day_du,
        thuong_hieu,
        trang_thai: trang_thai || "active",
        noi_bat: noi_bat === "true" || noi_bat === true,
        luot_xem: 0,
        can_nang: can_nang ? Number(can_nang) : null,
        chieu_dai: chieu_dai ? Number(chieu_dai) : null,
        chieu_rong: chieu_rong ? Number(chieu_rong) : null,
        chieu_cao: chieu_cao ? Number(chieu_cao) : null,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
      },
      { transaction: t },
    );

    const newProductId = sanPhamMoi.id;

    // 4. Lưu mảng Biến thể vào CSDL
    if (bien_the && bien_the.length > 0) {
      const dataBienThe = bien_the.map((bt) => ({
        ...bt,
        san_pham_id: newProductId,
        gia_goc: Number(bt.gia_goc) || 0,
        gia_ban: Number(bt.gia_ban) || 0,
        ton_kho: Number(bt.ton_kho) || 0,
      }));
      await BienTheSanPham.bulkCreate(dataBienThe, { transaction: t });
    }

    // 5. Lưu mảng Thuộc tính vào CSDL
    if (thuoc_tinh && thuoc_tinh.length > 0) {
      const dataThuocTinh = thuoc_tinh.map((tt) => ({
        ...tt,
        san_pham_id: newProductId,
        thu_tu: Number(tt.thu_tu) || 1,
      }));
      await ThuocTinhSanPham.bulkCreate(dataThuocTinh, { transaction: t });
    }

    // 6. XỬ LÝ LƯU HÌNH ẢNH
    if (req.files && req.files.length > 0) {
      const dataHinhAnh = req.files.map((file, index) => ({
        san_pham_id: newProductId,
        url_anh: `/uploads/${file.filename}`,
        alt_text: ten_san_pham,
        la_anh_chinh: index === 0,
      }));
      await HinhAnhSanPham.bulkCreate(dataHinhAnh, { transaction: t });
    } else if (req.body.hinh_anh) {
      try {
        let hinh_anh_arr = JSON.parse(req.body.hinh_anh);
        if (hinh_anh_arr && hinh_anh_arr.length > 0) {
          const dataHinhAnh = hinh_anh_arr.map((ha, index) => ({
            san_pham_id: newProductId,
            url_anh: ha.url_anh,
            alt_text: ha.alt_text || ten_san_pham,
            la_anh_chinh:
              ha.la_anh_chinh !== undefined ? ha.la_anh_chinh : index === 0,
          }));
          await HinhAnhSanPham.bulkCreate(dataHinhAnh, { transaction: t });
        }
      } catch (e) {
        console.error("Lỗi parse hinh_anh", e);
      }
    }

    await t.commit();

    res.status(201).json({
      message: "Thêm sản phẩm và chi tiết thành công!",
      data: sanPhamMoi,
    });
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi thêm sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm!" });
  }
};

exports.toggleTrangThai = async (req, res) => {
  try {
    const { id } = req.params;

    const sanPham = await SanPham.findByPk(id);
    if (!sanPham) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }

    const newStatus = sanPham.trang_thai === "active" ? "inactive" : "active";
    await sanPham.update({ trang_thai: newStatus });

    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      trang_thai: newStatus,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái!" });
  }
};

exports.deleteSanPham = async (req, res) => {
  try {
    const { id } = req.params;
    const sanPham = await SanPham.findByPk(id);
    if (!sanPham || sanPham.trang_thai === "deleted") {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }

    // Kiểm tra chủ động: tìm đơn hàng chưa hoàn tất có chứa biến thể của sản phẩm này
    const donHangDangXuLy = await ChiTietDonHang.findAll({
      include: [
        {
          model: BienTheSanPham,
          as: "bien_the",
          where: { san_pham_id: id },
          required: true,
        },
        {
          model: DonHang,
          as: "don_hang",
          where: {
            trang_thai: { [Op.in]: ["pending", "confirmed", "processing", "shipping"] },
          },
          required: true,
          attributes: ["id", "ma_don_hang", "trang_thai"],
        },
      ],
    });

    if (donHangDangXuLy.length > 0) {
      // Lấy danh sách mã đơn hàng duy nhất
      const maDonHangs = [...new Set(
        donHangDangXuLy.map((ct) => ct.don_hang?.ma_don_hang).filter(Boolean)
      )];
      return res.status(409).json({
        message: `Không thể xóa! Sản phẩm "${sanPham.ten_san_pham}" đang có trong ${donHangDangXuLy.length} đơn hàng chưa hoàn tất.`,
        so_don_hang: donHangDangXuLy.length,
        ma_don_hangs: maDonHangs.slice(0, 5),
        ten_san_pham: sanPham.ten_san_pham,
        san_pham_id: id,
        trang_thai_hien_tai: sanPham.trang_thai,
      });
    }

    // Không có đơn hàng đang xử lý → soft delete
    sanPham.trang_thai = "deleted";
    await sanPham.save();
    res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm." });
  }
};

// API cập nhật sản phẩm
exports.updateSanPham = async (req, res) => {
  const t = await require("../config/db").transaction();

  try {
    const { id } = req.params;
    const {
      ten_san_pham,
      thuong_hieu,
      danh_muc_id,
      nha_cung_cap_id,
      mo_ta_ngan,
      mo_ta_day_du,
      trang_thai,
      noi_bat,
    } = req.body;

    let bien_the = [];
    let thuoc_tinh = [];
    let hinh_anh_giu_lai = [];

    if (req.body.bien_the) {
      try {
        bien_the = JSON.parse(req.body.bien_the);
      } catch (e) {}
    }
    if (req.body.thuoc_tinh) {
      try {
        thuoc_tinh = JSON.parse(req.body.thuoc_tinh);
      } catch (e) {}
    }
    if (req.body.hinh_anh) {
      try {
        hinh_anh_giu_lai = JSON.parse(req.body.hinh_anh);
      } catch (e) {}
    }

    const sanPham = await SanPham.findByPk(id);
    if (!sanPham) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }

    const updateData = {
      ten_san_pham,
      thuong_hieu,
      danh_muc_id: danh_muc_id ? Number(danh_muc_id) : sanPham.danh_muc_id,
      nha_cung_cap_id: nha_cung_cap_id
        ? Number(nha_cung_cap_id)
        : sanPham.nha_cung_cap_id,
      mo_ta_ngan,
      mo_ta_day_du,
      trang_thai,
      noi_bat: noi_bat === "true" || noi_bat === true,
    };

    // Chỉ cập nhật slug nếu tên sản phẩm thay đổi hoặc cần đảm bảo duy nhất
    if (ten_san_pham && ten_san_pham !== sanPham.ten_san_pham) {
      updateData.slug = await createUniqueSlug(ten_san_pham, id);
    }

    await sanPham.update(updateData, { transaction: t });

    if (bien_the && bien_the.length > 0) {
      for (const bt of bien_the) {
        if (bt.id) {
          const { id: variantId, san_pham_id, ...updateData } = bt;
          await BienTheSanPham.update(
            {
              ...updateData,
              gia_goc: Number(bt.gia_goc) || 0,
              gia_ban: Number(bt.gia_ban) || 0,
              ton_kho: Number(bt.ton_kho) || 0,
            },
            { where: { id: bt.id, san_pham_id: id }, transaction: t },
          );
        } else {
          await BienTheSanPham.create(
            {
              ...bt,
              san_pham_id: id,
              gia_goc: Number(bt.gia_goc) || 0,
              gia_ban: Number(bt.gia_ban) || 0,
              ton_kho: Number(bt.ton_kho) || 0,
            },
            { transaction: t },
          );
        }
      }
    }

    await ThuocTinhSanPham.destroy({
      where: { san_pham_id: id },
      transaction: t,
    });

    if (thuoc_tinh && thuoc_tinh.length > 0) {
      const newThuocTinh = thuoc_tinh.map((tt) => {
        const { id: attrId, ...rest } = tt;
        return {
          ...rest,
          san_pham_id: id,
          thu_tu: Number(tt.thu_tu) || 1,
        };
      });
      await ThuocTinhSanPham.bulkCreate(newThuocTinh, { transaction: t });
    }

    await HinhAnhSanPham.destroy({
      where: { san_pham_id: id },
      transaction: t,
    });

    let tatCaAnh = [];

    if (hinh_anh_giu_lai && hinh_anh_giu_lai.length > 0) {
      hinh_anh_giu_lai.forEach((ha) => {
        tatCaAnh.push({
          san_pham_id: id,
          url_anh: ha.url_anh,
          alt_text: ha.alt_text || ten_san_pham,
          la_anh_chinh: ha.la_anh_chinh || false,
        });
      });
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        tatCaAnh.push({
          san_pham_id: id,
          url_anh: `/uploads/${file.filename}`,
          alt_text: ten_san_pham,
          la_anh_chinh: false,
        });
      });
    }

    if (tatCaAnh.length > 0 && !tatCaAnh.some((a) => a.la_anh_chinh)) {
      tatCaAnh[0].la_anh_chinh = true;
    }

    if (tatCaAnh.length > 0) {
      await HinhAnhSanPham.bulkCreate(tatCaAnh, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ message: "Cập nhật sản phẩm thành công!" });
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm!" });
  }
};

exports.getSanPhamTuongTu = async (req, res) => {
  try {
    const { id } = req.params;
    const sanPhamHienTai = await SanPham.findByPk(id);

    if (!sanPhamHienTai)
      return res.status(404).json({ message: "Không tìm thấy" });

    const sanPhamTuongTu = await SanPham.findAll({
      where: {
        danh_muc_id: sanPhamHienTai.danh_muc_id,
        id: { [Op.ne]: id },
        trang_thai: "active",
      },
      include: [
        { model: BienTheSanPham, as: "bien_the" },
        { model: HinhAnhSanPham, as: "hinh_anh" },
        { model: DanhGiaSanPham, as: "danh_gia", attributes: ["so_sao"] },
      ],
      limit: 8,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(sanPhamTuongTu);
  } catch (error) {
    console.error("Lỗi lấy SP tương tự:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

exports.getDanhGiaBySanPham = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const isAdmin = req.user?.vai_tro === "admin";
    const whereCondition = isAdmin
      ? { san_pham_id: id }
      : { san_pham_id: id, trang_thai: "approved" };

    const danhGia = await DanhGiaSanPham.findAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM ThichDanhGia 
              WHERE ThichDanhGia.danh_gia_id = DanhGiaSanPham.id AND ThichDanhGia.loai = 'like'
            )`),
            "total_likes",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM ThichDanhGia 
              WHERE ThichDanhGia.danh_gia_id = DanhGiaSanPham.id AND ThichDanhGia.loai = 'dislike'
            )`),
            "total_dislikes",
          ],
          [
            userId
              ? sequelize.literal(`(
                  SELECT loai FROM ThichDanhGia 
                  WHERE ThichDanhGia.danh_gia_id = DanhGiaSanPham.id AND ThichDanhGia.tai_khoan_id = ${userId}
                )`)
              : sequelize.literal("NULL"),
            "user_interaction",
          ],
        ],
      },
      include: [
        {
          model: TaiKhoan,
          as: "nguoi_dung",
          attributes: ["ho_ten", "anh_dai_dien", "vai_tro"],
        },
        {
          model: DonHang,
          as: "don_hang",
          include: [
            {
              model: ChiTietDonHang,
              as: "chi_tiet",
              include: [
                {
                  model: BienTheSanPham,
                  as: "bien_the",
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(danhGia);
  } catch (error) {
    console.error("Lỗi lấy đánh giá:", error);
    res.status(500).json({ message: "Lỗi lấy đánh giá!" });
  }
};

exports.toggleLikeDanhGia = async (req, res) => {
  try {
    const { danhGiaId } = req.params;
    const { loai } = req.body; // 'like' hoặc 'dislike'
    const tai_khoan_id = req.user.id;

    if (!['like', 'dislike'].includes(loai)) {
      return res.status(400).json({ message: "Loại tương tác không hợp lệ!" });
    }

    const interaction = await ThichDanhGia.findOne({
      where: { danh_gia_id: danhGiaId, tai_khoan_id },
    });

    if (interaction) {
      if (interaction.loai === loai) {
        // Nếu nhấn lại cùng loại -> Xóa (hủy tương tác)
        await interaction.destroy();
        return res.json({ message: "Đã hủy tương tác", action: "removed" });
      } else {
        // Nếu đổi từ like sang dislike hoặc ngược lại -> Cập nhật
        interaction.loai = loai;
        await interaction.save();
        return res.json({ message: "Đã cập nhật tương tác", action: "updated" });
      }
    } else {
      // Nếu chưa có tương tác -> Tạo mới
      await ThichDanhGia.create({
        danh_gia_id: danhGiaId,
        tai_khoan_id,
        loai,
      });
      return res.json({ message: "Đã thêm tương tác", action: "created" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xử lý like/dislike!" });
  }
};

exports.createDanhGia = async (req, res) => {
  try {
    const { id } = req.params;
    const { so_sao, noi_dung, don_hang_id, parent_id } = req.body;
    const tai_khoan_id = req.user.id; // Lấy ID từ token đã xác thực

    const cleanNoiDung = (!noi_dung || noi_dung === "undefined" || noi_dung.trim() === "")
      ? "Sản phẩm rất tốt!"
      : noi_dung;

    const cleanParentId = (parent_id && parent_id !== "undefined")
      ? parseInt(parent_id, 10)
      : null;

    let cleanSoSao = null;
    if (!cleanParentId) {
      cleanSoSao = (so_sao && so_sao !== "undefined") ? parseInt(so_sao, 10) : 5;
    }

    const cleanDonHangId = (don_hang_id && don_hang_id !== "undefined")
      ? parseInt(don_hang_id, 10)
      : null;

    let mangHinhAnh = [];
    if (req.files && req.files.length > 0) {
      mangHinhAnh = req.files.map((file) => file.filename);
    }

    const hinh_anh_string =
      mangHinhAnh.length > 0 ? JSON.stringify(mangHinhAnh) : null;

    const danhGiaMoi = await DanhGiaSanPham.create({
      san_pham_id: id,
      tai_khoan_id: tai_khoan_id,
      so_sao: cleanSoSao,
      noi_dung: cleanNoiDung,
      don_hang_id: cleanDonHangId,
      hinh_anh: hinh_anh_string,
      trang_thai: "approved",
      parent_id: cleanParentId,
    });

    res.status(201).json({ message: "Đánh giá thành công!", data: danhGiaMoi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi thêm đánh giá!" });
  }
};

exports.checkPurchased = async (req, res) => {
  try {
    const { id } = req.params;
    const tai_khoan_id = req.user.id;

    const order = await DonHang.findOne({
      where: {
        tai_khoan_id,
        trang_thai: "delivered",
      },
      include: [
        {
          model: ChiTietDonHang,
          as: "chi_tiet",
          include: [
            {
              model: BienTheSanPham,
              as: "bien_the",
              where: { san_pham_id: id },
            },
          ],
        },
      ],
    });

    res.status(200).json({ isPurchased: !!order });
  } catch (error) {
    console.error("Lỗi checkPurchased:", error);
    res.status(500).json({ isPurchased: false });
  }
};

exports.getThuongHieuByDanhMuc = async (req, res) => {
  try {
    const { danhMucId } = req.params;

    // 1. Tìm tất cả danh mục con
    const danhMucCon = await DanhMuc.findAll({
      where: { danh_muc_cha_id: danhMucId },
      attributes: ["id"],
    });

    // 2. Gom ID cha và ID con
    const danhMucIds = [Number(danhMucId), ...danhMucCon.map((c) => c.id)];

    // 3. Lấy thương hiệu của TẤT CẢ sản phẩm trong mảng ID này
    const list = await SanPham.findAll({
      attributes: [
        [
          SanPham.sequelize.fn(
            "DISTINCT",
            SanPham.sequelize.col("thuong_hieu"),
          ),
          "thuong_hieu",
        ],
      ],
      where: {
        danh_muc_id: {
          [Op.in]: danhMucIds,
        },
        trang_thai: "active",
      },
      raw: true,
    });

    const brands = list
      .map((item) => item.thuong_hieu)
      .filter((b) => b && b.trim() !== "");

    res.status(200).json(brands);
  } catch (error) {
    console.error("Lỗi lấy danh sách thương hiệu:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thương hiệu!" });
  }
};

exports.getBoLocByDanhMuc = async (req, res) => {
  try {
    const { danhMucId } = req.params;

    const danhMucCon = await DanhMuc.findAll({
      where: { danh_muc_cha_id: danhMucId },
      attributes: ["id"],
    });

    const danhMucIds = [Number(danhMucId), ...danhMucCon.map((c) => c.id)];

    const bienThes = await BienTheSanPham.findAll({
      include: [
        {
          model: SanPham,
          as: "san_pham",
          where: { danh_muc_id: { [Op.in]: danhMucIds }, trang_thai: "active" },
          attributes: [],
        },
      ],
      attributes: ["ram", "dung_luong", "mau_sac"],
      raw: true,
    });

    const rams = [
      ...new Set(
        bienThes.map((bt) => bt.ram).filter((v) => v && v.trim() !== ""),
      ),
    ];
    const dung_luongs = [
      ...new Set(
        bienThes.map((bt) => bt.dung_luong).filter((v) => v && v.trim() !== ""),
      ),
    ];

    const mau_sacs = [
      ...new Set(
        bienThes.map((bt) => bt.mau_sac).filter((v) => v && v.trim() !== ""),
      ),
    ];

    res.status(200).json({
      rams: rams.sort(),
      dung_luongs: dung_luongs.sort(),
      mau_sacs: mau_sacs.sort(),
    });
  } catch (error) {
    console.error("Lỗi lấy cấu hình bộ lọc:", error);
    res.status(500).json({ message: "Lỗi server khi lấy bộ lọc!" });
  }
};

exports.deleteDanhGia = async (req, res) => {
  try {
    const { id } = req.params;
    const danhGia = await DanhGiaSanPham.findByPk(id);
    if (!danhGia) return res.status(404).json({ message: "Không tìm thấy!" });

    await danhGia.destroy();
    res.json({ message: "Đã xóa đánh giá thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi xóa đánh giá!" });
  }
};

exports.updateDanhGiaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body; // 'approved', 'rejected', 'pending'

    const danhGia = await DanhGiaSanPham.findByPk(id);
    if (!danhGia) return res.status(404).json({ message: "Không tìm thấy!" });

    danhGia.trang_thai = trang_thai;
    await danhGia.save();

    res.json({ message: "Đã cập nhật trạng thái!", data: danhGia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái!" });
  }
};
