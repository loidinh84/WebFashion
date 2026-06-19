import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BASE_URL from "../config/api";
import * as Icons from "../assets/icons/index";
import Swal from "sweetalert2";

const formatPrice = (price) => {
  return price ? price.toLocaleString("vi-VN") + "đ" : "Liên hệ";
};

const getImageUrl = (path) => {
  if (!path) return "https://via.placeholder.com/150";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
};

const groupSpecs = (specs) => {
  const grouped = {};
  if (!specs || !Array.isArray(specs)) return grouped;
  specs.forEach((spec) => {
    const nhom = spec.nhom || "Khác";
    if (!grouped[nhom]) grouped[nhom] = {};
    grouped[nhom][spec.ten_thuoc_tinh] = spec.gia_tri;
  });
  return grouped;
};

const ProductSearchSlot = ({ label, selectedProduct, onSelect, onClear, otherProduct }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `${BASE_URL}/api/sanPham?search=${encodeURIComponent(query)}&limit=8`,
        );
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectHit = async (hit) => {
    try {
      const res = await fetch(`${BASE_URL}/api/sanPham/chi-tiet/${hit.slug}`);
      const data = await res.json();

      if (otherProduct) {
        Swal.fire({
          title: 'Đang phân tích...',
          text: 'AI đang kiểm tra mức độ tương đồng của 2 sản phẩm',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const aiCheckRes = await fetch(`${BASE_URL}/api/ai/check-type`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product1Name: otherProduct.ten_san_pham,
              product2Name: data.ten_san_pham
            })
          });
          const aiCheckData = await aiCheckRes.json();

          if (aiCheckData.isSameType === false) {
            const result = await Swal.fire({
              title: "Sản phẩm khác loại",
              text: `2 sản phẩm này có vẻ khác nhau (${aiCheckData.reason}), bạn có muốn tiếp tục so sánh không?`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3b82f6",
              cancelButtonColor: "#ef4444",
              confirmButtonText: "Tiếp tục",
              cancelButtonText: "Hủy bỏ"
            });

            if (!result.isConfirmed) return;
          } else {
            Swal.close();
          }
        } catch (e) {
          console.error("Lỗi AI check type:", e);
          Swal.close();
        }
      }

      onSelect(data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Lỗi chi tiết:", error);
    }
  };

  if (selectedProduct) {
    const img =
      selectedProduct.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
      selectedProduct.hinh_anh?.[0]?.url_anh;
    const price =
      selectedProduct.bien_the?.[0]?.gia_ban ||
      selectedProduct.bien_the?.[0]?.gia_goc ||
      0;

    return (
      <div className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm relative group">
        <button
          onClick={onClear}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        >
          &times;
        </button>
        <div className="w-40 h-40 flex items-center justify-center mb-4">
          <img
            src={getImageUrl(img)}
            alt=""
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
        <h3 className="font-bold text-gray-800 text-center line-clamp-2 h-10 mb-2">
          {selectedProduct.ten_san_pham}
        </h3>
        <p className="text-red-600 font-bold text-lg">{formatPrice(price)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 bg-gray-50 border border-gray-200 rounded-2xl border-dashed h-full min-h-[300px]">
      <h3 className="font-bold text-gray-600 mb-4 text-center">{label}</h3>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Nhập tên sản phẩm..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-blue-500 bg-white"
        />
        <Icons.Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {searchResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {searchResults.map((hit) => {
              const hitImg =
                hit.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
                hit.hinh_anh?.[0]?.url_anh;
              return (
                <div
                  key={hit.id}
                  onClick={() => handleSelectHit(hit)}
                  className="flex items-center gap-3 p-2 bg-white hover:bg-blue-50 rounded-lg cursor-pointer border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <img
                    src={getImageUrl(hitImg)}
                    alt=""
                    className="w-12 h-12 object-contain mix-blend-multiply"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-gray-800 line-clamp-2">
                      {hit.ten_san_pham}
                    </h5>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="text-center text-gray-400 text-sm py-10">
            Không tìm thấy sản phẩm.
          </div>
        ) : !searchQuery ? (
          <div className="text-center text-gray-400 text-sm py-10 flex flex-col items-center justify-center opacity-50">
            <Icons.Search className="w-10 h-10 mb-2" />
            <p>Tìm kiếm sản phẩm để bắt đầu so sánh</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ComparePage = () => {
  const [product1, setProduct1] = useState(null);
  const [product2, setProduct2] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    // Reset AI result khi đổi sản phẩm so sánh
    setAiResult(null);
  }, [product1?.id, product2?.id]);

  const handleAskAI = async () => {
    if (!product1 || !product2) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const payload = {
        product1: {
          name: product1.ten_san_pham,
          price:
            product1.bien_the?.[0]?.gia_ban ||
            product1.bien_the?.[0]?.gia_goc ||
            0,
          specs:
            product1.thuoc_tinh?.map((t) => ({
              name: t.ten_thuoc_tinh,
              value: t.gia_tri,
            })) || [],
        },
        product2: {
          name: product2.ten_san_pham,
          price:
            product2.bien_the?.[0]?.gia_ban ||
            product2.bien_the?.[0]?.gia_goc ||
            0,
          specs:
            product2.thuoc_tinh?.map((t) => ({
              name: t.ten_thuoc_tinh,
              value: t.gia_tri,
            })) || [],
        },
      };

      const res = await fetch(`${BASE_URL}/api/ai/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.message || data.error) {
        setAiResult({ isError: true, message: data.message || data.error });
      } else {
        setAiResult(data);
      }
    } catch (error) {
      console.error("Lỗi gọi AI:", error);
      setAiResult({ isError: true, message: "Lỗi kết nối đến máy chủ AI." });
    } finally {
      setAiLoading(false);
    }
  };

  const specs1 = groupSpecs(product1?.thuoc_tinh);
  const specs2 = groupSpecs(product2?.thuoc_tinh);
  const allGroups = new Set([...Object.keys(specs1), ...Object.keys(specs2)]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              So sánh sản phẩm
            </h1>
            <p className="text-gray-500">
              Tìm kiếm và chọn 2 sản phẩm để đối chiếu thông số chi tiết
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mb-8">
            <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
              <div className="w-12 h-12 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center font-bold text-gray-400">
                VS
              </div>
            </div>
            <ProductSearchSlot
              label="Sản phẩm thứ nhất"
              selectedProduct={product1}
              onSelect={setProduct1}
              onClear={() => setProduct1(null)}
              otherProduct={product2}
            />
            <ProductSearchSlot
              label="Sản phẩm thứ hai"
              selectedProduct={product2}
              onSelect={setProduct2}
              onClear={() => setProduct2(null)}
              otherProduct={product1}
            />
          </div>

          {/* Comparison Table */}
          {product1 && product2 && allGroups.size > 0 && (
            <div className="mt-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                  Bảng so sánh chi tiết
                </h3>

                <button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Icons.ChatAI className="w-5 h-5" />
                  )}
                  {aiLoading ? "AI đang phân tích..." : "Nhờ AI phân tích"}
                </button>
              </div>

              {/* Kết quả phân tích AI */}
              {aiResult && (
                <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                      <Icons.ChatAI className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg text-indigo-900">
                      AI Nhận xét
                    </h4>
                  </div>

                  {aiResult.isError ? (
                    <div className="text-red-600 text-sm font-medium p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                      {aiResult.message ||
                        "Đã có lỗi xảy ra. Vui lòng thử lại sau."}
                    </div>
                  ) : (
                    <>
                      <p className="text-indigo-800 font-medium text-[15px] mb-6 italic">
                        "{aiResult.summary}"
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Ưu nhược điểm SP 1 */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-indigo-50/50">
                          <h5 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2">
                            {product1.ten_san_pham}
                          </h5>
                          <div className="mb-3">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 block">
                              Ưu điểm
                            </span>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {aiResult.product1?.pros?.map((p, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-green-500 mt-0.5">
                                    +
                                  </span>{" "}
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 block">
                              Nhược điểm
                            </span>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {aiResult.product1?.cons?.map((c, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-red-400 mt-0.5">-</span>{" "}
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Ưu nhược điểm SP 2 */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-indigo-50/50">
                          <h5 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2">
                            {product2.ten_san_pham}
                          </h5>
                          <div className="mb-3">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 block">
                              Ưu điểm
                            </span>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {aiResult.product2?.pros?.map((p, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-green-500 mt-0.5">
                                    +
                                  </span>{" "}
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 block">
                              Nhược điểm
                            </span>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {aiResult.product2?.cons?.map((c, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-red-400 mt-0.5">-</span>{" "}
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-md">
                        <div className="font-bold text-sm text-indigo-200 uppercase tracking-wider mb-1">
                          Lời khuyên mua hàng
                        </div>
                        <p className="text-[15px] font-medium leading-relaxed">
                          {aiResult.verdict}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-6">
                {Array.from(allGroups).map((groupName) => {
                  const allKeysInGroup = new Set([
                    ...(specs1[groupName]
                      ? Object.keys(specs1[groupName])
                      : []),
                    ...(specs2[groupName]
                      ? Object.keys(specs2[groupName])
                      : []),
                  ]);

                  if (allKeysInGroup.size === 0) return null;

                  return (
                    <div
                      key={groupName}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                      <h5 className="font-bold text-sm bg-gray-50 py-3 px-6 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        {groupName}
                      </h5>
                      <div className="flex flex-col">
                        {Array.from(allKeysInGroup).map((key) => {
                          const val1 = specs1[groupName]?.[key] || "-";
                          const val2 = specs2[groupName]?.[key] || "-";
                          const isDifferent =
                            val1 !== val2 && val1 !== "-" && val2 !== "-";

                          return (
                            <div
                              key={key}
                              className={`grid grid-cols-12 text-sm border-b border-gray-100 last:border-0 hover:bg-blue-50/20 transition-colors`}
                            >
                              <div className="col-span-12 md:col-span-3 p-4 font-medium text-gray-500 bg-gray-50/30 md:border-r border-gray-100 flex items-center">
                                {key}
                              </div>
                              <div
                                className={`col-span-6 md:col-span-4 p-4 ${isDifferent ? "text-gray-900 font-medium bg-blue-50/10" : "text-gray-600"}`}
                              >
                                <span className="md:hidden block text-xs text-gray-400 mb-1">
                                  {product1.ten_san_pham}
                                </span>
                                {val1}
                              </div>
                              <div className="hidden md:block col-span-1 border-x border-gray-100 bg-gray-50/30"></div>
                              <div
                                className={`col-span-6 md:col-span-4 p-4 border-l border-gray-100 md:border-0 ${isDifferent ? "text-gray-900 font-medium bg-blue-50/10" : "text-gray-600"}`}
                              >
                                <span className="md:hidden block text-xs text-gray-400 mb-1">
                                  {product2.ten_san_pham}
                                </span>
                                {val2}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {product1 && product2 && allGroups.size === 0 && (
            <div className="text-center text-gray-500 py-10 border border-gray-100 rounded-xl bg-gray-50">
              Cả hai sản phẩm hiện chưa được cập nhật thông số kỹ thuật để so
              sánh.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComparePage;
