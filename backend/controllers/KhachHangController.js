const { Op } = require("sequelize");
const TaiKhoan = require("../models/TaiKhoan");
const DonHang = require("../models/DonHang");
const DiaChiGiaoHang = require("../models/DiaChiGiaoHang");
const TheThanhVien = require("../models/TheThanhVien");
const ThietLapCuaHang = require("../models/ThietLapCuaHang");
const {
  sendCustomEmail,
  sendOrderConfirmation,
} = require("../services/emailService");

// LẤY DANH SÁCH KHÁCH HÀNG
const getCustomers = async (req, res) => {
  try {
    const tiersRaw = await TheThanhVien.findAll({
      order: [["muc_chi_tieu_tu", "DESC"]],
    });

    const formattedTiers = tiersRaw.map((t) => ({
      id: t.id.toString(),
      name: t.ten_hang,
      minSpent: Number(t.muc_chi_tieu_tu),
      color: t.mau_the,
    }));

    const customersRaw = await TaiKhoan.findAll({
      where: {
        vai_tro: "customer",
        trang_thai: { [Op.ne]: "deleted" }
      },
      include: [
        {
          model: DiaChiGiaoHang,
          as: "dia_chi_giao_hang",
          required: false,
        },
        {
          model: DonHang,
          as: "danh_sach_don_hang",
          required: false,
          attributes: [
            "ma_don_hang",
            "tong_thanh_toan",
            "trang_thai",
            "created_at",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formattedCustomers = customersRaw.map((customer) => {
      // --- XỬ LÝ ĐỊA CHỈ & ĐẾM ĐỊA CHỈ ---
      let addressStr = "Chưa cập nhật địa chỉ";
      const totalAddresses = customer.dia_chi_giao_hang
        ? customer.dia_chi_giao_hang.length
        : 0; // Thêm đếm số địa chỉ

      if (totalAddresses > 0) {
        let defaultAddr = customer.dia_chi_giao_hang.find(
          (a) => a.la_mac_dinh === true || a.la_mac_dinh === 1,
        );
        if (!defaultAddr) defaultAddr = customer.dia_chi_giao_hang[0];
        const parts = [
          defaultAddr.dia_chi_cu_the,
          defaultAddr.phuong_xa,
          defaultAddr.quan_huyen,
          defaultAddr.tinh_thanh,
        ].filter(Boolean);
        addressStr = parts.join(", ");
      }

      const orders = customer.danh_sach_don_hang || [];
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      const deliveredOrders = orders.filter(
        (o) => o.trang_thai === "delivered",
      );
      const actualTotalSpent = deliveredOrders.reduce(
        (sum, o) => sum + Number(o.tong_thanh_toan),
        0,
      );

      const lastOrderDate =
        sortedOrders.length > 0
          ? new Date(sortedOrders[0].created_at).toLocaleDateString("vi-VN")
          : "Chưa mua hàng";

      const recentOrders = sortedOrders.slice(0, 2).map((order) => {
        let uiStatus = order.trang_thai;
        if (uiStatus === "delivered") uiStatus = "completed";
        if (uiStatus === "shipping" || uiStatus === "pending")
          uiStatus = "processing";
        return {
          id: order.ma_don_hang,
          date: new Date(order.created_at).toLocaleDateString("vi-VN"),
          total: Number(order.tong_thanh_toan),
          status: uiStatus,
        };
      });

      const joinDateObj = new Date(customer.created_at);
      const dd = String(joinDateObj.getDate()).padStart(2, "0");
      const mm = String(joinDateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = joinDateObj.getFullYear();
      const joinedDateFixed = `${dd}/${mm}/${yyyy}`;

      return {
        id: customer.id,
        name: customer.ho_ten || "Khách chưa nhập tên",
        email: customer.email,
        phone: customer.so_dien_thoai || "Chưa cập nhật",
        address: addressStr,
        joinedDate: joinedDateFixed,
        totalOrders: orders.length,
        totalSpent: actualTotalSpent,
        status: customer.trang_thai || "active",
        recentOrders: recentOrders,
        lastOrderDate: lastOrderDate,
        savedAddresses: totalAddresses,
      };
    });

    res.status(200).json({
      success: true,
      customers: formattedCustomers,
      tiers: formattedTiers,
    });
  } catch (error) {
    console.error("Lỗi getCustomers:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// KHÓA / MỞ KHÓA TÀI KHOẢN
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    await TaiKhoan.update({ trang_thai: newStatus }, { where: { id: id } });
    res.status(200).json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi cập nhật trạng thái" });
  }
};

const sendEmailToCustomer = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng điền đủ thông tin!" });
    }

    const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });
    const storeName = config && config.ten_cua_hang ? config.ten_cua_hang : "Cửa hàng";

    // Cấu hình bức thư
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #2563eb;">Thông báo từ ${storeName}</h2>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      `;

    await sendCustomEmail(email, subject, htmlMessage);

    res.status(200).json({ success: true, message: "Gửi email thành công!" });
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    res
      .status(500)
      .json({ success: false, message: "Không thể gửi email lúc này!" });
  }
};

module.exports = {
  getCustomers,
  toggleStatus,
  sendEmailToCustomer,
  sendOrderConfirmation,
};
