import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";
import Swal from "sweetalert2";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

const LogisticsList = () => {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    ten_don_vi: "",
    ma: "",
    phi_co_ban: 0,
    thoi_gian_du_kien: "",
    trang_thai: "active",
  });

  const fetchLogistics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/logistics/admin-logistics`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi tải danh sách đơn vị vận chuyển");
      setList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
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
      setForm(item);
      setEditingItem(item);
    } else {
      setForm({
        ten_don_vi: "",
        ma: "",
        phi_co_ban: 0,
        thoi_gian_du_kien: "",
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

    if (!form.ten_don_vi.trim()) {
      return toast.warning("Vui lòng nhập tên đơn vị vận chuyển!");
    }
    if (!form.ma.trim()) {
      return toast.warning("Vui lòng nhập mã đơn vị!");
    }

    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(form.ma.toUpperCase())) {
      return toast.warning(
        "Mã đơn vị không hợp lệ (Chỉ dùng chữ cái không dấu, số và dấu gạch dưới. VD: GHTK, GHN_01)",
      );
    }

    if (form.phi_co_ban < 0) {
      return toast.warning("Phí vận chuyển không được là số âm!");
    }

    if (!editingItem && !imageFile) {
      return toast.warning("Vui lòng tải lên logo của đơn vị vận chuyển!");
    }

    const loadingToast = toast.loading(
      editingItem ? "Đang cập nhật..." : "Đang thêm...",
    );

    const submitData = new FormData();
    submitData.append("ten_don_vi", form.ten_don_vi);
    submitData.append("ma", form.ma);
    submitData.append("phi_co_ban", form.phi_co_ban);
    submitData.append("thoi_gian_du_kien", form.thoi_gian_du_kien);
    submitData.append("trang_thai", form.trang_thai);
    if (imageFile) {
      submitData.append("logo_url", imageFile);
    }

    try {
      const url = editingItem
        ? `${BASE_URL}/api/logistics/${editingItem.id}`
        : `${BASE_URL}/api/logistics`;

      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: submitData,
      });

      if (res.ok) {
        toast.update(loadingToast, {
          render: editingItem ? "Cập nhật thành công!" : "Thêm mới thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setIsModalOpen(false);
        fetchLogistics();
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

  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`${BASE_URL}/api/logistics/${id}/toggle`, {
        method: "PUT",
        headers: getAuthHeader(),
      });
      toast.success("Đã đổi trạng thái");
      fetchLogistics();
    } catch {
      toast.error("Lỗi đổi trạng thái");
    }
  };

  const deleteItem = async (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn muốn xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Đồng ý, Xóa!",
      cancelButtonText: "Hủy bỏ",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${BASE_URL}/api/logistics/${id}`, {
            method: "DELETE",
            headers: getAuthHeader(),
          });

          if (res.ok) {
            Swal.fire("Đã xóa!", "Đơn vị vận chuyển đã bị xóa.", "success");

            fetchLogistics();
          } else {
            throw new Error("Lỗi từ server");
          }
        } catch {
          Swal.fire("Thất bại!", "Đã có lỗi xảy ra khi xóa.", "error");
        }
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Đơn vị vận chuyển</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium"
        >
          <Icons.Add className="w-5 h-5" /> Thêm đơn vị mới
        </button>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">Đơn vị</th>
              <th className="px-6 py-4 text-center">Mã</th>
              <th className="px-6 py-4 text-center">Phí cơ bản</th>
              <th className="px-6 py-4 text-center">Thời gian dự kiến</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-center w-40">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  Chưa có đơn vị vận chuyển nào hãy bấm nút "Thêm đơn vị mới" để
                  thêm.
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.logo_url ? (
                          <img
                            src={`${BASE_URL}${item.logo_url}`}
                            alt="logo"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">
                            Ảnh
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {item.ten_don_vi}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-gray-600 font-mono text-xs font-bold">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {item.ma}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-gray-700">
                    {new Intl.NumberFormat("vi-VN").format(item.phi_co_ban)} ₫
                  </td>
                  <td className="px-5 py-4 text-center text-gray-500">
                    {item.thoi_gian_du_kien || "—"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        item.trang_thai === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.trang_thai === "active" ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center  gap-2">
                      <button
                        onClick={() => openModal(item)}
                        className="text-sm font-bold px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id, item.trang_thai)}
                        className={`px-3 py-1.5 cursor-pointer rounded-lg border whitespace-nowrap text-sm font-medium ${
                          item.trang_thai === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.trang_thai === "active" ? "Ẩn" : "Mở lại"}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-sm font-bold px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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

      {/* Modal Thêm / Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-8 py-3 border-b border-gray-200 flex justify-between">
              <h3 className="text-2xl font-bold">
                {editingItem ? "Sửa đơn vị" : "Thêm đơn vị vận chuyển"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo Đơn Vị
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
                      Tải lên ảnh logo của đơn vị vận chuyển (Khuyên dùng ảnh
                      vuông, nền trong suốt PNG).
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

              {/* KHỐI NHẬP TEXT */}
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên đơn vị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giao Hàng Tiết Kiệm"
                    value={form.ten_don_vi}
                    onChange={(e) =>
                      setForm({ ...form, ten_don_vi: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mã đơn vị
                  </label>
                  <input
                    type="text"
                    placeholder="VD: GHTK"
                    value={form.ma}
                    onChange={(e) => setForm({ ...form, ma: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phí cơ bản (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="30000"
                    value={form.phi_co_ban}
                    onChange={(e) =>
                      setForm({ ...form, phi_co_ban: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian dự kiến
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 2-3 ngày"
                    value={form.thoi_gian_du_kien}
                    onChange={(e) =>
                      setForm({ ...form, thoi_gian_du_kien: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* FOOTER NÚT BẤM */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition shadow-md cursor-pointer"
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

export default LogisticsList;
