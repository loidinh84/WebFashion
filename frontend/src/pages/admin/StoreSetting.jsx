import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "../../config/api";

const API_URL = BASE_URL;

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

const isValidUrl = (url) => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const ToggleSwitch = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    className={`w-11 h-6 rounded-full flex items-center cursor-pointer transition-colors duration-300 flex-shrink-0 ${checked ? "bg-[#00a651]" : "bg-gray-300"}`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-1"}`}
    />
  </div>
);

const DEFAULT_STORE_INFO = {
  tenCuaHang: "",
  dienThoai: "",
  email: "",
  diaChi: "",
};
const DEFAULT_QR_INFO = {
  bankBin: "970422",
  accountNumber: "",
  accountName: "",
};
const DEFAULT_SETTINGS = {
  baoTriHeThong: false,
  tuDongDuyetDon: true,
  choPhepDanhGia: true,
  guiEmailTuDong: true,
  lamTronTien: false,
};
const DEFAULT_SOCIAL = { facebook: "", tiktok: "", instagram: "", zalo: "" };
const DEFAULT_EMAIL_CFG = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  emailNhanThongBao: "",
  nguongHetHang: 10,
};

const SMTP_PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  outlook: { host: "smtp-mail.outlook.com", port: 587 },
  yahoo: { host: "smtp.mail.yahoo.com", port: 587 },
};

