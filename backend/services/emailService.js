const nodemailer = require("nodemailer");
const ThietLapCuaHang = require("../models/ThietLapCuaHang");

const _getMailConfig = async () => {
  const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });

  if (!config?.smtp_user || !config?.smtp_pass) {
    throw new Error("Admin chưa cấu hình SMTP trong hệ thống!");
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

  return {
    transporter,
    storeName: config.ten_cua_hang || " ",
    senderEmail: config.smtp_user,
  };
};

// GỬI EMAIL TÙY CHỈNH
exports.sendCustomEmail = async (toEmail, subject, htmlMessage) => {
  const { transporter, storeName, senderEmail } = await _getMailConfig();
  return transporter.sendMail({
    from: `"${storeName}" <${senderEmail}>`,
    to: toEmail,
    subject,
    html: htmlMessage,
  });
};

// GỬI EMAIL XÁC NHẬN ĐƠN HÀNG
exports.sendOrderConfirmation = async (email, orderInfo) => {
  try {
    const { transporter, storeName, senderEmail } = await _getMailConfig();

    await transporter.sendMail({
      from: `"${storeName}" <${senderEmail}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${orderInfo.maDonHang} — ${storeName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#2563eb;padding:24px 28px">
            <h1 style="color:#fff;margin:0;font-size:20px">${storeName}</h1>
          </div>
          <div style="padding:28px">
            <h2 style="color:#111827;margin-top:0">Cảm ơn bạn đã đặt hàng!</h2>
            <p style="color:#374151">Xin chào <b>${orderInfo.customerName}</b>,</p>
            <p style="color:#374151">Đơn hàng <b style="color:#2563eb">#${orderInfo.maDonHang}</b> của bạn đã được tiếp nhận thành công.</p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
              <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#6b7280">Tổng thanh toán:</td><td style="text-align:right;font-weight:700;color:#dc2626">${orderInfo.total}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280">Phương thức:</td><td style="text-align:right">${orderInfo.paymentMethod}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Địa chỉ giao:</td><td style="text-align:right">${orderInfo.address}</td></tr>
              </table>
            </div>

            <p style="color:#374151">Nhân viên <b>${storeName}</b> sẽ sớm liên hệ để xác nhận đơn hàng.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px">
              Email này được gửi tự động, vui lòng không trả lời trực tiếp.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Lỗi gửi email xác nhận đơn hàng:", error.message);
    return false;
  }
};

// GỬI EMAIL THÔNG BÁO ĐƠN MỚI CHO ADMIN
exports.sendNewOrderNotification = async (orderInfo) => {
  try {
    const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });
    const adminEmail = config?.email_nhan_thong_bao;

    if (!adminEmail) return false;

    const { transporter, storeName, senderEmail } = await _getMailConfig();

    await transporter.sendMail({
      from: `"${storeName}" <${senderEmail}>`,
      to: adminEmail,
      subject: `Đơn hàng mới #${orderInfo.maDonHang}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#059669;padding:16px 20px">
            <h2 style="color:#fff;margin:0;font-size:16px">Có đơn hàng mới!</h2>
          </div>
          <div style="padding:20px;font-size:14px;color:#374151">
            <p>Mã đơn: <b style="color:#2563eb">#${orderInfo.maDonHang}</b></p>
            <p>Khách hàng: <b>${orderInfo.customerName}</b></p>
            <p>Tổng tiền: <b style="color:#dc2626">${orderInfo.total}</b></p>
            <p>Phương thức: ${orderInfo.paymentMethod}</p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Lỗi gửi email thông báo admin:", error.message);
    return false;
  }
};

exports.sendLowStockAlert = async (productInfo) => {
  try {
    const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });
    const adminEmail = config?.email_nhan_thong_bao;

    if (!adminEmail) return false;

    const { transporter, storeName, senderEmail } = await _getMailConfig();

    await transporter.sendMail({
      from: `"${storeName}" <${senderEmail}>`,
      to: adminEmail,
      subject: `[CẢNH BÁO KHO] Sản phẩm sắp hết hàng - ${productInfo.productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#dc2626;padding:16px 20px">
            <h2 style="color:#fff;margin:0;font-size:16px">Báo động sắp hết hàng!</h2>
          </div>
          <div style="padding:20px;font-size:14px;color:#374151">
            <p>Hệ thống ghi nhận sản phẩm dưới đây vừa chạm ngưỡng báo động:</p>
            <div style="background:#fef2f2;border:1px solid #f87171;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 8px 0">Sản phẩm: <b>${productInfo.productName}</b></p>
              ${productInfo.variantName ? `<p style="margin:0 0 8px 0">Phân loại: <b>${productInfo.variantName}</b></p>` : ""}
              <p style="margin:0">Tồn kho hiện tại: <b style="color:#dc2626;font-size:18px">${productInfo.remaining}</b> (Ngưỡng: ${productInfo.threshold})</p>
            </div>
            <p>Vui lòng kiểm tra và nhập thêm hàng để không làm gián đoạn việc kinh doanh.</p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Lỗi gửi email cảnh báo hết hàng:", error.message);
    return false;
  }
};
