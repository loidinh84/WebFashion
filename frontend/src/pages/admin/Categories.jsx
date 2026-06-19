import React, { useEffect, useState } from "react";
import CategoryModal from "./CategoryModal";
import ConfirmModal from "./ConfirmModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const CategoryNode = ({
  category,
  allCategories,
  level = 0,
  selected,
  onSelect,
  expandedParents,
  toggleExpand,
}) => {
  // Tìm danh mục này con
  const children = allCategories.filter((c) => c.parent === category.id);
  const isExpanded = expandedParents.has(category.id);
  const isSelected = selected === category.id;

  return (
    <div className="w-full">
      <button
        onClick={() => {
          onSelect(category.id);
          toggleExpand(category.id);
        }}
        // Càng sâu cấp thì lùi padding-left càng nhiều
        style={{ paddingLeft: `${level * 1.2 + 0.75}rem` }}
        className={`w-full flex justify-between items-center py-2 pr-3 rounded-lg transition-colors text-left cursor-pointer group
          ${isSelected ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50 font-medium"}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-[13px]">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Cột hiển thị số lượng danh mục con */}
          <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">
            {children.length}
          </span>
          {/* Mũi tên gập mở  */}
          {children.length > 0 && (
            <span className="text-[10px] text-gray-400">
              {isExpanded ? (
                <Icons.ArrowDown className="w-5 h-5" />
              ) : (
                <Icons.ArrowForward className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </button>

      {/* GỌI ĐỆ QUY: Nếu mở ra và có con thì lặp lại chính CategoryNode */}
      {isExpanded && children.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              level={level + 1}
              selected={selected}
              onSelect={onSelect}
              expandedParents={expandedParents}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};
const API_BASE = BASE_URL;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // BỘ LỌC
  const [statusTab, setStatusTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSelected, setFilterSelected] = useState("all");
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE}/api/sanPham/danhMuc`,
        getAuthHeader(),
      );

      const rawData = Array.isArray(response.data) ? response.data : [];

      const mappedData = rawData.map((cat) => ({
        id: cat.id,
        name: cat.ten_danh_muc || "Chưa có tên",
        slug: cat.slug || "",
        parent: cat.danh_muc_cha_id || null,
        parentName: cat.danh_muc_cha_id
          ? rawData.find((c) => c.id === cat.danh_muc_cha_id)?.ten_danh_muc
          : null,
        order: cat.thu_tu || 0,
        status: cat.trang_thai || "active",
        desc: cat.mo_ta || "",
        hien_thi_sidebar: cat.hien_thi_sidebar === true || cat.hien_thi_sidebar === 1,
      }));

      setCategories(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh mục từ máy chủ!");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSelected, statusTab]);

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (formData) => {
    try {
      if (editingCategory) {
        // --- CHỈNH SỬA ---
        await axios.put(
          `${API_BASE}/api/sanPham/danhMuc/${editingCategory.id}`,
          {
            ten_danh_muc: formData.name,
            slug: formData.slug,
            danh_muc_cha_id: formData.parent || null,
            thu_tu: formData.order,
            trang_thai: formData.status,
            mo_ta: formData.desc,
            hien_thi_sidebar: formData.hien_thi_sidebar,
          },
          getAuthHeader(),
        );
        toast.success("Cập nhật danh mục thành công!");
      } else {
        // --- THÊM MỚI ---
        await axios.post(
          `${API_BASE}/api/sanPham/danhMuc`,
          {
            ten_danh_muc: formData.name,
            slug: formData.slug,
            danh_muc_cha_id: formData.parent || null,
            thu_tu: formData.order,
            trang_thai: formData.status,
            mo_ta: formData.desc,
            hien_thi_sidebar: formData.hien_thi_sidebar,
          },
          getAuthHeader(),
        );
        toast.success("Thêm danh mục mới thành công!");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu danh mục!",
      );
    }
  };

  const executeDelete = async () => {
    const hasChildren = categories.some((c) => c.parent === confirmModal.id);
    if (hasChildren) {
      toast.error("Không thể xóa! Danh mục này đang có danh mục con.");
      setConfirmModal({ ...confirmModal, isOpen: false });
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/api/sanPham/danhMuc/${confirmModal.id}`,
        getAuthHeader(),
      );
      toast.success("Đã xóa danh mục thành công!");
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Lỗi: Không thể xóa danh mục này!",
      );
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const safeCategories = categories || [];

  // Toggle expand/collapse một danh mục cha trong sidebar
  const toggleExpand = (parentName) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentName)) next.delete(parentName);
      else next.add(parentName);
      return next;
    });
  };

  const filteredCategories = safeCategories.filter((c) => {
    // 1. Lọc theo tab trạng thái
    if (statusTab === "active" && c.status !== "active") return false;
    if (statusTab === "inactive" && c.status !== "inactive") return false;

    if (filterSelected !== "all") {
      if (c.id !== filterSelected && c.parent !== filterSelected) {
        return false;
      }
    }

    // 3. Lọc theo từ khóa
    if (
      searchTerm &&
      !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    return true;
  });

  const countAll = safeCategories.length;
  const countActive = safeCategories.filter(
    (c) => c.status === "active",
  ).length;
  const countInactive = safeCategories.filter(
    (c) => c.status === "inactive",
  ).length;

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="flex w-full max-w-[1600px] h-full p-4 lg:p-6 gap-4 lg:gap-3">
        {/* SIDEBAR BỘ LỌC */}
        <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar">
          {/* -- Tìm kiếm -- */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Tìm theo tên danh mục..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* -- Cây danh mục -- */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Danh mục</h3>
            <div className="space-y-0.5 text-sm">
              {/* Nút "Tất cả" */}
              <button
                onClick={() => setFilterSelected("all")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                  ${filterSelected === "all" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span>Tất cả</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {countAll}
                </span>
              </button>

              {categories
                .filter((c) => !c.parent)
                .map((rootCategory) => (
                  <CategoryNode
                    key={rootCategory.id}
                    category={rootCategory}
                    allCategories={categories}
                    selected={filterSelected}
                    onSelect={setFilterSelected}
                    expandedParents={expandedParents}
                    toggleExpand={toggleExpand}
                  />
                ))}
            </div>
          </div>
          {/* -- Trạng thái -- */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Trạng thái</h3>
            <div className="space-y-0.5 text-sm">
              {[
                { key: "all", label: "Tất cả" },
                { key: "active", label: "Đang hiển thị", count: countActive },
                { key: "inactive", label: "Đã ẩn", count: countInactive },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusTab(item.key)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${statusTab === item.key ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${statusTab === item.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">
              Danh mục sản phẩm
            </h2>
            <button
              onClick={() => handleOpenModal()}
              className="bg-[#4caf50] hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-[15px] shadow-sm cursor-pointer flex items-center gap-1 pl-2.5"
            >
              <Icons.Add className="w-5 h-5" /> Thêm danh mục
            </button>
          </div>

          {/* Bảng */}
          <div className="flex-1 overflow-auto bg-gray-50/30 relative border-t border-gray-200">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-gray-50 text-gray-700 z-10 text-[14px]">
                <tr>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 w-12 text-center">
                    STT
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Tên danh mục
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Danh mục cha
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200">
                    Mô tả
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-20 whitespace-nowrap">
                    Thứ tự
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-32">
                    Trạng thái
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-center w-24">
                    Sidebar
                  </th>
                  <th className="py-3 px-6 font-bold border-b border-gray-200 text-right w-28">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center font-medium text-gray-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center font-medium text-red-500"
                    >
                      Không tìm thấy danh mục nào.
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white"
                    >
                      <td className="py-4 px-6 text-center font-medium text-gray-400">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">{cat.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Slug: {cat.slug}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {cat.parent ? (
                          cat.parentName
                        ) : (
                          <span className="text-gray-500 font-medium">
                            Danh mục cha
                          </span>
                        )}
                      </td>
                      <td
                        className="py-4 px-6 text-gray-500 text-xs max-w-[200px] truncate"
                        title={cat.desc}
                      >
                        {cat.desc || (
                          <span className="italic text-gray-500">
                            Chưa có mô tả
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-gray-700">
                        {cat.order}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {cat.status === "active" ? (
                          <span className=" text-green-700 px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap">
                            Hiển thị
                          </span>
                        ) : (
                          <span className=" text-red-500  px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap">
                            Đã ẩn
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {cat.hien_thi_sidebar ? (
                          <span className="text-blue-600 font-bold">Hiện</span>
                        ) : (
                          <span className="text-gray-400">Ẩn</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="text-blue-600 font-bold hover:underline cursor-pointer text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              id: cat.id,
                              title: "Cảnh báo xóa danh mục",
                              message: `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`,
                            })
                          }
                          className="text-red-500 font-bold hover:underline cursor-pointer text-sm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Hiển thị{" "}
                <span className="font-semibold text-gray-600">
                  {filteredCategories.length}
                </span>
                / {countAll} danh mục
              </span>
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentPage(1)}
                className="px-2  border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-1.5 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 rounded font-bold shadow-sm transition-colors cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white border border-blue-600"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-1.5  border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={editingCategory}
        allCategories={categories}
        onSave={handleSaveCategory}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default Categories;
