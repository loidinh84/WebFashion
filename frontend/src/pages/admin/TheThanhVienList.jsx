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

const TheThanhVienList = () => {
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    ten_hang: "",
    muc_chi_tieu_tu: "",
    ty_le_giam_gia: "",
    diem_thuong_them: "",
    mau_the: "#2563eb",
    mo_ta_quyen_loi: "",
  });

  const fetchMemberships = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/memberships`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();

      // LOGIC MỚI: Tự động tương thích dù Backend trả về Array trực tiếp hay Object { data: [...] }
      const arrData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setMemberships(arrData);
    } catch {
      toast.error("Lỗi tải danh sách hạng thẻ");
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setForm({
        ten_hang: item.ten_hang || "",
        muc_chi_tieu_tu: item.muc_chi_tieu_tu || "",
        ty_le_giam_gia: item.ty_le_giam_gia || "",
        diem_thuong_them: item.diem_thuong_them || "",
        mau_the: item.mau_the || "#2563eb",
        mo_ta_quyen_loi: item.mo_ta_quyen_loi || "",
      });
      setEditingItem(item);
    } else {
      setForm({
        ten_hang: "",
        muc_chi_tieu_tu: 0,
        ty_le_giam_gia: 0,
        diem_thuong_them: 0,
        mau_the: "#2563eb",
        mo_ta_quyen_loi: "",
      });
      setEditingItem(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.ten_hang.trim())
      return toast.warning("Vui lòng nhập tên hạng thẻ!");
    if (form.muc_chi_tieu_tu < 0)
      return toast.warning("Mức chi tiêu không được là số âm!");
    if (form.ty_le_giam_gia < 0 || form.ty_le_giam_gia > 100)
      return toast.warning("Tỷ lệ giảm giá phải từ 0 - 100%!");
    if (form.diem_thuong_them < 0)
      return toast.warning("Điểm thưởng thêm không được là số âm!");

    const loadingToast = toast.loading(
      editingItem ? "Đang cập nhật..." : "Đang thêm...",
    );

    try {
      const url = editingItem
        ? `${BASE_URL}/api/memberships/${editingItem.id}`
        : `${BASE_URL}/api/memberships`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.update(loadingToast, {
          render: editingItem ? "Cập nhật thành công!" : "Thêm mới thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setIsModalOpen(false);
        fetchMemberships();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      toast.update(loadingToast, {
        render: err.message || "Không thể lưu hạng thẻ!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const deleteItem = async (id, ten) => {
    Swal.fire({
      title: "Cảnh báo nguy hiểm?",
      text: `Xóa hạng thẻ "${ten}" có thể ảnh hưởng đến người dùng đang ở hạng này. Bạn chắc chắn chứ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Vẫn Xóa!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${BASE_URL}/api/memberships/${id}`, {
            method: "DELETE",
            headers: getAuthHeader(),
          });
          if (res.ok) {
            Swal.fire(
              "Đã xóa!",
              "Hạng thẻ đã bị xóa khỏi hệ thống.",
              "success",
            );
            fetchMemberships();
          } else {
            const data = await res.json();
            throw new Error(data.message);
          }
        } catch (err) {
          Swal.fire(
            "Lỗi!",
            err.message || "Không thể xóa hạng thẻ này.",
            "error",
          );
        }
      }
    });
  };

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price);

  return (
    <div className="p-4 md:p-6 lg:p-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Hạng Thẻ Thành Viên
          </h2>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-blue-500/30 transition-all cursor-pointer"
        >
          <Icons.Add className="w-5 h-5" /> Thêm Hạng Thẻ
        </button>
      </div>

      {/* BẢNG DỮ LIỆU ĐƯỢC CHĂM CHÚT LẠI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider w-1/3">
                  Hạng Thẻ
                </th>
                <th className="px-6 py-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider">
                  Mức chi tiêu tối thiểu
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider">
                  Thưởng điểm
                </th>
                <th className="px-6 py-4 text-center font-bold text-xs text-gray-500 uppercase tracking-wider w-40">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-500">
                        Chưa có hạng thẻ nào được thiết lập
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                memberships.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden"
                          style={{
                            backgroundColor: item.mau_the,
                            boxShadow: `0 4px 14px 0 ${item.mau_the}60`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6 relative z-10 drop-shadow-md"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-700 text-lg">
                            {item.ten_hang}
                          </p>
                          <p
                            className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[250px]"
                            title={item.mo_ta_quyen_loi}
                          >
                            {item.mo_ta_quyen_loi || "Thành viên tiêu chuẩn"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-bold px-3 py-1">
                          Từ {formatPrice(item.muc_chi_tieu_tu)} ₫
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-4 py-1 bg-blue-100 rounded-lg text-gray-700 font-bold ">
                        {item.ty_le_giam_gia}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {item.diem_thuong_them > 0 ? (
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg font-bold border border-orange-100">
                          +{item.diem_thuong_them}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => deleteItem(item.id, item.ten_hang)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
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

      {/* MODAL ĐƯỢC CĂN CHỈNH LẠI UX/UI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative z-10 animate-scale-up">
            <div className="px-6 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem
                  ? "Cập nhật thẻ thành viên"
                  : "Tạo thẻ thành viên mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl flex items-center justify-center hover:text-red-600 text-gray-500 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-9">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên hạng thẻ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ten_hang}
                    onChange={(e) =>
                      setForm({ ...form, ten_hang: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5 text-center">
                    Màu thẻ
                  </label>
                  <div className="relative w-full h-[45px] rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm">
                    <input
                      type="color"
                      value={form.mau_the}
                      onChange={(e) =>
                        setForm({ ...form, mau_the: e.target.value })
                      }
                      className="absolute -top-2 -left-2 w-28 h-14 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Mức chi tiêu từ (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={form.muc_chi_tieu_tu}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        muc_chi_tieu_tu:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-gray-600 font-medium transition-all mb-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Giảm giá (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={form.ty_le_giam_gia}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ty_le_giam_gia:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-600 font-medium transition-all mb-2"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      %
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Thưởng điểm (%)
                    </label>
                    <input
                      type="number"
                      value={form.diem_thuong_them}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          diem_thuong_them:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500/20 text-gray-600 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Mô tả quyền lợi
                </label>
                <textarea
                  rows="3"
                  value={form.mo_ta_quyen_loi}
                  onChange={(e) =>
                    setForm({ ...form, mo_ta_quyen_loi: e.target.value })
                  }
                  className="w-full px-4 py-1 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                >
                  {editingItem ? "Cập nhật thẻ" : "Lưu thẻ mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TheThanhVienList;
