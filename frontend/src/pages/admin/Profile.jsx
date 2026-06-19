import React, { useEffect, useState, useRef } from "react";
import * as Icons from "../../assets/icons/index";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "../../config/api";

const Profile = () => {
  const [user, setUser] = useState({
    TENDANGNHAP: "",
    TENNGUOIDUNG: "",
    SDT: "",
    EMAIL: "",
    NGAYSINH: "",
    GIOITINH: "male",
    DIACHI: "",
    QUYENHAN: "",
    HINHANH: "",
    id: null,
  });
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUser = JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user") || "{}",
    );
    const userId = savedUser?.id || 1;

    if (!userId) {
      toast.error("Không tìm thấy thông tin người dùng!");
      setIsLoading(false);
      return;
    }

    fetch(`${BASE_URL}/api/taiKhoan/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Backend not ready");
        return res.json();
      })
      .then((data) => {
        const mappedUser = {
          id: data.id,
          TENNGUOIDUNG: data.ho_ten || "",
          EMAIL: data.email || "",
          SDT: data.so_dien_thoai || "",
          QUYENHAN: data.vai_tro || "admin",
          HINHANH: data.anh_dai_dien || "",
          NGAYSINH: data.ngay_sinh ? data.ngay_sinh.split("T")[0] : "",
          GIOITINH: data.gioi_tinh || "male",
          TENDANGNHAP: data.email || "",
          created_at: data.created_at,
        };
        setUser(mappedUser);
        setTempUser(mappedUser);
        setAvatarPreview(
          mappedUser.HINHANH?.startsWith("http")
            ? mappedUser.HINHANH
            : mappedUser.HINHANH
              ? `${BASE_URL}${mappedUser.HINHANH}`
              : "",
        );
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Lỗi lấy thông tin người dùng!");
        setIsLoading(false);
      });
  };

  const toggleEdit = () => {
    if (isEditing) {
      setUser(tempUser);
      setAvatarFile(null);
      setAvatarPreview(
        tempUser.HINHANH?.startsWith("http")
          ? tempUser.HINHANH
          : tempUser.HINHANH
            ? `${BASE_URL}${tempUser.HINHANH}`
            : "",
      );
    } else {
      setTempUser(user);
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    const toastId = toast.loading("Đang lưu thay đổi...");
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const formData = new FormData();
      formData.append("ho_ten", user.TENNGUOIDUNG);
      formData.append("so_dien_thoai", user.SDT);
      formData.append("gioi_tinh", user.GIOITINH);
      formData.append("ngay_sinh", user.NGAYSINH);

      if (avatarFile) {
        formData.append("anh_dai_dien", avatarFile);
      } else {
        formData.append("anh_dai_dien", user.HINHANH || "");
      }

      const response = await fetch(
        `${BASE_URL}/api/taiKhoan/updateProfile/${user.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.update(toastId, {
          render: "Cập nhật thông tin thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setTempUser(user);
        setIsEditing(false);
        fetchProfile(); // Refresh to get the new avatar path

        // Update user data in local storage / session storage
        const storageUserStr = localStorage.getItem("user")
          ? localStorage.getItem("user")
          : sessionStorage.getItem("user");
        if (storageUserStr) {
          const savedUser = JSON.parse(storageUserStr);
          savedUser.ho_ten = user.TENNGUOIDUNG;
          if (localStorage.getItem("user"))
            localStorage.setItem("user", JSON.stringify(savedUser));
          if (sessionStorage.getItem("user"))
            sessionStorage.setItem("user", JSON.stringify(savedUser));
        }
      } else {
        toast.update(toastId, {
          render: "Lỗi từ server: " + data.message,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch {
      toast.update(toastId, {
        render: "Lỗi kết nối server!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning("Mật khẩu xác nhận không khớp!");
      return;
    }

    const toastId = toast.loading("Đang xử lý...");
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/taiKhoan/change-password/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: data.message || "Đổi mật khẩu thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordModal(false);
      } else {
        toast.update(toastId, {
          render: data.message || "Lỗi khi đổi mật khẩu",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch {
      toast.update(toastId, {
        render: "Lỗi kết nối hệ thống!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex w-full h-full bg-[#F8F9FD] overflow-y-auto justify-center font-inter p-6 lg:p-10">
      <ToastContainer position="top-right" />

      <div className="w-full max-w-7xl flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center font-bold text-gray-500 py-32">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* --- CỘT TRÁI: AVATAR & BẢO MẬT --- */}
            <div className="w-full lg:w-[380px] space-y-4 shrink-0">
              {/* Box Avatar */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center relative">
                <div
                  className="relative w-32 h-32 mx-auto mb-5 group cursor-pointer"
                  onClick={() => isEditing && fileInputRef.current.click()}
                >
                  <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden transition-all group-hover:border-blue-100">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icons.User className="w-15 h-15 object-cover opacity-30" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-blue-600/60 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-xs font-bold uppercase">
                        Đổi ảnh
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {user.TENNGUOIDUNG || user.TENDANGNHAP}
                </h3>
                <p className="text-blue-600 font-bold text-sm mb-4 uppercase tracking-widest mt-1">
                  {user.QUYENHAN}
                </p>
                <div className="inline-flex gap-3 px-5 py-2 bg-green-50 text-green-700 text-xs font-black rounded-full uppercase tracking-wider">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse self-center"></div>
                  Đang hoạt động
                </div>
              </div>

              {/* Box Bảo mật */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">
                  Bảo mật tài khoản
                </h4>
                <div className="space-y-4">
                  <StatusItem label="Xác thực Email" isDone={true} />
                  <StatusItem
                    label="Xác thực Số Điện Thoại"
                    isDone={user.SDT ? true : false}
                  />
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-3 py-3.5 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-700 transition-all border border-gray-200 cursor-pointer"
                >
                  Đổi mật khẩu bảo mật
                </button>
              </div>
            </div>

            {/* --- CỘT PHẢI: FORM THÔNG TIN --- */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-8 pb-5 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Hồ sơ cá nhân
                  </h2>
                  <button
                    onClick={toggleEdit}
                    className="flex items-center justify-center gap-2.5 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  <InfoField
                    label="Tên đăng nhập"
                    name="TENDANGNHAP"
                    value={user.TENDANGNHAP}
                    isLocked={true}
                  />
                  <InfoField
                    label="Họ và tên"
                    name="TENNGUOIDUNG"
                    value={user.TENNGUOIDUNG}
                    isLocked={!isEditing}
                    onChange={handleChange}
                  />
                  <InfoField
                    label="Số điện thoại"
                    name="SDT"
                    value={user.SDT}
                    isLocked={!isEditing}
                    onChange={handleChange}
                  />
                  <InfoField
                    label="Email"
                    name="EMAIL"
                    value={user.EMAIL}
                    isLocked={true}
                    onChange={handleChange}
                  />

                  <div className="md:col-span-2 grid grid-cols-2 gap-10">
                    <InfoField
                      label="Ngày Sinh"
                      name="NGAYSINH"
                      value={user.NGAYSINH}
                      type="date"
                      isLocked={!isEditing}
                      onChange={handleChange}
                    />
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                        Giới tính
                      </label>
                      <div className="relative">
                        <select
                          name="GIOITINH"
                          value={user.GIOITINH || "male"}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none appearance-none focus:border-blue-600 transition-all disabled:opacity-60 ${!isEditing ? "" : "cursor-pointer"}`}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Lưu thay đổi thông tin
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL ĐỔI MẬT KHẨU --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[30px] p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                Đổi mật khẩu bảo mật
              </h3>
              {/* Nút X Đóng Modal Mật Khẩu */}
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-2xl opacity-40 hover:opacity-100 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <PasswordField
                label="Mật khẩu hiện tại"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
              />
              <PasswordField
                label="Mật khẩu mới"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
              {/* Nút Cập Nhật Mật Khẩu */}
              <button
                type="submit"
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm mt-6 hover:bg-black transition-all cursor-pointer"
              >
                Cập nhật mật khẩu mới
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT TRÍCH XUẤT ---
function InfoField({
  label,
  name,
  value,
  type = "text",
  isLocked = false,
  onChange,
  placeholder = "",
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={isLocked}
        placeholder={placeholder}
        className={`w-full p-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isLocked
            ? "bg-gray-100 border-transparent text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-800 focus:border-blue-600"
          }`}
      />
    </div>
  );
}

function PasswordField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">
        {label}
      </label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full p-3.5 rounded-2xl border text-sm font-bold outline-none transition-all bg-white border-gray-200 text-gray-800 focus:border-blue-600"
      />
    </div>
  );
}

function StatusItem({ label, isDone }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0 pb-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isDone ? "bg-green-500 animate-pulse" : "bg-red-400"}`}
        ></div>
        <span
          className={`text-xs font-black uppercase tracking-wider ${isDone ? "text-green-600" : "text-red-500"}`}
        >
          {isDone ? "Hoàn tất" : "Chưa xác thực"}
        </span>
      </div>
    </div>
  );
}

export default Profile;
