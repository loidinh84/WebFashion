import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Hàm tự động tạo slug từ tên tiếng Việt
const generateSlug = (str) => {
  const map = {
    à: "a",
    á: "a",
    â: "a",
    ã: "a",
    ä: "a",
    å: "a",
    è: "e",
    é: "e",
    ê: "e",
    ë: "e",
    ì: "i",
    í: "i",
    î: "i",
    ï: "i",
    ò: "o",
    ó: "o",
    ô: "o",
    õ: "o",
    ö: "o",
    ø: "o",
    ù: "u",
    ú: "u",
    û: "u",
    ü: "u",
    ý: "y",
    ÿ: "y",
    ñ: "n",
    ç: "c",
    // Tiếng Việt
    à: "a",
    á: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    đ: "d",
    è: "e",
    é: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    ì: "i",
    í: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ò: "o",
    ó: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ù: "u",
    ú: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ỳ: "y",
    ý: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
  };
  return str
    .toLowerCase()
    .split("")
    .map((c) => map[c] || c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  parent: "",
  order: 1,
  status: "active",
  desc: "",
  hien_thi_sidebar: true,
};

const CategoryModal = ({ isOpen, onClose, data, allCategories, onSave }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (data) {
          setFormData(data);
          setSlugManuallyEdited(true);
        } else {
          setFormData(EMPTY_FORM);
          setSlugManuallyEdited(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [data, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        // Chỉ auto-gen slug nếu người dùng chưa tự sửa slug
        slug: slugManuallyEdited ? prev.slug : generateSlug(value),
      }));
    } else if (name === "slug") {
      setSlugManuallyEdited(true);
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegenerateSlug = () => {
    setSlugManuallyEdited(false);
    setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tên danh mục không được để trống!");
      return;
    }
    const orderValue = Number(formData.order);
    if (isNaN(orderValue) || orderValue < 0) {
      toast.error("Thứ tự hiển thị phải là một số lớn hơn hoặc bằng 0!");
      return;
    }
    onSave(formData);
  };

  const renderOptions = (categoriesList, parentId = null, level = 0) => {
    let options = [];
    const children = categoriesList.filter((c) => c.parent === parentId);

    children.forEach((child) => {
      if (data && child.id === data.id) return;

      const prefix = "\u00A0\u00A0\u00A0".repeat(level);
      options.push(
        <option key={child.id} value={child.id}>
          {prefix}
          {child.name}
        </option>,
      );
      options = options.concat(
        renderOptions(categoriesList, child.id, level + 1),
      );
    });
    return options;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 p-4 font-sans">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">
            {data ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-3xl text-gray-400 hover:text-red-500 cursor-pointer transition-colors leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {/* Slug */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-bold text-gray-700">Slug</label>
              <button
                type="button"
                onClick={handleRegenerateSlug}
                className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Tạo lại từ tên
              </button>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 text-xs shrink-0">/danhMuc/</span>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                type="text"
                className="flex-1 bg-transparent outline-none text-sm font-mono text-gray-700 min-w-0"
                placeholder="tu-dong-tao-tu-ten"
              />
            </div>
          </div>

          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-gray-700"
            />
          </div>

          {/* Danh mục cha + Thứ tự */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Danh mục cha
              </label>
              <select
                name="parent"
                value={formData.parent || ""}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none  focus:border-blue-500 font-medium cursor-pointer transition-all text-sm appearance-none text-gray-700 "
              >
                <option value="">Danh mục cha</option>
                {renderOptions(allCategories)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Thứ tự hiển thị
              </label>
              <input
                name="order"
                value={formData.order}
                onChange={handleChange}
                type="number"
                className="w-full p-2 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-semibold transition-all"
              />
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ">
              Trạng thái hiển thị
            </label>
            <div className="flex gap-4">
              {[
                { value: "active", label: "Hiển thị", color: "green" },
                { value: "inactive", label: "Ẩn", color: "red" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer font-semibold text-sm transition-all 
                    ${
                      formData.status === opt.value
                        ? opt.color === "green"
                          ? "border-green-300 bg-green-50 text-green-600"
                          : "border-red-300 bg-red-50 text-red-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={formData.status === opt.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Hiển thị Sidebar */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ">
              Hiển thị trên Sidebar
            </label>
            <div className="flex gap-4">
              {[
                { value: true, label: "Có", color: "blue" },
                { value: false, label: "Không", color: "gray" },
              ].map((opt) => (
                <label
                  key={opt.label}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer font-semibold text-sm transition-all 
                    ${
                      formData.hien_thi_sidebar === opt.value
                        ? opt.color === "blue"
                          ? "border-blue-300 bg-blue-50 text-blue-600"
                          : "border-gray-300 bg-gray-50 text-gray-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    name="hien_thi_sidebar"
                    checked={formData.hien_thi_sidebar === opt.value}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        hien_thi_sidebar: opt.value,
                      }))
                    }
                    className="hidden"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-bold text-gray-700  mb-1.5">
              Mô tả
            </label>
            <textarea
              name="desc"
              value={formData.desc}
              onChange={handleChange}
              rows="3"
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-medium text-sm transition-all resize-none text-gray-700"
              placeholder="Mô tả ngắn..."
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-300 border border-gray-300 text-gray-600 rounded-xl font-medium text-lg tracking-wide hover:bg-gray-400 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-lg tracking-wide hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 cursor-pointer"
            >
              {data ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
