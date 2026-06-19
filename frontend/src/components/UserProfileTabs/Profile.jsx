import React, { useState, useEffect, useRef } from "react";
import { Icons } from "./Icons";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BASE_URL from "../../config/api";

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer text-sm ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
          }`}
      >
        <span className={!selectedOption ? "text-gray-400" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icons.ArrowDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-fade-in">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`p-2.5 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${value === opt.value
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-gray-700"
                }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileTab = ({ profileData, onProfileUpdated, onLogout }) => {
  const userInfo = profileData?.userInfo || {};
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [diaChiList, setDiaChiList] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedProv, setSelectedProv] = useState("");
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [addressForm, setAddressForm] = useState({
    ho_ten_nguoi_nhan: "",
    so_dien_thoai_dc: "",
    dia_chi_cu_the: "",
    la_mac_dinh: false,
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [ngaySinh, setNgaySinh] = useState(null);
  const [gioiTinh, setGioiTinh] = useState("");

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelAccountLoading, setCancelAccountLoading] = useState(false);

  useEffect(() => {
    if (userInfo.id) {
      setNgaySinh(userInfo.ngay_sinh ? new Date(userInfo.ngay_sinh) : null);
      setGioiTinh(userInfo.gioi_tinh || "");
    }
  }, [userInfo.id]);

  useEffect(() => {
    if (allLocations.length === 0) {
      fetch("https://provinces.open-api.vn/api/?depth=3")
        .then((res) => res.json())
        .then((data) => setAllLocations(data))
        .catch((err) => console.log("Lỗi tải tỉnh thành:", err));
    }
  }, [allLocations.length]);

  const handleProvinceChange = (provCode) => {
    setSelectedProv(provCode);
    setSelectedDist("");
    setSelectedWard("");

    const foundProv = allLocations.find((p) => p.code == provCode);
    setDistricts(foundProv ? foundProv.districts : []);
    setWards([]);
  };

  const handleDistrictChange = (distCode) => {
    setSelectedDist(distCode);
    setSelectedWard("");

    const foundDist = districts.find((d) => d.code == distCode);
    setWards(foundDist ? foundDist.wards : []);
  };

  const fetchDiaChi = async () => {
    if (!userInfo.id) return;
    try {
      const res = await fetch(`${BASE_URL}/api/taiKhoan/diachi/${userInfo.id}`);
      if (res.ok) {
        const data = await res.json();
        setDiaChiList(data);
      }
    } catch (error) {
      console.error("Lỗi lấy địa chỉ:", error);
    }
  };

  useEffect(() => {
    fetchDiaChi();
  }, [userInfo.id]);

  const diaChiMacDinh =
    diaChiList.find((dc) => dc.la_mac_dinh === 1 || dc.la_mac_dinh === true) ||
    diaChiList[0];

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
    return `${Math.floor(diffInMonths / 12)} năm trước`;
  };

  const handleUpdateProfile = async () => {
    try {
      const ho_ten = document.getElementById("ho_ten").value;
      const so_dien_thoai = document.getElementById(
        "so_dien_thoai_profile",
      ).value;

      const formData = new FormData();
      formData.append("ho_ten", ho_ten);
      formData.append("so_dien_thoai", so_dien_thoai || "");
      formData.append("gioi_tinh", gioiTinh);
      formData.append(
        "ngay_sinh",
        ngaySinh ? ngaySinh.toISOString().split("T")[0] : "",
      );

      if (avatarFile) {
        formData.append("anh_dai_dien", avatarFile);
      } else {
        formData.append("anh_dai_dien", userInfo.anh_dai_dien || "");
      }

      const res = await fetch(
        `${BASE_URL}/api/taiKhoan/updateProfile/${userInfo.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      if (res.ok) {
        toast.success("Cập nhật hồ sơ thành công!");
        setIsProfileModalOpen(false);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật!");
      }
    } catch {
      toast.error("Lỗi kết nối Server!");
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return toast.error("Vui lòng điền đầy đủ thông tin!");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Mật khẩu mới không khớp!");
    }
    try {
      const res = await fetch(
        `${BASE_URL}/api/taiKhoan/change-password/${userInfo.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.message || "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
        );
        setIsPasswordModalOpen(false);
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        if (onLogout) {
          setTimeout(() => {
            onLogout();
          }, 1500);
        }
      } else {
        toast.error(data.message || "Lỗi đổi mật khẩu!");
      }
    } catch {
      toast.error("Lỗi kết nối Server!");
    }
  };

  const openAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      ho_ten_nguoi_nhan: "",
      so_dien_thoai_dc: "",
      dia_chi_cu_the: "",
      la_mac_dinh: false,
    });
    setSelectedProv("");
    setSelectedDist("");
    setSelectedWard("");
    setDistricts([]);
    setWards([]);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (diaChi) => {
    setEditingAddressId(diaChi.id);
    setAddressForm({
      ho_ten_nguoi_nhan: diaChi.ho_ten_nguoi_nhan,
      so_dien_thoai_dc: diaChi.so_dien_thoai,
      dia_chi_cu_the: diaChi.dia_chi_cu_the,
      la_mac_dinh: diaChi.la_mac_dinh === 1 || diaChi.la_mac_dinh === true,
    });

    const matchLocation = (list, name) => {
      if (!name) return null;
      return list.find(
        (item) =>
          item.name === name ||
          item.name.includes(name) ||
          name.includes(item.name),
      );
    };

    const foundProv = matchLocation(allLocations, diaChi.tinh_thanh);
    if (foundProv) {
      setSelectedProv(foundProv.code);
      setDistricts(foundProv.districts);
      const foundDist = matchLocation(foundProv.districts, diaChi.quan_huyen);
      if (foundDist) {
        setSelectedDist(foundDist.code);
        setWards(foundDist.wards);
        const foundWard = matchLocation(foundDist.wards, diaChi.phuong_xa);
        if (foundWard) setSelectedWard(foundWard.code);
      }
    }
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (id) => {
    setAddressToDelete(id);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      const res = await fetch(
        `${BASE_URL}/api/taiKhoan/diachi/${addressToDelete}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        toast.success("Đã xóa địa chỉ!");
        fetchDiaChi();
      } else {
        const data = await res.json();
        toast.error(data.message || "Lỗi khi xóa địa chỉ!");
      }
    } catch {
      toast.error("Lỗi kết nối Server!");
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const {
        ho_ten_nguoi_nhan,
        so_dien_thoai_dc,
        dia_chi_cu_the,
        la_mac_dinh,
      } = addressForm;

      if (
        !ho_ten_nguoi_nhan ||
        !so_dien_thoai_dc ||
        !dia_chi_cu_the ||
        !selectedProv ||
        !selectedDist ||
        !selectedWard
      ) {
        return toast.error("Vui lòng điền đầy đủ thông tin!");
      }

      const tinh_thanh = allLocations.find((p) => p.code == selectedProv)?.name;
      const quan_huyen = districts.find((d) => d.code == selectedDist)?.name;
      const phuong_xa = wards.find((w) => w.code == selectedWard)?.name;

      const url = editingAddressId
        ? `${BASE_URL}/api/taiKhoan/diachi/${editingAddressId}`
        : `${BASE_URL}/api/taiKhoan/addAddress`;

      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tai_khoan_id: userInfo.id,
          ho_ten_nguoi_nhan,
          so_dien_thoai: so_dien_thoai_dc,
          tinh_thanh,
          quan_huyen,
          phuong_xa,
          dia_chi_cu_the,
          la_mac_dinh,
        }),
      });

      if (res.ok) {
        toast.success(
          editingAddressId
            ? "Đã cập nhật địa chỉ!"
            : "Đã thêm địa chỉ giao hàng!",
        );
        setIsAddressModalOpen(false);
        fetchDiaChi();
      } else {
        toast.error("Có lỗi xảy ra!");
      }
    } catch {
      toast.error("Lỗi kết nối Server!");
    }
  };

  const handleCancelAccount = async () => {
    setCancelAccountLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/taiKhoan/cancel-account/${userInfo.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Hủy tài khoản thành công!");
        setIsCancelModalOpen(false);
        if (onLogout) {
          setTimeout(() => {
            onLogout();
          }, 1500);
        }
      } else {
        toast.error(data.message || "Lỗi khi hủy tài khoản!");
      }
    } catch (error) {
      console.error("Lỗi hủy tài khoản:", error);
      toast.error("Lỗi kết nối Server!");
    } finally {
      setCancelAccountLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-24 md:pb-0">
      {/* Khối 1: Thông tin cá nhân */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            Thông tin cá nhân
          </h2>
          <button
            onClick={() => {
              setNgaySinh(userInfo.ngay_sinh ? new Date(userInfo.ngay_sinh) : null);
              setGioiTinh(userInfo.gioi_tinh || "");
              setAvatarFile(null);
              setIsProfileModalOpen(true);
            }}
            className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Icons.Edit />
            Cập nhật
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Họ và tên:</span>
            <span className="font-bold text-gray-800">
              {userInfo.ho_ten || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Số điện thoại:</span>
            <span className="font-bold text-gray-800">
              {userInfo.so_dien_thoai || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Giới tính:</span>
            <span className="font-bold text-gray-800">
              {userInfo.gioi_tinh === "male"
                ? "Nam"
                : userInfo.gioi_tinh === "female"
                  ? "Nữ"
                  : userInfo.gioi_tinh === "other"
                    ? "Khác"
                    : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Email:</span>
            <span className="font-bold text-gray-800">
              {userInfo.email || "Chưa cập nhật"}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Ngày sinh:</span>
            <span className="font-bold text-gray-800">
              {userInfo.ngay_sinh
                ? new Date(userInfo.ngay_sinh).toLocaleDateString("vi-VN")
                : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500 min-w-max mr-4">
              Địa chỉ mặc định:
            </span>
            <span className="font-bold text-gray-800 text-right line-clamp-2">
              {diaChiMacDinh
                ? `${diaChiMacDinh.dia_chi_cu_the}, ${diaChiMacDinh.phuong_xa}, ${diaChiMacDinh.quan_huyen}, ${diaChiMacDinh.tinh_thanh}`
                : "Chưa thiết lập"}
            </span>
          </div>
        </div>
      </div>

      {/* Khối 2: Sổ địa chỉ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            Sổ địa chỉ
          </h2>
          <button
            onClick={openAddModal}
            className="flex text-sm text-red-500 font-medium hover:underline gap-1.5 cursor-pointer"
          >
            <Icons.Plus />
            Thêm địa chỉ
          </button>
        </div>

        {diaChiList.length > 0 ? (
          <div className="flex flex-col gap-3">
            {diaChiList.map((diaChi, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${diaChi.la_mac_dinh === 1 || diaChi.la_mac_dinh === true
                  ? "border-blue-100 bg-blue-50/30"
                  : "border-gray-100 bg-white"
                  } flex justify-between items-start`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">
                      {diaChi.ho_ten_nguoi_nhan}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 text-sm font-medium">
                      {diaChi.so_dien_thoai}
                    </span>
                    {(diaChi.la_mac_dinh === 1 ||
                      diaChi.la_mac_dinh === true) && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                          Mặc định
                        </span>
                      )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {diaChi.dia_chi_cu_the}
                  </p>
                  <p className="text-sm text-gray-600">
                    {`${diaChi.phuong_xa || ""}, ${diaChi.quan_huyen || ""}, ${diaChi.tinh_thanh || ""
                      }`.replace(/^,\s*|,\s*$/g, "")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEditAddress(diaChi)}
                    className="text-blue-600 text-sm font-bold hover:underline text-right cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(diaChi.id)}
                    className="text-red-600 text-sm font-bold hover:underline text-right cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Icons.Location />
            </div>
            <p className="text-gray-400 text-sm italic">
              Bạn chưa thiết lập địa chỉ giao hàng nào.
            </p>
          </div>
        )}
      </div>

      {/* Khối 3: Bảo mật & Liên kết */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mật khẩu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-bold text-gray-800">Mật khẩu</h2>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className=" text-red-500 font-medium hover:underline flex gap-1.5 items-center text-sm cursor-pointer"
            >
              <Icons.Edit className="w-3 h-3" /> Thay đổi
            </button>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Cập nhật lần cuối:</p>
            <p className="text-sm font-medium">
              {getRelativeTime(userInfo.updated_at)}
            </p>
          </div>
        </div>

        {/* Hủy tài khoản */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold text-red-600 flex items-center gap-2">
                Hủy tài khoản
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Tài khoản của bạn sẽ bị xóa vĩnh viễn và Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end mt-auto">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >Hủy tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cập nhật profile */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-1000 flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md px-7 py-3 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200">
              <h3 className="text-xl font-bold mb-1">Cập nhật hồ sơ</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-2xl text-center pb-4 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div
                  className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200"
                  onClick={() => document.getElementById("avatarInput").click()}
                >
                  <img
                    src={
                      avatarFile
                        ? URL.createObjectURL(avatarFile)
                        : userInfo.anh_dai_dien?.startsWith("http")
                          ? userInfo.anh_dai_dien
                          : userInfo.anh_dai_dien
                            ? `${BASE_URL}${userInfo.anh_dai_dien}`
                            : "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(userInfo.ho_ten || "U")
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">
                      Đổi ảnh
                    </span>
                  </div>
                  <input
                    type="file"
                    id="avatarInput"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatarFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="ho_ten"
                  defaultValue={userInfo.ho_ten}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  id="so_dien_thoai_profile"
                  defaultValue={userInfo.so_dien_thoai}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  defaultValue={userInfo.email}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                />
              </div>
              <CustomSelect
                label="Giới tính"
                placeholder="Chọn giới tính"
                value={gioiTinh}
                onChange={setGioiTinh}
                options={[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                  { value: "other", label: "Khác" },
                ]}
              />
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <DatePicker
                  selected={ngaySinh}
                  onChange={(date) => setNgaySinh(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Chọn ngày sinh"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 py-2 bg-[#4A44F2] text-white rounded-xl font-bold cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm địa chỉ */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-1000 flex items-center justify-center p-4 animate-fade-in ">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md px-6 py-2 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 mb-2">
              <h3 className="text-xl font-bold mb-1">
                {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-2xl text-center pb-4 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên người nhận
              </label>
              <input
                type="text"
                placeholder="Họ tên người nhận"
                value={addressForm.ho_ten_nguoi_nhan}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    ho_ten_nguoi_nhan: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={addressForm.so_dien_thoai_dc}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      so_dien_thoai_dc: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
                />
              </div>

              <CustomSelect
                label="Tỉnh/Thành phố"
                placeholder="Chọn Tỉnh/Thành phố"
                value={selectedProv}
                onChange={handleProvinceChange}
                options={allLocations.map((p) => ({
                  value: p.code,
                  label: p.name,
                }))}
              />

              <CustomSelect
                label="Quận/Huyện"
                placeholder="Chọn Quận/Huyện"
                value={selectedDist}
                onChange={handleDistrictChange}
                disabled={!selectedProv}
                options={districts.map((d) => ({
                  value: d.code,
                  label: d.name,
                }))}
              />

              <CustomSelect
                label="Phường/Xã"
                placeholder="Chọn Phường/Xã"
                value={selectedWard}
                onChange={setSelectedWard}
                disabled={!selectedDist}
                options={wards.map((w) => ({
                  value: w.code,
                  label: w.name,
                }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ cụ thể
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường..."
                  value={addressForm.dia_chi_cu_the}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      dia_chi_cu_the: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 mt-2 cursor-pointer ">
                <input
                  type="checkbox"
                  checked={addressForm.la_mac_dinh}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      la_mac_dinh: e.target.checked,
                    })
                  }
                  className="w-4 h-4 cursor-pointer"
                />{" "}
                <span className="text-sm">Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAddress}
                className="flex-1 py-2 bg-[#4A44F2] text-white rounded-xl font-bold cursor-pointer"
              >
                {editingAddressId ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {addressToDelete && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Trash className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Xóa địa chỉ này?
              </h3>
              <p className="text-gray-500 text-sm">
                Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể
                hoàn tác.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setAddressToDelete(null)}
                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <div className="w-px bg-gray-100"></div>
              <button
                onClick={confirmDeleteAddress}
                className="flex-1 py-3 text-red-600 font-bold hover:bg-red-50 transition-colors cursor-pointer"
              >
                Vâng, xóa đi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thay đổi mật khẩu */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-1000 flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm px-6 py-3 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 mb-4">
              <h3 className="text-xl font-bold mb-2">Đổi mật khẩu</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-2xl text-center pb-4 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-1 focus:ring-blue-200 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl font-bold cursor-pointer "
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 bg-[#4A44F2] text-white rounded-xl font-bold cursor-pointer"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận hủy tài khoản */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-1000 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Trash className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Hủy tài khoản của bạn?
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                Tài khoản sẽ bị vô hiệu hóa ngay lập tức và bạn sẽ đăng xuất khỏi hệ thống.
                <br />
                <span className="font-bold text-red-600">Chú ý:</span> Hãy đảm bảo chắc chắn với quyết định này trước khi bấm <strong>"Xác nhận hủy!"</strong>. Vì đây là hành động không thể hoàn tác.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelAccountLoading}
                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <div className="w-px bg-gray-100"></div>
              <button
                onClick={handleCancelAccount}
                disabled={cancelAccountLoading}
                className="flex-1 py-3 text-red-600 font-bold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelAccountLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận hủy!"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
