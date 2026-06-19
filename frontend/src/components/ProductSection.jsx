import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductCard from "./ProductCard";
import BASE_URL from "../config/api";
import * as Icons from "../assets/icons/index";

const EMPTY_ARRAY = [];

const ProductSection = ({
  tab1,
  tab2,
  danhMucId1,
  danhMucId2,
  viewAllLink,
  filters: initialFilters = EMPTY_ARRAY,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh mục ID hiện tại dựa trên tab
  const currentDanhMucId = activeTab === 0 ? danhMucId1 : danhMucId2;

  // Effect 1: Lấy danh sách thương hiệu động từ API
  useEffect(() => {
    let isMounted = true;
    const fetchBrands = async () => {
      if (!currentDanhMucId) {
        setBrands([]);
        return;
      }
      try {
        const res = await axios.get(
          `${BASE_URL}/api/sanPham/thuong-hieu/${currentDanhMucId}`,
        );
        if (isMounted) {
          setBrands(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Lỗi lấy thương hiệu:", error);
        if (isMounted) setBrands([]);
      }
    };
    fetchBrands();
    return () => {
      isMounted = false;
    };
  }, [currentDanhMucId]);

  // Effect 2: Lấy danh sách sản phẩm
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      if (!currentDanhMucId) return;

      try {
        setLoading(true);
        let selectedBrand = "";

        const currentBrands = brands.length > 0 ? brands : initialFilters;
        if (activeFilter !== null) {
          selectedBrand = currentBrands[activeFilter] || "";
        }

        const url = `${BASE_URL}/api/sanPham?danhMucId=${currentDanhMucId}${
          selectedBrand
            ? `&thuongHieu=${encodeURIComponent(selectedBrand)}`
            : ""
        }`;

        const res = await axios.get(url);
        if (isMounted) {
          const data = res.data.data || res.data;
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [currentDanhMucId, activeFilter, brands, initialFilters]);

  const handleTabChange = (index) => {
    if (index === activeTab) return;
    setActiveTab(index);
    setActiveFilter(null);
  };

  const currentSlug = (activeTab === 0 ? tab1 : tab2)
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
  const dynamicViewAllLink = `/category/${currentSlug}`;

  const filtersToDisplay = brands.length > 0 ? brands : initialFilters;

  return (
    <div className="w-full mt-2 sm:mt-4 group/section">
      <div className="w-full mx-auto flex flex-col bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-4 lg:p-7 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {/* 1. Header: Tab & View All */}
        <div className="flex items-center justify-between border-b border-gray-100 mb-2 gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { label: tab1, id: danhMucId1 },
              { label: tab2, id: danhMucId2 },
            ]
              .filter((item) => item.label)
              .map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleTabChange(i)}
                  className={`whitespace-nowrap flex-shrink-0 relative px-3 sm:px-6 py-1 text-base sm:text-lg font-medium cursor-pointer transition-all duration-300 ${
                    activeTab === i
                      ? "text-[#4A44F2]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {item.label}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[4px] bg-[#4A44F2] rounded-t-full transition-all duration-300 transform ${
                      activeTab === i
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0"
                    }`}
                  />
                </button>
              ))}
          </div>

          <Link
            to={viewAllLink || dynamicViewAllLink}
            className="flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#4A44F2] transition-colors group/all pr-1 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {/* 2. Brand Filters — cuộn ngang trên mobile */}
        {filtersToDisplay && filtersToDisplay.length > 0 && (
          <div className="flex gap-2 mb-2 md:mb-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <button
              onClick={() => setActiveFilter(null)}
              className={`flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-1 text-sm font-medium transition-all duration-300 border cursor-pointer ${
                activeFilter === null
                  ? "bg-[#4A44F2] text-white border-[#4A44F2] shadow-[0_4px_12px_rgba(74,68,242,0.25)]"
                  : "bg-gray-50 border-gray-100 text-gray-600 hover:border-[#4A44F2] hover:text-[#4A44F2] hover:bg-white"
              }`}
            >
              Tất cả
            </button>
            {filtersToDisplay.slice(0, 10).map((filter, i) => (
              <button
                key={i}
                onClick={() => setActiveFilter(i)}
                className={`flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-1 text-sm font-medium transition-all duration-300 border cursor-pointer ${
                  activeFilter === i
                    ? "bg-[#4A44F2] text-white border-[#4A44F2] shadow-[0_4px_12px_rgba(74,68,242,0.25)]"
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:border-[#4A44F2] hover:text-[#4A44F2] hover:bg-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* 3. Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 aspect-square rounded-2xl mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))
          ) : products && products.length > 0 ? (
            products.slice(0, 10).map((prod, idx) => (
              <div
                key={prod.id || idx}
                className="transition-all duration-500 transform"
              >
                <ProductCard product={prod} />
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Icons.Box className="w-10 h-10 text-gray-300" />
              </div>
              <span className="font-bold text-gray-400 text-lg">
                Hết hàng hoặc chưa có sản phẩm
              </span>
              <p className="text-gray-400 text-sm mt-1">
                Vui lòng quay lại sau nhé!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSection;
