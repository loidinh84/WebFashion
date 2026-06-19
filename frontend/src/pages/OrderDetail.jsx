import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BASE_URL from "../config/api";
import * as Icons from "../assets/icons/index";
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

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price || 0);

// Component vẽ đường đi thực tế theo đường phố (OSRM – miễn phí, không cần API key)
const RouteLayer = ({ from, to }) => {
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    if (!from || !to) return;
    const [fromLat, fromLng] = from;
    const [toLat, toLng] = to;

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes && data.routes[0]) {
          // OSRM trả về [lng, lat] → đảo lại thành [lat, lng] cho Leaflet
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng],
          );
          setRoutePoints(coords);
        }
      })
      .catch(() => {
        // Nếu API lỗi, dùng đường thẳng fallback
        setRoutePoints([from, to]);
      });
  }, [JSON.stringify(from), JSON.stringify(to)]);

  if (routePoints.length < 2) return null;
  return (
    <Polyline
      positions={routePoints}
      pathOptions={{ color: "#ee4d2d", weight: 4, opacity: 0.9 }}
    />
  );
};

// Auto-fit bản đồ để hiển cả hai điểm khi coords cập nhật
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length >= 2) {
      map.fitBounds(valid, { padding: [50, 50], maxZoom: 15 });
    } else if (valid.length === 1) {
      map.flyTo(valid[0], 14, { duration: 0.5 });
    }
  }, [JSON.stringify(points)]);
  return null;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [destCoords, setDestCoords] = useState(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/taikhoan/order-detail/${id}`,
        );
        const data = await response.json();
        setOrder(data);
        setLoading(false);

        // Geocode địa chỉ giao hàng - thử từng mức chi tiết
        if (data.dia_chi) {
          const { dia_chi_cu_the, phuong_xa, quan_huyen, tinh_thanh } =
            data.dia_chi;
          // Thử lần lượt từ đầy đủ → bớt dần để tăng khả năng tìm thấy
          const addressCandidates = [
            [dia_chi_cu_the, phuong_xa, quan_huyen, tinh_thanh]
              .filter(Boolean)
              .join(", "),
            [phuong_xa, quan_huyen, tinh_thanh].filter(Boolean).join(", "),
            [quan_huyen, tinh_thanh].filter(Boolean).join(", "),
            tinh_thanh,
          ].filter(Boolean);
          for (const addr of addressCandidates) {
            try {
              const geo = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1&countrycodes=vn`,
                { headers: { "Accept-Language": "vi" } },
              );
              const geoData = await geo.json();
              if (geoData.length > 0) {
                setDestCoords([
                  parseFloat(geoData[0].lat),
                  parseFloat(geoData[0].lon),
                ]);
                break;
              }
            } catch {
              // bỏ qua lỗi
            }
          }
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Không tìm thấy đơn hàng!
      </div>
    );

  const steps = [
    { key: "pending", label: "Đơn Hàng Đã Đặt" },
    { key: "confirmed", label: "Đã Xác Nhận Thông Tin Thanh Toán" },
    { key: "shipping", label: "Đã Giao Cho ĐVVC" },
    { key: "delivered", label: "Đã Nhận Được Hàng" },
    { key: "completed", label: "Đánh Giá" },
  ];

  const statusIndex = {
    pending: 0,
    confirmed: 1,
    shipping: 2,
    delivered: 3,
    completed: 4,
    cancelled: -1,
  };

  const currentStepIndex = statusIndex[order.trang_thai] ?? 0;

  const rawGD = order.giao_dich;
  const giaoDich = Array.isArray(rawGD) ? rawGD[0] || {} : rawGD || {};

  const isPaid =
    giaoDich.trang_thai === "success" ||
    ["delivered", "completed"].includes(order.trang_thai);
  const paymentMethodName =
    giaoDich.phuong_thuc?.ten_phuong_thuc || "Thanh toán khi nhận hàng";
  const isCod =
    !giaoDich.phuong_thuc ||
    giaoDich.phuong_thuc?.loai === "cod" ||
    paymentMethodName.toLowerCase().includes("nhận hàng") ||
    paymentMethodName.toLowerCase().includes("cod");

  const trackingHistory = (() => {
    const dbLogs = order.lich_su_giao_hang || [];

    if (dbLogs.some((log) => log.tieu_de === "Đơn Hàng Đã Đặt")) {
      return dbLogs;
    }

    // Với các đơn hàng cũ hoặc chưa có log khởi tạo, thêm các mốc cơ bản
    const baseLogs = [
      {
        thoi_gian: order.created_at,
        tieu_de: "Đơn hàng đã đặt",
        mo_ta: "Đơn hàng đã được đặt thành công.",
      },
    ];

    if (order.trang_thai !== "pending" && order.trang_thai !== "cancelled") {
      const confirmedDate = new Date(
        new Date(order.created_at).getTime() + 1000,
      ).toISOString();
      baseLogs.push({
        thoi_gian: confirmedDate,
        tieu_de: "Đã xác nhận đơn hàng",
        mo_ta: "Cửa hàng đang chuẩn bị hàng.",
      });
    }

    if (["shipping", "delivered", "completed"].includes(order.trang_thai)) {
      const shippingDate = new Date(
        new Date(order.created_at).getTime() + 2000,
      ).toISOString();
      baseLogs.push({
        thoi_gian: order.updated_at || shippingDate,
        tieu_de: "Đã giao cho đơn vị vận chuyển",
      });
    }
    const combined = [...dbLogs];
    baseLogs.forEach((base) => {
      if (!combined.some((c) => c.tieu_de === base.tieu_de)) {
        combined.push(base);
      }
    });
    return combined.sort(
      (a, b) =>
        new Date(b.thoi_gian).getTime() - new Date(a.thoi_gian).getTime(),
    );
  })();

  const renderStepper = () => {
    if (order.trang_thai === "cancelled") {
      return (
        <div className="bg-white p-8 rounded-sm shadow-sm mb-4 border border-[#ee4d2d]">
          <h2 className="text-xl font-medium text-[#ee4d2d] text-center">
            Đơn Hàng Đã Hủy
          </h2>
        </div>
      );
    }

    return (
      <div className="bg-white p-8 rounded-sm mb-4">
        <div className="flex justify-between items-start relative">
          <div className="absolute left-0 top-6 w-full h-1 bg-gray-200 z-0"></div>
          <div
            className="absolute left-0 top-6 h-1 bg-[#26aa99] z-0 transition-all duration-500"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          ></div>

          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            return (
              <div
                key={index}
                className="relative z-10 flex flex-col items-center w-24"
              >
                <div
                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center bg-white ${
                    isCompleted
                      ? "border-[#26aa99] text-[#26aa99]"
                      : "border-gray-300 text-gray-300"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {index === 0 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    )}
                    {index === 1 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    )}
                    {index === 2 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                      />
                    )}
                    {index === 3 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    )}
                    {index === 4 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    )}
                  </svg>
                </div>
                <span
                  className={`mt-3 text-sm whitespace-nowrap text-center ${isCompleted ? "text-gray-800" : "text-gray-400"}`}
                >
                  {step.label}
                </span>
                {isCompleted && index === currentStepIndex && (
                  <span className="text-xs text-gray-400 mt-1">
                    {
                      new Date(order.updated_at || order.created_at)
                        .toLocaleString("vi-VN")
                        .split(" ")[1]
                    }
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 max-w-[1200px] py-6 flex-grow">
        {/* Header bar */}
        <div className="bg-white p-4 flex justify-between items-center rounded-sm shadow-sm mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-500 transition text-lg gap-1.5 cursor-pointer  "
          >
            <Icons.ArrowForward className="w-5 h-5 rotate-180" />
            Trở lại
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[15px] text-gray-800 ">
              Mã Đơn Hàng: {order.ma_don_hang || order.id}
            </span>
            <span className="text-[#ee4d2d] font-medium text-sm border-l border-gray-300 pl-3">
              {order.trang_thai === "pending" && "Chờ xác nhận"}
              {order.trang_thai === "confirmed" && "Đã xác nhận"}
              {order.trang_thai === "shipping" && "Đang giao"}
              {order.trang_thai === "delivered" && "Đã giao hàng"}
              {order.trang_thai === "completed" && "Hoàn thành"}
              {order.trang_thai === "cancelled" && "Đã hủy"}
            </span>
          </div>
        </div>

        {renderStepper()}

        <div className="bg-white rounded-sm shadow-sm">
          <div className="p-6 flex flex-col md:flex-row gap-8">
            {/* Địa chỉ */}
            <div className="flex-1 border-r border-gray-100 pr-4">
              <h3 className="text-xl text-gray-800 mb-4 capitalize">
                Địa Chỉ Nhận Hàng
              </h3>
              <div className="text-gray-600 text-sm space-y-2">
                <p className="font-bold text-gray-800 text-base">
                  {order.dia_chi?.ho_ten_nguoi_nhan || "Khách hàng"}
                </p>
                <p className="text-gray-500">
                  {order.dia_chi?.so_dien_thoai || "Chưa cập nhật"}
                </p>
                <p>
                  {order.dia_chi
                    ? `${order.dia_chi.dia_chi_cu_the}, ${order.dia_chi.phuong_xa}, ${order.dia_chi.quan_huyen}, ${order.dia_chi.tinh_thanh}`
                    : "Không có thông tin địa chỉ"}
                </p>
              </div>
            </div>

            {/* Tracking */}
            <div className="flex-[2]">
              <div className="flex justify-between items-end mb-4">
                <div className="text-sm font-medium text-gray-800 border-b-2 border-[#ee4d2d] pb-2 inline-block">
                  Lịch Sử Giao Hàng
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {order.don_vi_vc?.ten_don_vi || "Giao hàng tiêu chuẩn"}
                  {order.ma_van_don && (
                    <>
                      <br />
                      Mã vận đơn: {order.ma_van_don}
                    </>
                  )}
                </div>
              </div>

              {/* Map block if shipping */}
              {order.trang_thai === "shipping" &&
                (() => {
                  const waypoints = (order.lich_su_giao_hang || [])
                    .filter((l) => l.lat && l.lng)
                    .map((l) => [parseFloat(l.lat), parseFloat(l.lng)]);
                  const latestPos =
                    waypoints.length > 0
                      ? waypoints[0]
                      : destCoords || [10.0311, 105.7903];
                  return (
                    <div className="h-72 bg-gray-100 mb-6 rounded-md overflow-hidden border border-gray-200">
                      <MapContainer
                        center={latestPos}
                        zoom={14}
                        scrollWheelZoom={true}
                        className="h-full w-full z-0 relative"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        <FitBounds
                          points={[
                            ...(waypoints.length > 0 ? [waypoints[0]] : []),
                            destCoords,
                          ]}
                        />
                        {waypoints.length > 0 && destCoords && (
                          <RouteLayer from={waypoints[0]} to={destCoords} />
                        )}

                        {/* Marker các waypoint */}
                        {waypoints.map((pos, i) => (
                          <Marker key={`wp-${i}`} position={pos}>
                            <Popup>
                              {i === 0 ? (
                                <span className="text-[#26aa99] font-medium">
                                  Shipper đang ở đây
                                </span>
                              ) : (
                                `Điểm ${waypoints.length - i}`
                              )}
                            </Popup>
                          </Marker>
                        ))}

                        {/* Marker địa chỉ đích */}
                        {destCoords && (
                          <Marker
                            position={destCoords}
                            icon={L.divIcon({
                              className: "",
                              html: `<div style="background:#ee4d2d;color:white;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:14px">O</span></div>`,
                              iconSize: [28, 28],
                              iconAnchor: [14, 28],
                            })}
                          >
                            <Popup>
                              <div className="flex items-center gap-1 font-bold text-[#ee4d2d]">
                                <Icons.Location className="w-4 h-4" />
                                <span>Địa chỉ giao hàng</span>
                              </div>
                              <br />
                              {order.dia_chi
                                ? `${order.dia_chi.dia_chi_cu_the}, ${order.dia_chi.phuong_xa}`
                                : "Nhà bạn"}
                            </Popup>
                          </Marker>
                        )}

                        {waypoints.length === 0 && !destCoords && (
                          <Marker position={latestPos}>
                            <Popup>Đang cập nhật vị trí shipper...</Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                  );
                })()}

              <div className="relative border-l-[2px] border-gray-200 ml-3 space-y-8 pb-4 mt-8">
                {trackingHistory.map((log, index) => (
                  <div
                    key={index}
                    className="relative z-10 flex gap-4 pl-8 items-start"
                  >
                    <div
                      className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${index === 0 ? "bg-[#26aa99] text-white ring-4 ring-green-100" : "bg-gray-300"}`}
                    >
                      {index === 0 ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-full">
                      <div className="text-sm text-gray-500 w-32 shrink-0">
                        {new Date(log.thoi_gian).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${index === 0 ? "text-[#26aa99] font-medium" : "text-gray-800"}`}
                        >
                          {log.tieu_de}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {log.mo_ta}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="bg-white rounded-sm shadow-sm mb-4 p-6">
          <div className="space-y-4">
            {order.chi_tiet?.map((item, index) => {
              const imageUrl = item.bien_the?.san_pham?.hinh_anh?.[0]?.url_anh
                ? `${BASE_URL}${item.bien_the.san_pham.hinh_anh[0].url_anh}`
                : "https://via.placeholder.com/150";

              return (
                <div
                  key={index}
                  className="flex gap-4 items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <img
                    src={imageUrl}
                    alt={item.ten_sp_luc_mua}
                    className="w-20 h-20 object-contain border border-gray-100"
                  />
                  <div className="flex-1">
                    <h4 className="text-gray-800 text-base line-clamp-2">
                      {item.ten_sp_luc_mua}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Phân loại hàng: {item.bien_the?.mau_sac || "Mặc định"}
                      {item.bien_the?.dung_luong
                        ? ` - ${item.bien_the.dung_luong}`
                        : ""}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      x{item.so_luong}
                    </p>
                  </div>
                  <div className="text-right flex items-center justify-end h-20">
                    <span className="text-[#ee4d2d] text-sm">
                      {formatPrice(item.don_gia)}₫
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="bg-white rounded-sm shadow-sm flex flex-col items-end">
          <div className="w-full md:w-[450px] border-l border-gray-100">
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 border-dotted">
              <span className="text-sm text-gray-500">Tổng tiền hàng</span>
              <span className="text-sm text-gray-800">
                {formatPrice(order.tong_tien_hang)}₫
              </span>
            </div>
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 border-dotted">
              <span className="text-sm text-gray-500">Phí vận chuyển</span>
              <span className="text-sm text-gray-800">
                {formatPrice(order.phi_van_chuyen)}₫
              </span>
            </div>
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 border-dotted">
              <span className="text-sm text-gray-500">Giảm giá</span>
              <span className="text-sm text-gray-800">
                -{formatPrice(order.tien_giam_gia) || 0}₫
              </span>
            </div>
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 border-dotted">
              <span className="text-sm text-gray-500">Thành tiền</span>
              <span className="text-2xl font-medium text-[#ee4d2d]">
                {formatPrice(order.tong_thanh_toan)}₫
              </span>
            </div>
            {isPaid ? (
              <div className="flex items-center justify-between px-3 py-2 bg-green-50 border-t border-dashed border-green-400 text-sm text-green-800 font-medium">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Đơn hàng đã được thanh toán thành công.{" "}
                </div>
                <div className="whitespace-nowrap">
                  Cần thanh toán:{" "}
                  <strong className="text-green-600 text-base ml-1">0₫</strong>
                </div>
              </div>
            ) : isCod ? (
              <div className="flex items-center justify-between px-3 py-2 bg-[#fffaf9] border-t border-dashed border-orange-400 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  Vui lòng thanh toán khi nhận hàng.
                </div>
                <div>
                  Cần thanh toán:{" "}
                  <strong className="text-[#ee4d2d] text-base ml-1">
                    {formatPrice(order.tong_thanh_toan)}₫
                  </strong>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 border-t border-dashed border-yellow-400 text-sm text-yellow-800 font-medium">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-600 animate-pulse shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Đang chờ xác nhận chuyển khoản.
                </div>
                <div>
                  Cần thanh toán:{" "}
                  <strong className="text-yellow-600 text-base ml-1">0₫</strong>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center px-3 py-2">
              <span className="text-sm text-gray-500">
                Phương thức Thanh toán
              </span>
              <span className="text-sm text-gray-800 font-medium">
                {paymentMethodName}
              </span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
