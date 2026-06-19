import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import BASE_URL from "../config/api";

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [activeBrand, setActiveBrand] = useState(null);
  const [activeSort, setActiveSort] = useState("Mới nhất");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    rams: [],
    dung_luongs: [],
  });
  const [activeRam, setActiveRam] = useState("");
  const [activeDungLuong, setActiveDungLuong] = useState("");
  const [activeMauSac, setActiveMauSac] = useState("");

  const BRAND_LIMIT = 10;
  const location = useLocation();

  const fetchCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(location.search);
      const initialBrand = params.get("brand");
      if (initialBrand) setActiveBrand(initialBrand);

      const isId = /^\d+$/.test(slug);
      const endpoint = isId
        ? `${BASE_URL}/api/sanPham/danh-muc/id/${slug}`
        : `${BASE_URL}/api/sanPham/danh-muc/slug/${slug}`;

      // Fetch danh mục
      const catRes = await axios.get(endpoint);
      const categoryData = catRes.data;
      setCategory(categoryData);

      // Fetch brands
      const brandsRes = await axios.get(
        `${BASE_URL}/api/sanPham/thuong-hieu/${categoryData.id}`,
      );
      setBrands(brandsRes.data || []);

      try {
        const filtersRes = await axios.get(
          `${BASE_URL}/api/sanPham/boloc/${categoryData.id}`,
        );
        setFilterOptions(filtersRes.data || { rams: [], dung_luongs: [] });
      } catch (err) {
        console.error("Không tải được option bộ lọc", err);
      }

      setPage(1);
      setActiveRam("");
      setActiveDungLuong("");
      setActiveMauSac("");
    } catch (err) {
      console.error(err);
      setError("Không tìm thấy danh mục này.");
    } finally {
      setLoading(false);
    }
  }, [slug, activeSort, location.search]);

  const fetchProducts = async (
    catId,
    brand = null,
    sort = "Mới nhất",
    ram = "",
    dungLuong = "",
    mauSac = "",
    pageNum = 1,
    reset = false,
  ) => {
    try {
      if (pageNum > 1) setLoadingMore(true);

      let url = `${BASE_URL}/api/sanPham?danhMucId=${catId}&page=${pageNum}&limit=10`;
      if (brand) url += `&thuongHieu=${encodeURIComponent(brand)}`;
      if (ram) url += `&ram=${encodeURIComponent(ram)}`;
      if (dungLuong) url += `&dung_luong=${encodeURIComponent(dungLuong)}`;
      if (mauSac) url += `&mau_sac=${encodeURIComponent(mauSac)}`;
      if (sort) url += `&sort=${encodeURIComponent(sort)}`;

      const res = await axios.get(url);
      const fetchedData = res.data.data || [];
      const totalP = res.data.totalPages || 1;

      if (reset) {
        setProducts(fetchedData);
      } else {
        setProducts((prev) => [...prev, ...fetchedData]);
      }

      setTotalPages(totalP);
      setLoadingMore(false);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  useEffect(() => {
    if (category) {
      setPage(1);
      fetchProducts(
        category.id,
        activeBrand,
        activeSort,
        activeRam,
        activeDungLuong,
        activeMauSac,
        1,
        true,
      );
    }
  }, [
    category,
    activeBrand,
    activeSort,
    activeRam,
    activeDungLuong,
    activeMauSac,
  ]);

  useEffect(() => {
    if (category && page > 1) {
      fetchProducts(
        category.id,
        activeBrand,
        activeSort,
        activeRam,
        activeDungLuong,
        activeMauSac,
        page,
        false,
      );
    }
  }, [page]);

  const observer = useRef();
  const lastProductElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && page < totalPages) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        { threshold: 0.1 },
      );

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, page, totalPages],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-32 flex flex-col items-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-[#4A44F2] rounded-full animate-spin"></div>
          </div>
          <p className="mt-8 text-gray-400 font-bold  text-sm animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Rất tiếc!
            </h2>
            <p className="text-gray-500 mb-8 font-medium">
              Không tìm thấy danh mục hoặc có lỗi xảy ra.
            </p>
            <Link
              to="/"
              className="bg-[#4A44F2] text-white px-10 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block"
            >
              Quay về trang chủ
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const visibleBrands = showAllBrands ? brands : brands.slice(0, BRAND_LIMIT);

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-3 max-w-[1280px] flex-grow">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2 px-1">
          <Link
            to="/"
            className="hover:text-[#4A44F2] transition-colors font-medium"
          >
            Trang chủ
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">
            {category.ten_danh_muc}
          </span>
        </nav>

        {/* Category Info & Filters */}
        <div className="bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-5 mb-5 overflow-hidden relative">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            {category.ten_danh_muc}
          </h1>

          {/* Hàng 1: Brands Selection */}
          {brands.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {visibleBrands.map((brand, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setActiveBrand(activeBrand === brand ? null : brand)
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                      activeBrand === brand
                        ? "bg-[#4A44F2] text-white border-[#4A44F2] shadow-md shadow-indigo-100"
                        : "bg-blue-50 border-blue-100 text-gray-600 hover:border-[#4A44F2] hover:text-[#4A44F2] hover:bg-white"
                    }`}
                  >
                    {brand.toUpperCase()}
                  </button>
                ))}

                {brands.length > BRAND_LIMIT && (
                  <button
                    onClick={() => setShowAllBrands(!showAllBrands)}
                    className="px-4 py-2 text-[#4A44F2] text-sm font-medium hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-transparent"
                  >
                    {showAllBrands
                      ? "Thu gọn ▲"
                      : `Xem thêm ${brands.length - BRAND_LIMIT} hãng ▼`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hàng 2: Bộ Lọc Nâng Cao (Combobox RAM, Dung Lượng) & Sắp Xếp */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pt-4 border-t border-gray-100 gap-4">
            {/* Cụm Combobox Lọc Nâng Cao */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-500 mr-1 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Lọc theo:
              </span>

              {/* Combobox Lọc RAM */}
              {filterOptions.rams && filterOptions.rams.length > 0 && (
                <div className="relative">
                  <select
                    value={activeRam}
                    onChange={(e) => setActiveRam(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:border-[#4A44F2] focus:ring-1 focus:ring-[#4A44F2] cursor-pointer transition-colors font-medium"
                  >
                    <option value="">Tất cả RAM</option>
                    {filterOptions.rams.map((ram, idx) => (
                      <option key={idx} value={ram}>
                        {ram}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Combobox Lọc Dung Lượng */}
              {filterOptions.dung_luongs &&
                filterOptions.dung_luongs.length > 0 && (
                  <div className="relative">
                    <select
                      value={activeDungLuong}
                      onChange={(e) => setActiveDungLuong(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:border-[#4A44F2] focus:ring-1 focus:ring-[#4A44F2] cursor-pointer transition-colors font-medium"
                    >
                      <option value="">Dung lượng</option>
                      {filterOptions.dung_luongs.map((dl, idx) => (
                        <option key={idx} value={dl}>
                          {dl}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                )}
              {filterOptions.mau_sacs && filterOptions.mau_sacs.length > 0 && (
                <div className="relative">
                  <select
                    value={activeMauSac}
                    onChange={(e) => setActiveMauSac(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:border-[#4A44F2] focus:ring-1 focus:ring-[#4A44F2] cursor-pointer transition-colors font-medium"
                  >
                    <option value="">Tất cả màu</option>
                    {filterOptions.mau_sacs.map((mau, idx) => (
                      <option key={idx} value={mau}>
                        {mau}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Cụm Sắp xếp */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto w-full lg:w-auto no-scrollbar">
              {["Mới nhất", "Bán chạy", "Giá Thấp - Cao", "Giá Cao - Thấp"].map(
                (option) => (
                  <button
                    key={option}
                    onClick={() => setActiveSort(option)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      activeSort === option
                        ? "bg-white shadow-sm text-[#4A44F2] border border-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Products Display */}
        {products.length > 0 ? (
          <div className="pb-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-3">
              {products.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="transform transition-all duration-500"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Sentinel for Infinite Scroll */}
            <div
              ref={lastProductElementRef}
              className="flex flex-col items-center justify-center mt-5"
            >
              {loadingMore ? (
                <>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#4A44F2] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#4A44F2] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-[#4A44F2] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
                    Đang tải thêm...
                  </p>
                </>
              ) : page >= totalPages && products.length > 0 ? (
                <div className="flex flex-col items-center opacity-40">
                  <div className=" w-20 bg-gray-300 mb-4"></div>
                  <p className="text-gray-400 text-xs font-medium">
                    Bạn đã xem hết sản phẩm trong mục này
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl py-10 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-15 h-15 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-[#4A44F2] opacity-[0.03] rounded-full animate-ping"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-300 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-gray-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">
              Hiện tại chúng tôi chưa có sản phẩm nào phù hợp với lựa chọn này.
              Thử chọn hãng khác xem sao nhé!
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
