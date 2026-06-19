import React from "react";
import { Icons } from "./Icons";
import BASE_URL from "../../config/api";
import ProductCard from "../ProductCard";

const Overview = ({
  profileData,
  wishlist = [],
  onRemoveWishlistItem,
  setActiveTab,
  navigate,
}) => {
  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* 1. Khối Đơn hàng gần đây */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
            Đơn hàng gần đây
          </h2>
          <button
            onClick={() => setActiveTab("orders")}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {profileData?.allOrders?.length > 0 ? (
            profileData.allOrders.slice(0, 3).map((order) => {
              const getStatus = (status) => {
                const s = String(status).toLowerCase();
                if (
                  s.includes("delivered") ||
                  s.includes("hoàn thành") ||
                  s === "hoan_thanh"
                )
                  return {
                    label: "Hoàn thành",
                    color: "bg-green-50 text-green-600 border-green-200",
                  };
                if (
                  s.includes("cancelled") ||
                  s.includes("đã hủy") ||
                  s.includes("hủy")
                )
                  return {
                    label: "Đã hủy",
                    color: "bg-red-50 text-red-600 border-red-200",
                  };
                if (s.includes("shipping") || s.includes("đang giao"))
                  return {
                    label: "Đang giao",
                    color: "bg-blue-50 text-blue-600 border-blue-200",
                  };
                return {
                  label: "Đang xử lý",
                  color: "bg-orange-50 text-orange-600 border-orange-200",
                };
              };
              const statusObj = getStatus(order.trang_thai);
              let imgSrc =
                order.chi_tiet?.[0]?.bien_the?.san_pham?.hinh_anh?.[0]
                  ?.url_anh || null;
              if (imgSrc && !imgSrc.startsWith("http")) {
                imgSrc = `${BASE_URL}${imgSrc.startsWith("/") ? "" : "/"}${imgSrc}`;
              }
              const finalImage = imgSrc;

              return (
                <div
                  key={order.ma_don_hang}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-200 shadow-sm p-1">
                      <img
                        src={finalImage}
                        alt="Sản phẩm"
                        className="w-full h-full object-contain rounded-md"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        Mã đơn:{" "}
                        <span className="text-gray-600 font-mono">
                          #{order.ma_don_hang}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-1 font-medium">
                        {order.chi_tiet?.[0]?.ten_sp_luc_mua}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">
                        {new Date(order.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                    <p className="font-bold text-gray-800">
                      {new Intl.NumberFormat("vi-VN").format(
                        order.tong_thanh_toan,
                      )}
                      đ
                    </p>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg mt-1.5 shadow-sm border ${statusObj.color}`}
                    >
                      {statusObj.label}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm italic">
                Chưa có đơn hàng nào gần đây.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Khối Sản phẩm yêu thích */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
            Sản phẩm yêu thích
          </h2>
          <button
            onClick={() => setActiveTab("wishlist")}
            className="text-sm text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>

        {wishlist.length > 0 ? (
          /* NẾU CÓ DỮ LIỆU: Hiển thị Grid 3 sản phẩm mới nhất */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.slice(0, 3).map((item) => (
              <div key={item.id} className="h-full">
                {/* Truyền item.san_pham vào ProductCard */}
                <ProductCard
                  product={item.san_pham}
                  onLikeChange={(isLiked) => {
                    if (!isLiked && onRemoveWishlistItem) {
                      onRemoveWishlistItem(item.san_pham.id);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* NẾU RỖNG: Hiển thị Empty State */
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 transition-all">
            <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
              <Icons.Heart />
            </div>
            <p className="text-xs font-medium text-gray-500">
              Bạn chưa có sản phẩm nào yêu thích? Hãy bắt đầu mua sắm ngay nào!{" "}
              <button
                onClick={() => navigate("/")}
                className="text-blue-600 text-xs font-medium transition-colors hover:underline cursor-pointer"
              >
                Khám phá ngay
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
