const path = require("path"); // FIX: thêm import
const fs = require("fs"); // FIX: thêm import
const ThietLapCuaHang = require("../models/ThietLapCuaHang");
const nodemailer = require("nodemailer");

//  WHITELIST CÁC FIELD ĐƯỢC PHÉP UPDATE
const ALLOWED_FIELDS = [
  "ten_cua_hang",
  "so_dien_thoai",
  "email",
  "dia_chi",
  "vietqr_bank_bin",
  "vietqr_account_no",
  "vietqr_account_name",
  "bao_tri_he_thong",
  "tu_dong_duyet_don",
  "cho_phep_danh_gia",
  "gui_email_tu_dong",
  "lam_tron_tien",
  "facebook_url",
  "tiktok_url",
  "instagram_url",
  "zalo",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "email_nhan_thong_bao",
  "nguong_bao_het_hang",
];

// GET: LẤY CẤU HÌNH
const getStoreSettings = async (req, res) => {
  try {
    let config = await ThietLapCuaHang.findOne({ where: { id: 1 } });

    if (!config) {
      config = await ThietLapCuaHang.create({
        ten_cua_hang: "Cửa hàng của bạn",
        so_dien_thoai: "0123456789",
        email: "admin@gmail.com",
      });
    }

    const safeData = { ...config.toJSON() };
    if (safeData.smtp_pass) {
      safeData.smtp_pass = safeData.smtp_pass ? "••••••••" : "";
    }

    res.status(200).json({ success: true, data: safeData });
  } catch (error) {
    console.error("Lỗi getStoreSettings:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ!" });
  }
};

// PUT: CẬP NHẬT CẤU HÌNH
const updateStoreSettings = async (req, res) => {
  try {
    // FIX: Chỉ lấy các field trong whitelist
    const updateData = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.file) {
      const oldConfig = await ThietLapCuaHang.findOne({ where: { id: 1 } });
      if (oldConfig?.logo_url) {
        const oldFilePath = path.join(__dirname, "..", oldConfig.logo_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.logo_url = `/uploads/${req.file.filename}`;
    }

    if (updateData.smtp_pass === "••••••••") {
      delete updateData.smtp_pass;
    }

    await ThietLapCuaHang.update(updateData, { where: { id: 1 } });
    res.status(200).json({ success: true, message: "Đã lưu cấu hình!" });
  } catch (error) {
    console.error("Lỗi updateStoreSettings:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lưu dữ liệu!" });
  }
};

// POST: TEST GỬI EMAIL
const testEmailConfig = async (req, res) => {
  try {
    const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });

    if (!config?.smtp_user || !config?.smtp_pass) {
      return res.status(400).json({
        success: false,
        message:
          "Chưa cấu hình SMTP. Vui lòng điền đầy đủ thông tin SMTP trước!",
      });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host || "smtp.gmail.com",
      port: Number(config.smtp_port) || 587,
      secure: Number(config.smtp_port) === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    // Verify kết nối SMTP
    await transporter.verify();

    const toEmail = config.email_nhan_thong_bao || config.smtp_user;
    await transporter.sendMail({
      from: `"${config.ten_cua_hang || ""}" <${config.smtp_user}>`,
      to: toEmail,
      subject: "Test Email — Cấu hình SMTP thành công",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#2563eb;margin-bottom:8px">Email test thành công!</h2>
          <p style="color:#374151">Cấu hình SMTP của <b>${config.ten_cua_hang || "Store"}</b> đang hoạt động tốt.</p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:16px 0"/>
          <p style="color:#6b7280;font-size:12px">Email này được gửi tự động từ trang Thiết lập cửa hàng.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: `Đã gửi email test đến ${toEmail}. Vui lòng kiểm tra hộp thư!`,
    });
  } catch (error) {
    console.error("Lỗi test email:", error);
    res.status(400).json({
      success: false,
      message: `Kết nối SMTP thất bại: ${error.message}`,
    });
  }
};

module.exports = { getStoreSettings, updateStoreSettings, testEmailConfig };
