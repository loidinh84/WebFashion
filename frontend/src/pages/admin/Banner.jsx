import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    tieu_de: "",
    duong_dan: "",
    thu_tu: 1,
    vi_tri: "homepage",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const getAuthHeader = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/banners/admin-banner`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi lấy danh sách banner");
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      tieu_de: "",
      duong_dan: "",
      thu_tu: 1,
      vi_tri: "homepage",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleEdit = (bn) => {
    setFormData({
      tieu_de: bn.tieu_de || "",
      duong_dan: bn.duong_dan || "",
      thu_tu: bn.thu_tu || 1,
      vi_tri: bn.vi_tri || "homepage",
    });
    setImagePreview(`${BASE_URL}${bn.hinh_anh_url}`);
    setImageFile(null);
    setEditingId(bn.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !editingId)
      return toast.error("Vui lòng chọn hình ảnh Banner!");

    const loadingToast = toast.loading(
      editingId ? "Đang cập nhật banner..." : "Đang thêm banner...",
    );

    const submitData = new FormData();
    submitData.append("tieu_de", formData.tieu_de);
    submitData.append("duong_dan", formData.duong_dan);
    submitData.append("thu_tu", formData.thu_tu);
    submitData.append("vi_tri", formData.vi_tri);
    if (imageFile) {
      submitData.append("hinh_anh", imageFile);
    }

    try {
      const url = editingId
        ? `${BASE_URL}/api/banners/${editingId}`
        : `${BASE_URL}/api/banners`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeader(),
        body: submitData,
      });

      if (res.ok) {
        toast.update(loadingToast, {
          render: editingId
            ? "Cập nhật thành công!"
            : "Thêm banner thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setIsModalOpen(false);
        resetForm();
        fetchBanners();
      } else {
        throw new Error();
      }
    } catch {
      toast.update(loadingToast, {
        render: editingId ? "Cập nhật thất bại!" : "Thêm banner thất bại!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const deleteBanner = async (id) => {
    const loadingToast = toast.loading("Đang xóa banner...");

    try {
      await fetch(`${BASE_URL}/api/banners/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      toast.update(loadingToast, {
        render: "Xóa banner thành công!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      fetchBanners();
    } catch {
      toast.update(loadingToast, {
        render: "Lỗi khi xóa banner!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  const toggleStatus = async (id) => {
    try {
      await fetch(`${BASE_URL}/api/banners/${id}/toggle`, {
        method: "PUT",
        headers: getAuthHeader(),
      });
      toast.success("Cập nhật trạng thái thành công");
      fetchBanners();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <div className="flex w-full max-w-[1500px] h-full p-6 gap-6 flex-col">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý Banner</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2.5 pl-3 rounded-xl font-medium flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Icons.Add className="w-5 h-5" /> Thêm Banner mới
          </button>
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
          <table className="w-full min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-5 text-left font-semibold text-gray-600 w-52">
                  Hình ảnh
                </th>
                <th className="px-6 py-5 text-left font-semibold text-gray-600">
                  Tiêu đề / Link
                </th>
                <th className="px-6 py-5 text-center font-semibold text-gray-600 w-36">
                  Vị trí
                </th>
                <th className="px-6 py-5 text-center font-semibold text-gray-600 w-28">
                  Thứ tự
                </th>
                <th className="px-6 py-5 text-center font-semibold text-gray-600 whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-6 py-5 text-center font-semibold text-gray-600 w-32 whitespace-nowrap">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Icons.Picture className="w-20 h-20 opacity-20" />
                      <p className="text-gray-500 text-xl">
                        Chưa có banner nào
                      </p>
                      <p className="text-gray-400 mt-2">
                        Nhấn nút "Thêm Banner mới" để bắt đầu
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                banners.map((bn) => (
                  <tr
                    key={bn.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={`${BASE_URL}${bn.hinh_anh_url}`}
                        alt={bn.tieu_de}
                        className="h-24 w-48 object-cover rounded-lg shadow-sm border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 mb-1">
                        {bn.tieu_de || "Không có tiêu đề"}
                      </p>
                      {bn.duong_dan && (
                        <a
                          href={bn.duong_dan}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {bn.duong_dan}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider">
                        {bn.vi_tri.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-700">
                      {bn.thu_tu}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap- font-medium ${
                          bn.trang_thai === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {bn.trang_thai === "active" ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <button
                        onClick={() => handleEdit(bn)}
                        className="text-amber-600 font-bold p-3 hover:bg-red-50 rounded-lg transition-all cursor-pointer whitespace-nowrap border border-amber-400 py-1.5 "
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => toggleStatus(bn.id)}
                        className={`w-full cursor-pointer font-bold py-1.5 rounded-lg border transition ${
                          bn.trang_thai === "active"
                            ? "border-amber-500 text-amber-600 hover:bg-amber-50"
                            : "border-green-500 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {bn.trang_thai === "active"
                          ? "Ẩn Banner"
                          : "Hiện thị lại"}
                      </button>
                      <button
                        onClick={() => deleteBanner(bn.id)}
                        className="text-red-500 border border-red-400 w-full font-bold hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all whitespace-nowrap cursor-pointer"
                      >
                        Xóa Banner
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingId ? "Chỉnh sửa Banner" : "Thêm Banner Mới"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-3xl text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Hình ảnh Banner{" "}
                  {!editingId && <span className="text-red-500">*</span>}
                </label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="relative border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium">
                          Click để đổi ảnh khác
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Icons.Picture className="w-7 h-7 text-blue-500" />
                      <p className="text-gray-500 font-medium">
                        Click để chọn hình ảnh
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tỷ lệ khuyến nghị: 21:9
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={formData.tieu_de}
                    onChange={(e) =>
                      setFormData({ ...formData, tieu_de: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                    placeholder="Ví dụ: Khuyến mãi hè 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.thu_tu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thu_tu: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Đường dẫn khi click (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.duong_dan}
                  onChange={(e) =>
                    setFormData({ ...formData, duong_dan: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg font-medium transition shadow-md cursor-pointer"
                >
                  {editingId ? "Lưu thay đổi" : "Lưu Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
