import React, { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import ConfirmModal from "./ConfirmModal";
import axios from "axios";
import { toast } from "react-toastify";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";


const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN").format(price || 0);

const API_BASE = BASE_URL;

const CategoryNode = ({
  category,
  allCategories,
  level = 0,
  selected,
  onSelect,
  expandedParents,
  toggleExpand,
}) => {
  const children = allCategories.filter(
    (c) => c.danh_muc_cha_id === category.id,
  );
  const isExpanded = expandedParents.has(category.id);
  const isSelected = selected === category.id;

  return (
    <div className="w-full">
      <button
        onClick={() => {
          onSelect(category.id);
          toggleExpand(category.id);
        }}
        style={{ paddingLeft: `${level * 1.2 + 0.75}rem` }}
        className={`w-full flex justify-between items-center py-2 pr-3 rounded-lg transition-colors text-left cursor-pointer group
          ${isSelected ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50 font-medium"}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-[13px]">{category.ten_danh_muc}</span>
        </div>
        {children.length > 0 && (
          <span className="text-[10px] text-gray-400">
            {isExpanded ? (
              <Icons.ArrowDown className="w-5 h-5" />
            ) : (
              <Icons.ArrowForward className="w-3 h-3" />
            )}
          </span>
        )}
      </button>

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

const mapProduct = (p) => ({
  id: p.id,
  name: p.ten_san_pham,
  brand: p.thuong_hieu,
  supplier: p.supplier?.ten_nha_cung_cap || p.supplier || "Chưa cập nhật",
  category: p.category?.ten_danh_muc || p.category || "Chưa cập nhật",
  price: p.bien_the?.[0]?.gia_ban ?? 0,
  cost: p.bien_the?.[0]?.gia_goc ?? 0,
  stock: p.bien_the?.reduce((t, bt) => t + (Number(bt.ton_kho) || 0), 0) ?? 0,
  status: p.trang_thai,
  isFeatured: p.noi_bat,
  shortDesc: p.mo_ta_ngan,
  fullDesc: p.mo_ta_day_du,
  variants: p.bien_the || [],
  attributes: p.thuoc_tinh || [],
  images: p.hinh_anh || [],
  createdAt: p.created_at,
  luot_mua: p.luot_mua || 0,
  rawData: p,
});

const Product = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [expandedRows, setExpandedRows] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState({});
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── BỘ LỌC ──
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [expandedParents, setExpandedParents] = useState(new Set());

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null,
    product: null,
    title: "",
    message: "",
  });

  const [blockedDeleteModal, setBlockedDeleteModal] = useState({
    isOpen: false,
    message: "",
    detail: null,
    productId: null,
    tenSanPham: "",
    trangThaiHienTai: "",
  });

  const emptyFormData = {
    ten_san_pham: "",
    thuong_hieu: "",
    danh_muc_id: "",
    nha_cung_cap_id: "",
    trang_thai: "active",
    mo_ta_ngan: "",
    mo_ta_day_du: "",
    noi_bat: false,
    thuoc_tinh: [{ ten_thuoc_tinh: "", gia_tri: "", nhom: "", thu_tu: 1 }],
    bien_the: [
      {
        sku: "",
        mau_sac: "",
        dung_luong: "",
        ram: "",
        gia_goc: 0,
        gia_ban: 0,
        ton_kho: 0,
        ma_mau_hex: "",
        trang_thai: "active",
      },
    ],
    can_nang: null,
    chieu_dai: null,
    chieu_rong: null,
    chieu_cao: null,
    meta_title: null,
    meta_description: null,
    hinh_anh: [],
  };
  const [formData, setFormData] = useState(emptyFormData);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const toggleExpand = (categoryId) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // FETCH
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let trangThaiParam = "";
      let noiBatParam = "";

      if (filterStatus === "active" || filterStatus === "inactive") {
        trangThaiParam = filterStatus;
      } else if (filterStatus === "featured") {
        noiBatParam = "true";
      }
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        danhMucId: selectedCategory === "all" ? "" : selectedCategory,
        nhaCungCapId: selectedSupplier === "all" ? "" : selectedSupplier,
        trangThai: trangThaiParam,
        noiBat: noiBatParam,
        search: searchTerm || "",
      }).toString();
      const resSp = await axios.get(
        `${API_BASE}/api/sanPham/tatCaSanPham?${queryParams}`,
        getAuthHeader(),
      );

      const mappedProducts = resSp.data.data.map((p) => {
        return {
          ...mapProduct(p),
          category: p.danh_muc ? p.danh_muc.ten_danh_muc : "Chưa cập nhật",
          supplier: p.nha_cung_cap
            ? p.nha_cung_cap.ten_nha_cc
            : "Chưa cập nhật",
        };
      });

      setProducts(mappedProducts);
      setTotalPages(resSp.data.totalPages);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    selectedCategory,
    selectedSupplier,
    filterStatus,
    searchTerm,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchFormOptions = async () => {
    try {
      const [resCat, resSup] = await Promise.all([
        axios.get(`${API_BASE}/api/sanPham/danhMuc`, getAuthHeader()),
        axios.get(`${API_BASE}/api/sanPham/nhaCungCap`, getAuthHeader()),
      ]);
      setCategories(resCat.data);
      setSuppliers(resSup.data);
    } catch (error) {
      console.error("Lỗi khi tải Danh mục/NCC:", error);
    }
  };

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // BỘ LỌC
  const filteredProducts = products.filter((p) => {
    if (stockFilter === "in_stock" && p.stock <= 0) return false;
    if (stockFilter === "out_of_stock" && p.stock > 0) return false;
    return true;
  });

  // HANDLERS 
  const handleQuickSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim())
      return toast.warning("Vui lòng nhập tên danh mục!");

    try {
      await axios.post(
        `${API_BASE}/api/sanPham/danhMuc`,
        {
          ten_danh_muc: newCategoryName,
          danh_muc_cha_id: newCategoryParentId || null,
          trang_thai: "active",
        },
        getAuthHeader(),
      );

      toast.success("Đã thêm danh mục: " + newCategoryName);
      setIsAddCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryParentId("");
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi thêm danh mục!");
    }
  };

  const handleQuickSaveSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim())
      return toast.warning("Vui lòng nhập tên nhà cung cấp!");

    try {
      if (editingSupplier) {
        await axios.put(
          `${API_BASE}/api/sanPham/nhaCungCap/${editingSupplier}`,
          { ten_nha_cc: newSupplierName },
          getAuthHeader(),
        );
        toast.success("Cập nhật nhà cung cấp thành công!");
      } else {
        await axios.post(
          `${API_BASE}/api/sanPham/nhaCungCap`,
          { ten_nha_cc: newSupplierName, trang_thai: "active" },
          getAuthHeader(),
        );
        toast.success("Đã thêm nhà cung cấp: " + newSupplierName);
      }

      setNewSupplierName("");
      setEditingSupplier(null);
      fetchProducts();
      if (editingSupplier) {
        setSuppliers(
          suppliers.map((s) =>
            s.id === editingSupplier
              ? { ...s, ten_nha_cc: newSupplierName }
              : s,
          ),
        );
      } else {
        await fetchFormOptions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEditSupplierClick = (supplier) => {
    setEditingSupplier(supplier.id);
    setNewSupplierName(supplier.ten_nha_cc);
  };

  const handleDeleteSupplier = (supplierObj) => {
    setConfirmModal({
      isOpen: true,
      actionType: "delete_supplier",
      supplier: supplierObj,
      title: "Xác nhận xóa Nhà cung cấp",
      message: `Bạn có chắc chắn muốn xóa "${supplierObj.ten_nha_cc}" không? Dữ liệu sẽ được chuyển vào thùng rác.`,
    });
  };

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const arr = [...formData[arrayName]];
    arr[index][field] = value;
    setFormData((prev) => ({ ...prev, [arrayName]: arr }));
  };

  const addRow = (n, obj) =>
    setFormData((prev) => ({ ...prev, [n]: [...prev[n], obj] }));
  const removeRow = (n, index) =>
    setFormData((prev) => ({
      ...prev,
      [n]: prev[n].filter((_, i) => i !== index),
    }));

  // LƯU SẢN PHẨM
  const handleSaveProduct = async () => {
    if (!formData.ten_san_pham.trim())
      return toast.warning("Tên sản phẩm không được để trống!");

    if (!formData.danh_muc_id) return toast.warning("Vui lòng chọn danh mục!");

    if (!formData.nha_cung_cap_id)
      return toast.warning("Vui lòng chọn nhà cung cấp!");

    if (formData.bien_the.length === 0)
      return toast.warning("Vui lòng thêm ít nhất 1 biến thể!");


    if (formData.bien_the.some((bt) => Number(bt.ton_kho) < 0))
      return toast.warning("Tồn kho không được âm!");

    for (let i = 0; i < formData.bien_the.length; i++) {
      const bt = formData.bien_the[i];
      if (!bt.sku || !bt.sku.trim()) {
        return toast.warning(`Vui lòng nhập SKU cho biến thể dòng ${i + 1}!`);
      }
      if (Number(bt.gia_goc) < 0) {
        return toast.warning(`Giá gốc ở dòng ${i + 1} không được âm!`);
      }
      if (Number(bt.ton_kho) < 0) {
        return toast.warning(`Tồn kho ở dòng ${i + 1} không được âm!`);
      }
    }

    if (
      Number(formData.can_nang) < 0 ||
      Number(formData.chieu_dai) < 0 ||
      Number(formData.chieu_rong) < 0 ||
      Number(formData.chieu_cao) < 0
    ) {
      return toast.warning("Cân nặng và Kích thước không được là số âm!");
    }

    const totalImages = (formData.hinh_anh?.length || 0) + uploadedFiles.length;
    if (totalImages === 0) {
      return toast.warning("Vui lòng tải lên ít nhất 1 hình ảnh cho sản phẩm!");
    }

    const dataToSend = new FormData();
    dataToSend.append("ten_san_pham", formData.ten_san_pham);
    dataToSend.append("thuong_hieu", formData.thuong_hieu);
    dataToSend.append("danh_muc_id", formData.danh_muc_id);
    dataToSend.append("nha_cung_cap_id", formData.nha_cung_cap_id);
    dataToSend.append("trang_thai", formData.trang_thai);
    dataToSend.append("mo_ta_ngan", formData.mo_ta_ngan);
    dataToSend.append("mo_ta_day_du", formData.mo_ta_day_du);
    dataToSend.append("noi_bat", formData.noi_bat);
    dataToSend.append("bien_the", JSON.stringify(formData.bien_the));
    dataToSend.append("thuoc_tinh", JSON.stringify(formData.thuoc_tinh));
    dataToSend.append("can_nang", formData.can_nang || 0);
    dataToSend.append("chieu_dai", formData.chieu_dai || 0);
    dataToSend.append("chieu_rong", formData.chieu_rong || 0);
    dataToSend.append("chieu_cao", formData.chieu_cao || 0);
    dataToSend.append("meta_title", formData.meta_title || "");
    dataToSend.append("meta_description", formData.meta_description || "");

    if (formData.hinh_anh?.length > 0)
      dataToSend.append("hinh_anh", JSON.stringify(formData.hinh_anh));
    uploadedFiles.forEach((file) => dataToSend.append("hinh_anh_files", file));

    const config = {
      headers: {
        ...getAuthHeader().headers,
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      if (editingProduct) {
        await axios.put(
          `${API_BASE}/api/sanPham/${editingProduct.id}`,
          dataToSend,
          config,
        );
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await axios.post(`${API_BASE}/api/sanPham`, dataToSend, config);
        toast.success("Thêm sản phẩm mới thành công!");
      }
      setIsModalOpen(false);
      setUploadedFiles([]);
      fetchProducts();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm!";
      toast.error(msg);
    }
  };

  const executeConfirmAction = async () => {
    const closeConfirm = () => {
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      if (confirmModal.product) {
        setExpandedRows((prev) =>
          prev.filter((r) => r !== confirmModal.product.id),
        );
      }
    };

    const pid = confirmModal.product?.id ?? null;

    try {
      if (confirmModal.actionType === "delete_supplier") {
        const sid = confirmModal.supplier.id;
        await axios.delete(
          `${API_BASE}/api/sanPham/nhaCungCap/${sid}`,
          getAuthHeader(),
        );
        toast.success("Đã xóa nhà cung cấp thành công!");
        setSuppliers(suppliers.filter((s) => s.id !== sid));
        closeConfirm();
        return;
      }

      if (confirmModal.actionType === "delete") {
        await axios.delete(`${API_BASE}/api/sanPham/${pid}`, getAuthHeader());
        toast.success("Xóa thành công!");
        setProducts(products.filter((p) => p.id !== pid));
      } else {
        await axios.put(
          `${API_BASE}/api/sanPham/${pid}/status`,
          {},
          getAuthHeader(),
        );
        toast.success("Cập nhật trạng thái thành công!");
      }
      fetchProducts();
      closeConfirm();
    } catch (error) {
      console.error(error);
      // Bắt lỗi 409: sản phẩm đang có trong đơn hàng chưa hoàn tất
      if (error.response?.status === 409) {
        const data = error.response.data;
        const maDonHangs = data.ma_don_hangs || [];
        closeConfirm();
        setBlockedDeleteModal({
          isOpen: true,
          message: data.message,
          detail:
            maDonHangs.length > 0
              ? `Mã đơn hàng liên quan: ${maDonHangs.join(", ")}${data.so_don_hang > maDonHangs.length
                ? ` và ${data.so_don_hang - maDonHangs.length} đơn khác`
                : ""
              }`
              : null,
          productId: pid,
          tenSanPham: data.ten_san_pham || confirmModal.product?.name || "",
          trangThaiHienTai: data.trang_thai_hien_tai,
        });
      } else {
        toast.error(error.response?.data?.message || "Thao tác thất bại!");
        closeConfirm();
      }
    }
  };


  // Đổi trạng thái sang inactive từ modal cảnh báo
  const handleForceSetInactive = async () => {
    const pid = blockedDeleteModal.productId;
    if (!pid) return;
    try {
      // Nếu đang active thì mới cần toggle, nếu đã inactive thì thôi
      if (blockedDeleteModal.trangThaiHienTai !== "inactive") {
        await axios.put(
          `${API_BASE}/api/sanPham/${pid}/status`,
          {},
          getAuthHeader(),
        );
        toast.success(
          `Đã chuyển "${blockedDeleteModal.tenSanPham}" sang Ngừng kinh doanh!`,
        );
        fetchProducts();
      } else {
        toast.info(`"${blockedDeleteModal.tenSanPham}" đã ở trạng thái Ngừng kinh doanh.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể đổi trạng thái!");
    } finally {
      setBlockedDeleteModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
    if (!activeDetailTab[id])
      setActiveDetailTab((prev) => ({ ...prev, [id]: "info" }));
  };


  const handleEditClick = async (product) => {
    setUploadedFiles([]);
    try {
      const res = await axios.get(`${API_BASE}/api/sanpham/${product.id}`);
      const d = res.data;
      setEditingProduct(product);
      setFormData({
        ten_san_pham: d.ten_san_pham || "",
        thuong_hieu: d.thuong_hieu || "",
        danh_muc_id: d.danh_muc_id || "",
        nha_cung_cap_id: d.nha_cung_cap_id || "",
        trang_thai: d.trang_thai || "active",
        mo_ta_ngan: d.mo_ta_ngan || "",
        mo_ta_day_du: d.mo_ta_day_du || "",
        noi_bat: d.noi_bat || false,
        thuoc_tinh:
          d.thuoc_tinh?.length > 0 ? d.thuoc_tinh : emptyFormData.thuoc_tinh,
        bien_the: d.bien_the?.length > 0 ? d.bien_the : emptyFormData.bien_the,
        hinh_anh: d.hinh_anh?.length > 0 ? d.hinh_anh : [],
        can_nang: d.can_nang || "",
        chieu_dai: d.chieu_dai || "",
        chieu_rong: d.chieu_rong || "",
        chieu_cao: d.chieu_cao || "",
        meta_title: d.meta_title || "",
        meta_description: d.meta_description || "",
      });
    } catch {
      setEditingProduct(product);
      setFormData({
        ten_san_pham: product.name || "",
        thuong_hieu: product.brand || "",
        danh_muc_id:
          categories.find((c) => c.name === product.category)?.id || "",
        nha_cung_cap_id:
          suppliers.find((s) => s.name === product.supplier)?.id || "",
        trang_thai: product.status || "active",
        mo_ta_ngan: product.shortDesc || "",
        mo_ta_day_du: product.fullDesc || "",
        noi_bat: product.isFeatured || false,
        thuoc_tinh:
          product.attributes?.length > 0
            ? product.attributes
            : emptyFormData.thuoc_tinh,
        bien_the:
          product.variants?.length > 0
            ? product.variants
            : emptyFormData.bien_the,
        hinh_anh: product.images?.length > 0 ? product.images : [],
      });
    }
    setIsModalOpen(true);
    setActiveTab(1);
  };

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden justify-center relative font-sans">
      <div className="flex w-full max-w-[1600px] h-full p-4 lg:p-6 gap-4 lg:gap-4">
        {/* SIDEBAR BỘ LỌC */}
        <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-4 pr-1">
          {/* -- Tìm kiếm -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Tên, thương hiệu..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* -- Danh mục -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Danh mục</h3>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="text-gray-400 hover:text-blue-600 text-xl cursor-pointer font-medium leading-none"
                title="Thêm danh mục"
              >
                <Icons.Add className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-0.5 text-sm">
              {/* 1. Nút Tất cả */}
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                  ${selectedCategory === "all" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="truncate">Tất cả</span>
              </button>
              {/* 2. Các danh mục từ Database */}
              {categories
                .filter((c) => !c.danh_muc_cha_id)
                .map((rootCategory) => (
                  <CategoryNode
                    key={rootCategory.id}
                    category={rootCategory}
                    allCategories={categories}
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                    expandedParents={expandedParents}
                    toggleExpand={toggleExpand}
                  />
                ))}
            </div>
          </div>

          {/* -- Nhà cung cấp -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Nhà cung cấp</h3>
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="text-gray-400 hover:text-blue-600 text-xl cursor-pointer font-medium leading-none"
                title="Thêm nhà cung cấp"
              >
                <Icons.Add className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-0.5 text-sm">
              {[
                { id: "all-sup", value: "all", label: "Tất cả" },
                ...suppliers.map((s) => ({
                  id: s.id,
                  value: s.id,
                  label: s.ten_nha_cc,
                })),
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSupplier(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${selectedSupplier === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* -- Trạng thái -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Trạng thái</h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Đang kinh doanh" },
                { value: "inactive", label: "Ngừng kinh doanh" },
                { value: "featured", label: "Nổi bật" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilterStatus(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${filterStatus === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* -- Tồn kho -- */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tồn kho</h3>
            <div className="space-y-0.5 text-sm">
              {[
                { value: "all", label: "Tất cả" },
                { value: "in_stock", label: "Còn hàng" },
                { value: "out_of_stock", label: "Hết hàng" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStockFilter(item.value)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg transition-colors text-left cursor-pointer font-medium
                    ${stockFilter === item.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG DỮ LIỆU */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white shrink-0">
            <h2 className="text-xl font-bold text-gray-800">
              Danh sách sản phẩm
            </h2>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setActiveTab(1);
                setEditingProduct(null);
                setFormData({ ...emptyFormData });
                setUploadedFiles([]);
              }}
              className="bg-[#4caf50] hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-[15px] shadow-sm cursor-pointer flex items-center gap-1"
            >
              <Icons.Add className="w-5 h-5" /> Thêm sản phẩm
            </button>
          </div>

          {/* Bảng */}
          <div className="flex-1 overflow-auto bg-gray-50/30 relative">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 bg-gray-50 text-gray-600 z-10 text-sm">
                <tr>
                  <th className="py-3 px-5 font-bold border-b border-gray-200">
                    Mã & Tên sản phẩm
                  </th>
                  <th className="py-3 px-5 font-bold border-b border-gray-200">
                    Danh mục
                  </th>
                  <th className="py-3 px-5 font-bold border-b border-gray-200">
                    Nhà cung cấp
                  </th>
                  <th className="py-3 px-5 font-bold border-b border-gray-200 text-right">
                    Giá bán
                  </th>
                  <th className="py-3 px-5 font-bold border-b border-gray-200 text-center w-24">
                    Tồn kho
                  </th>
                  <th className="py-3 px-5 font-bold border-b border-gray-200 text-center w-36">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-gray-500 font-medium"
                    >
                      Không tìm thấy sản phẩm nào.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isExpanded = expandedRows.includes(p.id);
                    const currentDetailTab = activeDetailTab[p.id] || "info";
                    return (
                      <React.Fragment key={p.id}>
                        {/* ── DÒNG CHÍNH ── */}
                        <tr
                          onClick={() => toggleRow(p.id)}
                          className={`cursor-pointer transition-colors border-b border-gray-200
                            ${isExpanded ? "bg-blue-50/40" : "hover:bg-gray-50 bg-white"}`}
                        >
                          <td className="py-3 px-5">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {p.name}
                              {p.isFeatured && (
                                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded border border-yellow-300 font-bold whitespace-nowrap">
                                  Nổi bật
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Mã: {p.id} · {p.brand}
                            </div>
                          </td>
                          <td className="py-3 px-5 text-gray-600 text-sm">
                            {p.category}
                          </td>
                          <td className="py-3 px-5 text-gray-600 text-sm">
                            {p.supplier}
                          </td>
                          <td className="py-3 px-5 text-right font-bold text-gray-800">
                            {formatPrice(p.price)}
                          </td>
                          <td className="py-3 px-5 text-center font-bold">
                            {p.stock <= 0 ? (
                              <span className="text-red-500  whitespace-nowrap">
                                Hết hàng
                              </span>
                            ) : (
                              <span className="text-gray-800">{p.stock}</span>
                            )}
                          </td>
                          <td className="py-3 px-5 text-center">
                            {p.status === "active" ? (
                              <span className=" text-green-700 px-3 py-1 rounded text-sm font-bold  whitespace-nowrap">
                                Đang kinh doanh
                              </span>
                            ) : (
                              <span className=" text-red-500 px-3 py-1 rounded text-sm font-bold whitespace-nowrap">
                                Ngừng bán
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* ── DÒNG CHI TIẾT MỞ RỘNG ── */}
                        {isExpanded && (
                          <tr className="bg-[#f8fafc] border-b-2 border-blue-200">
                            <td colSpan="6" className="p-0 whitespace-normal">
                              {/* Sub-tabs */}
                              <div className="flex border-b border-gray-200 px-6 pt-2 bg-gray-50 gap-1">
                                {[
                                  { key: "info", label: "Thông tin" },
                                  {
                                    key: "variants",
                                    label: `Biến thể (${p.variants.length})`,
                                  },
                                  {
                                    key: "attributes",
                                    label: `Thuộc tính (${p.attributes.length})`,
                                  },
                                  {
                                    key: "images",
                                    label: `Hình ảnh (${p.images.length})`,
                                  },
                                ].map((tab) => (
                                  <button
                                    key={tab.key}
                                    onClick={() =>
                                      setActiveDetailTab((prev) => ({
                                        ...prev,
                                        [p.id]: tab.key,
                                      }))
                                    }
                                    className={`cursor-pointer px-4 py-2 text-sm font-semibold border-b-2 transition-colors
                                      ${currentDetailTab === tab.key
                                        ? "border-blue-600 text-blue-600 bg-white"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                      }`}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              <div className="p-5">
                                {/* TAB: THÔNG TIN */}
                                {currentDetailTab === "info" && (
                                  <div className="flex flex-col xl:flex-row gap-5">
                                    {/* Thông tin cơ bản */}
                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5">
                                      <h4 className="font-bold text-gray-700 text-sm mb-4 border-b border-gray-300 pb-2">
                                        Thông tin cơ bản
                                      </h4>
                                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Tên sản phẩm
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {p.name}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Thương hiệu
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {p.brand || "—"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Danh mục
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {p.category}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Nhà cung cấp
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {p.supplier}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Giá gốc (nhập)
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {formatPrice(p.cost)} ₫
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Giá bán
                                          </p>
                                          <p className="font-bold text-blue-600">
                                            {formatPrice(p.price)} ₫
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Tổng tồn kho
                                          </p>
                                          <p
                                            className={`font-bold ${p.stock === 0 ? "text-red-500" : "text-gray-900"}`}
                                          >
                                            {p.stock === 0
                                              ? "Hết hàng"
                                              : `${p.stock} sản phẩm`}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Nổi bật
                                          </p>
                                          <p className="font-semibold text-gray-900">
                                            {p.isFeatured ? "✓ Có" : "Không"}
                                          </p>
                                        </div>
                                        <div className="col-span-2">
                                          <p className="text-gray-500 text-sm mb-0.5">
                                            Mô tả ngắn
                                          </p>
                                          <p className="text-gray-700">
                                            {p.shortDesc || (
                                              <span className="italic text-gray-400">
                                                Chưa có mô tả
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                        {p.fullDesc && (
                                          <div className="col-span-2">
                                            <p className="text-gray-500 text-sm mb-0.5">
                                              Mô tả đầy đủ
                                            </p>
                                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                                              {p.fullDesc}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Thao tác */}
                                    <div className="w-full xl:w-38 shrink-0 flex flex-col gap-2">
                                      <h4 className="font-bold text-gray-700 text-sm mb-1 pb-2">
                                        Thao tác
                                      </h4>
                                      <button
                                        onClick={() => handleEditClick(p)}
                                        className="cursor-pointer w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xs uppercase tracking-wide transition shadow-sm"
                                      >
                                        Chỉnh sửa
                                      </button>
                                      <button
                                        onClick={() =>
                                          setConfirmModal({
                                            isOpen: true,
                                            actionType: "toggleStatus",
                                            product: p,
                                            title: "Xác nhận thay đổi",
                                            message: `${p.status === "active" ? "Ngừng kinh doanh" : "Mở bán lại"} sản phẩm "${p.name}"?`,
                                          })
                                        }
                                        className="cursor-pointer w-full py-2.5 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-bold text-xs uppercase tracking-wide transition"
                                      >
                                        {p.status === "active"
                                          ? "Ngừng kinh doanh"
                                          : "Mở bán lại"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          setConfirmModal({
                                            isOpen: true,
                                            actionType: "delete",
                                            product: p,
                                            title: "Cảnh báo xóa sản phẩm",
                                            message: `Bạn có chắc muốn xóa sản phẩm "${p.name}"? Hành động này không thể hoàn tác.`,
                                          })
                                        }
                                        className="cursor-pointer w-full py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs uppercase tracking-wide transition "
                                      >
                                        Xóa sản phẩm
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* TAB: BIẾN THỂ */}
                                {currentDetailTab === "variants" && (
                                  <div>
                                    {p.variants.length === 0 ? (
                                      <p className="text-gray-500 italic text-sm text-center py-6">
                                        Chưa có biến thể nào.
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm border rounded-lg overflow-hidden min-w-max">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="p-3 font-bold text-gray-700">
                                                SKU
                                              </th>
                                              <th className="p-3 font-bold text-gray-700">
                                                Màu sắc
                                              </th>
                                              <th className="p-3 font-bold text-gray-700">
                                                Dung lượng
                                              </th>
                                              <th className="p-3 font-bold text-gray-700">
                                                RAM
                                              </th>
                                              <th className="p-3 font-bold text-gray-700 text-right">
                                                Giá gốc
                                              </th>
                                              <th className="p-3 font-bold text-gray-700 text-right">
                                                Giá bán
                                              </th>
                                              <th className="p-3 font-bold text-gray-700 text-center">
                                                Tồn kho
                                              </th>
                                              <th className="p-3 font-bold text-gray-700 text-center">
                                                Trạng thái
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {p.variants.map((v, idx) => (
                                              <tr
                                                key={idx}
                                                className="border-t border-gray-200 bg-white hover:bg-gray-50"
                                              >
                                                <td className="p-3 font-mono text-xs font-semibold text-gray-700">
                                                  {v.sku || "—"}
                                                </td>
                                                <td className="p-3">
                                                  <div className="flex items-center gap-2">
                                                    {v.ma_mau_hex && (
                                                      <span
                                                        className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                                                        style={{
                                                          backgroundColor:
                                                            v.ma_mau_hex,
                                                        }}
                                                      />
                                                    )}
                                                    <span>
                                                      {v.mau_sac || "—"}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="p-3">
                                                  {v.dung_luong || "—"}
                                                </td>
                                                <td className="p-3">
                                                  {v.ram || "—"}
                                                </td>
                                                <td className="p-3 text-right text-gray-600">
                                                  {formatPrice(v.gia_goc)} ₫
                                                </td>
                                                <td className="p-3 text-right font-bold text-blue-600">
                                                  {formatPrice(v.gia_ban)} ₫
                                                </td>
                                                <td className="p-3 text-center font-bold">
                                                  {Number(v.ton_kho) === 0 ? (
                                                    <span className="text-red-500">
                                                      Hết
                                                    </span>
                                                  ) : (
                                                    <span className="text-gray-800">
                                                      {v.ton_kho}
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-3 text-center">
                                                  <span
                                                    className={`text-xs font-bold px-2 py-0.5 rounded ${v.trang_thai === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                                  >
                                                    {v.trang_thai === "active"
                                                      ? "Hiện"
                                                      : "Ẩn"}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* TAB: THUỘC TÍNH */}
                                {currentDetailTab === "attributes" && (
                                  <div>
                                    {p.attributes.length === 0 ? (
                                      <p className="text-gray-500 italic text-sm text-center py-6">
                                        Chưa có thuộc tính nào.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {p.attributes
                                          .sort(
                                            (a, b) =>
                                              (a.thu_tu || 0) - (b.thu_tu || 0),
                                          )
                                          .map((attr, idx) => (
                                            <div
                                              key={idx}
                                              className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                                            >
                                              <span className="text-gray-500 text-xs font-semibold">
                                                {attr.nhom
                                                  ? `[${attr.nhom}] `
                                                  : ""}
                                                {attr.ten_thuoc_tinh}
                                              </span>
                                              <span className="font-bold text-gray-800 text-sm text-right ml-3">
                                                {attr.gia_tri}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* TAB: HÌNH ẢNH */}
                                {currentDetailTab === "images" && (
                                  <div>
                                    {p.images.length === 0 ? (
                                      <p className="text-gray-500 italic text-sm text-center py-6">
                                        Chưa có hình ảnh nào.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {p.images
                                          .sort(
                                            (a, b) =>
                                              (a.thu_tu || 0) - (b.thu_tu || 0),
                                          )
                                          .map((img, idx) => (
                                            <div
                                              key={idx}
                                              className={`relative rounded-lg overflow-hidden border-2 ${img.la_anh_chinh ? "border-blue-500" : "border-gray-200"}`}
                                            >
                                              <img
                                                src={`${API_BASE}${img.url_anh}`}
                                                alt={img.alt_text || p.name}
                                                className="w-full h-24 object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                  e.target.src =
                                                    "../../assets/images/NoImage.webp";
                                                }}
                                              />
                                              {img.la_anh_chinh && (
                                                <span className="absolute top-0 left-0 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 font-bold">
                                                  Chính
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-between items-center text-sm text-gray-600 shrink-0">
            <span className="font-medium">
              Hiển thị{" "}
              <span className="font-semibold text-gray-800">
                {filteredProducts.length}
              </span>{" "}
              / {products.length} sản phẩm
            </span>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &laquo;
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button className="px-2.5 bg-blue-600 text-white rounded-md font-bold shadow-sm cursor-default">
                {currentPage}
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &gt;
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 border border-gray-200 hover:bg-gray-50 rounded-md font-medium transition-colors cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL THÊM/SỬA SẢN PHẨM ── */}
      <ProductModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formData={formData}
        setFormData={setFormData}
        handleBasicChange={handleBasicChange}
        handleArrayChange={handleArrayChange}
        addRow={addRow}
        removeRow={removeRow}
        handleSaveProduct={handleSaveProduct}
        editingProduct={editingProduct}
        categories={categories}
        suppliers={suppliers}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
      />

      {/* ── QUICK ADD MODALS ── */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Thêm Danh Mục</h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-2xl cursor-pointer hover:text-red-500 leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickSaveCategory}>
              <div className="p-6 pb-1">
                <label className="text-sm font-medium text-gray-700 ">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-medium font-medium"
                  placeholder="Tên danh mục..."
                  autoFocus
                />
              </div>
              <div className="px-6 py-3">
                <label className="text-sm font-medium text-gray-700 ">
                  Danh mục cha:
                </label>
                <select
                  value={newCategoryParentId}
                  onChange={(e) => setNewCategoryParentId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 text-sm text-gray-700 bg-white appearance-none"
                >
                  <option value="">Là danh mục cha</option>
                  {categories
                    .filter((c) => !c.danh_muc_cha_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ten_danh_muc}
                      </option>
                    ))}
                </select>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="flex-1 py-2 bg-white border border-gray-300 rounded-xl font-medium cursor-pointer hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-medium text-gray-800 text-xl">
                Thêm Nhà Cung Cấp
              </h3>
              <button
                onClick={() => {
                  setIsAddSupplierOpen(false);
                  setEditingSupplier(null);
                  setNewSupplierName("");
                }}
                className="text-3xl cursor-pointer hover:text-red-500 leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleQuickSaveSupplier}
              className="p-5 border-b border-gray-100 shrink-0"
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {editingSupplier ? "Cập nhật tên:" : "Thêm mới:"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="flex-1 p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-medium text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold cursor-pointer hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  {editingSupplier ? "Cập nhật" : "Thêm"}
                </button>
                {editingSupplier && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(null);
                      setNewSupplierName("");
                    }}
                    className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold cursor-pointer hover:bg-gray-300 text-sm"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* Danh sách hiện tại */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Danh sách hiện tại
              </h4>
              {suppliers.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Chưa có nhà cung cấp nào.
                </p>
              ) : (
                <div className="space-y-2">
                  {suppliers.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors"
                    >
                      <span className="font-semibold text-gray-700 text-sm">
                        {s.ten_nha_cc}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSupplierClick(s)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận thao tác thông thường */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Xác nhận"
        type={
          confirmModal.actionType?.includes("delete") ? "danger" : "warning"
        }
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeConfirmAction}
      />

      {/* Modal cảnh báo: không thể xóa vì có đơn hàng đang xử lý */}
      <ConfirmModal
        isOpen={blockedDeleteModal.isOpen}
        type="warning"
        title="Không thể xóa sản phẩm"
        message={blockedDeleteModal.message}
        detail={
          blockedDeleteModal.detail ? (
            <span>{blockedDeleteModal.detail}</span>
          ) : undefined
        }
        onCancel={() =>
          setBlockedDeleteModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={null}
        extraButton={
          blockedDeleteModal.trangThaiHienTai !== "inactive"
            ? {
              label: "Ngừng kinh doanh",
              onClick: handleForceSetInactive,
              className:
                "px-4 py-2 text-orange-700 bg-orange-50 border border-orange-200 cursor-pointer rounded-lg hover:bg-orange-500 hover:text-white transition font-medium text-sm",
            }
            : {
              label: "Đã ngừng kinh doanh",
              onClick: () =>
                setBlockedDeleteModal((prev) => ({ ...prev, isOpen: false })),
              className:
                "px-4 py-2 text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer rounded-lg font-medium text-sm",
            }
        }
      />

    </div>
  );
};

export default Product;
