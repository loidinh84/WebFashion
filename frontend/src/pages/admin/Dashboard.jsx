import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "../../assets/icons/index";
import axios from "axios";
import BASE_URL from "../../config/api";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfWeek, startOfMonth, subMonths } from "date-fns";
import { vi } from "date-fns/locale/vi";

registerLocale("vi", vi);

const statusConfig = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
  shipping: { label: "Đang giao", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Thành công", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
  refunded: { label: "Hoàn tiền", color: "bg-orange-100 text-orange-700" },
};



const Dashboard = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [topType, setTopType] = useState("qty");

  // CÁC STATE LƯU DỮ LIỆU
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [pieChart, setPieChart] = useState([]);
  const [topByQty, setTopByQty] = useState([]);
  const [topByRevenue, setTopByRevenue] = useState([]);

  // BỘ LỌC THỜI GIAN
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterDateFrom, setFilterDateFrom] = useState(
    startOfMonth(new Date())
  );
  const [filterDateTo, setFilterDateTo] = useState(new Date());

  useEffect(() => {
    const now = new Date();
    if (filterPeriod === "month") {
      setFilterDateFrom(startOfMonth(now));
      setFilterDateTo(now);
    } else if (filterPeriod === "week") {
      setFilterDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
      setFilterDateTo(now);
    } else if (filterPeriod === "2months") {
      setFilterDateFrom(startOfMonth(subMonths(now, 1)));
      setFilterDateTo(now);
    }
  }, [filterPeriod]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const params = {};
      if (filterDateFrom) params.fromDate = format(filterDateFrom, "yyyy-MM-dd");
      if (filterDateTo) params.toDate = format(filterDateTo, "yyyy-MM-dd");

      const response = await axios.get(
        `${BASE_URL}/api/dashboard/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        }
      );   
      const data = response.data;

      if (data.success) {
        const dashboardStats = [
          {
            id: 1,
            label: "Tổng doanh thu",
            rawValue: data.stats.totalRevenue || 0,
            value:
              new Intl.NumberFormat("vi-VN").format(
                data.stats?.totalRevenue || 0,
              ) + " ₫",
            change: filterPeriod === "custom" ? "Tùy chọn" : "Trong kỳ",
            positive: true,
            sub: "Đơn giao thành công",
            accent: "#2563eb",
            bg: "from-blue-50 to-blue-100/40",
            border: "border-blue-200",
          },
          {
            id: 2,
            label: "Đơn hàng mới",
            value: data.stats?.newOrders || 0,
            change: filterPeriod === "custom" ? "Tùy chọn" : "Trong kỳ",
            positive: true,
            sub: "Tổng số đơn",
            accent: "#059669",
            bg: "from-emerald-50 to-emerald-100/40",
            border: "border-emerald-200",
          },
          {
            id: 3,
            label: "Khách hàng",
            value: data.stats.totalCustomers,
            change: "Thành viên",
            positive: true,
            sub: "Đã đăng ký",
            accent: "#7c3aed",
            bg: "from-violet-50 to-violet-100/40",
            border: "border-violet-200",
          },
          {
            id: 4,
            label: "Sản phẩm tồn kho",
            value: data.stats.totalInventory,
            change: "Trong kho",
            positive: true,
            sub: "Tổng các biến thể",
            accent: "#dc2626",
            bg: "from-red-50 to-red-100/40",
            border: "border-red-200",
          },
        ];

        setStats(dashboardStats);
        setOrders(data.recentOrders || []);
        setRevenueChart(data.revenueChart || []);
        setPieChart(data.pieData || []);
        setTopByQty(data.topProductsQty || []);
        setTopByRevenue(data.topProductsRevenue || []);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu Dashboard:", error);
      if (error.response?.status === 401) {
        console.error("Lỗi xác thực: Token không hợp lệ hoặc đã hết hạn.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterDateFrom, filterDateTo]);

  const maxChart =
    revenueChart.length > 0 ? Math.max(...revenueChart.map((d) => d.value)) : 1;

  const r = 40;
  const circ = 2 * Math.PI * r;

  const displayTopProducts = topType === "qty" ? topByQty : topByRevenue;

  const donutSegments = useMemo(() => {
    let cum = 0;
    return pieChart.map((seg) => {
      const pct = seg.value / 100;
      const dash = pct * circ;
      const gap = circ - dash;
      const offset = cum * circ;
      cum += pct;
      return { ...seg, dash, gap, offset };
    });
  }, [pieChart]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f2f5]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 font-medium">
          Đang tải dữ liệu hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f0f2f5] font-sans p-4 lg:p-6 pb-20">
      {/* ── HEADER ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 ">
            Tổng quan hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · Dữ liệu cập nhật vừa xong
          </p>
        </div>

        {/* BỘ LỌC */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Thời gian</span>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="month">Tháng này</option>
              <option value="week">Tuần này</option>
              <option value="2months">2 tháng trước</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Từ ngày</span>
              <DatePicker
                selected={filterDateFrom}
                onChange={(date) => {
                  setFilterDateFrom(date);
                  if (filterPeriod !== "custom") setFilterPeriod("custom");
                }}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                className="w-28 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Đến ngày</span>
              <DatePicker
                selected={filterDateTo}
                onChange={(date) => {
                  setFilterDateTo(date);
                  if (filterPeriod !== "custom") setFilterPeriod("custom");
                }}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                className="w-28 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </div>
          </div>
          
          <button 
            onClick={fetchDashboardData}
            className="mt-5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <Icons.Add className="w-4 h-4 rotate-45" /> 
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((card) => (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
          >
            <div
              className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: card.accent }}
            />
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: card.accent }}
            >
              <Icons.Bill className="w-5 h-5" />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
              {card.label}
            </p>
            <p className="text-xl font-extrabold text-gray-900 leading-tight">
              {card.value}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  card.positive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {card.change}
              </span>
              <span className="text-[11px] text-gray-400">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: BIỂU ĐỒ CỘT + PHÂN LOẠI ĐƠN ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Biểu đồ doanh thu 7 ngày */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-800 text-base">
                Doanh thu 7 ngày qua
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Đơn vị: triệu đồng</p>
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              Tuần này
            </span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-40">
            {revenueChart.map((d, i) => {
              const heightPct = (d.value / maxChart) * 100;
              const isHovered = hoveredBar === i;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  <div
                    className={`text-[10px] font-bold text-blue-600 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}
                  >
                    {d.amount}
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full relative flex items-end"
                    style={{ height: "120px" }}
                  >
                    <div
                      className="w-full rounded-t-lg transition-all duration-200"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isHovered ? "#2563eb" : "#bfdbfe",
                        minHeight: "8px",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phân loại đơn hàng */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 text-base mb-1">
            Trạng thái đơn hàng
          </h3>
          <p className="text-xs text-gray-400 mb-5">
            {filterDateFrom && filterDateTo 
              ? `${format(filterDateFrom, "dd/MM/yyyy")} - ${format(filterDateTo, "dd/MM/yyyy")}`
              : `Tháng ${new Date().getMonth() + 1} / ${new Date().getFullYear()}`}
          </p>

          {/* SVG Donut chart */}
          <div className="flex justify-center mb-5">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={`${seg.dash} ${seg.gap}`}
                    strokeDashoffset={-seg.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-gray-800">
                  {pieChart.reduce((sum, item) => sum + (item.count || 0), 0)}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  đơn
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {pieChart.map((seg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${seg.value}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-7 text-right">
                    {seg.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ĐƠN HÀNG GẦN ĐÂY + TOP SẢN PHẨM ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Đơn hàng gần đây */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-base">
              Đơn hàng gần đây
            </h3>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Mã đơn</th>
                  <th className="px-6 py-3 text-left font-bold">Khách hàng</th>
                  <th className="px-6 py-3 text-left font-bold">Sản phẩm</th>
                  <th className="px-6 py-3 text-right font-bold">Tổng tiền</th>
                  <th className="px-6 py-3 text-center font-bold">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right font-bold">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const s = statusConfig[order.status] || { label: "Không rõ" };
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-blue-600 text-xs">
                        {order.id}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-800">
                        {order.customer}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 max-w-[200px] truncate">
                        {order.product}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-gray-800">
                        {order.amount}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${s.color || "bg-gray-100 text-gray-600"}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-400 text-xs">
                        {order.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-800 text-bold">
              Top {displayTopProducts.length} sản phẩm
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTopType("qty")}
                className={`text-[10px] font-bold cursor-pointer px-3 py-1.5 rounded-md transition-colors ${topType === "qty" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Phổ biến
              </button>
              <button
                onClick={() => setTopType("revenue")}
                className={`text-[10px] font-bold cursor-pointer px-3 py-1.5 rounded-md transition-colors ${topType === "revenue" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Giá trị nhất
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {displayTopProducts.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0
                      ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 leading-tight">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 shrink-0 ml-2">
                    {p.sold} cái
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 w-14 text-right whitespace-nowrap">
                    {p.revenue} ₫
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick summary */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-700">
                {displayTopProducts.reduce(
                  (sum, item) => sum + Number(item.sold || 0),
                  0,
                )}
              </p>
              <p className="text-[10px] text-blue-500 font-semibold mt-0.5">
                SL bán ra (Top 5)
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">
                {stats.length > 0
                  ? (stats[0].rawValue / 1000000).toFixed(1) + "tr"
                  : "0"}
              </p>
              <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                Tổng doanh thu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