function StoreSettings() {
  const [activeTab, setActiveTab] = useState("thong-tin");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. STATE THÔNG TIN CỬA HÀNG
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE_INFO);
  const [qrInfo, setQrInfo] = useState(DEFAULT_QR_INFO);
  const [bankList, setBankList] = useState([]);
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL_CFG);
  const [testingEmail, setTestingEmail] = useState(false);

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/store-settings`, {
        headers: getAuthHeader(),
      });
      const result = await response.json();

      if (result.success) {
        const db = result.data;
        setStoreInfo({
          tenCuaHang: db.ten_cua_hang || "",
          dienThoai: db.so_dien_thoai || "",
          email: db.email || "",
          diaChi: db.dia_chi || "",
          anhDaiDien: db.logo_url || null,
        });
        if (db.logo_url) setLogoPreview(`${API_URL}${db.logo_url}`);

        setQrInfo({
          bankBin: db.vietqr_bank_bin || "970422",
          accountNumber: db.vietqr_account_no || "",
          accountName: db.vietqr_account_name || "",
        });

        setSettings({
          baoTriHeThong: db.bao_tri_he_thong,
          tuDongDuyetDon: db.tu_dong_duyet_don,
          choPhepDanhGia: db.cho_phep_danh_gia,
          guiEmailTuDong: db.gui_email_tu_dong,
          lamTronTien: db.lam_tron_tien,
        });

        setSocialLinks({
          facebook: db.facebook_url || "",
          tiktok: db.tiktok_url || "",
          instagram: db.instagram_url || "",
          zalo: db.zalo || "",
        });

        setEmailConfig({
          smtpHost: db.smtp_host || "smtp.gmail.com",
          smtpPort: db.smtp_port || 587,
          smtpUser: db.smtp_user || "",
          smtpPass: db.smtp_pass || "",
          emailNhanThongBao: db.email_nhan_thong_bao || "",
          nguongHetHang: db.nguong_bao_het_hang || 10,
        });
      }
    } catch (error) {
      console.error("Lỗi tải cấu hình:", error);
      toast.error("Lỗi lấy cấu hình từ máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch("https://api.vietqr.io/v2/banks");
        const result = await response.json();

        if (result.code === "00") {
          setBankList(result.data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách ngân hàng:", error);
      }
    };
    fetchBanks();
  }, []);

  const saveToDatabase = async (payload) => {
    const response = await fetch(`${API_URL}/api/store-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  const handleSaveStoreInfo = async () => {
    const id = toast.loading("Đang lưu thông tin...");
    try {
      const formData = new FormData();
      formData.append("ten_cua_hang", storeInfo.tenCuaHang);
      formData.append("so_dien_thoai", storeInfo.dienThoai);
      formData.append("email", storeInfo.email);
      formData.append("dia_chi", storeInfo.diaChi);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await fetch(`${API_URL}/api/store-settings`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.update(id, {
          render: "Đã lưu thông tin cửa hàng!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.update(id, {
        render: "Lỗi kết nối!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const handleSaveQRInfo = async () => {
    const id = toast.loading("Đang cập nhật VietQR...");
    try {
      await saveToDatabase({
        vietqr_bank_bin: qrInfo.bankBin,
        vietqr_account_no: qrInfo.accountNumber,
        vietqr_account_name: qrInfo.accountName,
      });
      toast.update(id, {
        render: "Đã cập nhật mã QR!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch {
      toast.update(id, {
        render: "Lỗi kết nối!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
  };

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    const sqlColumnMap = {
      baoTriHeThong: "bao_tri_he_thong",
      tuDongDuyetDon: "tu_dong_duyet_don",
      choPhepDanhGia: "cho_phep_danh_gia",
      guiEmailTuDong: "gui_email_tu_dong",
      lamTronTien: "lam_tron_tien",
    };
    try {
      await saveToDatabase({ [sqlColumnMap[key]]: newValue });
      toast.success("Đã lưu tự động", {
        position: "bottom-right",
        autoClose: 1000,
        hideProgressBar: true,
      });
    } catch {
      toast.error("Mất kết nối! Không thể lưu.");
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSaveSocials = async () => {
    const invalidFields = [];
    if (!isValidUrl(socialLinks.facebook)) invalidFields.push("Facebook");
    if (!isValidUrl(socialLinks.tiktok)) invalidFields.push("TikTok");
    if (!isValidUrl(socialLinks.instagram)) invalidFields.push("Instagram");
    if (!isValidUrl(socialLinks.zalo)) invalidFields.push("Zalo");

    if (invalidFields.length > 0) {
      toast.error(
        `URL không hợp lệ: ${invalidFields.join(", ")}. Vui lòng nhập đúng định dạng https://...`,
      );
      return;
    }

    const id = toast.loading("Đang lưu liên kết...");
    try {
      await saveToDatabase({
        facebook_url: socialLinks.facebook,
        tiktok_url: socialLinks.tiktok,
        instagram_url: socialLinks.instagram,
        zalo: socialLinks.zalo,
      });
      toast.update(id, {
        render: "Đã cập nhật Mạng xã hội!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch {
      toast.update(id, {
        render: "Lỗi lưu cấu hình!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const handleSaveEmailConfig = async () => {
    const id = toast.loading("Đang lưu cấu hình Email...");
    try {
      const payload = {
        smtp_host: emailConfig.smtpHost,
        smtp_port: emailConfig.smtpPort,
        smtp_user: emailConfig.smtpUser,
        smtp_pass: emailConfig.smtpPass,
        email_nhan_thong_bao: emailConfig.emailNhanThongBao,
        nguong_bao_het_hang: emailConfig.nguongHetHang,
      };

      if (emailConfig.smtpPass && emailConfig.smtpPass !== "••••••••") {
        payload.smtp_pass = emailConfig.smtpPass;
      }
      await saveToDatabase(payload);
      toast.update(id, {
        render: "Đã lưu cấu hình Email!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch {
      toast.update(id, {
        render: "Lỗi lưu cấu hình!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    const id = toast.loading("Đang gửi email test...");
    try {
      const response = await fetch(
        `${BASE_URL}/api/store-settings/test-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
        },
      );
      const result = await response.json();

      if (result.success) {
        toast.update(id, {
          render: result.message,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(id, {
          render: result.message,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch {
      toast.update(id, {
        render: "Không thể kết nối máy chủ!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4 max-w-3xl">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-px bg-gray-100" />
      <div className="flex gap-10">
        <div className="w-40 h-40 bg-gray-200 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );

  const sidebarItem = (tab, label) => (
    <li
      className={`px-5 py-3 flex items-center gap-3 cursor-pointer border-l-[3px] transition-all text-sm font-medium
        ${
          activeTab === tab
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : "border-transparent text-gray-600 hover:bg-gray-100"
        }`}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </li>
  );

  return (
    <div className="flex w-full h-full justify-center p-4 md:p-6">
      <ToastContainer position="top-right" />
      <div className="flex w-full max-w-[1400px] bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
        {/* CỘT TRÁI: SIDEBAR MENU */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-6 overflow-y-auto shrink-0">
          <div className="mb-4">
            <h3 className="px-5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Hệ thống
            </h3>
            <ul>
              {sidebarItem("thong-tin", "Thông tin cửa hàng")}
              {sidebarItem("tinh-nang", "Thiết lập tính năng")}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="px-5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Thanh toán & Mạng xã hội
            </h3>
            <ul>
              {sidebarItem("qr-code", "Thiết lập mã QR")}
              {sidebarItem("ket-noi", "Mạng xã hội")}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="px-5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Thông báo & Email
            </h3>
            <ul>{sidebarItem("email-config", "Thông báo & Email")}</ul>
          </div>
        </div>

        {/* CỘT PHẢI: NỘI DUNG */}
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {/* TAB 1: THÔNG TIN CỬA HÀNG */}
          {activeTab === "thong-tin" &&
            (isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="animate-fade-in-up max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                  Cấu hình Cửa hàng
                </h2>
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-1/3 flex flex-col items-center">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => logoInputRef.current.click()}
                      className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors mb-3 overflow-hidden relative group shadow-sm"
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <i className="fa-regular fa-image text-gray-400 text-4xl mb-2 group-hover:scale-110 transition-transform"></i>
                          <span className="text-blue-600 text-sm font-bold">
                            Tải Logo
                          </span>
                        </>
                      )}
                      {logoPreview && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-camera text-white text-2xl mb-1"></i>
                          <span className="text-white text-xs font-bold">
                            Đổi Logo
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 text-center">
                      Kích thước chuẩn: 512x512px
                      <br />
                      Tối đa 2MB
                    </span>
                  </div>

                  <div className="w-full md:w-2/3 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Tên cửa hàng
                      </label>
                      <input
                        type="text"
                        value={storeInfo.tenCuaHang || ""}
                        onChange={(e) =>
                          setStoreInfo({
                            ...storeInfo,
                            tenCuaHang: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Điện thoại
                        </label>
                        <input
                          type="text"
                          value={storeInfo.dienThoai || ""}
                          onChange={(e) =>
                            setStoreInfo({
                              ...storeInfo,
                              dienThoai: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={storeInfo.email || ""}
                          onChange={(e) =>
                            setStoreInfo({
                              ...storeInfo,
                              email: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Địa chỉ cửa hàng
                      </label>
                      <textarea
                        rows="3"
                        value={storeInfo.diaChi || ""}
                        onChange={(e) =>
                          setStoreInfo({ ...storeInfo, diaChi: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      ></textarea>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveStoreInfo}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        Lưu thông tin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* TAB 2: TÍNH NĂNG HỆ THỐNG */}
          {activeTab === "tinh-nang" &&
            (isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="animate-fade-in-up max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                  Tính năng hệ thống
                </h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {[
                    {
                      key: "baoTriHeThong",
                      icon: "fa-power-off",
                      iconCls: "text-red-500",
                      title: "Bảo trì hệ thống",
                      desc: "Tạm khóa website đối với khách hàng (Chỉ Admin truy cập được).",
                    },
                    {
                      key: "tuDongDuyetDon",
                      icon: "fa-bolt",
                      iconCls: "text-yellow-500",
                      title: "Tự động duyệt đơn (COD)",
                      desc: "Đơn hàng thanh toán sẽ tự động chuyển sang Đang xử lý.",
                    },
                    {
                      key: "choPhepDanhGia",
                      icon: "fa-star",
                      iconCls: "text-orange-400",
                      title: "Cho phép đánh giá sản phẩm",
                      desc: "Khách hàng có thể bình luận và đánh giá sao cho sản phẩm đã mua.",
                    },
                    {
                      key: "guiEmailTuDong",
                      icon: "fa-envelope-circle-check",
                      iconCls: "text-blue-500",
                      title: "Gửi Email tự động",
                      desc: "Tự động gửi email thông báo khi khách đặt hàng thành công.",
                    },
                    {
                      key: "lamTronTien",
                      icon: "fa-coins",
                      iconCls: "text-green-500",
                      title: "Làm tròn số tiền hóa đơn",
                      desc: "Tự động làm tròn tổng tiền thanh toán (VD: 199.999đ → 200.000đ).",
                    },
                  ].map((item, i, arr) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 w-6 text-center">
                          <i
                            className={`fa-solid ${item.icon} ${item.iconCls} text-xl`}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={settings[item.key]}
                        onChange={() => handleToggle(item.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* TAB 3: THANH TOÁN VIETQR */}
          {activeTab === "qr-code" &&
            (isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="animate-fade-in-up max-w-4xl">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                  <h2 className="text-2xl font-medium text-gray-800">
                    Thiết lập mã QR
                  </h2>
                </div>

                <div className="flex flex-col md:flex-row gap-10">
                  <div className="w-full md:w-1/2 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Ngân hàng thụ hưởng
                      </label>
                      <select
                        value={qrInfo.bankBin}
                        onChange={(e) =>
                          setQrInfo({ ...qrInfo, bankBin: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Chọn ngân hàng</option>
                        {bankList.map((bank) => (
                          <option key={bank.id} value={bank.bin}>
                            {bank.shortName} - {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Số tài khoản
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập số tài khoản..."
                        value={qrInfo.accountNumber}
                        onChange={(e) =>
                          setQrInfo({
                            ...qrInfo,
                            accountNumber: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Tên chủ tài khoản
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên tài khoản..."
                        value={qrInfo.accountName}
                        onChange={(e) =>
                          setQrInfo({
                            ...qrInfo,
                            accountName: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleSaveQRInfo}
                        className="bg-[#00a651] hover:bg-[#008d45] text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full flex justify-center items-center gap-2 cursor-pointer"
                      >
                        Cập nhật mã QR
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl shadow-inner">
                    {qrInfo.accountNumber.length > 4 ? (
                      <div className="text-center">
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 inline-block">
                          <img
                            src={`https://img.vietqr.io/image/${qrInfo.bankBin}-${qrInfo.accountNumber}-compact2.png?accountName=${qrInfo.accountName}`}
                            alt="VietQR"
                            className="w-60 h-60 object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-xs text-gray-500 font-medium italic">
                          Mã QR quét được ngay lập tức
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <i className="fa-solid fa-qrcode text-6xl mb-4 opacity-50"></i>
                        <p className="text-sm font-medium">
                          Vui lòng nhập Số tài khoản
                          <br />
                          để xem trước mã QR
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* TAB 4: KẾT NỐI MẠNG XÃ HỘI */}
          {activeTab === "ket-noi" &&
            (isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="animate-fade-in-up max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                  Liên kết Mạng xã hội
                </h2>
                <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-5">
                  {[
                    {
                      key: "facebook",
                      label: "Facebook Fanpage",
                      placeholder: "https://facebook.com/ltlstore",
                      iconBg: "bg-blue-100 text-blue-600",
                      icon: "fa-brands fa-facebook-f",
                    },
                    {
                      key: "tiktok",
                      label: "TikTok Channel",
                      placeholder: "https://tiktok.com/@ltlstore",
                      iconBg: "bg-black text-white",
                      icon: "fa-brands fa-tiktok",
                    },
                    {
                      key: "instagram",
                      label: "Instagram Profile",
                      placeholder: "https://instagram.com/ltlstore",
                      iconBg:
                        "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white",
                      icon: "fa-brands fa-instagram",
                    },
                    {
                      key: "zalo",
                      label: "Zalo Support",
                      placeholder: "https://zalo.me/0123456789",
                      iconBg: "bg-blue-500 text-white",
                      icon: null,
                      iconText: "Zalo",
                    },
                  ].map((item) => {
                    const val = socialLinks[item.key];
                    const invalid = val && !isValidUrl(val);
                    return (
                      <div key={item.key} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}
                        >
                          {item.icon ? (
                            <i className={`${item.icon} text-xl`} />
                          ) : (
                            <span className="font-bold text-[10px]">
                              {item.iconText}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            {item.label}
                          </label>
                          <input
                            type="text"
                            value={val}
                            placeholder={item.placeholder}
                            onChange={(e) =>
                              setSocialLinks({
                                ...socialLinks,
                                [item.key]: e.target.value,
                              })
                            }
                            className={`w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 transition-all
                              ${invalid ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"}`}
                          />
                          {invalid && (
                            <p className="text-xs text-red-500 mt-1">
                              URL không hợp lệ, vui lòng nhập đúng định dạng
                              https://...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={handleSaveSocials}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      Lưu liên kết
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* TAB 5: Thông báo và Email */}
          {activeTab === "email-config" &&
            (isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="animate-fade-in-up max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                  Cấu hình Email & Thông báo
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cấu hình SMTP */}
                  <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-blue-600 flex items-center gap-2 mb-2">
                      Server gửi Email (SMTP)
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Chọn nhà cung cấp email
                      </label>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const presets = {
                            gmail: {
                              smtpHost: "smtp.gmail.com",
                              smtpPort: 587,
                            },
                            outlook: {
                              smtpHost: "smtp-mail.outlook.com",
                              smtpPort: 587,
                            },
                            yahoo: {
                              smtpHost: "smtp.mail.yahoo.com",
                              smtpPort: 587,
                            },
                          };
                          const preset = presets[e.target.value];
                          if (preset)
                            setEmailConfig((prev) => ({ ...prev, ...preset }));
                        }}
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 appearance-none text-sm bg-white outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>
                          Chọn để tự điền HOST và PORT
                        </option>
                        <option value="gmail">
                          Gmail (smtp.gmail.com : 587)
                        </option>
                        <option value="outlook">
                          Outlook / Hotmail (smtp-mail.outlook.com : 587)
                        </option>
                        <option value="yahoo">
                          Yahoo Mail (smtp.mail.yahoo.com : 587)
                        </option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          PORT
                        </label>
                        <input
                          type="number"
                          value={emailConfig.smtpPort}
                          onChange={(e) =>
                            setEmailConfig({
                              ...emailConfig,
                              smtpPort: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Tài khoản gửi (User)
                        </label>
                        <input
                          type="text"
                          value={emailConfig.smtpUser}
                          onChange={(e) =>
                            setEmailConfig({
                              ...emailConfig,
                              smtpUser: e.target.value,
                            })
                          }
                          placeholder="gmailCuaBan@gmail.com"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Mật khẩu ứng dụng (App Password)
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline font-normal text-[10px]"
                        >
                          {" "}
                          Lấy ở đâu?
                        </a>
                      </label>
                      <input
                        type="password"
                        value={emailConfig.smtpPass}
                        onChange={(e) =>
                          setEmailConfig({
                            ...emailConfig,
                            smtpPass: e.target.value,
                          })
                        }
                        placeholder="Nhập để thay đổi mật khẩu..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Để trống nếu không muốn thay đổi mật khẩu hiện tại.
                      </p>
                    </div>
                    <button
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                      className="w-full py-2 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {testingEmail ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />{" "}
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane" /> Gửi email
                          test
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cấu hình Nhận thông báo */}
                  <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-4">
                    <h3 className="font-bold text-orange-600 flex items-center gap-2 mb-2">
                      Cài đặt nhận thông báo
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Email nhận thông báo đơn mới/hết hàng
                      </label>
                      <input
                        type="email"
                        value={emailConfig.emailNhanThongBao}
                        onChange={(e) =>
                          setEmailConfig({
                            ...emailConfig,
                            emailNhanThongBao: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="gmailNhanThongBao@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Ngưỡng báo động sắp hết hàng
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={emailConfig.nguongHetHang}
                          onChange={(e) =>
                            setEmailConfig({
                              ...emailConfig,
                              nguongHetHang: e.target.value,
                            })
                          }
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                          {emailConfig.nguongHetHang} SP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveEmailConfig}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default StoreSettings;
