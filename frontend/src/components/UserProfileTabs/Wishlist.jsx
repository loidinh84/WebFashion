import React from "react";
import ProductCard from "../ProductCard";
import { Icons } from "./Icons";

const WishlistTab = ({ wishlist = [], onRemoveWishlistItem, navigate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          Sản phẩm yêu thích
          {wishlist.length > 0 && (
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-sm font-bold">
              {wishlist.length}
            </span>
          )}
        </h2>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((item) => (
            <div key={item.id} className="h-full">
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
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-red-400">
            <Icons.Heart />
          </div>
          <p className="text-base font-medium text-gray-600 mb-2">
            Danh sách yêu thích của bạn đang trống!
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Lưu lại những sản phẩm bạn ưng ý để mua sau nhé.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-[#4A44F2] text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100 cursor-pointer"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
