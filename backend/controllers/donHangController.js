const db = require("../config/db");
const { Op } = require("sequelize");
const DonHang = require("../models/DonHang");
const ChiTietDonHang = require("../models/ChiTietDonHang");
const HoaDonDienTu = require("../models/HoaDonDienTu");
const DonViVanChuyen = require("../models/DonViVanChuyen");
const PhuongThucThanhToan = require("../models/PhuongThucThanhToan");
const BienTheSanPham = require("../models/BienTheSanPham");
const SanPham = require("../models/SanPham");
const KhuyenMai = require("../models/KhuyenMai");
const LichSuDungVoucher = require("../models/LichSuDungVoucher");
const TaiKhoan = require("../models/TaiKhoan");
const emailService = require("../services/emailService");
const TheThanhVien = require("../models/TheThanhVien");
const GiaoDichThanhToan = require("../models/GiaoDichThanhToan");
const DiaChiGiaoHang = require("../models/DiaChiGiaoHang");
const ThietLapCuaHang = require("../models/ThietLapCuaHang");
const LichSuGiaoHang = require("../models/LichSuGiaoHang");

exports.createDonHang = async (req, res) => {
  const t = await db.transaction();

  try {
    const {
      tai_khoan_id,
      dia_chi_id,
      don_vi_vc_id,
      tong_tien_hang,
      phi_van_chuyen,
      tien_giam_gia,
      tong_thanh_toan,
      ghi_chu,
      phuong_thuc_tt,
      items,
      voucher_code,
      vat_info,
      receive_email,
      dung_diem,
    } = req.body;

    let voucherData = null;
    // --- KIỂM TRA VOUCHER ---
    if (voucher_code) {
      voucherData = await KhuyenMai.findOne({
        where: { ma_khuyen_mai: voucher_code, trang_thai: "active" },
        transaction: t,
      });
      if (!voucherData)
        throw new Error("Mã giảm giá không tồn tại hoặc đã hết hạn!");

      // 1. Kiểm tra thời gian
      const now = new Date();
      if (now < voucherData.ngay_bat_dau || now > voucherData.ngay_ket_thuc) {
        throw new Error("Mã giảm giá hiện không trong thời gian sử dụng!");
      }

      // 2. Kiểm tra số lượng mã tổng quát
      if (voucherData.da_su_dung >= voucherData.so_luong_ma) {
        throw new Error("Mã giảm giá đã hết lượt sử dụng!");
      }

      // 3.Chặn mỗi người dùng chỉ dùng 1 lần
      const usageCount = await LichSuDungVoucher.count({
        where: { tai_khoan_id, khuyen_mai_id: voucherData.id },
        transaction: t,
      });
      if (usageCount > 0) {
        throw new Error(
          "Bạn đã sử dụng mã giảm giá này cho một đơn hàng trước đó!",
        );
      }
    }

    const config = await ThietLapCuaHang.findOne({
      where: { id: 1 },
      transaction: t,
    });

    const generateOrderCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let storeName =
        config && config.ten_cua_hang ? config.ten_cua_hang : "HD";
      let prefix = storeName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .substring(0, 8);
      let result = `${prefix}-`;
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // 1. Tạo mã đơn hàng tự động
    const maDonHang = generateOrderCode();

    let final_thanh_toan = tong_thanh_toan;
    if (config && config.lam_tron_tien) {
      final_thanh_toan = Math.round(tong_thanh_toan / 1000) * 1000;
    }

    const phuongThucDinhDanh = await PhuongThucThanhToan.findByPk(
      phuong_thuc_tt,
      {
        transaction: t,
      },
    );

    let initialStatus = "pending";

    if (
      config &&
      config.tu_dong_duyet_don &&
      phuongThucDinhDanh &&
      phuongThucDinhDanh.loai === "cod"
    ) {
      initialStatus = "confirmed";
    }

    // Lấy thông tin địa chỉ thật để snapshot
    const thongTinDiaChi = await DiaChiGiaoHang.findByPk(dia_chi_id, {
      transaction: t,
    });

    if (!thongTinDiaChi) {
      throw new Error("Không tìm thấy địa chỉ giao hàng!");
    }

    // 2. Lưu vào bảng DonHang (cùng với snapshot địa chỉ)
    const newOrder = await DonHang.create(
      {
        ma_don_hang: maDonHang,
        tai_khoan_id,
        dia_chi_id,
        don_vi_vc_id,
        tong_tien_hang,
        phi_van_chuyen,
        tong_thanh_toan: final_thanh_toan,
        tien_giam_gia: Math.round(tien_giam_gia || 0),
        trang_thai: initialStatus,
        ghi_chu: ghi_chu || "",
        created_at: new Date(),
        // Các cột snapshot
        ho_ten_nguoi_nhan: thongTinDiaChi.ho_ten_nguoi_nhan,
        so_dien_thoai: thongTinDiaChi.so_dien_thoai,
        dia_chi_cu_the: thongTinDiaChi.dia_chi_cu_the,
        tinh_thanh: thongTinDiaChi.tinh_thanh,
        quan_huyen: thongTinDiaChi.quan_huyen,
        phuong_xa: thongTinDiaChi.phuong_xa,
      },
      { transaction: t },
    );

    const maGiaoDich = `GD-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

    await GiaoDichThanhToan.create(
      {
        don_hang_id: newOrder.id,
        phuong_thuc_id: phuong_thuc_tt,
        ma_giao_dich: maGiaoDich,
        so_tien: final_thanh_toan,
        trang_thai: "pending",
      },
      { transaction: t },
    );

    if (voucherData) {
      await voucherData.update(
        { da_su_dung: voucherData.da_su_dung + 1 },
        { transaction: t },
      );
      await LichSuDungVoucher.create(
        {
          tai_khoan_id,
          khuyen_mai_id: voucherData.id,
          don_hang_id: newOrder.id,
        },
        { transaction: t },
      );
    }

    // 2. Xử lý từng sản phẩm: Kiểm tra kho + Trừ tồn kho
    const orderDetailsData = [];

    for (const item of items) {
      const bienThe = await BienTheSanPham.findByPk(item.variantId, {
        transaction: t,
      });

      if (!bienThe || bienThe.ton_kho < item.so_luong) {
        throw new Error(
          `Sản phẩm ${item.ten_san_pham} đã hết hàng hoặc không đủ số lượng!`,
        );
      }

      const tonKhoCu = bienThe.ton_kho;
      const tonKhoMoi = tonKhoCu - item.so_luong;

      // Trừ kho
      await bienThe.update({ ton_kho: tonKhoMoi }, { transaction: t });

      if (config && config.nguong_bao_het_hang) {
        if (
          tonKhoCu > config.nguong_bao_het_hang &&
          tonKhoMoi <= config.nguong_bao_het_hang
        ) {
          emailService
            .sendLowStockAlert({
              productName: item.ten_san_pham,
              variantName:
                `${item.dung_luong || ""} ${item.mau_sac || ""}`.trim(),
              remaining: tonKhoMoi,
              threshold: config.nguong_bao_het_hang,
            })
            .catch((err) => console.log("Lỗi gửi mail báo hết hàng:", err));
        }
      }

      // Đẩy dữ liệu vào mảng để dùng bulkCreate
      orderDetailsData.push({
        don_hang_id: newOrder.id,
        bien_the_id: item.variantId,
        ten_sp_luc_mua: item.ten_san_pham,
        sku_luc_mua: item.sku || `SKU-${item.variantId}`,
        so_luong: item.so_luong,
        don_gia: item.gia_ban,
        thanh_tien: item.gia_ban * item.so_luong,
      });
    }

    // 3. Lưu toàn bộ chi tiết đơn hàng
    await ChiTietDonHang.bulkCreate(orderDetailsData, { transaction: t });

    // 4. Nếu khách yêu cầu VAT, lưu vào bảng HoaDonDienTu
    if (vat_info && vat_info.ten_cong_ty) {
      await HoaDonDienTu.create(
        {
          don_hang_id: newOrder.id,
          ten_nguoi_mua: vat_info.ten_cong_ty,
          ma_so_thue: vat_info.mst,
          dia_chi_nguoi_mua: vat_info.dia_chi_cty,
          tong_tien_chua_vat: tong_tien_hang,
          tien_vat: tong_tien_hang * 0.1,
          tong_tien_vat: tong_tien_hang * 1.1,
          ngay_xuat: new Date(),
        },
        { transaction: t },
      );
    }

    if (dung_diem && dung_diem > 0) {
      const userToUpdate = await TaiKhoan.findByPk(tai_khoan_id, {
        transaction: t,
      });
      if (userToUpdate.diem_tich_luy < dung_diem) {
        throw new Error("Số dư điểm tích lũy không đủ!");
      }
      await userToUpdate.update(
        {
          diem_tich_luy: userToUpdate.diem_tich_luy - dung_diem,
        },
        { transaction: t },
      );
    }

    await t.commit();

    // Tự động tạo log lịch sử đầu tiên
    await LichSuGiaoHang.create({
      don_hang_id: newOrder.id,
      tieu_de: "Đơn Hàng Đã Đặt",
      mo_ta: "Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được ghi nhận.",
      thoi_gian: new Date(),
    });
    if (initialStatus === "confirmed") {
      await LichSuGiaoHang.create({
        don_hang_id: newOrder.id,
        tieu_de: "Đã Xác Nhận Đơn Hàng",
        mo_ta: "Đơn hàng được tự động xác nhận, đang chuẩn bị hàng.",
        thoi_gian: new Date(),
      });
    }

    const taiKhoan = await TaiKhoan.findByPk(tai_khoan_id);

    try {
      const tongChiTieuMoi =
        Number(taiKhoan.tong_chi_tieu || 0) + Number(final_thanh_toan);

      const hangMoi = await TheThanhVien.findOne({
        where: { muc_chi_tieu_tu: { [Op.lte]: tongChiTieuMoi } },
        order: [["muc_chi_tieu_tu", "DESC"]],
      });

      await taiKhoan.update({
        tong_chi_tieu: tongChiTieuMoi,
        the_thanh_vien_id: hangMoi ? hangMoi.id : taiKhoan.the_thanh_vien_id,
      });
    } catch (err) {
      console.log("Lỗi cập nhật thẻ thành viên:", err);
    }

    if (config && config.gui_email_tu_dong) {
      const currencyFormatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      });

      const addressText = ghi_chu.includes("Địa chỉ:")
        ? ghi_chu
        : "Xem trong lịch sử đơn hàng";

      const orderInfoForEmail = {
        customerName: taiKhoan?.ho_ten || "Khách hàng",
        maDonHang: maDonHang,
        total: currencyFormatter.format(final_thanh_toan),
        paymentMethod:
          phuongThucDinhDanh.loai === "cod" ? "Tiền mặt (COD)" : "Chuyển khoản",
        address: addressText,
      };

      if (taiKhoan && taiKhoan.email) {
        emailService
          .sendOrderConfirmation(taiKhoan.email, orderInfoForEmail)
          .catch((err) => console.log("Lỗi gửi mail cho khách:", err));
      }

      emailService
        .sendNewOrderNotification(orderInfoForEmail)
        .catch((err) => console.log("Lỗi gửi mail cho admin:", err));
    }

    res.status(201).json({
      message: "Đặt hàng thành công!",
      maDonHang: maDonHang,
    });
  } catch (error) {
    await t.rollback();
    res
      .status(400)
      .json({ message: error.message || "Lỗi hệ thống khi tạo đơn hàng!" });
  }
};

exports.checkVoucher = async (req, res) => {
  try {
    const { code, userId, totalAmount } = req.body;

    const voucher = await KhuyenMai.findOne({
      where: { ma_khuyen_mai: code, trang_thai: "active" },
    });

    if (!voucher)
      return res.status(404).json({ message: "Mã giảm giá không tồn tại!" });

    // 1. Kiểm tra thời gian
    const now = new Date();
    if (now < voucher.ngay_bat_dau || now > voucher.ngay_ket_thuc) {
      return res.status(400).json({
        message: "Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng!",
      });
    }

    // 2. Kiểm tra số lượng tổng
    if (voucher.da_su_dung >= voucher.so_luong_ma) {
      return res
        .status(400)
        .json({ message: "Mã giảm giá đã hết lượt sử dụng!" });
    }

    // 3. Kiểm tra đơn hàng tối thiểu
    if (totalAmount < voucher.don_hang_toi_thieu) {
      return res.status(400).json({
        message: `Đơn hàng tối thiểu phải từ ${voucher.don_hang_toi_thieu}đ để dùng mã này!`,
      });
    }

    // 4. KIỂM TRA DÙNG 1 LẦN
    const used = await LichSuDungVoucher.findOne({
      where: { tai_khoan_id: userId, khuyen_mai_id: voucher.id },
    });
    if (used) {
      return res.status(400).json({ message: "Bạn đã sử dụng mã này rồi!" });
    }

    res.json({
      message: "Áp dụng mã thành công!",
      discount: {
        id: voucher.id,
        loai: voucher.loai,
        gia_tri: voucher.gia_tri,
        gia_tri_toi_da: voucher.gia_tri_toi_da,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra voucher!" });
  }
};

// Admin
exports.getAdminOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      fromDate,
      toDate,
    } = req.query;

    const whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { ma_don_hang: { [Op.like]: `%${search}%` } },
        { "$dia_chi.ho_ten_nguoi_nhan$": { [Op.like]: `%${search}%` } },
        { "$dia_chi.so_dien_thoai$": { [Op.like]: `%${search}%` } },
      ];
    }

    if (status && status !== "all") {
      whereCondition.trang_thai = status;
    }

    if (fromDate || toDate) {
      whereCondition.created_at = {};
      if (fromDate) whereCondition.created_at[Op.gte] = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereCondition.created_at[Op.lte] = endDate;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await DonHang.findAndCountAll({
      where: whereCondition,
      include: [
        { model: DiaChiGiaoHang, as: "dia_chi" },
        { model: ChiTietDonHang, as: "chi_tiet" },
        {
          model: GiaoDichThanhToan,
          as: "giao_dich",
          include: [{ model: PhuongThucThanhToan, as: "phuong_thuc" }],
        },
        {
          model: TaiKhoan,
          as: "nguoi_mua",
        },
        {
          model: LichSuGiaoHang,
          as: "lich_su_giao_hang",
          attributes: ["id", "tieu_de", "mo_ta", "thoi_gian"],
          required: false,
          separate: true,
          order: [["thoi_gian", "DESC"]],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
      subQuery: false,
    });

    // Format dữ liệu
    const formattedOrders = orders.map((order) => {
      const diaChi = order.dia_chi || {};
      const nguoiMua = order.nguoi_mua || {};
      const hoTen = order.ho_ten_nguoi_nhan || diaChi.ho_ten_nguoi_nhan || nguoiMua.ho_ten || "Khách vãng lai";
      const sdt = order.so_dien_thoai || diaChi.so_dien_thoai || nguoiMua.so_dien_thoai || "Chưa cập nhật";
      const diachiCuthe = order.dia_chi_cu_the || diaChi.dia_chi_cu_the;
      const phuongXa = order.phuong_xa || diaChi.phuong_xa;
      const quanHuyen = order.quan_huyen || diaChi.quan_huyen;
      const tinhThanh = order.tinh_thanh || diaChi.tinh_thanh;

      const rawGD = order.giao_dich;
      const giaoDich = Array.isArray(rawGD) ? (rawGD[0] || {}) : (rawGD || {});
      const phuongThuc = giaoDich.phuong_thuc || {};

      // Xử lý ngày tháng thành chuỗi dd/mm/yyyy HH:MM
      const d = new Date(order.created_at);
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

      // Xử lý chuỗi địa chỉ
      const fullAddress = [diachiCuthe, phuongXa, quanHuyen, tinhThanh]
        .filter(Boolean)
        .join(", ");

      return {
        id: order.ma_don_hang,
        customerName: hoTen || "Khách vãng lai",
        phone: sdt || "Chưa cập nhật",
        address: fullAddress || "Chưa cập nhật",
        date: dateStr,
        total: order.tong_thanh_toan,
        shippingFee: order.phi_van_chuyen,
        discount: order.tien_giam_gia,
        voucherCode: order.voucher_code,
        subTotal: order.tong_tien_hang,
        note: order.ghi_chu,
        paymentMethod: phuongThuc.ten_phuong_thuc || "COD",
        paymentStatus:
          giaoDich.trang_thai === "success" ||
            ["delivered", "completed"].includes(order.trang_thai)
            ? "Đã thanh toán"
            : "Chưa thanh toán",
        orderStatus: order.trang_thai,
        lichSu: (order.lich_su_giao_hang || [])
          .sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian))
          .map((ls) => {
            const t = new Date(ls.thoi_gian);
            return {
              id: ls.id,
              tieuDe: ls.tieu_de,
              moTa: ls.mo_ta,
              thoiGian: `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}/${t.getFullYear()} ${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`,
            };
          }),
        items: order.chi_tiet.map((item) => ({
          name: item.ten_sp_luc_mua,
          variant: item.sku_luc_mua,
          qty: item.so_luong,
          price: item.don_gia,
        })),
      };
    });

    res.status(200).json({
      orders: formattedOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalItems: count,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đơn hàng" });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;

    // Tìm đơn hàng trong DB
    const donHang = await DonHang.findOne({ where: { ma_don_hang: id } });

    if (!donHang) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng này!" });
    }

    // Không cho phép đổi trạng thái nếu đơn đã Hủy hoặc Hoàn thành
    if (
      donHang.trang_thai === "cancelled" ||
      donHang.trang_thai === "delivered"
    ) {
      return res
        .status(400)
        .json({ message: "Đơn hàng đã đóng, không thể thay đổi trạng thái!" });
    }

    if (trang_thai === "cancelled") {
      if (donHang.trang_thai === "shipping") {
        return res.status(400).json({
          message: "Đơn hàng đã được giao cho Shipper, không thể hủy!",
        });
      }
    }

    donHang.trang_thai = trang_thai;
    donHang.update_at = new Date();
    await donHang.save();

    // Cập nhật trạng thái giao dịch thanh toán thành công nếu admin duyệt nhận tiền chuyển khoản hoặc đơn đã giao thành công
    if (trang_thai === "confirmed" || trang_thai === "delivered") {
      const giaoDich = await GiaoDichThanhToan.findOne({
        where: { don_hang_id: donHang.id },
      });
      if (giaoDich) {
        giaoDich.trang_thai = "success";
        await giaoDich.save();
      }
    }

    // Tự động tạo log lịch sử giao hàng
    const statusLogs = {
      confirmed: {
        tieu_de: "Đã Xác Nhận Đơn Hàng",
        mo_ta: "Người bán đã xác nhận và đang chuẩn bị hàng",
      },
      shipping: {
        tieu_de: "Đã Giao Cho ĐVVC",
        mo_ta: "Đơn hàng đã được bàn giao cho đơn vị vận chuyển",
      },
      delivered: {
        tieu_de: "Giao Hàng Thành Công",
        mo_ta: "Khách hàng đã nhận được hàng",
      },
      cancelled: { tieu_de: "Đơn Hàng Đã Hủy", mo_ta: "Đơn hàng đã bị hủy" },
      refunded: {
        tieu_de: "Hoàn Tiền Đã Xử Lý",
        mo_ta: "Tiền đã được hoàn lại cho khách hàng",
      },
    };
    if (statusLogs[trang_thai]) {
      await LichSuGiaoHang.create({
        don_hang_id: donHang.id,
        ...statusLogs[trang_thai],
        thoi_gian: new Date(),
      });
    }

    if (trang_thai === "delivered") {
      const orderInfo = await DonHang.findByPk(donHang.id, {
        include: [
          {
            model: TaiKhoan,
            as: "nguoi_mua",
            include: [{ model: TheThanhVien, as: "hang_thanh_vien" }],
          },
        ],
      });

      if (orderInfo && orderInfo.nguoi_mua) {
        // Công thức: 1000đ = 1 điểm. Cộng thêm % thưởng từ hạng thẻ
        const basePoints = Math.floor(orderInfo.tong_thanh_toan / 1000);
        const bonusRate =
          orderInfo.nguoi_mua.hang_thanh_vien?.diem_thuong_them || 0;
        const totalBonusPoints = Math.round(basePoints * (1 + bonusRate / 100));

        await orderInfo.nguoi_mua.update({
          diem_tich_luy:
            (orderInfo.nguoi_mua.diem_tich_luy || 0) + totalBonusPoints,
        });

        console.log(
          `Đã cộng ${totalBonusPoints} điểm cho khách hàng ${orderInfo.nguoi_mua.id}`,
        );
      }

      // Tăng lượt mua cho từng sản phẩm trong đơn hàng
      try {
        const chiTietDonHang = await ChiTietDonHang.findAll({
          where: { don_hang_id: donHang.id },
          include: [{
            model: BienTheSanPham,
            as: "bien_the",
            attributes: ["san_pham_id"],
          }],
        });

        // Gom số lượng theo san_pham_id
        const luotMuaMap = {};
        for (const ct of chiTietDonHang) {
          const sanPhamId = ct.bien_the?.san_pham_id;
          if (sanPhamId) {
            luotMuaMap[sanPhamId] = (luotMuaMap[sanPhamId] || 0) + ct.so_luong;
          }
        }

        // Cập nhật luot_mua cho từng sản phẩm
        for (const [sanPhamId, soLuong] of Object.entries(luotMuaMap)) {
          await SanPham.increment("luot_mua", {
            by: soLuong,
            where: { id: sanPhamId },
          });
        }
      } catch (err) {
        console.error("Lỗi cập nhật lượt mua:", err);
      }
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công!",
      data: donHang,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái!" });
  }
};

// Thêm log lịch sử giao hàng
exports.addTrackingLog = async (req, res) => {
  try {
    const { id } = req.params; // ma_don_hang
    const { tieu_de, mo_ta, lat, lng } = req.body;

    const donHang = await DonHang.findOne({ where: { ma_don_hang: id } });
    if (!donHang)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

    const log = await LichSuGiaoHang.create({
      don_hang_id: donHang.id,
      tieu_de,
      mo_ta,
      lat: lat || null,
      lng: lng || null,
      thoi_gian: new Date(),
    });

    res.status(201).json({ message: "Thêm tracking thành công!", data: log });
  } catch (error) {
    console.error("Lỗi thêm tracking log:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
