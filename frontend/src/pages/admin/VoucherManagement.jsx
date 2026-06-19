import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 10);
  return localISOTime;
};

const formatDateTimeUI = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price || 0);

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    ma_khuyen_mai: "",
    ten_chuong_trinh: "",
    loai: "phantram",
    gia_tri: "",
    gia_tri_toi_da: "",
    don_hang_toi_thieu: "",
    so_luong_ma: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
  });

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/khuyenMai`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      const arrData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setVouchers(arrData);
    } catch {
      toast.error("Lỗi tải danh sách khuyến mãi");
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setForm({
        ma_khuyen_mai: item.ma_khuyen_mai || "",
        ten_chuong_trinh: item.ten_chuong_trinh || "",
        loai: item.loai || "phantram",
        gia_tri: item.gia_tri || "",
        gia_tri_toi_da: item.gia_tri_toi_da || "",
        don_hang_toi_thieu: item.don_hang_toi_thieu || "",
        so_luong_ma: item.so_luong_ma || "",
        ngay_bat_dau: formatDateForInput(item.ngay_bat_dau),
        ngay_ket_thuc: formatDateForInput(item.ngay_ket_thuc),
      });
      setEditingItem(item);
    } else {
      setForm({
        ma_khuyen_mai: "",
        ten_chuong_trinh: "",
        loai: "phantram",
        gia_tri: "",
        gia_tri_toi_da: "",
        don_hang_toi_thieu: "",
        so_luong_ma: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: "",
      });
      setEditingItem(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.ma_khuyen_mai.trim())
      return toast.warning("Vui lòng nhập mã khuyến mãi!");
    if (!form.ten_chuong_trinh.trim())
      return toast.warning("Vui lòng nhập tên chương trình!");
    if (new Date(form.ngay_ket_thuc) <= new Date(form.ngay_bat_dau)) {
      return toast.warning("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
    }
    if (form.loai === "phantram" && (form.gia_tri <= 0 || form.gia_tri > 100)) {
      return toast.warning("Giảm phần trăm phải nằm trong khoảng 1 - 100%!");
    }

    const loadingToast = toast.loading(
      editingItem ? "Đang cập nhật..." : "Đang thêm...",
    );

    try {
      const url = editingItem
        ? `${BASE_URL}/api/khuyenMai/${editingItem.id}`
        : `${BASE_URL}/api/khuyenMai`;
      const method = editingItem ? "PUT" : "POST";

      const dataToSend = { ...form };
      if (dataToSend.ngay_bat_dau && dataToSend.ngay_bat_dau.length === 10) {
        dataToSend.ngay_bat_dau = `${dataToSend.ngay_bat_dau}T00:00:00`;
      }
      if (dataToSend.ngay_ket_thuc && dataToSend.ngay_ket_thuc.length === 10) {
        dataToSend.ngay_ket_thuc = `${dataToSend.ngay_ket_thuc}T23:59:59`;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        toast.update(loadingToast, {
          render: editingItem ? "Cập nhật thành công!" : "Thêm mới thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setIsModalOpen(false);
        fetchVouchers();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      toast.update(loadingToast, {
        render: err.message || "Không thể lưu khuyến mãi!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/api/khuyenMai/${id}/status`, {
        method: "PUT",
        headers: getAuthHeader(),
      });
      if (res.ok) {
        toast.success(
          currentStatus === "active"
            ? "Đã vô hiệu hóa mã!"
            : "Đã kích hoạt mã!",
        );
        fetchVouchers();
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái!");
    }
  };

  const deleteItem = async (id, ma) => {
    Swal.fire({
      title: "Cảnh báo nguy hiểm?",
      text: `Xóa mã "${ma}" vĩnh viễn khỏi hệ thống. Bạn chắc chắn chứ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Vẫn Xóa!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${BASE_URL}/api/khuyenMai/${id}`, {
            method: "DELETE",
            headers: getAuthHeader(),
          });
          if (res.ok) {
            Swal.fire("Đã xóa!", "Mã khuyến mãi đã bị xóa.", "success");
            fetchVouchers();
          } else {
            const data = await res.json();
            throw new Error(data.message);
          }
        } catch (err) {
          Swal.fire("Lỗi!", err.message || "Không thể xóa mã này.", "error");
        }
      }
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Quản Lý Khuyến Mãi
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-blue-500/30 transition-all cursor-pointer mt-2 md:mt-0"
        >
          <Icons.Add className="w-5 h-5" /> Tạo Mã Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-[10%]">
                  Mã KM
                </th>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-[20%]">
                  Chương trình
                </th>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-[12%]">
                  Mức Giảm
                </th>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-[10%]">
                  Điều kiện
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider w-[8%] whitespace-nowrap">
                  Số lượng
                </th>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-[18%]">
                  Thời hạn
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider w-[12%]">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider w-[15%] whitespace-nowrap">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-gray-400">
                    Chưa có mã khuyến mãi nào
                  </td>
                </tr>
              ) : (
                vouchers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm inline-block">
                        {item.ma_khuyen_mai}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 text-sm line-clamp-2 leading-relaxed">
                        {item.ten_chuong_trinh}
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5 font-medium">
                        Loại: {item.loai === "phantram" ? "Theo %" : "Tiền mặt"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-emerald-600">
                        Giảm{" "}
                        {item.loai === "phantram"
                          ? `${item.gia_tri}%`
                          : `${formatPrice(item.gia_tri)}đ`}
                      </p>
                      {item.gia_tri_toi_da > 0 && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          Tối đa:{" "}
                          <span className="font-bold text-gray-700">
                            {formatPrice(item.gia_tri_toi_da)}đ
                          </span>
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700 font-medium">
                        Từ{" "}
                        <span className="font-bold">
                          {formatPrice(item.don_hang_toi_thieu)}đ
                        </span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${item.da_su_dung >= item.so_luong_ma ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}
                      >
                        {item.da_su_dung} / {item.so_luong_ma}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs text-gray-600 mb-1.5">
                        <span className="text-gray-400 font-medium w-10 inline-block">
                          Từ:
                        </span>{" "}
                        <span className="font-bold">
                          {formatDateTimeUI(item.ngay_bat_dau)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-400 font-medium w-10 inline-block">
                          Đến:
                        </span>{" "}
                        <span className="font-bold text-red-500">
                          {formatDateTimeUI(item.ngay_ket_thuc)}
                        </span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                          item.trang_thai === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.trang_thai === "active" ? "Đang Bật" : "Đã Tắt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center items-center gap-2">
                        {new Date(item.ngay_ket_thuc) < new Date() ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-500 border border-gray-300 inline-block">
                            Đã Hết Hạn
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              toggleStatus(item.id, item.trang_thai)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer mr-1 border ${
                              item.trang_thai === "active"
                                ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
                            }`}
                          >
                            {item.trang_thai === "active" ? "Khóa" : "Mở lại"}
                          </button>
                        )}

                        <button
                          onClick={() => openModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() =>
                            deleteItem(item.id, item.ma_khuyen_mai)
                          }
                          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer font-medium"
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
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden relative z-10 animate-scale-up">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem
                  ? "Cập nhật mã khuyến mãi"
                  : "Tạo mã khuyến mãi mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl text-gray-400 hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ma_khuyen_mai}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ma_khuyen_mai: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:outline-0 focus:border-blue-500 uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chương trình <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ten_chuong_trinh}
                    onChange={(e) =>
                      setForm({ ...form, ten_chuong_trinh: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:outline-0 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại giảm
                  </label>
                  <select
                    value={form.loai}
                    onChange={(e) => setForm({ ...form, loai: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500  cursor-pointer appearance-none focus:outline-0"
                  >
                    <option value="phantram">Theo phần trăm (%)</option>
                    <option value="tienmat">Theo tiền mặt (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">
                    Mức giảm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.gia_tri}
                    onChange={(e) =>
                      setForm({ ...form, gia_tri: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giảm tối đa (đ)
                  </label>
                  <input
                    type="number"
                    value={form.gia_tri_toi_da}
                    onChange={(e) =>
                      setForm({ ...form, gia_tri_toi_da: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn tối thiểu (đ)
                  </label>
                  <input
                    type="number"
                    value={form.don_hang_toi_thieu}
                    onChange={(e) =>
                      setForm({ ...form, don_hang_toi_thieu: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng phát hành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.so_luong_ma}
                    onChange={(e) =>
                      setForm({ ...form, so_luong_ma: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.ngay_bat_dau}
                    onChange={(e) =>
                      setForm({ ...form, ngay_bat_dau: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.ngay_ket_thuc}
                    onChange={(e) =>
                      setForm({ ...form, ngay_ket_thuc: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 focus:outline-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                >
                  {editingItem ? "Lưu thay đổi" : "Tạo mã ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
