import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BASE_URL from "../config/api";
import { addToCart as addToCartHelper } from "../utils/cartHelper";

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const SimilarProducts = ({ products, user }) => {
  const navigate = useNavigate();

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150?text=No+Image";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  if (!products?.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium text-gray-800">Sản phẩm tương tự</h2>
      </div>

      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={12}
        slidesPerView={2}
        slidesPerGroup={1}
        navigation={{
          nextEl: ".swiper-btn-next",
          prevEl: ".swiper-btn-prev",
        }}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={products.length > 5}
        grabCursor={true}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
        style={{ paddingBottom: "15px" }}
      >
        {products.map((sp) => {
          const imgUrl =
            sp.hinh_anh?.find((i) => i.la_anh_chinh)?.url_anh ||
            sp.hinh_anh?.[0]?.url_anh;
          const giaMin = Math.min(
            ...(sp.bien_the?.map((bt) => bt.gia_ban || bt.gia_goc) || [0]),
          );
          const giaGocSp = Math.max(
            ...(sp.bien_the?.map((bt) => bt.gia_goc) || [0]),
          );
          const discount =
            giaGocSp > giaMin
              ? Math.round(((giaGocSp - giaMin) / giaGocSp) * 100)
              : 0;
          const colors = [
            ...new Set(sp.bien_the?.map((bt) => bt.ma_mau_hex).filter(Boolean)),
          ];

          return (
            <SwiperSlide key={sp.id}>
              <div
                onClick={() =>
                  navigate(
                    sp.slug ? `/product/${sp.slug}` : `/product/id/${sp.id}`,
                  )
                }
                className="border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-md transition-all group h-full"
              >
                {/* Ảnh */}
                <div className="relative bg-gray-50 p-3 flex items-center justify-center h-[160px]">
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded z-10">
                      -{discount}%
                    </span>
                  )}
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={sp.ten_san_pham}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                </div>

                {/* Thông tin */}
                <div className="p-3">
                  <p className="text-[10px] text-gray-400 mb-1">
                    {sp.thuong_hieu}
                  </p>
                  <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[32px]">
                    {sp.ten_san_pham}
                  </h4>

                  <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                    <span className="text-sm font-medium text-red-600">
                      {giaMin > 0 ? formatPrice(giaMin) : "Liên hệ"}
                    </span>
                    {discount > 0 && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatPrice(giaGocSp)}
                      </span>
                    )}
                  </div>

                  {colors.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {colors.slice(0, 5).map((hex, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      {colors.length > 5 && (
                        <span className="text-[10px] text-gray-400">
                          +{colors.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = sp.bien_the?.[0];
                      if (!v) return;

                      const cartItem = {
                        id: sp.id,
                        variantId: v.id,
                        ten_san_pham: sp.ten_san_pham,
                        hinh_anh: imgUrl,
                        gia_ban: Number(v.gia_ban || v.gia_goc || 0),
                        dung_luong: v.dung_luong || "",
                        mau_sac: v.mau_sac || "",
                        ram: v.ram || "",
                        sku: v.sku || "",
                      };

                      addToCartHelper(cartItem, 1);
                      toast.success("Đã thêm vào giỏ hàng!");
                    }}
                    className="w-full py-1.5 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition cursor-pointer"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default SimilarProducts;
