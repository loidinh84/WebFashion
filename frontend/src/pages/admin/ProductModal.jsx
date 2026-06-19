import React, { useRef, useState } from "react";
import * as Icons from "../../assets/icons/index";
import BASE_URL from "../../config/api";

const API_BASE = BASE_URL;

const tabs = [
  { id: 1, name: "1. Thông tin chung" },
  { id: 2, name: "2. Thuộc tính" },
  { id: 3, name: "3. Biến thể" },
  { id: 4, name: "4. Hình ảnh" },
];

const ProductModal = ({
  isModalOpen,
  setIsModalOpen,
  activeTab,
  setActiveTab,
  formData,
  setFormData,
  handleBasicChange,
  handleArrayChange,
  addRow,
  removeRow,
  handleSaveProduct,
  editingProduct,
  categories,
  suppliers,
  uploadedFiles,
  setUploadedFiles,
}) => {
  const dropRef = useRef(null);
  const fileInput = useRef(null);
  const slotInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);

  if (!isModalOpen) return null;

  // ── BUILD UNIFIED LIST ──
  const oldImages = (formData.hinh_anh || []).map((img, i) => ({
    type: "old",
    url_anh: img.url_anh,
    alt_text: img.alt_text || "",
    la_anh_chinh: i === 0,
    thu_tu: i + 1,
  }));
  const newImages = (uploadedFiles || []).map((file) => ({
    type: "new",
    file,
    previewUrl: URL.createObjectURL(file),
  }));

  const allImages = [...oldImages, ...newImages];
  const totalSlots = Math.max(4, allImages.length + 1);

  // ── THÊM ẢNH ──
  const addFiles = (files, insertAtSlot = null) => {
    const validFiles = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    if (validFiles.length === 0) return;

    if (insertAtSlot !== null && insertAtSlot < allImages.length) {
      replaceImageAtSlot(insertAtSlot, validFiles[0]);
      if (validFiles.length > 1) {
        setUploadedFiles((prev) => [...prev, ...validFiles.slice(1)]);
      }
    } else {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const replaceImageAtSlot = (slotIndex, file) => {
    const oldCount = oldImages.length;
    if (slotIndex < oldCount) {
      const newOld = formData.hinh_anh.filter((_, i) => i !== slotIndex);
      setFormData((prev) => ({ ...prev, hinh_anh: newOld }));
      setUploadedFiles((prev) => [file, ...prev]);
    } else {
      const newIdx = slotIndex - oldCount;
      setUploadedFiles((prev) => {
        const arr = [...prev];
        arr[newIdx] = file;
        return arr;
      });
    }
  };

  // ── XÓA ẢNH ──
  const removeImage = (slotIndex) => {
    const oldCount = oldImages.length;
    if (slotIndex < oldCount) {
      const newOld = formData.hinh_anh.filter((_, i) => i !== slotIndex);
      setFormData((prev) => ({ ...prev, hinh_anh: newOld }));
    } else {
      const newIdx = slotIndex - oldCount;
      setUploadedFiles((prev) => prev.filter((_, i) => i !== newIdx));
    }
  };

  // ── SET ẢNH CHÍNH ─────────────────────────────────────────────────────────
  // Di chuyển ảnh tại slotIndex lên vị trí 0 (ảnh chính = index 0)
  const setAsMain = (slotIndex) => {
    if (slotIndex === 0) return;
    const combined = [...allImages];
    const [item] = combined.splice(slotIndex, 1);
    combined.unshift(item);

    // Tách lại thành oldImages & newImages theo thứ tự mới
    const newOld = combined
      .filter((i) => i.type === "old")
      .map((img, idx) => ({
        url_anh: img.url_anh,
        alt_text: img.alt_text,
        la_anh_chinh: idx === 0,
        thu_tu: idx + 1,
      }));
    const newFiles = combined
      .filter((i) => i.type === "new")
      .map((i) => i.file);

    setFormData((prev) => ({ ...prev, hinh_anh: newOld }));
    setUploadedFiles(newFiles);
  };

  // ── DI CHUYỂN ẢNH (← →) ──────────────────────────────────────────────────
  const moveImage = (slotIndex, direction) => {
    const target = slotIndex + direction;
    if (target < 0 || target >= allImages.length) return;

    const combined = [...allImages];
    [combined[slotIndex], combined[target]] = [
      combined[target],
      combined[slotIndex],
    ];

    const newOld = combined
      .filter((i) => i.type === "old")
      .map((img, idx) => ({
        url_anh: img.url_anh,
        alt_text: img.alt_text,
        la_anh_chinh: idx === 0,
        thu_tu: idx + 1,
      }));
    const newFiles = combined
      .filter((i) => i.type === "new")
      .map((i) => i.file);

    setFormData((prev) => ({ ...prev, hinh_anh: newOld }));
    setUploadedFiles(newFiles);
  };

  // ── DRAG & DROP ───────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── CLICK SLOT ────────────────────────────────────────────────────────────
  const handleSlotClick = (slotIndex) => {
    setPendingSlot(slotIndex);
    slotInputRef.current?.click();
  };

  const handleSlotFileChange = (e) => {
    if (e.target.files.length > 0) {
      addFiles(e.target.files, pendingSlot);
    }
    e.target.value = null;
    setPendingSlot(null);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-[#F8FAFC] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* ── HEADER ── */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-gray-800">
            {editingProduct
              ? `Cập nhật: ${editingProduct.name || editingProduct.ten_san_pham}`
              : "Thêm sản phẩm mới"}
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-red-500 text-3xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="bg-white px-6 pt-3 border-b border-gray-200 overflow-x-auto shrink-0">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer
                  ${activeTab === tab.id ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:bg-gray-50"}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── NỘI DUNG ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-full">
            {/* ═══ TAB 1: THÔNG TIN CHUNG ═══ */}
            {activeTab === 1 && (
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-2 gap-5 text-sm">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-gray-700 mb-2">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="ten_san_pham"
                      value={formData.ten_san_pham}
                      onChange={handleBasicChange}
                      type="text"
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-gray-700 mb-2">
                      Thương hiệu
                    </label>
                    <input
                      name="thuong_hieu"
                      value={formData.thuong_hieu}
                      onChange={handleBasicChange}
                      type="text"
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Danh mục
                    </label>
                    <select
                      name="danh_muc_id"
                      value={formData.danh_muc_id || ""}
                      onChange={handleBasicChange}
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer appearance-none"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.ten_danh_muc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Nhà cung cấp
                    </label>
                    <select
                      name="nha_cung_cap_id"
                      value={formData.nha_cung_cap_id || ""}
                      onChange={handleBasicChange}
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer appearance-none"
                    >
                      <option value="">Chọn nhà cung cấp</option>
                      {suppliers?.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.ten_nha_cc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Trạng thái kinh doanh
                    </label>
                    <select
                      name="trang_thai"
                      value={formData.trang_thai}
                      onChange={handleBasicChange}
                      className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer appearance-none"
                    >
                      <option value="active">Đang kinh doanh</option>
                      <option value="inactive">Ngừng kinh doanh</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1 pt-6">
                    <input
                      type="checkbox"
                      name="noi_bat"
                      id="noi_bat"
                      checked={formData.noi_bat}
                      onChange={handleBasicChange}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                    />
                    <label
                      htmlFor="noi_bat"
                      className="font-bold text-gray-800 cursor-pointer"
                    >
                      Là sản phẩm nổi bật
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">
                      Mô tả ngắn
                    </label>
                    <textarea
                      name="mo_ta_ngan"
                      value={formData.mo_ta_ngan}
                      onChange={handleBasicChange}
                      rows="2"
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Mô tả ngắn..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-2">
                      Mô tả đầy đủ
                    </label>
                    <textarea
                      name="mo_ta_day_du"
                      value={formData.mo_ta_day_du}
                      onChange={handleBasicChange}
                      rows="5"
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                      placeholder="Mô tả chi tiết..."
                    />
                  </div>
                  <div className=" border-t border-gray-200 pt-4">
                    <h4 className="font-bold text-gray-800 mb-4">Thông số</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1 whitespace-nowrap">
                          Cân nặng (Gram)
                        </label>
                        <input
                          type="number"
                          name="can_nang"
                          value={formData.can_nang}
                          onChange={handleBasicChange}
                          className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                          placeholder="VD: 500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Dài (cm)
                        </label>
                        <input
                          type="number"
                          name="chieu_dai"
                          value={formData.chieu_dai}
                          onChange={handleBasicChange}
                          className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                          placeholder="VD: 20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Rộng (cm)
                        </label>
                        <input
                          type="number"
                          name="chieu_rong"
                          value={formData.chieu_rong}
                          onChange={handleBasicChange}
                          className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                          placeholder="VD: 10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Cao (cm)
                        </label>
                        <input
                          type="number"
                          name="chieu_cao"
                          value={formData.chieu_cao}
                          onChange={handleBasicChange}
                          className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                          placeholder="VD: 5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ---- CẤU HÌNH SEO ---- */}
                  <div className=" border-t border-gray-200 pt-4">
                    <h4 className="font-bold text-gray-800 mb-4">
                      Cấu hình SEO (Tối ưu tìm kiếm)
                    </h4>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-1">
                        Meta Title (Tiêu đề SEO)
                      </label>
                      <input
                        type="text"
                        name="meta_title"
                        value={formData.meta_title}
                        onChange={handleBasicChange}
                        className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                        placeholder="Nên để 50 - 60 ký tự..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Meta Description (Mô tả SEO)
                      </label>
                      <textarea
                        name="meta_description"
                        value={formData.meta_description}
                        onChange={handleBasicChange}
                        className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500 min-h-[80px]"
                        placeholder="Mô tả ngắn gọn hiển thị trên Google..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 2: THUỘC TÍNH ═══ */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Thông số kỹ thuật
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Nhóm giúp phân loại (VD: Màn hình, Hiệu năng, Kết nối).
                </p>
                {formData.thuoc_tinh.map((item, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      value={item.nhom}
                      onChange={(e) =>
                        handleArrayChange(
                          "thuoc_tinh",
                          index,
                          "nhom",
                          e.target.value,
                        )
                      }
                      type="text"
                      className="w-1/5 border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Nhóm"
                    />
                    <input
                      value={item.ten_thuoc_tinh}
                      onChange={(e) =>
                        handleArrayChange(
                          "thuoc_tinh",
                          index,
                          "ten_thuoc_tinh",
                          e.target.value,
                        )
                      }
                      type="text"
                      className="w-2/5 border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Tên thông số"
                    />
                    <input
                      value={item.gia_tri}
                      onChange={(e) =>
                        handleArrayChange(
                          "thuoc_tinh",
                          index,
                          "gia_tri",
                          e.target.value,
                        )
                      }
                      type="text"
                      className="flex-1 border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Giá trị"
                    />
                    <button
                      onClick={() => removeRow("thuoc_tinh", index)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50  rounded-lg transition cursor-pointer shrink-0"
                    >
                      <Icons.Delete className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    addRow("thuoc_tinh", {
                      ten_thuoc_tinh: "",
                      gia_tri: "",
                      nhom: "",
                      thu_tu: formData.thuoc_tinh.length + 1,
                    })
                  }
                  className="mt-2 px-3 py-2 text-sm text-blue-600 font-semibold border border-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Icons.Add className="w-4 h-4" />
                  Thêm thông số
                </button>
              </div>
            )}

            {/* ═══ TAB 3: BIẾN THỂ ═══ */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">
                  Các phiên bản & Mức giá
                </h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-sm min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-3 font-semibold text-gray-600">SKU</th>
                        <th className="p-3 font-semibold text-gray-600">
                          Màu sắc
                        </th>
                        <th className="p-3 font-semibold text-gray-600">
                          Mã màu
                        </th>
                        <th className="p-3 font-semibold text-gray-600">
                          Dung lượng
                        </th>
                        <th className="p-3 font-semibold text-gray-600">RAM</th>
                        <th className="p-3 font-semibold text-gray-600">
                          Giá gốc
                        </th>
                        <th className="p-3 font-semibold text-gray-600">
                          Giá bán
                        </th>
                        <th className="p-3 font-semibold text-gray-600 w-20 text-center">
                          Tồn kho
                        </th>
                        <th className="p-3 font-semibold text-gray-600 whitespace-nowrap">
                          Trạng thái
                        </th>
                        <th className="p-3 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.bien_the.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-300 last:border-0 hover:bg-gray-50"
                        >
                          <td className="p-2">
                            <input
                              value={item.sku}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "sku",
                                  e.target.value,
                                )
                              }
                              type="text"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="SKU..."
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.mau_sac}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "mau_sac",
                                  e.target.value,
                                )
                              }
                              type="text"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="Tên màu..."
                            />
                          </td>
                          <td className="p-2 w-28">
                            <div className="flex items-center gap-0.5">
                              <input
                                type="color"
                                value={item.ma_mau_hex || "#ffffff"}
                                onChange={(e) =>
                                  handleArrayChange(
                                    "bien_the",
                                    index,
                                    "ma_mau_hex",
                                    e.target.value,
                                  )
                                }
                                className="w-5 h-7 rounded border border-gray-300 cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none p-0"
                              />
                              <input
                                value={item.ma_mau_hex || ""}
                                onChange={(e) =>
                                  handleArrayChange(
                                    "bien_the",
                                    index,
                                    "ma_mau_hex",
                                    e.target.value,
                                  )
                                }
                                type="text"
                                className="w-20 border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm font-mono"
                                placeholder="#ffffff"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              value={item.dung_luong}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "dung_luong",
                                  e.target.value,
                                )
                              }
                              type="text"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="256GB..."
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.ram}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "ram",
                                  e.target.value,
                                )
                              }
                              type="text"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="8GB..."
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.gia_goc}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "gia_goc",
                                  e.target.value,
                                )
                              }
                              type="number"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.gia_ban}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "gia_ban",
                                  e.target.value,
                                )
                              }
                              type="number"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={item.ton_kho}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "ton_kho",
                                  e.target.value,
                                )
                              }
                              type="number"
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.trang_thai || "active"}
                              onChange={(e) =>
                                handleArrayChange(
                                  "bien_the",
                                  index,
                                  "trang_thai",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-gray-300 px-2 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer appearance-none"
                            >
                              <option value="active">Hiện</option>
                              <option value="inactive">Ẩn</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeRow("bien_the", index)}
                              className="text-red-400 hover:text-red-600 cursor-pointer"
                            >
                              <Icons.Delete className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() =>
                    addRow("bien_the", {
                      sku: "",
                      mau_sac: "",
                      dung_luong: "",
                      ram: "",
                      gia_goc: 0,
                      gia_ban: 0,
                      ton_kho: 0,
                      ma_mau_hex: "",
                      trang_thai: "active",
                    })
                  }
                  className="mt-2 px-4 py-2 text-sm text-green-600 font-semibold border border-green-400 rounded-lg hover:bg-green-50 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Icons.Add className="w-4 h-4" /> Thêm biến thể mới
                </button>
              </div>
            )}

            {/* ═══ TAB 4: HÌNH ẢNH ═══ */}
            {activeTab === 4 && (
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">
                  Quản lý hình ảnh
                </h4>

                {/* Hidden file inputs */}
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = null;
                  }}
                />
                <input
                  ref={slotInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleSlotFileChange}
                />

                {/* ── Drop zone ── */}
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInput.current?.click()}
                  className={`border rounded-xl p-2 text-center flex flex-col items-center justify-center cursor-pointer transition select-none
                    ${dragOver ? "border-blue-500 bg-blue-100" : "border-blue-300 bg-blue-50/50 hover:bg-blue-50"}`}
                >
                  <Icons.Picture className="w-8 h-8 text-blue-500 pointer-events-none" />
                  <p className="font-semibold text-blue-700 pointer-events-none">
                    {dragOver
                      ? "Thả ảnh vào đây..."
                      : "Click hoặc kéo thả hình ảnh vào đây"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 pointer-events-none">
                    Hỗ trợ JPG, PNG, WebP · Tối đa 5MB/ảnh · Có thể chọn nhiều
                    ảnh
                  </p>
                </div>

                {/* ── Thống kê ── */}
                {allImages.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Tổng:{" "}
                    <span className="font-bold text-gray-700">
                      {allImages.length}
                    </span>{" "}
                    ảnh
                    {oldImages.length > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="text-blue-600 font-semibold">
                          {oldImages.length} ảnh cũ
                        </span>
                      </>
                    )}
                    {newImages.length > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="text-green-600 font-semibold">
                          {newImages.length} ảnh mới
                        </span>
                      </>
                    )}
                  </p>
                )}

                {/* ── Grid slots ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: totalSlots }).map((_, slotIndex) => {
                    const img = allImages[slotIndex];
                    const hasImg = !!img;
                    const isMain = slotIndex === 0 && hasImg;
                    const isOld = hasImg && img.type === "old";
                    const isNew = hasImg && img.type === "new";
                    const isEmpty = !hasImg;

                    return (
                      <div
                        key={slotIndex}
                        className={`relative border-2 rounded-xl flex flex-col overflow-hidden transition
                          ${
                            isMain
                              ? "border-blue-500 shadow-md"
                              : isEmpty
                                ? "border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                                : "border-gray-200 bg-white"
                          }`}
                        onClick={
                          isEmpty ? () => handleSlotClick(slotIndex) : undefined
                        }
                      >
                        {/* Badge ảnh chính */}
                        {isMain && (
                          <span className="absolute top-0 left-0 bg-blue-500 text-white text-[9px] px-2 py-0.5 z-10 font-bold rounded-br-lg">
                            Ảnh chính
                          </span>
                        )}
                        {/* Badge ảnh mới */}
                        {isNew && (
                          <span className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 z-10 font-bold rounded-bl-lg">
                            Mới
                          </span>
                        )}

                        {/* Preview */}
                        {hasImg ? (
                          <div className="relative group">
                            <img
                              src={
                                isOld
                                  ? `${API_BASE}${img.url_anh}`
                                  : img.previewUrl
                              }
                              alt={isOld ? img.alt_text || "" : "preview"}
                              className="w-full h-50 object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/200x112?text=No+Image";
                              }}
                            />
                            {/* Overlay click để thay ảnh */}
                            <div
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              onClick={() => handleSlotClick(slotIndex)}
                              title="Click để thay ảnh"
                            >
                              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                                Thay ảnh
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-28 flex flex-col items-center justify-center text-gray-400 select-none">
                            <Icons.Add className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              Slot {slotIndex + 1}
                            </span>
                          </div>
                        )}

                        {/* Controls */}
                        {hasImg && (
                          <div className="px-1.5 py-1.5 flex flex-col gap-1.5 bg-white">
                            {/* Di chuyển */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => moveImage(slotIndex, -1)}
                                disabled={slotIndex === 0}
                                className="text-gray-400 hover:text-blue-600 px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
                                title="Di chuyển trái"
                              >
                                <Icons.ArrowLeftLong className="w-4 h-4" />
                              </button>
                              <span className="text-[11px] font-semibold text-gray-500">
                                {slotIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => moveImage(slotIndex, 1)}
                                disabled={slotIndex >= allImages.length - 1}
                                className="text-gray-400 hover:text-blue-600 px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
                                title="Di chuyển phải"
                              >
                                <Icons.ArrowRightLong className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Set chính & Xóa */}
                            <div className="flex gap-1">
                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => setAsMain(slotIndex)}
                                  className="flex-1 bg-white border border-gray-300 text-[10px] py-1 rounded-lg hover:bg-gray-100 cursor-pointer font-semibold text-gray-800"
                                >
                                  Làm ảnh chính
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(slotIndex)}
                                className="flex-1 bg-white border border-red-200 text-red-500 text-[10px] py-1 rounded-lg hover:bg-red-50 cursor-pointer font-semibold"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {allImages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm italic py-4">
                    Chưa có hình ảnh nào. Kéo thả hoặc click vào vùng trên để
                    thêm ảnh.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex justify-between items-center shrink-0">
          <div>
            {activeTab > 1 && (
              <button
                onClick={() => setActiveTab(activeTab - 1)}
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium cursor-pointer flex items-center gap-1"
              >
                <Icons.ArrowLeftLong className="w-5 h-5" /> Quay lại
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSaveProduct}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-sm cursor-pointer"
            >
              {editingProduct ? "Lưu thay đổi" : "Lưu sản phẩm"}
            </button>
            {activeTab < 4 && (
              <button
                onClick={() => setActiveTab(activeTab + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm cursor-pointer flex items-end gap-1"
              >
                Tiếp tục <Icons.ArrowRightLong className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
