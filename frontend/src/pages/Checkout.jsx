import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import toast, { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import BASE_URL from "../config/api";
import * as Icons from "../assets/icons/index";
import { StoreContext } from "../context/StoreContext";
import { clearSelectedItems } from "../utils/cartHelper";

const Checkout = () => {
  const navigate = useNavigate();
  const { storeConfig } = useContext(StoreContext);
  const { user, updateUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [shippingUnits, setShippingUnits] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Các state quản lý form
  const [tempPaymentMethod, setTempPaymentMethod] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [receiveEmail, setReceiveEmail] = useState(false);
  const [vatRequested, setVatRequested] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [bankName, setBankName] = useState("");
  const [vatErrors, setVatErrors] = useState({});

  const MST_REGEX = /^\d{10}(-\d{3})?$/;

  const validateVat = (info) => {
    const errs = {};
    if (!info.ten_cong_ty.trim()) errs.ten_cong_ty = "Vui lòng nhập tên công ty";
    if (!info.mst.trim()) {
      errs.mst = "Vui lòng nhập mã số thuế";
    } else if (!MST_REGEX.test(info.mst.trim())) {
      errs.mst = "Mã số thuế không đúng định dạng (10 số hoặc 10số-3số)";
    }
    if (!info.dia_chi_cty.trim()) errs.dia_chi_cty = "Vui lòng nhập địa chỉ công ty";
    return errs;
  };
  const [vatInfo, setVatInfo] = useState({
    ten_cong_ty: "",
    mst: "",
    dia_chi_cty: "",
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const selected = cart.filter((item) => item.selected);
    if (selected.length === 0) {
      toast.error("Giỏ hàng trống!");
      return navigate("/cart");
    }
    setCheckoutItems(selected);

    // Kiểm tra tồn kho của các sản phẩm đã chọn trước khi thanh toán
    const checkStockBeforeCheckout = async () => {
      const productIds = [...new Set(selected.map((item) => item.id))];
      try {
        const stockMap = {};
        await Promise.all(
          productIds.map(async (id) => {
            const res = await fetch(`${BASE_URL}/api/sanPham/${id}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.bien_the) {
                data.bien_the.forEach((vt) => {
                  stockMap[vt.id] = vt.ton_kho;
                });
              }
            }
          })
        );

        let hasIssue = false;
        for (const item of selected) {
          const maxStock = stockMap[item.variantId];
          if (maxStock !== undefined) {
            if (maxStock === 0) {
              toast.error(`Sản phẩm "${item.ten_san_pham}" đã hết hàng!`);
              hasIssue = true;
            } else if (item.so_luong > maxStock) {
              toast.error(`Sản phẩm "${item.ten_san_pham}" chỉ còn ${maxStock} sản phẩm ở cửa hàng!`);
              hasIssue = true;
            }
          }
        }

        if (hasIssue) {
          setTimeout(() => navigate("/cart"), 2000);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra tồn kho:", err);
      }
    };

    checkStockBeforeCheckout();

    if (user) {
      // Lấy thông tin tài khoản mới nhất để đồng bộ điểm tích lũy và hạng thẻ thực tế
      fetch(`${BASE_URL}/api/taiKhoan/dashboard/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.userInfo && updateUser) {
            updateUser({
              diem_tich_luy: data.userInfo.diem_tich_luy || 0,
              mau_the: data.userInfo.hang_thanh_vien?.mau_the || "#9ca3af",
              ty_le_giam_gia: data.userInfo.hang_thanh_vien?.ty_le_giam_gia || 0,
              ten_hang: data.userInfo.hang_thanh_vien?.ten_hang,
              ho_ten: data.userInfo.ho_ten,
              so_dien_thoai: data.userInfo.so_dien_thoai,
              anh_dai_dien: data.userInfo.anh_dai_dien,
            });
          }
        })
        .catch((err) => console.error("Lỗi cập nhật thông tin tài khoản:", err));

      // Lấy địa chỉ
      fetch(`${BASE_URL}/api/taiKhoan/diachi/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data);
          setSelectedAddress(
            data.find((a) => a.la_mac_dinh === 1 || a.la_mac_dinh === true) ||
            data[0],
          );
        });

      // Lấy Đơn vị vận chuyển
      fetch(`${BASE_URL}/api/logistics`)
        .then((res) => res.json())
        .then((data) => {
          setShippingUnits(data);
          if (data.length > 0) setSelectedShipping(data[0]);
        });

      // Lấy Phương thức thanh toán
      fetch(`${BASE_URL}/api/payments`)
        .then((res) => res.json())
        .then((data) => {
          setPaymentMethods(data);
          if (data.length > 0) {
            setPaymentMethod(data[0]);
            setTempPaymentMethod(data[0]);
          }
        });
    }
  }, [user?.id, navigate]);

  // Lấy tên ngân hàng từ BIN code qua VietQR API
  useEffect(() => {
    const bin = storeConfig?.vietqr_bank_bin;
    if (!bin) return;
    fetch("https://api.vietqr.io/v2/banks")
      .then((r) => r.json())
      .then((res) => {
        if (res.code === "00") {
          const found = res.data.find((b) => b.bin === bin);
          if (found) {
            setBankName(`${found.shortName} - ${found.name}`);
          } else {
            setBankName(bin);
          }
        }
      })
      .catch(() => setBankName(bin));
  }, [storeConfig?.vietqr_bank_bin]);

  const handleApplyVoucher = async () => {
    if (!voucherCode) return toast.error("Vui lòng nhập mã!");
    try {
      const res = await fetch(`${BASE_URL}/api/donhang/check-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode,
          userId: user.id,
          totalAmount: subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        let discount = 0;
        if (data.discount.loai === "phantram") {
          discount = subtotal * (data.discount.gia_tri / 100);
          if (discount > data.discount.gia_tri_toi_da)
            discount = Number(data.discount.gia_tri_toi_da);
        } else {
          discount = Number(data.discount.gia_tri);
        }

        setVoucherDiscount(discount);
        toast.success(data.message);
      } else {
        setVoucherDiscount(0);
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  };

  // Tính toán tiền
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.gia_ban * item.so_luong,
    0,
  );
  const shippingFee = selectedShipping
    ? Number(selectedShipping.phi_co_ban)
    : 0;
  const memberDiscountRate = (user?.ty_le_giam_gia || 0) / 100;
  const discountAmount = Math.round(subtotal * memberDiscountRate);
  const pointsToUse = usePoints
    ? Math.min(
      user?.diem_tich_luy || 0,
      subtotal + shippingFee - discountAmount - voucherDiscount,
    )
    : 0;
  const total =
    subtotal + shippingFee - discountAmount - voucherDiscount - pointsToUse;

  const isBankTransfer = paymentMethod?.loai === "bank_transfer";

  // URL mã QR VietQR sinh động theo số tiền và mã đơn
  const qrUrl = useMemo(() => {
    const bin = storeConfig?.vietqr_bank_bin;
    const stk = storeConfig?.vietqr_account_no;
    const name = storeConfig?.vietqr_account_name || "";
    if (!bin || !stk) return null;
    const finalAmount = storeConfig?.lam_tron_tien
      ? Math.round(total / 1000) * 1000
      : Math.round(total);
    const info = encodeURIComponent(`Thanh toan don hang`);
    return `https://img.vietqr.io/image/${bin}-${stk}-compact2.png?amount=${finalAmount}&addInfo=${info}&accountName=${encodeURIComponent(name)}`;
  }, [storeConfig, total]);

  // Điều kiện enable nút thanh toán
  const vatValid = !vatRequested || Object.keys(validateVat(vatInfo)).length === 0;
  const canCheckout =
    !!selectedAddress &&
    !!selectedShipping &&
    !!paymentMethod &&
    (!isBankTransfer || transferConfirmed) &&
    vatValid;

  const finalTotal = storeConfig?.lam_tron_tien
    ? Math.round(total / 1000) * 1000
    : total;

  const handleConfirmOrder = async () => {
    if (!user) return toast.error("Vui lòng đăng nhập!");
    if (!selectedAddress)
      return toast.error("Vui lòng chọn địa chỉ giao hàng!");

    if (vatRequested) {
      if (!vatInfo.ten_cong_ty.trim())
        return toast.error("Vui lòng nhập tên công ty!");
      if (!vatInfo.mst.trim()) return toast.error("Vui lòng nhập mã số thuế!");
      if (!vatInfo.dia_chi_cty.trim())
        return toast.error("Vui lòng nhập địa chỉ công ty!");
      const mstRegex = /^\d{10}(-\d{3})?$/;
      if (!mstRegex.test(vatInfo.mst.trim()))
        return toast.error("Mã số thuế không đúng định dạng!");
    }

    setLoading(true);

    const orderData = {
      tai_khoan_id: user.id,
      dia_chi_id: selectedAddress.id,
      don_vi_vc_id: selectedShipping?.id,
      tong_tien_hang: subtotal,
      phi_van_chuyen: shippingFee,
      tien_giam_gia: discountAmount + voucherDiscount,
      tong_thanh_toan: total,
      ghi_chu: orderNote,
      phuong_thuc_tt: paymentMethod?.id,
      voucher_code: voucherDiscount > 0 ? voucherCode : null,
      dung_diem: usePoints ? pointsToUse : 0,
      items: checkoutItems.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        ten_san_pham: item.ten_san_pham,
        so_luong: item.so_luong,
        gia_ban: item.gia_ban,
      })),
      vat_info: vatRequested ? vatInfo : null,
      receive_email: receiveEmail,
    };

    try {
      const response = await fetch(`${BASE_URL}/api/donHang/dat-hang`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        if (isBankTransfer) {
          toast.success("Đơn hàng đã được ghi nhận! Cửa hàng sẽ xác nhận sau khi kiểm tra chuyển khoản.", { duration: 4000 });
        } else {
          toast.success("Đặt hàng thành công!");
        }

        const selectedVariantIds = checkoutItems.map((item) => item.variantId);
        await clearSelectedItems(selectedVariantIds);

        setTimeout(() => navigate("/profile"), 1800);
      } else {
        toast.error(result.message || "Lỗi đặt hàng!");
      }
    } catch {
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getImageUrl = (url) => {
    if (!url) return "../assets/images/NoImage.webp";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen font-sans text-gray-800">
      <Header />
      <Toaster position="top-center" />

      <main className="container mx-auto px-3 sm:px-4 py-3 max-w-6xl mt-1 mb-4 sm:mb-12 pb-16 md:pb-0">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">
          Thanh toán đơn hàng
        </h1>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-6">
          {/* ================= CỘT TRÁI: THÔNG TIN ================= */}
          <div className="w-full lg:w-2/3 flex flex-col gap-3 lg:gap-6">
            {/* 1. THÔNG TIN NHẬN HÀNG */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-medium text-gray-800">
                  Thông tin nhận hàng
                </h2>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-blue-600 text-xs font-medium hover:underline hover:underline cursor-pointer whitespace-nowrap"
                >
                  Thay đổi
                </button>
              </div>
              {selectedAddress ? (
                <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 relative">
                  <p className="font-bold text-gray-800 text-base mb-1">
                    {selectedAddress.ho_ten_nguoi_nhan || user?.ho_ten}
                    <span className="font-normal text-gray-500 ml-2">
                      | {selectedAddress.so_dien_thoai}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedAddress.dia_chi_cu_the} {selectedAddress.phuong_xa}{" "}
                    {selectedAddress.quan_huyen} {selectedAddress.tinh_thanh}
                  </p>
                  <p className="font-medium  text-gray-500 text-sm mt-2">
                    Email
                  </p>
                  <span className="font-normal text-gray-500">
                    {user.email}
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 italic">
                  Chưa có địa chỉ. Vui lòng thêm mới!
                </p>
              )}
            </div>
            {/* 2. KIỂM TRA SẢN PHẨM  */}
            <div className="bg-white rounded-lg shadow-sm px-4 pt-3 sm:px-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                Danh sách sản phẩm
              </h2>
              <div className="flex flex-col gap-4">
                {checkoutItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <img
                      src={getImageUrl(item.hinh_anh)}
                      className="w-25 h-25 object-contain rounded bg-white p-2"
                      alt="sp"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-700 text-sm">
                        {item.ten_san_pham}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Phân loại: {item.dung_luong} | {item.mau_sac}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">
                          Số lượng:{" "}
                          <b className="text-red-600 font-medium">
                            {item.so_luong}
                          </b>
                        </span>
                        <span className="font-bold text-[#e30019]">
                          {formatPrice(item.gia_ban)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 2. VẬN CHUYỂN */}
            <div className="bg-white rounded-lg shadow-sm px-4 pt-3 sm:px-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Phương thức vận chuyển
              </h2>
              <div className="flex flex-col gap-3 mb-6">
                {shippingUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className={`flex items-center justify-between p-2.5 border rounded-lg cursor-pointer transition-colors ${selectedShipping?.id === unit.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        className="w-4 h-4 accent-blue-600"
                        checked={selectedShipping?.id === unit.id}
                        onChange={() => setSelectedShipping(unit)}
                      />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          {unit.ten_don_vi}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dự kiến nhận: {unit.thoi_gian_du_kien || "2-3 ngày"}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-gray-800">
                      {formatPrice(unit.phi_co_ban)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-lg shadow-sm px-3 py-2 sm:px-6 sm:py-4 border border-gray-100 whitespace-nowrap">
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                Phương thức thanh toán
              </h2>
              <div
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {paymentMethod?.logo_url ? (
                      <img
                        src={`${BASE_URL}${paymentMethod.logo_url}`}
                        className="w-full h-full object-contain p-1.5"
                        alt="logo"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">LOGO</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base text-[15px]">
                      {paymentMethod?.ten_phuong_thuc || "Chọn phương thức thanh toán"}
                    </p>
                    {paymentMethod && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isBankTransfer
                          ? "Quét mã QR để thanh toán nhanh chóng"
                          : "Thanh toán an toàn khi nhận hàng (COD)"}
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-blue-600 font-bold text-sm cursor-pointer hover:underline whitespace-nowrap">
                  Thay đổi
                </button>
              </div>

              {/* HIỂN THỊ KHI CHỌN CHUYỂN KHOẢN */}
              {isBankTransfer && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">Hướng dẫn thanh toán chuyển khoản</p>
                      <ol className="list-decimal list-inside space-y-1 text-[13px] text-blue-700">
                        <li>Bấm <strong>"Xem mã QR"</strong> để quét mã thanh toán</li>
                        <li>Chuyển khoản đúng số tiền và nội dung hiển thị</li>
                        <li>Tích vào ô <strong>"Tôi đã chuyển khoản"</strong> bên dưới</li>
                        <li>Cửa hàng sẽ xác nhận trong vòng <strong>15–30 phút</strong></li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17v3M17 14h3" />
                      </svg>
                      Xem mã QR
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600"
                        checked={transferConfirmed}
                        onChange={(e) => setTransferConfirmed(e.target.checked)}
                      />
                      <span className="text-sm font-medium text-blue-800">
                        Tôi đã chuyển khoản
                      </span>
                    </label>
                  </div>

                  {transferConfirmed && (
                    <p className="mt-3 text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      Đã xác nhận. Đơn hàng sẽ được tạo và chờ cửa hàng kiểm tra chuyển khoản.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* CÁC CHECKBOX TIỆN ÍCH */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 space-y-3 sm:space-y-4">
              <label className="flex items-center font-medium gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={receiveEmail}
                  onChange={(e) => setReceiveEmail(e.target.checked)}
                />
                Nhận thông báo đơn hàng và ưu đãi qua Email
              </label>
              <label className="flex items-center font-medium gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={vatRequested}
                  onChange={(e) => setVatRequested(e.target.checked)}
                />
                Yêu cầu xuất hóa đơn công ty
              </label>
              {vatRequested && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 mt-1">
                  {/* Tên công ty */}
                  <div>
                    <input
                      type="text"
                      placeholder="Tên công ty *"
                      className={`w-full border-b px-3 py-2 text-sm outline-none transition-colors ${vatErrors.ten_cong_ty
                          ? "border-red-400 bg-red-50 placeholder-red-400"
                          : "border-gray-300 focus:border-blue-500 bg-transparent"
                        }`}
                      value={vatInfo.ten_cong_ty}
                      onChange={(e) => {
                        const updated = { ...vatInfo, ten_cong_ty: e.target.value };
                        setVatInfo(updated);
                        setVatErrors(validateVat(updated));
                      }}
                    />
                    {vatErrors.ten_cong_ty && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{vatErrors.ten_cong_ty}</p>
                    )}
                  </div>

                  {/* Mã số thuế */}
                  <div>
                    <input
                      type="text"
                      placeholder="Mã số thuế * (VD: 1234567890 hoặc 1234567890-123)"
                      className={`w-full border-b px-3 py-2 text-sm outline-none font-mono transition-colors ${vatErrors.mst
                          ? "border-red-400 bg-red-50 placeholder-red-400"
                          : vatInfo.mst && !vatErrors.mst
                            ? "border-green-400 bg-green-50"
                            : "border-gray-300 focus:border-blue-500 bg-transparent"
                        }`}
                      value={vatInfo.mst}
                      onChange={(e) => {
                        const updated = { ...vatInfo, mst: e.target.value };
                        setVatInfo(updated);
                        setVatErrors(validateVat(updated));
                      }}
                    />
                    {vatErrors.mst ? (
                      <p className="text-red-500 text-xs mt-1 ml-1">{vatErrors.mst}</p>
                    ) : vatInfo.mst && (
                      <p className="text-green-600 text-xs mt-1 ml-1">Mã số thuế hợp lệ</p>
                    )}
                  </div>

                  {/* Địa chỉ công ty */}
                  <div>
                    <input
                      type="text"
                      placeholder="Địa chỉ công ty *"
                      className={`w-full border-b px-3 py-2 text-sm outline-none transition-colors ${vatErrors.dia_chi_cty
                          ? "border-red-400 bg-red-50 placeholder-red-400"
                          : "border-gray-300 focus:border-blue-500 bg-transparent"
                        }`}
                      value={vatInfo.dia_chi_cty}
                      onChange={(e) => {
                        const updated = { ...vatInfo, dia_chi_cty: e.target.value };
                        setVatInfo(updated);
                        setVatErrors(validateVat(updated));
                      }}
                    />
                    {vatErrors.dia_chi_cty && (
                      <p className="text-red-500 text-xs mt-1 ml-1">{vatErrors.dia_chi_cty}</p>
                    )}
                    <p className="text-gray-400 ml-1 text-xs italic mt-1">
                      Từ 1/7/2025, vui lòng nhập địa chỉ theo bản đồ sáp nhập mới.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= CỘT PHẢI: TÓM TẮT ĐƠN HÀNG ================= */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-30">
              <h2 className="text-xl font-bold font-inter text-gray-800">
                Chi tiết thanh toán
              </h2>

              {/* Voucher */}
              <div className="py-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 "
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
                {(() => {
                  const availablePoints = user?.diem_tich_luy || 0;
                  const hasPoints = availablePoints > 0;

                  return (
                    <div
                      className={`mt-3 p-2 rounded-xl border flex justify-between items-center transition-all ${hasPoints ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-200 opacity-80"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${hasPoints ? "bg-orange-500" : "bg-gray-400"}`}
                        >
                          <Icons.Star className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${hasPoints ? "text-gray-800" : "text-gray-500"}`}
                          >
                            Dùng {formatPrice(availablePoints).replace("₫", "")}{" "}
                            điểm
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {hasPoints
                              ? `Giảm thêm ${formatPrice(availablePoints)}`
                              : "Bạn chưa có điểm tích lũy"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!hasPoints}
                        onClick={() => hasPoints && setUsePoints(!usePoints)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!hasPoints ? "bg-gray-200 cursor-not-allowed" : usePoints ? "bg-orange-500 cursor-pointer" : "bg-gray-300 cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${usePoints && hasPoints ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Tính tiền */}
              <div className="flex flex-col gap-3 text-sm text-gray-600 mb-2 border-b border-gray-300 pb-5">
                <div className="flex justify-between">
                  <span>Số lượng sản phẩm:</span>
                  <b>{checkoutItems.length}</b>
                </div>
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <b>{formatPrice(subtotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <b>{formatPrice(shippingFee)}</b>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 bg-green-50 rounded text-xs font-medium tracking-wider p-1">
                    <span>Giảm giá ({user?.ten_hang || "Thành viên"}):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-blue-600 bg-blue-50 rounded text-xs font-medium tracking-wider p-1">
                    <span>Mã ưu đãi:</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ghi chú..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-20 bg-gray-50/50"
                ></textarea>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="font-bold text-gray-800 text-xl">
                  Tổng cộng:
                </span>
                <span className="text-2xl font-bold text-[#e30019]">
                  {formatPrice(finalTotal)}
                </span>
              </div>

              {/* Thông báo khi chưa đủ điều kiện */}
              {!canCheckout && (
                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
                  {!selectedAddress && <p>• Vui lòng chọn địa chỉ giao hàng</p>}
                  {!selectedShipping && <p>• Vui lòng chọn phương thức vận chuyển</p>}
                  {!paymentMethod && <p>• Vui lòng chọn phương thức thanh toán</p>}
                  {isBankTransfer && !transferConfirmed && (
                    <p>• Vui lòng xem mã QR và xác nhận đã chuyển khoản</p>
                  )}
                  {vatRequested && !vatValid && (
                    <p>• Vui lòng điền đầy đủ và đúng thông tin xuất hóa đơn VAT</p>
                  )}
                </div>
              )}

              <button
                onClick={handleConfirmOrder}
                disabled={loading || !canCheckout}
                className={`w-full py-2.5 rounded-lg font-bold text-lg shadow-md transition ${canCheckout && !loading
                    ? "bg-[#e30019] hover:bg-red-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {loading
                  ? "Đang xử lý..."
                  : isBankTransfer
                    ? "Xác nhận đặt hàng"
                    : "Thanh toán"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">
                Chọn phương thức thanh toán
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-3xl text-gray-400 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {paymentMethods.map((method) => (
                <div key={method.id}>
                  <div
                    onClick={() => setTempPaymentMethod(method)}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${tempPaymentMethod?.id === method.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {/* ==== ĐOẠN ĐƯỢC SỬA: HIỂN THỊ LOGO AN TOÀN ==== */}
                    {method.logo_url ? (
                      <img
                        src={`${BASE_URL}${method.logo_url}`}
                        className="w-10 h-10 object-contain p-1 bg-white border border-gray-100 rounded-md shrink-0"
                        alt="bank"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-md flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">
                          LOGO
                        </span>
                      </div>
                    )}
                    {/* ============================================== */}

                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">
                        {method.ten_phuong_thuc}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {method.loai === "bank_transfer"
                          ? "Quét mã để thanh toán nhanh"
                          : "Thanh toán an toàn"}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempPaymentMethod?.id === method.id
                          ? "border-blue-600"
                          : "border-gray-300"
                        }`}
                    >
                      {tempPaymentMethod?.id === method.id && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setPaymentMethod(tempPaymentMethod);
                  setIsPaymentModalOpen(false);
                }}
                className="w-full bg-[#e30019] text-white py-3 rounded-lg font-bold shadow-md hover:bg-red-700 transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg">
                Sổ địa chỉ của bạn
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-3xl text-gray-400 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-gray-50">
              {addresses.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Bạn chưa có địa chỉ nào được lưu.
                </p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setIsAddressModalOpen(false);
                    }}
                    className={`p-4 border rounded-xl cursor-pointer transition-all bg-white shadow-sm hover:shadow-md ${selectedAddress?.id === addr.id ? "border-blue-100 ring-1 ring-blue-600" : "border-gray-200"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800 flex items-center gap-2">
                        {addr.ho_ten_nguoi_nhan || user?.ho_ten}
                        {(addr.la_mac_dinh === 1 ||
                          addr.la_mac_dinh === true) && (
                            <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              Mặc định
                            </span>
                          )}
                      </p>
                      <p className="text-sm font-medium text-gray-600">
                        {addr.so_dien_thoai}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {addr.dia_chi_cu_the}, {addr.phuong_xa}, {addr.quan_huyen}
                      , {addr.tinh_thanh}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  setIsAddressModalOpen(false);
                  navigate("/profile", { state: { activeTab: "profile" } });
                }}
                className="w-full border border-green-400 bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition cursor-pointer flex justify-center items-center gap-2"
              >
                <Icons.Add /> Thêm địa chỉ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL QR CHUYỂN KHOẢN ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800 text-base">Thanh toán chuyển khoản</h3>
                <p className="text-xs text-gray-500 mt-0.5">Quét mã QR bằng app ngân hàng</p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-2xl text-gray-400 hover:text-red-500 cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* QR Code */}
            <div className="px-5 py-4 flex flex-col items-center">
              {qrUrl ? (
                <>
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-2 shadow-sm mb-3">
                    <img
                      src={qrUrl}
                      alt="VietQR"
                      className="w-56 h-56 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="hidden w-56 h-56 items-center justify-center text-gray-400 text-sm text-center"
                    >
                      Không tải được mã QR. Vui lòng CK thủ công.
                    </div>
                  </div>

                  {/* Thông tin chuyển khoản */}
                  <div className="w-full bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Ngân hàng</span>
                      <span className="font-bold text-gray-800 text-right max-w-[60%]">
                        {bankName || storeConfig?.vietqr_bank_bin || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Số tài khoản</span>
                      <span className="font-bold text-gray-800 font-mono tracking-wider">
                        {storeConfig?.vietqr_account_no || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Chủ tài khoản</span>
                      <span className="font-bold text-gray-800 uppercase">
                        {storeConfig?.vietqr_account_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2.5 mt-1">
                      <span className="text-gray-500 font-medium">Số tiền</span>
                      <span className="font-extrabold text-[#e30019] text-base">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Nội dung CK</span>
                      <span className="font-bold text-blue-700">Thanh toan don hang</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center mt-3 italic">
                    Sau khi chuyển khoản, vui lòng đánh dấu "Tôi đã chuyển khoản" để đặt hàng.
                  </p>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <p className="font-medium">Chưa cấu hình tài khoản ngân hàng.</p>
                  <p className="text-xs mt-1">Vui lòng liên hệ admin.</p>
                </div>
              )}
            </div>

            {/* Footer button */}
            <div className="px-5 pb-5">
              <button
                onClick={() => {
                  setTransferConfirmed(true);
                  setShowQrModal(false);
                  toast.success("Đã xác nhận! Bấm 'Xác nhận đặt hàng' để hoàn tất.", { duration: 3000 });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition cursor-pointer"
              >
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
