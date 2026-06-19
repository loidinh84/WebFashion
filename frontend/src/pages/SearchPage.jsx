import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import BASE_URL from "../config/api";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!keyword.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(
          `${BASE_URL}/api/sanPham?search=${encodeURIComponent(keyword)}&limit=50`,
        );
        setProducts(res.data.data || []);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [keyword]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-[1280px] flex-grow">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 px-1">
          <Link
            to="/"
            className="hover:text-[#4A44F2] transition-colors font-medium"
          >
            Trang chủ
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Tìm kiếm</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-xl text-gray-800">
            Kết quả tìm kiếm cho từ khóa:{" "}
            <strong className="text-[#4A44F2]">"{keyword}"</strong>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tìm thấy {products.length} sản phẩm phù hợp
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Đang tìm kiếm...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="transform transition-all"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl py-16 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium text-lg">
              Rất tiếc, không tìm thấy sản phẩm nào!
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Vui lòng thử lại với từ khóa khác chung chung hơn nhé.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
