const TaiKhoan = require("../models/TaiKhoan");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");
const TheThanhVien = require("../models/TheThanhVien");
const DonHang = require("../models/DonHang");
const ChiTietDonHang = require("../models/ChiTietDonHang");
const DiaChiGiaoHang = require("../models/DiaChiGiaoHang");
const BienTheSanPham = require("../models/BienTheSanPham");
const SanPham = require("../models/SanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const LichSuGiaoHang = require("../models/LichSuGiaoHang");
const DonViVanChuyen = require("../models/DonViVanChuyen");
const ThietLapCuaHang = require("../models/ThietLapCuaHang");
const DanhGiaSanPham = require("../models/DanhGiaSanPham");
const GiaoDichThanhToan = require("../models/GiaoDichThanhToan");
const PhuongThucThanhToan = require("../models/PhuongThucThanhToan");
const PhieuNhapHang = require("../models/PhieuNhapHang");
const PhieuKiemKho = require("../models/PhieuKiemKho");
const YeuThich = require("../models/YeuThich");
const DanhGiaCuaHang = require("../models/DanhGiaCuaHang");
const ThichDanhGia = require("../models/ThichDanhGia");

// Lấy danh sách tất cả tài khoản
exports.getAllRTaiKhoan = async (req, res) => {
  try {
    const danhSach = await TaiKhoan.findAll();
    res.json(danhSach);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách" });
  }
};

// Lấy thông tin 1 người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await TaiKhoan.findByPk(req.params.id, {
      attributes: { exclude: ["mat_khau"] },
    });
    if (!user) return res.status(404).json({ message: "Không tìm thấy!" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getUserFullDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await TaiKhoan.findByPk(id, {
      attributes: { exclude: ["mat_khau"] },
      include: [{ model: TheThanhVien, as: "hang_thanh_vien" }],
    });

    const allOrders = await DonHang.findAll({
      where: { tai_khoan_id: id },
      include: [
        {
          model: ChiTietDonHang,
          as: "chi_tiet",
          include: [
            {
              model: BienTheSanPham,
              as: "bien_the",
              include: [
                {
                  model: SanPham,
                  as: "san_pham",
                  include: [{ model: HinhAnhSanPham, as: "hinh_anh" }],
                },
              ],
            },
          ],
        },
        {
          model: DanhGiaSanPham,
          as: "danh_gia",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const allMemberships = await TheThanhVien.findAll({
      order: [["muc_chi_tieu_tu", "ASC"]],
    });

    res.json({
      userInfo: user,
      orderCount: allOrders.length,
      allOrders: allOrders,
      allMemberships: allMemberships,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu dashboard" });
  }
};

// Thêm tài khoản mới
exports.createTaiKhoan = async (req, res) => {
  try {
    const { ho_ten, email, mat_khau, so_dien_thoai } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const emailTonTai = await TaiKhoan.findOne({ where: { email: email } });
    if (emailTonTai) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // Kiểm tra số điện thoại
    const sdtTonTai = await TaiKhoan.findOne({
      where: {
        so_dien_thoai: so_dien_thoai,
      },
    });
    if (sdtTonTai) {
      return res
        .status(400)
        .json({ message: "Số điện thoại này đã được sử dụng!" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedMatKhau = await bcrypt.hash(mat_khau, salt);

    const hangMacDinh = await TheThanhVien.findOne({
      order: [["muc_chi_tieu_tu", "ASC"]],
    });

    if (!hangMacDinh) {
      return res.status(500).json({
        message: "Hệ thống chưa thiết lập hạng thẻ thành viên!",
      });
    }

    // Lưu thông tin tài khoản
    const taiKhoanMoi = await TaiKhoan.create({
      ho_ten,
      email,
      mat_khau: hashedMatKhau,
      so_dien_thoai,
      the_thanh_vien_id: hangMacDinh.id,
      tong_chi_tieu: 0,
    });

    res
      .status(201)
      .json({ message: "Tạo tài khoản thành công!", data: taiKhoanMoi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo tài khoản!" });
  }
};

// Đăng nhập
exports.loginTaiKhoan = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;
    const user = await TaiKhoan.findOne({
      where: {
        [Op.or]: [{ email: email }, { so_dien_thoai: email }],
      },
      include: [{ model: TheThanhVien, as: "hang_thanh_vien" }],
    });

    if (!user) {
      return res.status(404).json({
        message: " Email hoặc số điện thoại không tồn tại!",
      });
    }

    if (user.trang_thai === "banned") {
      return res.status(403).json({
        message:
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý để biết thêm chi tiết!",
      });
    }

    const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không chính xác!" });
    }

    const { rememberMe } = req.body;
    const expireTime = rememberMe ? "30d" : "1d";

    const token = jwt.sign(
      { id: user.id, email: user.email, vai_tro: user.vai_tro },
      process.env.JWT_SECRET,
      { expiresIn: expireTime },
    );

    res.status(200).json({
      message: "Đăng nhập thành công!",
      token: token,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        vai_tro: user.vai_tro,
        so_dien_thoai: user.so_dien_thoai,
        anh_dai_dien: user.anh_dai_dien,
        diem_tich_luy: user.diem_tich_luy || 0,
        mau_the: user.hang_thanh_vien?.mau_the || "#9ca3af",
        ty_le_giam_gia: user.hang_thanh_vien?.ty_le_giam_gia || 0,
        ten_hang: user.hang_thanh_vien?.ten_hang,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập!" });
  }
};

// Đăng nhập bằng google
exports.loginWithGoogle = async (req, res) => {
  try {
    const { email, ho_ten, anh_dai_dien } = req.body;

    // Tìm user theo email
    let user = await TaiKhoan.findOne({ where: { email } });

    // Nếu chưa có → tự động tạo mới
    if (!user) {
      const hangMacDinh = await TheThanhVien.findOne({
        order: [["muc_chi_tieu_tu", "ASC"]],
      });

      user = await TaiKhoan.create({
        ho_ten,
        email,
        mat_khau: "GOOGLE_AUTH_NO_PASSWORD",
        anh_dai_dien,
        vai_tro: "customer",
        the_thanh_vien_id: hangMacDinh?.id,
        tong_chi_tieu: 0,
      });
    }

    // Tạo token
    const { rememberMe } = req.body;
    const expireTime = rememberMe ? "30d" : "1d";

    const token = jwt.sign(
      { id: user.id, email: user.email, vai_tro: user.vai_tro },
      process.env.JWT_SECRET,
      { expiresIn: expireTime },
    );

    // Lấy thông tin thẻ thành viên
    const userWithCard = await TaiKhoan.findByPk(user.id, {
      include: [{ model: TheThanhVien, as: "hang_thanh_vien" }],
    });

    res.status(200).json({
      message: "Đăng nhập Google thành công!",
      token,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        vai_tro: user.vai_tro,
        anh_dai_dien: user.anh_dai_dien,
        so_dien_thoai: user.so_dien_thoai,
        diem_tich_luy: user.diem_tich_luy || 0,
        mau_the: userWithCard.hang_thanh_vien?.mau_the || "#9ca3af",
        ty_le_giam_gia: userWithCard.hang_thanh_vien?.ty_le_giam_gia || 0,
        ten_hang: userWithCard.hang_thanh_vien?.ten_hang,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi đăng nhập Google!" });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ email!" });
    }

    const user = await TaiKhoan.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email này chưa được đăng ký trong hệ thống!" });
    }

    if (user.trang_thai === "banned" || user.trang_thai === "deleted") {
      return res.status(403).json({ message: "Tài khoản này đã bị khóa hoặc bị hủy!" });
    }

    // Ký reset token trong 15 phút
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const origin = req.get("origin") || "http://localhost:5173";
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    // Lấy thiết lập tên cửa hàng từ database
    const thietLap = await ThietLapCuaHang.findOne();
    const tenCuaHang = thietLap?.ten_cua_hang || "WebEcommerce";

    // Soạn email
    const subject = `Khôi phục mật khẩu tài khoản của bạn — ${tenCuaHang}`;
    const htmlMessage = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Thin brand accent line -->
        <div style="height: 4px; background-color: #dc2626;"></div>
        
        <div style="padding: 40px 35px;">
          <!-- Brand Logo Header -->
          <div style="margin-bottom: 30px; text-align: center;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
              ${tenCuaHang}
            </h2>
          </div>

          <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; text-align: center;">
            Yêu cầu Đặt lại Mật khẩu
          </h3>

          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;">
            Xin chào <b>${user.ho_ten}</b>,
          </p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
            Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1446bdff; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>

          <div style="color: #475569; font-size: 13px; line-height: 1.5; padding: 15px; background-color: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px; margin-top: 30px;">
            <b>Lưu ý bảo mật:</b> Liên kết này chỉ có hiệu lực trong vòng <b>15 phút</b>. Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email này, mật khẩu của bạn sẽ được giữ nguyên an toàn.
          </div>

          <div style="color: #94a3b8; font-size: 13px; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; line-height: 1.5;">
            Trân trọng,<br>
            <span style="color: #64748b; font-weight: 600;">Đội ngũ hỗ trợ ${tenCuaHang}</span>
          </div>
        </div>
      </div>
    `;

    await emailService.sendCustomEmail(user.email, subject, htmlMessage);

    res.status(200).json({ success: true, message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!" });
  } catch (error) {
    console.error("Lỗi yêu cầu quên mật khẩu:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi gửi email khôi phục!" });
  }
};

// Đặt lại mật khẩu mới
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin yêu cầu!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải chứa ít nhất 6 ký tự!" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Liên kết khôi phục đã hết hạn hoặc không hợp lệ!" });
    }

    if (decoded.purpose !== "reset-password") {
      return res.status(400).json({ message: "Token không đúng mục đích khôi phục!" });
    }

    const user = await TaiKhoan.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại!" });
    }

    if (user.trang_thai === "banned" || user.trang_thai === "deleted") {
      return res.status(403).json({ message: "Tài khoản này đã bị khóa hoặc bị hủy!" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.mat_khau = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới." });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật mật khẩu!" });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await DonHang.findByPk(id, {
      include: [
        {
          model: DiaChiGiaoHang,
          as: "dia_chi",
        },
        {
          model: DonViVanChuyen,
          as: "don_vi_vc",
        },
        {
          model: LichSuGiaoHang,
          as: "lich_su_giao_hang",
        },
        {
          model: ChiTietDonHang,
          as: "chi_tiet",
          include: [
            {
              model: BienTheSanPham,
              as: "bien_the",
              include: [
                {
                  model: SanPham,
                  as: "san_pham",
                  include: [{ model: HinhAnhSanPham, as: "hinh_anh" }],
                },
              ],
            },
          ],
        },
        {
          model: GiaoDichThanhToan,
          as: "giao_dich",
          include: [
            {
              model: PhuongThucThanhToan,
              as: "phuong_thuc",
            },
          ],
        },
      ],
      order: [
        [{ model: LichSuGiaoHang, as: "lich_su_giao_hang" }, "thoi_gian", "DESC"]
      ],
    });

    const thietLap = await ThietLapCuaHang.findOne();

    if (!order)
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin đơn hàng!" });

    // Attach shop settings to the response if needed
    const orderData = order.toJSON();
    orderData.cua_hang = thietLap;

    // Thay thế dia_chi bằng dữ liệu snapshot nếu có, để bảo toàn lịch sử giao hàng
    if (orderData.ho_ten_nguoi_nhan) {
      orderData.dia_chi = {
        ho_ten_nguoi_nhan: orderData.ho_ten_nguoi_nhan,
        so_dien_thoai: orderData.so_dien_thoai,
        dia_chi_cu_the: orderData.dia_chi_cu_the,
        tinh_thanh: orderData.tinh_thanh,
        quan_huyen: orderData.quan_huyen,
        phuong_xa: orderData.phuong_xa,
      };
    }

    // Nếu cả dữ liệu snapshot lẫn quan hệ địa chỉ gốc đều bị null (đơn hàng cũ hoặc bị lỗi), lấy địa chỉ giao hàng mặc định của người dùng làm fallback
    if (!orderData.dia_chi) {
      const fallbackDiaChi = await DiaChiGiaoHang.findOne({
        where: { tai_khoan_id: orderData.tai_khoan_id },
        order: [["la_mac_dinh", "DESC"]],
      });
      if (fallbackDiaChi) {
        orderData.dia_chi = fallbackDiaChi.toJSON();
      }
    }

    res.json(orderData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Server khi lấy chi tiết đơn hàng" });
  }
};

exports.getDiaChiByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const diaChiList = await DiaChiGiaoHang.findAll({
      where: { tai_khoan_id: id },
      order: [["la_mac_dinh", "DESC"]],
    });
    res.json(diaChiList);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách địa chỉ!" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let { ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh } = req.body;
    let anh_dai_dien = req.body.anh_dai_dien;

    if (!ngay_sinh) ngay_sinh = null;
    if (!so_dien_thoai) so_dien_thoai = null;

    if (req.file) {
      anh_dai_dien = `/uploads/${req.file.filename}`;
    }

    await TaiKhoan.update(
      { ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh, anh_dai_dien },
      { where: { id } },
    );
    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật!" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await TaiKhoan.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.mat_khau);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedMatKhau = await bcrypt.hash(newPassword, salt);

    await TaiKhoan.update({ mat_khau: hashedMatKhau }, { where: { id } });

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server khi đổi mật khẩu!" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const {
      tai_khoan_id,
      ho_ten_nguoi_nhan,
      so_dien_thoai,
      dia_chi_cu_the,
      tinh_thanh,
      quan_huyen,
      phuong_xa,
      la_mac_dinh,
    } = req.body;

    if (la_mac_dinh) {
      await DiaChiGiaoHang.update(
        { la_mac_dinh: 0 },
        { where: { tai_khoan_id } },
      );
    }

    await DiaChiGiaoHang.create({
      tai_khoan_id,
      ho_ten_nguoi_nhan,
      so_dien_thoai,
      dia_chi_cu_the,
      tinh_thanh,
      quan_huyen,
      phuong_xa,
      la_mac_dinh: la_mac_dinh ? 1 : 0,
    });
    res.status(201).json({ message: "Đã thêm địa chỉ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi thêm địa chỉ!" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      ho_ten_nguoi_nhan,
      so_dien_thoai,
      dia_chi_cu_the,
      tinh_thanh,
      quan_huyen,
      phuong_xa,
      la_mac_dinh,
      tai_khoan_id,
    } = req.body;

    if (la_mac_dinh && tai_khoan_id) {
      await DiaChiGiaoHang.update(
        { la_mac_dinh: 0 },
        { where: { tai_khoan_id } },
      );
    }

    await DiaChiGiaoHang.update(
      {
        ho_ten_nguoi_nhan,
        so_dien_thoai,
        dia_chi_cu_the,
        tinh_thanh,
        quan_huyen,
        phuong_xa,
        la_mac_dinh: la_mac_dinh ? 1 : 0,
      },
      { where: { id: addressId } },
    );
    res.status(200).json({ message: "Cập nhật địa chỉ thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật địa chỉ!" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    await DiaChiGiaoHang.destroy({ where: { id: addressId } });
    res.status(200).json({ message: "Đã xóa địa chỉ!" });
  } catch (error) {
    console.error("Lỗi xóa địa chỉ:", error);
    res.status(500).json({ message: "Lỗi server khi xóa địa chỉ!" });
  }
};

exports.cancelAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra các ràng buộc giao dịch kinh doanh quan trọng (không thể xóa)
    const hasOrders = await DonHang.findOne({ where: { tai_khoan_id: id } });
    const hasPurchaseInvoices = await PhieuNhapHang.findOne({ where: { nguoi_tao: id } });
    const hasInventoryAudits = await PhieuKiemKho.findOne({ where: { nguoi_tao: id } });

    if (hasOrders || hasPurchaseInvoices || hasInventoryAudits) {
      await TaiKhoan.update({ trang_thai: "deleted" }, { where: { id } });
      return res.status(200).json({
        success: true,
        type: "soft",
        message: "Hủy tài khoản thành công!",
      });
    } else {
      await DiaChiGiaoHang.destroy({ where: { tai_khoan_id: id } });
      await YeuThich.destroy({ where: { tai_khoan_id: id } });
      await DanhGiaCuaHang.destroy({ where: { tai_khoan_id: id } });
      await ThichDanhGia.destroy({ where: { tai_khoan_id: id } });

      await TaiKhoan.destroy({ where: { id } });
      return res.status(200).json({
        success: true,
        type: "hard",
        message: "Hủy tài khoản thành công!",
      });
    }
  } catch (error) {
    console.error("Lỗi khi hủy tài khoản:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi hủy tài khoản!" });
  }
};
