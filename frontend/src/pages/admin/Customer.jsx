import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import axios from "axios";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price || 0);

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [dd, mm, yyyy] = dateStr.split("/");
  return new Date(`${yyyy}-${mm}-${dd}`);
};

const Customer = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState([]);
  const [dbTiers, setDbTiers] = useState([]);

  // BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null,
    customerId: null,
    newStatus: null,
    title: "",
    message: "",
  });

  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    customerEmail: "",
    customerName: "",
    subject: "",
    message: "",
    isSending: false,
  });

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${BASE_URL}/api/customers`, {
        headers,
      });
      if (response.data.success) {
        setCustomers(response.data.customers);
        setDbTiers(response.data.tiers);
      }
    } catch (error) {
      console.error("Lỗi tải khách hàng:", error);
      showToast("Không thể tải dữ liệu", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getDynamicTier = (totalSpent) => {
    const matchedTier = dbTiers.find((t) => totalSpent >= t.minSpent);

    if (matchedTier) {
      return matchedTier;
    }
    return { id: "none", name: "Chưa có hạng", color: "#9ca3af" };
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      2500,
    );
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const executeConfirmAction = async () => {
    try {
      const { customerId, newStatus } = confirmModal;

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/customers/${customerId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, status: newStatus } : c,
        ),
      );
      showToast(
        newStatus === "banned" ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!",
        "success",
      );
    } catch {
      showToast("Có lỗi xảy ra!", "error");
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const renderOrderStatus = (status) => {
    switch (status) {
      case "processing":
        return (
          <span className="text-blue-600 font-bold text-xs uppercase">
            Đang giao
          </span>
        );
      case "completed":
        return (
          <span className="text-green-600 font-bold text-xs uppercase">
            Hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="text-red-500 font-bold text-xs uppercase">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="text-gray-500 font-bold text-xs uppercase">
            {status}
          </span>
        );
    }
  };

  // LỌC DỮ LIỆU
  const filteredCustomers = customers.filter((c) => {
    // 1. Trạng thái tài khoản
    if (filterStatus !== "all" && c.status !== filterStatus) return false;

    // 2. Hạng thành viên
    if (filterTier !== "all" && getDynamicTier(c.totalSpent).id !== filterTier)
      return false;

    // 3. Ngày tham gia
    const joined = parseDate(c.joinedDate);
    if (filterDateFrom && joined) {
      if (joined < new Date(filterDateFrom)) return false;
    }
    if (filterDateTo && joined) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59);
      if (joined > to) return false;
    }

    // 4. Tìm kiếm
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSendEmail = async () => {
    if (!emailModal.subject.trim() || !emailModal.message.trim()) {
      showToast("Vui lòng nhập đầy đủ Tiêu đề và Nội dung!", "error");
      return;
    }

    try {
      setEmailModal((prev) => ({ ...prev, isSending: true }));
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/api/customers/send-email`,
        {
          email: emailModal.customerEmail,
          subject: emailModal.subject,
          message: emailModal.message,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      showToast("Đã gửi email thành công!", "success");
      setEmailModal({
        isOpen: false,
        customerEmail: "",
        customerName: "",
        subject: "",
        message: "",
        isSending: false,
      });
    } catch (error) {
      showToast("Lỗi khi gửi email!", "error");
      setEmailModal((prev) => ({ ...prev, isSending: false }));
    }
  };

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <div className="flex w-full max-w-[1536px] h-full p-4 lg:p-6 gap-4 lg:gap-6">
        {/* SIDEBAR BỘ LỌC */}
        <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-4 pr-1">
          {/* -- Tìm kiếm -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Tên, SĐT, Email..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* -- Lọc trạng thái tài khoản -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Trạng thái tài khoản
            </h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Đang hoạt động" },
                { value: "banned", label: "Đã khóa" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilterStatus(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${filterStatus === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* -- Lọc hạng thành viên -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Hạng thành viên
            </h3>
            <div className="space-y-0.5 text-sm">
              <button
                onClick={() => setFilterTier("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium ${filterTier === "all" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span>Tất cả</span>
              </button>

              {dbTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setFilterTier(tier.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${filterTier === tier.id ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: tier.color }}>{tier.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      ≥ {formatPrice(tier.minSpent)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* -- Lọc theo ngày tham gia -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Ngày tham gia
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  min={filterDateFrom}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="w-full text-xs text-gray-500 hover:text-red-500 font-medium cursor-pointer py-1 transition-colors flex items-center justify-center gap-1 hover:bg-red-50 rounded-lg"
                >
                  <Icons.Delete className="w-4 h-4" />
                  Xóa bộ lọc ngày
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG DỮ LIỆU */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 bg-white shrink-0">
            <h2 className="text-xl font-bold text-gray-800">
              Danh sách Khách hàng
            </h2>
          </div>

          {/* Bảng */}
          <div className="flex-1 overflow-auto bg-gray-50/30 relative">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-gray-50 text-gray-700 z-10 text-sm">
                <tr>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Khách hàng
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Liên hệ
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-32 whitespace-nowrap">
                    Hạng thành viên
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-28 whitespace-nowrap">
                    Số đơn hàng
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-right">
                    Tổng chi tiêu
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-32">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      Không tìm thấy khách hàng nào.
                    </td>
                  </tr>
                ) : (
                  currentCustomers.map((customer) => {
                    const isExpanded = expandedRows.includes(customer.id);
                    const currentTier = getDynamicTier(customer.totalSpent);
                    return (
                      <React.Fragment key={customer.id}>
                        {/* Dòng chính */}
                        <tr
                          onClick={() => toggleRow(customer.id)}
                          className={`cursor-pointer transition-colors border-b border-gray-200
                            ${isExpanded ? "bg-blue-50/50" : "hover:bg-gray-50 bg-white"}
                            ${customer.status === "banned" ? "opacity-60" : ""}`}
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-900">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Mã: {customer.id} · Tham gia:{" "}
                              {customer.joinedDate}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-800">
                              {customer.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {customer.email}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              style={{
                                backgroundColor: `${currentTier.color}20`,
                                color: currentTier.color,
                                borderColor: currentTier.color,
                              }}
                              className="px-2.5 py-1 rounded text-xs font-bold uppercase whitespace-nowrap border"
                            >
                              {currentTier.name}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-gray-800">
                            {customer.totalOrders}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-gray-800">
                            {formatPrice(customer.totalSpent)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {customer.status === "active" ? (
                              <span className="whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold uppercase bg-green-100 text-green-600 border border-green-200">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold uppercase bg-red-100 text-red-400 border border-red-200">
                                Đã khóa
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Dòng chi tiết */}
                        {isExpanded && (
                          <tr className="bg-[#f8fafc] border-b-2 border-blue-200 shadow-inner">
                            <td colSpan="6" className="p-6">
                              <div className="flex flex-col xl:flex-row gap-6">
                                {/* Thông tin chi tiết */}
                                <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase text-xs tracking-wider">
                                    Thông tin chi tiết
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Họ và tên:
                                      </span>
                                      <span className="font-bold text-gray-900">
                                        {customer.name}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Số điện thoại:
                                      </span>
                                      <span className="font-medium text-gray-700">
                                        {customer.phone}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Email:
                                      </span>
                                      <span className="font-medium text-gray-700">
                                        {customer.email}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Hạng:
                                      </span>
                                      <span
                                        style={{
                                          backgroundColor: `${currentTier.color}20`,
                                          color: currentTier.color,
                                          borderColor: currentTier.color,
                                        }}
                                        className="px-2.5 py-1 rounded text-xs font-bold uppercase whitespace-nowrap border"
                                      >
                                        {currentTier.name}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Tham gia từ:
                                      </span>
                                      <span className="text-gray-800">
                                        {customer.joinedDate}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Địa chỉ:
                                      </span>
                                      <span className="text-gray-800">
                                        {customer.address}
                                      </span>
                                    </div>
                                    <div className="flex mt-2">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Lần mua cuối:
                                      </span>
                                      <span className="text-gray-800 font-bold">
                                        {customer.lastOrderDate}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Số địa chỉ lưu:
                                      </span>
                                      <span className="text-gray-800">
                                        {customer.savedAddresses} địa chỉ
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Tổng chi tiêu:
                                      </span>
                                      <span className="text-gray-800 font-bold">
                                        {formatPrice(customer.totalSpent)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Lịch sử đơn hàng */}
                                <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase text-xs tracking-wider flex justify-between">
                                    <span>Đơn hàng gần đây</span>
                                    <span
                                      onClick={() =>
                                        navigate(
                                          `/admin/orders?search=${customer.phone}`,
                                        )
                                      }
                                      className="text-blue-600 cursor-pointer hover:underline normal-case font-normal"
                                    >
                                      Xem tất cả
                                    </span>
                                  </h4>
                                  <div className="space-y-3">
                                    {customer.recentOrders?.length > 0 ? (
                                      customer.recentOrders.map(
                                        (order, idx) => (
                                          <div
                                            key={idx}
                                            className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                                          >
                                            <div>
                                              <p className="font-bold text-blue-600 cursor-pointer hover:underline">
                                                {order.id}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">
                                                {order.date}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-bold text-gray-800">
                                                {formatPrice(order.total)}
                                              </p>
                                              <p className="mt-1">
                                                {renderOrderStatus(
                                                  order.status,
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        ),
                                      )
                                    ) : (
                                      <p className="text-gray-500 text-sm italic">
                                        Khách hàng chưa có đơn hàng nào.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Thao tác */}
                                <div className="w-full xl:w-48 shrink-0 flex flex-col gap-3">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-1 uppercase text-xs tracking-wider text-center xl:text-left">
                                    Quản trị
                                  </h4>
                                  {customer.status === "active" ? (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "ban",
                                          customerId: customer.id,
                                          newStatus: "banned",
                                          title: "Cảnh báo khóa tài khoản",
                                          message: `Bạn có chắc chắn muốn khóa tài khoản của khách hàng ${customer.name}?`,
                                        })
                                      }
                                      className="w-full py-2.5 bg-red-50 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
                                    >
                                      Khóa tài khoản
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "unban",
                                          customerId: customer.id,
                                          newStatus: "active",
                                          title: "Mở khóa tài khoản",
                                          message: `Khôi phục quyền truy cập cho khách hàng ${customer.name}?`,
                                        })
                                      }
                                      className="w-full py-2.5 bg-green-50 border border-green-300 text-green-700 hover:bg-green-600 hover:text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
                                    >
                                      Mở khóa tài khoản
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      setEmailModal({
                                        isOpen: true,
                                        customerEmail: customer.email,
                                        customerName: customer.name,
                                        subject: "",
                                        message: "",
                                        isSending: false,
                                      })
                                    }
                                    className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
                                  >
                                    Gửi Email
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-between items-center text-sm text-gray-600 shrink-0">
            <span className="font-medium">
              Hiển thị{" "}
              <span className="font-semibold text-gray-800">
                {filteredCustomers.length}
              </span>{" "}
              / {customers.length} khách hàng
            </span>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button className="px-2.5 bg-blue-600 text-white rounded-md font-bold shadow-sm">
                {currentPage}
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-2  border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.actionType === "ban" ? "danger" : "primary"}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeConfirmAction}
      />

      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[200] px-6 py-3.5 rounded-lg shadow-xl font-medium text-white transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}
      {/* --- MODAL GỬI EMAIL --- */}
      {emailModal.isOpen && (
        <div className="fixed bottom-0 right-6 z-[100] drop-shadow-xl">
          <div className="bg-white rounded-t-xl w-[360px] border border-gray-200 overflow-hidden flex flex-col shadow-2xl">
            <div className="px-4 py-1.5 bg-blue-600 text-white border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-medium text-sm truncate w-56">
                Gửi Email đến: {emailModal.customerName} <br />
                <span className="text-xs text-blue-100 truncate w-[230px] leading-tight">
                  {emailModal.customerEmail}
                </span>
              </h3>
              <button
                onClick={() => setEmailModal({ ...emailModal, isOpen: false })}
                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) =>
                    setEmailModal({ ...emailModal, subject: e.target.value })
                  }
                  placeholder="Nhập tiêu đề email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </label>
                <textarea
                  rows="5"
                  value={emailModal.message}
                  onChange={(e) =>
                    setEmailModal({ ...emailModal, message: e.target.value })
                  }
                  placeholder="Kính gửi quý khách..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEmailModal({ ...emailModal, isOpen: false })}
                className="px-4 py-2 font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-colors text-sm cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailModal.isSending}
                className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {emailModal.isSending ? "Đang gửi..." : "Gửi Email ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
