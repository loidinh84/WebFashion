import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

const PaymenList = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // State xử lý ảnh
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    ten_phuong_thuc: "",
    ma: "",
    loai: "cod",
    trang_thai: "active",
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/payments/admin-pay`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      setPaymentMethods(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi tải danh sách phương thức thanh toán");
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setForm({
        ten_phuong_thuc: item.ten_phuong_thuc || "",
        ma: item.ma || "",
        loai: item.loai || "cod",
        trang_thai: item.trang_thai || "active",
      });
      setEditingItem(item);
      setImagePreview(item.logo_url ? `${BASE_URL}${item.logo_url}` : null);
    } else {
      setForm({
        ten_phuong_thuc: "",
        ma: "",
        loai: "cod",
        trang_thai: "active",
      });
      setEditingItem(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.ten_phuong_thuc.trim() || !form.ma.trim()) {
      return toast.warning("Vui lòng nhập đầy đủ Tên và Mã phương thức!");
    }

    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(form.ma)) {
      return toast.warning(
        "Mã chỉ được chứa chữ IN HOA, số và dấu gạch dưới (VD: MOMO, VNPAY_1). Không chứa khoảng trắng!",
      );
    }

    const loadingToast = toast.loading(
      editingItem ? "Đang cập nhật..." : "Đang thêm...",
    );

    const submitData = new FormData();
    submitData.append("ten_phuong_thuc", form.ten_phuong_thuc);
    submitData.append("ma", form.ma);
    submitData.append("loai", form.loai);
    submitData.append("trang_thai", form.trang_thai);

    if (imageFile) {
      submitData.append("logo_url", imageFile);
    }

    try {
      const url = editingItem
        ? `${BASE_URL}/api/payments/${editingItem.id}`
        : `${BASE_URL}/api/payments`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: submitData,
      });

      if (res.ok) {
        toast.update(loadingToast, {
          render: editingItem
            ? "Cập nhật thành công!"
            : "Thêm phương thức thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setIsModalOpen(false);
        fetchPayments();
      } else {
        throw new Error();
      }
    } catch {
      toast.update(loadingToast, {
        render: "Có lỗi xảy ra!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const toggleStatus = async (id) => {
    try {
      await fetch(`${BASE_URL}/api/payments/${id}/toggle`, {
        method: "PUT",
        headers: getAuthHeader(),
      });
      toast.success("Đã đổi trạng thái");
      fetchPayments();
    } catch {
      toast.error("Lỗi đổi trạng thái");
    }
  };

  const deleteItem = async (id, ten) => {
    Swal.fire({
      title: "Xóa phương thức này?",
      text: `Bạn có chắc chắn muốn xóa "${ten}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Đồng ý, Xóa!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${BASE_URL}/api/payments/${id}`, {
            method: "DELETE",
            headers: getAuthHeader(),
          });
          if (res.ok) {
            Swal.fire(
              "Đã xóa!",
              "Phương thức thanh toán đã bị xóa.",
              "success",
            );
            fetchPayments();
          } else throw new Error();
        } catch {
          Swal.fire("Lỗi!", "Không thể xóa phương thức này.", "error");
        }
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Phương thức thanh toán
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white p-3 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-all cursor-pointer"
        >
          <Icons.Add className="w-5 h-5" /> Thêm phương thức mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-sm text-gray-500 uppercase">
                Phương thức
              </th>
              <th className="px-6 py-4 text-center font-bold text-sm text-gray-500 uppercase">
                Mã
              </th>
              <th className="px-6 py-4 text-center font-bold text-sm text-gray-500 uppercase">
                Loại
              </th>
              <th className="px-6 py-4 text-center font-bold text-sm text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-center w-40 font-bold text-sm text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : paymentMethods.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  Chưa có phương thức thanh toán nào
                </td>
              </tr>
            ) : (
              paymentMethods.map((pm) => (
                <tr
                  key={pm.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                        {pm.logo_url ? (
                          <img
                            src={`${BASE_URL}${pm.logo_url}`}
                            alt="logo"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">
                            Logo
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">
                        {pm.ten_phuong_thuc}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase text-gray-600">
                      {pm.ma}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${pm.loai === "cod" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {pm.loai === "cod" ? "COD" : "Chuyển khoản"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold  transition-all ${pm.trang_thai === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {pm.trang_thai === "active" ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal(pm)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => toggleStatus(pm.id)}
                        className={`px-4 py-1.5 rounded-lg border cursor-pointer text-sm font-medium whitespace-nowrap transition-all ${pm.trang_thai === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {pm.trang_thai === "active" ? "Ẩn" : "Mở lại"}
                      </button>
                      <button
                        onClick={() => deleteItem(pm.id, pm.ten_phuong_thuc)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="px-8 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem
                  ? "Sửa phương thức thanh toán"
                  : "Thêm phương thức mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* KHỐI CHỌN LOGO */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo Cổng Thanh Toán
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 shrink-0 relative group"
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icons.Picture className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <Icons.Picture className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Chọn ảnh</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      Tải lên logo ví điện tử hoặc ngân hàng (Nên dùng ảnh PNG,
                      tỉ lệ 1:1).
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên phương thức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Ví MoMo"
                    value={form.ten_phuong_thuc}
                    onChange={(e) =>
                      setForm({ ...form, ten_phuong_thuc: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mã (Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MOMO"
                    value={form.ma}
                    onChange={(e) =>
                      setForm({ ...form, ma: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono uppercase"
                    disabled={!!editingItem}
                  />
                  {!!editingItem && (
                    <div className="text-xs font-meidum p-1 -mb-4">
                      Không thể thay đổi khi chỉnh sửa.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Loại thanh toán
                  </label>
                  <select
                    value={form.loai}
                    onChange={(e) => setForm({ ...form, loai: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl  cursor-pointer focus:outline-none focus:border-blue-500 appearance-none bg-white font-medium text-gray-700"
                  >
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                    <option value="bank_transfer">
                      Chuyển khoản trực tuyến
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingItem ? "Lưu thay đổi" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymenList;
