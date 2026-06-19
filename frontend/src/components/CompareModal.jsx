import React, { useState, useEffect, useRef } from "react";
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

// Hàm gộp thuộc tính từ mảng thành object { 'Nhom': { 'Ten thuoc tinh': 'Gia tri' } }
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

const CompareModal = ({ isOpen, onClose, currentProduct }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedProduct(null);
      setAiResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset AI result khi đổi sản phẩm so sánh
    setAiResult(null);
  }, [selectedProduct?.id]);

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
          `${BASE_URL}/api/sanPham?search=${encodeURIComponent(query)}&limit=6`,
        );
        const data = await res.json();
        setSearchResults(data.data || []); // API getAllSanPham trả về { data: [...] }
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectProduct = async (productHit) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/sanPham/chi-tiet/${productHit.slug}`,
      );
      const data = await res.json();

      Swal.fire({
        title: "Đang phân tích...",
        text: "AI đang kiểm tra mức độ tương đồng của 2 sản phẩm",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const aiCheckRes = await fetch(`${BASE_URL}/api/ai/check-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product1Name: currentProduct.ten_san_pham,
            product2Name: data.ten_san_pham,
          }),
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
            cancelButtonText: "Hủy bỏ",
          });

          if (!result.isConfirmed) return;
        } else {
          Swal.close();
        }
      } catch (e) {
        console.error("Lỗi AI check type:", e);
        Swal.close();
      }

      setSelectedProduct(data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết SP:", error);
    }
  };

  const handleAskAI = async () => {
    if (!currentProduct || !selectedProduct) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const payload = {
        product1: {
          name: currentProduct.ten_san_pham,
          price:
            currentProduct.bien_the?.[0]?.gia_ban ||
            currentProduct.bien_the?.[0]?.gia_goc ||
            0,
          specs:
            currentProduct.thuoc_tinh?.map((t) => ({
              name: t.ten_thuoc_tinh,
              value: t.gia_tri,
            })) || [],
        },
        product2: {
          name: selectedProduct.ten_san_pham,
          price:
            selectedProduct.bien_the?.[0]?.gia_ban ||
            selectedProduct.bien_the?.[0]?.gia_goc ||
            0,
          specs:
            selectedProduct.thuoc_tinh?.map((t) => ({
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

  if (!isOpen || !currentProduct) return null;

  const currentImg =
    currentProduct.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
    currentProduct.hinh_anh?.[0]?.url_anh;
  const currentPrice =
    currentProduct.bien_the?.[0]?.gia_ban ||
    currentProduct.bien_the?.[0]?.gia_goc ||
    0;

  if (selectedProduct) {
    const selectedImg =
      selectedProduct.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
      selectedProduct.hinh_anh?.[0]?.url_anh;
    const selectedPrice =
      selectedProduct.bien_the?.[0]?.gia_ban ||
      selectedProduct.bien_the?.[0]?.gia_goc ||
      0;

    const specs1 = groupSpecs(currentProduct.thuoc_tinh);
    const specs2 = groupSpecs(selectedProduct.thuoc_tinh);
    const allGroups = new Set([...Object.keys(specs1), ...Object.keys(specs2)]);

    return (
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-bold text-xl text-gray-800">
              So sánh sản phẩm
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Product Headers */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
            <div className="col-span-5 flex flex-col items-center text-center">
              <img
                src={getImageUrl(currentImg)}
                alt=""
                className="w-24 h-24 object-contain mb-2 mix-blend-multiply"
              />
              <h4 className="font-bold text-sm line-clamp-2">
                {currentProduct.ten_san_pham}
              </h4>
              <p className="text-red-600 font-bold mt-1">
                {formatPrice(currentPrice)}
              </p>
            </div>
            <div className="col-span-1 flex items-center justify-center text-gray-300 font-bold">
              VS
            </div>
            <div className="col-span-4 flex flex-col items-center text-center relative">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-0 right-0 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Đổi sản phẩm
              </button>
              <img
                src={getImageUrl(selectedImg)}
                alt=""
                className="w-24 h-24 object-contain mb-2 mix-blend-multiply"
              />
              <h4 className="font-bold text-sm line-clamp-2">
                {selectedProduct.ten_san_pham}
              </h4>
              <p className="text-red-600 font-bold mt-1">
                {formatPrice(selectedPrice)}
              </p>
            </div>
          </div>

          {/* Specs Table */}
          <div className="overflow-y-auto flex-1 p-6 bg-gray-50/30">
            <div className="flex justify-between items-center mb-6 gap-4">
              <h4 className="font-bold text-lg text-gray-800">
                Thông số kỹ thuật
              </h4>
              <button
                onClick={handleAskAI}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 text-sm"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Icons.ChatAI className="w-4 h-4" />
                )}
                {aiLoading ? "Đang phân tích..." : "Nhờ AI phân tích"}
              </button>
            </div>

            {/* Kết quả phân tích AI */}
            {aiResult && (
              <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow-sm animate-fade-in-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                    <Icons.ChatAI className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-indigo-900">
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
                    <p className="text-indigo-800 font-medium text-sm mb-5 italic">
                      "{aiResult.summary}"
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-50/50">
                        <h5 className="font-bold text-xs text-gray-800 mb-2 border-b border-gray-100 pb-2">
                          {currentProduct.ten_san_pham}
                        </h5>
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-1">
                            Ưu điểm
                          </span>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {aiResult.product1?.pros?.map((p, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">+</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">
                            Nhược điểm
                          </span>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {aiResult.product1?.cons?.map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-red-400">-</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-50/50">
                        <h5 className="font-bold text-xs text-gray-800 mb-2 border-b border-gray-100 pb-2">
                          {selectedProduct.ten_san_pham}
                        </h5>
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-1">
                            Ưu điểm
                          </span>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {aiResult.product2?.pros?.map((p, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">
                                  <Icons.Add />
                                </span>{" "}
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">
                            Nhược điểm
                          </span>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {aiResult.product2?.cons?.map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-red-400">-</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-600 text-white rounded-xl p-3.5 shadow-md">
                      <div className="font-bold text-sm text-indigo-200 mb-1">
                        Lời khuyên mua hàng
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        {aiResult.verdict}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {Array.from(allGroups).map((groupName) => {
              const allKeysInGroup = new Set([
                ...(specs1[groupName] ? Object.keys(specs1[groupName]) : []),
                ...(specs2[groupName] ? Object.keys(specs2[groupName]) : []),
              ]);

              if (allKeysInGroup.size === 0) return null;

              return (
                <div
                  key={groupName}
                  className="mb-6 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                >
                  <h5 className="font-bold text-sm bg-gray-50 py-3 px-4 text-gray-700 uppercase tracking-wider border-b border-gray-100">
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
                          className={`grid grid-cols-12 text-sm border-b border-gray-50 last:border-0 hover:bg-blue-50/20 transition-colors`}
                        >
                          <div className="col-span-3 p-3 font-medium text-gray-500 border-r border-gray-100 bg-gray-50/30">
                            {key}
                          </div>
                          <div
                            className={`col-span-4 p-3 ${isDifferent ? "text-gray-900 font-medium" : "text-gray-600"}`}
                          >
                            {val1}
                          </div>
                          <div className="col-span-1 border-x border-gray-50 bg-gray-50/30"></div>
                          <div
                            className={`col-span-4 p-3 ${isDifferent ? "text-gray-900 font-medium" : "text-gray-600"}`}
                          >
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
      </div>
    );
  }

  // TRẠNG THÁI TÌM KIẾM SẢN PHẨM
  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">
            Chọn sản phẩm so sánh
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-lg border border-blue-100 shadow-sm">
            <img
              src={getImageUrl(currentImg)}
              alt=""
              className="w-12 h-12 object-contain mix-blend-multiply"
            />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-bold mb-0.5 uppercase tracking-wider">
              Đang xem
            </p>
            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
              {currentProduct.ten_san_pham}
            </h4>
            <p className="text-red-600 font-bold text-sm mt-0.5">
              {formatPrice(currentPrice)}
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập tên sản phẩm cần so sánh..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all"
              autoFocus
            />
            <Icons.Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="mt-4 max-h-[300px] overflow-y-auto pr-1">
            {searchResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {searchResults.map((hit) => {
                  const hitImg =
                    hit.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
                    hit.hinh_anh?.[0]?.url_anh;
                  const hitPrice =
                    hit.bien_the?.[0]?.gia_ban ||
                    hit.bien_the?.[0]?.gia_goc ||
                    0;

                  return (
                    <div
                      key={hit.id}
                      onClick={() => handleSelectProduct(hit)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="bg-white p-1 rounded-md border border-gray-100 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={getImageUrl(hitImg)}
                          alt=""
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-gray-800 line-clamp-1">
                          {hit.ten_san_pham}
                        </h5>
                        <p className="text-red-600 font-bold text-xs mt-0.5">
                          {formatPrice(hitPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="text-center text-gray-500 text-sm py-10">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : !searchQuery ? (
              <div className="text-center text-gray-400 text-sm py-10">
                Gõ tên sản phẩm cùng loại để tìm kiếm.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
