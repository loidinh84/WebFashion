const DonHang = require("../models/DonHang");
const TaiKhoan = require("../models/TaiKhoan");
const BienTheSanPham = require("../models/BienTheSanPham");
const ChiTietDonHang = require("../models/ChiTietDonHang");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

const getDashboardSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let startRange, endRange;

    if (fromDate && toDate) {
      startRange = `${fromDate} 00:00:00`;
      endRange = `${toDate} 23:59:59`;
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startRange = firstDay.toISOString().slice(0, 10) + " 00:00:00";
      endRange = now.toISOString().slice(0, 10) + " 23:59:59";
    }
    

    const totalRevenue =
      (await DonHang.sum("tong_thanh_toan", {
        where: {
          trang_thai: "delivered",
          created_at: { 
            [Op.gte]: startRange,
            [Op.lte]: endRange 
          },
        },
      })) || 0;

    const newOrders = await DonHang.count({
      where: { 
        created_at: { 
          [Op.gte]: startRange,
          [Op.lte]: endRange 
        } 
      },
    });

    const totalCustomers = await TaiKhoan.count({
      where: { vai_tro: "customer" },
    });

    const totalInventory = await BienTheSanPham.sum("ton_kho");

    const recentOrdersRaw = await DonHang.findAll({
      order: [["created_at", "DESC"]],
      limit: 6,
      include: [
        {
          model: TaiKhoan,
          as: "nguoi_mua",
          attributes: ["ho_ten"],
        },
        {
          model: ChiTietDonHang,
          as: "chi_tiet",
          attributes: ["ten_sp_luc_mua"],
        },
      ],
    });

    const recentOrders = recentOrdersRaw.map((order) => {
      let productName = "Không rõ sản phẩm";

      if (order.chi_tiet && order.chi_tiet.length > 0) {
        if (order.chi_tiet.length === 1) {
          productName = order.chi_tiet[0].ten_sp_luc_mua;
        } else {
          productName = `${order.chi_tiet[0].ten_sp_luc_mua} ... (+${order.chi_tiet.length - 1} sp khác)`;
        }
      }

      return {
        id: order.ma_don_hang,
        customer: order.nguoi_mua ? order.nguoi_mua.ho_ten : "Khách vãng lai",
        product: productName,
        amount:
          new Intl.NumberFormat("vi-VN").format(order.tong_thanh_toan) + " ₫",
        status: order.trang_thai,
        date: new Date(order.created_at).toLocaleDateString("vi-VN"),
      };
    });

    const topProductsQty = await ChiTietDonHang.findAll({
      attributes: [
        "ten_sp_luc_mua",
        [sequelize.fn("SUM", sequelize.col("so_luong")), "sold_qty"],
        [sequelize.fn("SUM", sequelize.col("thanh_tien")), "total_revenue"],
      ],
      group: ["ten_sp_luc_mua"],
      order: [[sequelize.fn("SUM", sequelize.col("so_luong")), "DESC"]],
      limit: 5,
    });

    const topProductsRevenue = await ChiTietDonHang.findAll({
      attributes: [
        "ten_sp_luc_mua",
        [sequelize.fn("SUM", sequelize.col("so_luong")), "sold_qty"],
        [sequelize.fn("SUM", sequelize.col("thanh_tien")), "total_revenue"],
      ],
      group: ["ten_sp_luc_mua"],
      order: [[sequelize.fn("SUM", sequelize.col("thanh_tien")), "DESC"]],
      limit: 5,
    });

    const formatTop = (data) => {
      const maxVal = Math.max(
        ...data.map((item) => Number(item.dataValues.total_revenue)),
        1,
      );
      return data.map((item) => ({
        name: item.dataValues.ten_sp_luc_mua,
        sold: Number(item.dataValues.sold_qty),
        revenue: new Intl.NumberFormat("vi-VN").format(
          item.dataValues.total_revenue,
        ),
        pct: Math.round((Number(item.dataValues.total_revenue) / maxVal) * 100),
      }));
    };

    // Chart data range: if custom range is small (< 10 days), show day-by-day. 
    // For simplicity, we'll keep the 7-day logic but use the endRange as the reference.
    const chartEnd = new Date(`${toDate || new Date().toISOString().slice(0,10)} 23:59:59`);
    const chartStart = new Date(chartEnd);
    chartStart.setDate(chartStart.getDate() - 6);
    
    const chartStartStr = chartStart.toISOString().slice(0, 10) + " 00:00:00";
    const chartEndStr = chartEnd.toISOString().slice(0, 10) + " 23:59:59";

    const orders7Days = await DonHang.findAll({
      where: {
        trang_thai: "delivered",
        created_at: { 
          [Op.gte]: chartStartStr,
          [Op.lte]: chartEndStr 
        },
      },
      attributes: ["created_at", "tong_thanh_toan"],
    });

    const pad = (n) => n.toString().padStart(2, "0");

    const chartDataMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(chartEnd);
      d.setDate(d.getDate() - i);
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
      chartDataMap[dateStr] = { day: dateStr, value: 0, amount: "0" };
    }

    orders7Days.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const dateStr = `${pad(orderDate.getDate())}/${pad(orderDate.getMonth() + 1)}`;
      if (chartDataMap[dateStr]) {
        chartDataMap[dateStr].value += Number(order.tong_thanh_toan);
      }
    });

    const chartData = Object.values(chartDataMap).map((item) => ({
      day: item.day,
      value: item.value,
      amount: item.value > 0 ? (item.value / 1000000).toFixed(1) + "tr" : "0",
    }));

    const orderStatusCount = await DonHang.findAll({
      attributes: [
        "trang_thai",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { 
        created_at: { 
          [Op.gte]: startRange,
          [Op.lte]: endRange 
        } 
      },
      group: ["trang_thai"],
    });

    const statusColors = {
      delivered: { label: "Thành công", color: "#10b981" },
      shipping: { label: "Đang giao", color: "#3b82f6" },
      confirmed: { label: "Đang xử lý", color: "#8b5cf6" },
      pending: { label: "Chờ xử lý", color: "#f59e0b" },
      cancelled: { label: "Đã hủy", color: "#ef4444" },
      refunded: { label: "Hoàn tiền", color: "#f97316" },
    };

    let totalOrdersForPie = orderStatusCount.reduce(
      (sum, item) => sum + Number(item.dataValues.count),
      0,
    );

    const pieData = orderStatusCount.map((item) => {
      const count = Number(item.dataValues.count);
      const config = statusColors[item.trang_thai] || {
        label: item.trang_thai,
        color: "#9ca3af",
      };
      return {
        label: config.label,
        value:
          totalOrdersForPie > 0
            ? Math.round((count / totalOrdersForPie) * 100)
            : 0,
        color: config.color,
        count: count,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: totalRevenue ?? 0,
        newOrders: newOrders ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalInventory: totalInventory ?? 0,
      },
      recentOrders: recentOrders,
      topProductsQty: formatTop(topProductsQty),
      topProductsRevenue: formatTop(topProductsRevenue),
      revenueChart: chartData,
      pieData: pieData,
    });
  } catch (error) {
    console.error("Lỗi getDashboardSummary:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = { getDashboardSummary };
