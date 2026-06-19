import React, { useEffect, useState } from "react";
import * as Icons from "../../assets/icons/index";
import ConfirmModal from "./ConfirmModal";
import axios from "axios";
import BASE_URL from "../../config/api";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { useReactToPrint } from "react-to-print";
import InvoiceTemplate from "./InvoiceTemplate";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

registerLocale("vi", vi);

const API_URL = BASE_URL;

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price || 0);

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Component bản đồ mini có thể click để chọn tọa độ
const ClickHandler = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

// Sub-component bay tới tọa độ mới khi geocode xong
const FlyToLocation = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
};

const TrackingMapPicker = ({ lat, lng, onPick }) => {
  const defaultCenter = [10.0311, 105.7903]; // Cần Thơ
  const center = lat && lng ? [lat, lng] : defaultCenter;
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onPick={onPick} />
      <FlyToLocation lat={lat} lng={lng} />
      {lat && lng && <Marker position={[lat, lng]} />}
    </MapContainer>
  );
};

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState([]);

  // BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [orderTab, setOrderTab] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState(null);
  const [filterDateTo, setFilterDateTo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const componentRef = React.useRef();
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null,
    orderId: null,
    newStatus: null,
    title: "",
    message: "",
  });

  // --- TRACKING MODAL ---
  const [trackingModal, setTrackingModal] = useState({
    isOpen: false,
    orderId: null, // ma_don_hang
  });
  const [trackingForm, setTrackingForm] = useState({
    tieu_de: "",
    mo_ta: "",
    lat: null,
    lng: null,
  });
  const [trackingAddress, setTrackingAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: orderTab,
        paymentMethod: filterPaymentMethod,
        paymentStatus: filterPaymentStatus,
        fromDate: filterDateFrom ? format(filterDateFrom, "yyyy-MM-dd") : "",
        toDate: filterDateTo ? format(filterDateTo, "yyyy-MM-dd") : "",
      };

      // const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/donHang`, {
        params: params,
        headers: getAuthHeader().headers,
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      console.error(error);
      showToast("Không thể tải danh sách đơn hàng!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [
    currentPage,
    orderTab,
    filterPaymentMethod,
    filterPaymentStatus,
    filterDateFrom,
    filterDateTo,
    debouncedSearchTerm,
  ]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      2000,
    );
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const executeConfirmAction = async () => {
    try {
      const { orderId, newStatus } = confirmModal;
      await axios.put(
        `${BASE_URL}/api/donHang/${orderId}/status`,
        { trang_thai: newStatus },
        getAuthHeader(),
      );
      fetchOrders();

      let msg = "Cập nhật thành công!";
      if (newStatus === "confirmed") msg = "Đã duyệt đơn hàng thành công!";
      if (newStatus === "delivered") msg = "Xác nhận đã giao hàng thành công!";
      if (newStatus === "cancelled") msg = "Đã hủy đơn hàng!";
      if (newStatus === "refunded")
        msg = "Đã xử lý hoàn tiền/trả hàng thành công!";
      showToast(msg, "success");
    } catch (error) {
      console.error(error);
      showToast("Có lỗi xảy ra khi cập nhật trạng thái!", "error");
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
      setExpandedRows([]);
    }
  };

  // --- HÀM GEOCODING ---
  const handleGeocode = async () => {
    if (!trackingAddress.trim()) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trackingAddress)}&limit=1`,
        { headers: { "Accept-Language": "vi" } },
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        setTrackingForm((f) => ({
          ...f,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        }));
      } else {
        showToast("Không tìm thấy địa chỉ này!", "error");
      }
    } catch {
      showToast("Lỗi kết nối geocoding!", "error");
    } finally {
      setIsGeocoding(false);
    }
  };

  // --- HÀM GỬI TRACKING ---
  const handleSubmitTracking = async () => {
    if (!trackingForm.tieu_de) {
      showToast("Vui lòng nhập tiêu đề!", "error");
      return;
    }
    setIsSubmittingTracking(true);
    try {
      await axios.post(
        `${BASE_URL}/api/donHang/${trackingModal.orderId}/tracking`,
        trackingForm,
        getAuthHeader(),
      );
      showToast("Đã thêm điểm giao hàng thành công!", "success");
      setTrackingModal({ isOpen: false, orderId: null });
      setTrackingForm({ tieu_de: "", mo_ta: "", lat: null, lng: null });
      setTrackingAddress("");
    } catch {
      showToast("Lỗi khi lưu tracking!", "error");
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Chờ xác nhận
          </span>
        );
      case "confirmed":
        return (
          <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Đang xử lý
          </span>
        );
      case "shipping":
        return (
          <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Đang giao
          </span>
        );
      case "delivered":
        return (
          <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Hoàn thành
          </span>
        );
      case "refunded":
        return (
          <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Hoàn tiền
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `HoaDon_${selectedOrderForPrint?.id || "LTL_Store"} `,
  });

  const [shouldPrint, setShouldPrint] = useState(false);

  React.useEffect(() => {
    if (shouldPrint && selectedOrderForPrint) {
      const timer = setTimeout(() => {
        handlePrint();
        setShouldPrint(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, selectedOrderForPrint]);

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <div className="flex w-full max-w-[1536px] h-full p-4 lg:p-6 gap-4 lg:gap-4">
        {/* CỘT TRÁI: BỘ LỌC */}
        <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-4 pr-1">
          {/* -- Tìm kiếm -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Mã đơn, tên, SĐT..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* -- Lọc trạng thái đơn -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Trạng thái đơn hàng
            </h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "pending", label: "Chờ xác nhận" },
                { value: "confirmed", label: "Đang xử lý" },
                { value: "shipping", label: "Đang giao" },
                { value: "delivered", label: "Hoàn thành" },
                { value: "refunded", label: "Trả hàng/Hoàn tiền" },
                { value: "cancelled", label: "Đã hủy" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setOrderTab(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${orderTab === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* -- Lọc phương thức thanh toán -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Phương thức thanh toán
            </h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "COD", label: "COD (Tiền mặt)" },
                { value: "Chuyển khoản", label: "Chuyển khoản" },
                { value: "VNPAY", label: "Ví điện tử" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilterPaymentMethod(item.value)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${filterPaymentMethod === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* -- Lọc trạng thái thanh toán -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              Trạng thái thanh toán
            </h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "Đã thanh toán", label: "Đã thanh toán" },
                { value: "Chưa thanh toán", label: "Chưa thanh toán" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilterPaymentStatus(item.value)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${filterPaymentStatus === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* -- Lọc theo ngày -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Thời gian</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Từ ngày
                </label>
                <DatePicker
                  selected={filterDateFrom}
                  onChange={(date) => setFilterDateFrom(date)}
                  selectsStart
                  startDate={filterDateFrom}
                  endDate={filterDateTo}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  placeholderText="dd/mm/yyyy"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Đến ngày
                </label>
                <DatePicker
                  selected={filterDateTo}
                  onChange={(date) => setFilterDateTo(date)}
                  selectsEnd
                  startDate={filterDateFrom}
                  endDate={filterDateTo}
                  minDate={filterDateFrom}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  placeholderText="dd/mm/yyyy"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="w-full text-xs text-gray-500 hover:text-red-500 font-medium cursor-pointer py-1 transition-colors flex items-center justify-center gap-1 border border-gray-200 rounded-lg"
                >
                  <Icons.Delete className="w-4 h-4" /> Xóa bộ lọc ngày
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
              Danh sách Đơn hàng
            </h2>
          </div>

          {/* Tab trạng thái đơn */}
          <div className="px-6 bg-white border-b border-gray-100 flex gap-6 text-sm font-medium shrink-0 overflow-x-auto hide-scrollbar">
            {[
              { id: "all", label: "Tất cả đơn" },
              { id: "pending", label: "Chờ xác nhận" },
              { id: "confirmed", label: "Đang xử lý" },
              { id: "shipping", label: "Đang giao" },
              { id: "delivered", label: "Hoàn thành" },
              { id: "refunded", label: "Trả hàng/Hoàn tiền" },
              { id: "cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOrderTab(tab.id)}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${orderTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bảng */}
          <div className="flex-1 overflow-auto bg-gray-50/30 relative">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-gray-50 text-gray-600 z-10 text-sm">
                <tr>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Mã đơn hàng
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Khách hàng
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Ngày đặt
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-right">
                    Tổng tiền
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center">
                    Thanh toán
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center">
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      Không tìm thấy đơn hàng nào.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isExpanded = expandedRows.includes(order.id);
                    return (
                      <React.Fragment key={order.id}>
                        {/* Dòng chính */}
                        <tr
                          onClick={() => toggleRow(order.id)}
                          className={`cursor-pointer transition-colors border-b border-gray-200 ${isExpanded
                            ? "bg-blue-50/50"
                            : "hover:bg-blue-50/30 bg-white"
                            } ${order.orderStatus === "cancelled" ? "opacity-60" : ""}`}
                        >
                          <td className="py-4 px-6 font-bold text-blue-600">
                            {order.id}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-gray-900">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {order.phone}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {order.date}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-gray-800">
                            {formatPrice(order.total)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <p className="font-medium text-gray-800 text-xs">
                              {order.paymentMethod}
                            </p>
                            <p
                              className={`text-[10px] font-bold mt-1 uppercase ${order.paymentStatus === "Đã thanh toán" ? "text-green-600" : "text-orange-500"}`}
                            >
                              {order.paymentStatus}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {renderStatusBadge(order.orderStatus)}
                          </td>
                        </tr>

                        {/* Dòng chi tiết mở rộng */}
                        {isExpanded && (
                          <tr className="bg-[#f8fafc] border-b-2 border-blue-200 shadow-inner">
                            <td colSpan="6" className="p-6">
                              <div className="flex flex-col xl:flex-row gap-6">
                                <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-4  text-sm tracking-wider">
                                    Thông tin giao hàng
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Phương thức:
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        {order.paymentMethod}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Trạng thái:
                                      </span>
                                      <span
                                        className={`font-bold text-xs ${order.paymentStatus ===
                                          "Đã thanh toán"
                                          ? "text-green-600"
                                          : "text-amber-600"
                                          }`}
                                      >
                                        {order.paymentStatus}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Người nhận:
                                      </span>
                                      <span className="font-bold text-gray-900">
                                        {order.customerName}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Điện thoại:
                                      </span>
                                      <span className="font-bold text-gray-900">
                                        {order.phone}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="text-gray-500 w-28 font-medium">
                                        Địa chỉ:
                                      </span>
                                      <span className="text-gray-800">
                                        {order.address}
                                      </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                                      <span className="text-gray-500 block mb-1 font-medium">
                                        Ghi chú khách hàng:
                                      </span>
                                      <div className="p-2 bg-yellow-50 rounded-lg text-gray-600 italic">
                                        {order.note ||
                                          "Không có ghi chú cho đơn hàng này."}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Panel lịch sử trạng thái */}
                                <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm min-w-[220px]">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-4 text-sm tracking-wider">
                                    Lịch sử trạng thái
                                  </h4>
                                  {!order.lichSu || order.lichSu.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4">Chưa có lịch sử.</p>
                                  ) : (
                                    <ol className="relative border-l-2 border-gray-200 ml-2 space-y-0">
                                      {order.lichSu.map((ls, idx) => (
                                        <li key={ls.id} className="mb-4 ml-4">
                                          <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full border-2 ${idx === 0 ? "bg-blue-500 border-blue-300" : "bg-white border-gray-300"}`} />
                                          <div className={`p-2.5 rounded-lg border text-xs ${idx === 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`}>
                                            <p className={`font-bold mb-0.5 ${idx === 0 ? "text-blue-700" : "text-gray-700"}`}>
                                              {ls.tieuDe}
                                            </p>
                                            {ls.moTa && (
                                              <p className="text-gray-500 leading-snug mb-1">{ls.moTa}</p>
                                            )}
                                            <p className={`font-mono text-[10px] ${idx === 0 ? "text-blue-500" : "text-gray-400"}`}>
                                              {ls.thoiGian}
                                            </p>
                                          </div>
                                        </li>
                                      ))}
                                    </ol>
                                  )}
                                </div>

                                <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4  text-sm tracking-wider">
                                    Sản phẩm đặt mua
                                  </h4>
                                  <div className="space-y-3">
                                    {order.items?.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                                      >
                                        <div>
                                          <p className="font-semibold text-gray-800">
                                            {item.name}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Phân loại: {item.variant}{" "}
                                            <span className="mx-2">|</span> SL:{" "}
                                            <span className="font-bold">
                                              {item.qty}
                                            </span>
                                          </p>
                                          <span className="font-medium text-red-500">
                                            {formatPrice(item.price)}
                                          </span>
                                        </div>
                                        <p className="font-bold text-blue-600">
                                          {formatPrice(item.price * item.qty)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">
                                        Tạm tính:
                                      </span>
                                      <span className="font-medium text-gray-800">
                                        {formatPrice(
                                          order.items?.reduce(
                                            (total, item) =>
                                              total + item.price * item.qty,
                                            0,
                                          ),
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">
                                        Phí vận chuyển:
                                      </span>
                                      <span className="font-medium text-gray-800">
                                        {formatPrice(
                                          order.shippingFee ||
                                          order.total -
                                          order.items?.reduce(
                                            (total, item) =>
                                              total + item.price * item.qty,
                                            0,
                                          ),
                                        )}
                                      </span>
                                    </div>
                                    {order.discount > 0 && (
                                      <div className="flex justify-between text-sm text-red-500">
                                        <div className="flex flex-col">
                                          <span>Giảm giá:</span>{" "}
                                          <span className="text-[10px] text-gray-400 italic">
                                            {order.voucherCode
                                              ? `(Mã: ${order.voucherCode})`
                                              : "(Ưu đãi hạng thẻ thành viên)"}
                                          </span>
                                        </div>
                                        <span className="font-medium">
                                          -{formatPrice(order.discount)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <span className="font-medium text-gray-900 text-sm">
                                        Tổng thanh toán:
                                      </span>
                                      <span className="text-lg font-medium text-blue-600">
                                        {formatPrice(order.total)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-full xl:w-48 shrink-0 flex flex-col gap-3">
                                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-1 uppercase text-xs tracking-wider text-center xl:text-left">
                                    Thao tác
                                  </h4>

                                  {/* CẢNH BÁO ĐƠN CHUYỂN KHOẢN PENDING */}
                                  {order.orderStatus === "pending" &&
                                    order.paymentMethod?.toLowerCase().includes("chuyển khoản") && (
                                      <div className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-800">
                                        <p className="font-bold mb-1">Chờ xác nhận CK</p>
                                        <p className="leading-snug">Kiểm tra sao kê ngân hàng trước khi duyệt đơn này.</p>
                                      </div>
                                    )}

                                  {order.orderStatus === "pending" && (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "process",
                                          orderId: order.id,
                                          newStatus: "confirmed",
                                          title: order.paymentMethod?.toLowerCase().includes("chuyển khoản")
                                            ? "Xác nhận đã nhận tiền"
                                            : "Xác nhận duyệt đơn",
                                          message: order.paymentMethod?.toLowerCase().includes("chuyển khoản")
                                            ? `Bạn đã kiểm tra sao kê và xác nhận nhận được tiền từ đơn hàng ${order.id}?`
                                            : `Duyệt và chuyển đơn hàng ${order.id} sang trạng thái Đang giao?`,
                                        })
                                      }
                                      className={`w-full py-2.5 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-sm cursor-pointer ${order.paymentMethod?.toLowerCase().includes("chuyển khoản")
                                        ? "bg-amber-500 hover:bg-amber-600"
                                        : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                      {order.paymentMethod?.toLowerCase().includes("chuyển khoản")
                                        ? "Đã nhận tiền – Duyệt đơn"
                                        : "Duyệt đơn này"}
                                    </button>
                                  )}
                                  {order.orderStatus === "confirmed" && (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "ship",
                                          orderId: order.id,
                                          newStatus: "shipping",
                                          title: "Bàn giao vận chuyển",
                                          message: `Đơn hàng ${order.id} đã được giao cho Shipper?`,
                                        })
                                      }
                                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-sm cursor-pointer"
                                    >
                                      Giao hàng
                                    </button>
                                  )}
                                  {order.orderStatus === "shipping" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          setConfirmModal({
                                            isOpen: true,
                                            actionType: "complete",
                                            orderId: order.id,
                                            newStatus: "delivered",
                                            title: "Xác nhận giao thành công",
                                            message: `Đơn hàng ${order.id} đã được giao thành công?`,
                                          })
                                        }
                                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-sm cursor-pointer"
                                      >
                                        Đã giao xong
                                      </button>
                                      <button
                                        onClick={() => {
                                          setTrackingForm({
                                            tieu_de: "",
                                            mo_ta: "",
                                            lat: null,
                                            lng: null,
                                          });
                                          setTrackingAddress("");
                                          setTrackingModal({
                                            isOpen: true,
                                            orderId: order.id,
                                          });
                                        }}
                                        className="w-full py-2.5 bg-blue-50 border border-blue-400 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
                                      >
                                        Thêm Điểm giao hàng
                                      </button>
                                    </>
                                  )}
                                  {order.orderStatus === "cancelled" && (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "refund",
                                          orderId: order.id,
                                          newStatus: "refunded",
                                          title: "Xác nhận Hoàn tiền",
                                          message: `Đơn hàng ${order.id} đã bị hủy. Xác nhận hoàn tiền cho khách hàng?`,
                                        })
                                      }
                                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-sm cursor-pointer"
                                    >
                                      Xác nhận hoàn tiền
                                    </button>
                                  )}
                                  {order.orderStatus === "delivered" && (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          actionType: "return",
                                          orderId: order.id,
                                          newStatus: "refunded",
                                          title:
                                            "Xác nhận Trả hàng & Hoàn tiền",
                                          message: `Bạn đã nhận lại kiện hàng của đơn ${order.id} và đồng ý hoàn tiền cho khách?`,
                                        })
                                      }
                                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors shadow-sm cursor-pointer mt-3"
                                    >
                                      Trả hàng & Hoàn tiền
                                    </button>
                                  )}
                                  {(order.orderStatus === "pending" ||
                                    order.orderStatus === "confirmed") && (
                                      <button
                                        onClick={() =>
                                          setConfirmModal({
                                            isOpen: true,
                                            actionType: "cancel",
                                            orderId: order.id,
                                            newStatus: "cancelled",
                                            title: "Cảnh báo hủy đơn",
                                            message: `Bạn có chắc chắn hủy đơn hàng ${order.id} không?`,
                                          })
                                        }
                                        className="w-full py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer"
                                      >
                                        Hủy đơn hàng
                                      </button>
                                    )}
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForPrint(order);
                                      setShouldPrint(true);
                                    }}
                                    className="w-full py-2.5 bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-bold text-xs uppercase tracking-wide transition-colors mt-auto cursor-pointer"
                                  >
                                    In hóa đơn
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
                {orders.length}
              </span>{" "}
              / {totalItems} đơn hàng
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button className="px-2.5  bg-blue-600 text-white rounded-md font-bold shadow-sm">
                {currentPage}
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
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
        type={confirmModal.actionType === "cancel" ? "danger" : "primary"}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeConfirmAction}
      />

      {/* TRACKING MODAL */}
      {trackingModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-2.5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Thêm Điểm Giao Hàng</h3>
              <button
                onClick={() =>
                  setTrackingModal({ isOpen: false, orderId: null })
                }
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Geocoding */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Tìm kiếm địa chỉ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingAddress}
                    onChange={(e) => setTrackingAddress(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
                    placeholder="Nhập ví trí..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeocoding ? "Đang tìm..." : "Tìm"}
                  </button>
                </div>
              </div>

              {/* Mini Map */}
              <div className="h-56 rounded-lg overflow-hidden border border-gray-200 relative">
                <p className="absolute top-1.5 left-1/2 -translate-x-1/2 z-[500] bg-white/90 px-3 py-1 rounded-full text-xs text-gray-600 shadow whitespace-nowrap">
                  {trackingForm.lat
                    ? `${parseFloat(trackingForm.lat).toFixed(5)}, ${parseFloat(trackingForm.lng).toFixed(5)}`
                    : "Click vào bản đồ để ghim vị trí"}
                </p>
                <TrackingMapPicker
                  lat={trackingForm.lat}
                  lng={trackingForm.lng}
                  onPick={(lat, lng) =>
                    setTrackingForm((f) => ({ ...f, lat, lng }))
                  }
                />
              </div>

              {/* Form */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingForm.tieu_de}
                  onChange={(e) =>
                    setTrackingForm((f) => ({ ...f, tieu_de: e.target.value }))
                  }
                  placeholder="Ví dụ: Đang giao hàng"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={trackingForm.mo_ta}
                  onChange={(e) =>
                    setTrackingForm((f) => ({ ...f, mo_ta: e.target.value }))
                  }
                  placeholder="Ví dụ: Shipper đang trên đường đến nhà bạn"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    setTrackingModal({ isOpen: false, orderId: null })
                  }
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer border border-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitTracking}
                  disabled={isSubmittingTracking}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTracking ? "Đang lưu..." : "Lưu điểm giao hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[200] px-6 py-3.5 rounded-lg shadow-xl font-medium text-white transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}
      {selectedOrderForPrint && (
        <div className="absolute left-[-9999px] top-[-9999px]">
          <InvoiceTemplate ref={componentRef} order={selectedOrderForPrint} />
        </div>
      )}
    </div>
  );
};

export default Order;
