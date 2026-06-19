import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import * as Icons from "../assets/icons/index";

const ProductCard = ({ product, onLikeChange }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user?.id || !product?.id) return;
      try {
        const res = await fetch(
          `${BASE_URL}/api/wishlist/check/${user.id}/${product.id}`,
        );
        const data = await res.json();
        setIsLiked(data.isLiked);
      } catch (error) {
        console.error("Lỗi kiểm tra yêu thích:", error);
      }
    };
    checkLikeStatus();
  }, [user?.id, product?.id]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      navigate("/login");
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tai_khoan_id: user.id,
          san_pham_id: product.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsLiked(data.isLiked);
        if (onLikeChange) onLikeChange(data.isLiked);
        if (data.isLiked) {
          toast.success("Đã thêm vào danh sách yêu thích!");
        } else {
          toast.success("Đã bỏ yêu thích sản phẩm.");
        }
      } else {
        toast.error(data.message || "Có lỗi xảy ra!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setIsLiking(false);
    }
  };

  let imageUrl = "../assets/NoImage.webp";
  if (product.hinh_anh && product.hinh_anh.length > 0) {
    const mainImg =
      product.hinh_anh.find((img) => img.la_anh_chinh === true) ||
      product.hinh_anh[0];
    imageUrl = mainImg.url_anh;
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }
  }

  let giaCu = 0;
  let giaMoi = 0;
  if (product.bien_the && product.bien_the.length > 0) {
    giaCu = product.bien_the[0].gia_goc || 0;
    giaMoi = product.bien_the[0].gia_ban || giaCu;
  }

  const phanTramGiam =
    giaCu > 0 && giaCu > giaMoi
      ? Math.round(((giaCu - giaMoi) / giaCu) * 100)
      : 0;

  const isNewProduct = product.created_at
    ? (Date.now() - new Date(product.created_at).getTime()) /
        (1000 * 60 * 60 * 24) <=
      5
    : false;

  const avgRating = product.diem_danh_gia
    ? Number(product.diem_danh_gia)
    : product.danh_gia_trung_binh
      ? Number(product.danh_gia_trung_binh)
      : null;
  const tongDanhGia = Number(product.tong_danh_gia || 0);
  const firstVariant = product.bien_the?.[0];
  const ram = firstVariant?.ram;
  const dungLuong = firstVariant?.dung_luong;
  const thuongHieu = product.thuong_hieu;
  const uniqueColors = product.bien_the
    ? [
        ...new Map(
          product.bien_the
            .filter((bt) => bt.mau_sac)
            .map((bt) => [bt.mau_sac, bt]),
        ).values(),
      ]
    : [];

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer relative font-sans flex flex-col h-full"
    >
      {/* ── Badge giảm giá / Mới ─────────────────────────────────────────── */}
      <div className="flex justify-between items-start z-10 absolute w-full pr-6 top-3">
        {phanTramGiam > 0 ? (
          <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            Giảm {phanTramGiam}%
          </div>
        ) : isNewProduct ? (
          <div className="bg-[#FF6A13] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            Mới
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={handleToggleFavorite}
          disabled={isLiking}
          className={`flex items-center gap-1 text-[12px] font-medium z-20 cursor-pointer transition-colors ${
            isLiked ? "text-red-500" : "text-blue-400 hover:text-red-500"
          } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLiked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 animate-scale-up"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <Icons.Favorite className="w-5 h-5" />
          )}
          Yêu thích
        </button>
      </div>

      {/* ── Ảnh sản phẩm ────────────────────────────────────────────────── */}
      <div className="w-full aspect-square flex items-center justify-center overflow-hidden mt-2">
        <img
          src={imageUrl}
          alt={product.ten_san_pham}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
        />
      </div>

      {/* ── Thông tin chữ ───────────────────────────────────────────────── */}
      <div className="flex-grow flex flex-col mt-2">

        {/* Thương hiệu */}
        {thuongHieu && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mb-1">
            {thuongHieu}
          </span>
        )}

        {/* Tên sản phẩm */}
        <h3 className="text-gray-800 text-xs font-bold leading-tight group-hover:text-blue-600 line-clamp-2 min-h-[30px]">
          {product.ten_san_pham}
        </h3>

        {/* Mô tả ngắn */}
        {product.mo_ta_ngan && (
          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2 mt-1">
            {product.mo_ta_ngan}
          </p>
        )}

        {/* Tags thông số kỹ thuật */}
        {(ram || dungLuong) && (
          <div className="flex flex-wrap gap-1 mt-1.5 mb-1">
            {ram && (
              <span className="bg-gray-100 text-gray-600 text-[9px] font-medium px-1.5 py-0.5 rounded">
                RAM {ram}
              </span>
            )}
            {dungLuong && (
              <span className="bg-gray-100 text-gray-600 text-[9px] font-medium px-1.5 py-0.5 rounded">
                {dungLuong}
              </span>
            )}
          </div>
        )}

        {/* Chấm màu sắc */}
        {uniqueColors.length > 1 && (
          <div className="flex items-center gap-1 mb-1.5">
            {uniqueColors.slice(0, 5).map((bt) => (
              <span
                key={bt.mau_sac}
                title={bt.mau_sac}
                className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0"
                style={{ background: bt.ma_mau_hex || "#ccc" }}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className="text-[9px] text-gray-400">
                +{uniqueColors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Giá */}
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-red-600 text-sm font-bold">
            {giaMoi > 0 ? giaMoi.toLocaleString("vi-VN") + "đ" : "Liên hệ"}
          </span>
          {giaCu > 0 && giaCu > giaMoi && (
            <span className="text-gray-400 text-[10px] font-medium line-through">
              {giaCu.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        {/* Footer: Sao + Số đánh giá + Lượt xem */}
        <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-2">
          <div className="flex text-[10px] gap-0.5 text-yellow-400 font-medium items-center">
            <Icons.Star className="w-3 h-3 fill-yellow-400" />
            {avgRating !== null ? (
              <span className="text-yellow-500">{avgRating.toFixed(1)}</span>
            ) : (
              <span className="text-yellow-400">5.0</span>
            )}
            {tongDanhGia > 0 && (
              <span className="text-gray-400 ml-0.5">({tongDanhGia})</span>
            )}
          </div>
          <div className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {product.luot_xem || 0}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
