import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BASE_URL from "../config/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SimilarProducts from "../components/SimilarProducts";
import { addToCart as addToCartHelper } from "../utils/cartHelper";
import { toast } from "react-toastify";
import * as Icons from "../assets/icons/index";
import SpecsModal from "../components/SpecsModal";
import CompareModal from "../components/CompareModal";
import { AuthContext } from "../context/AuthContext";
import { Helmet } from "react-helmet-async";
import { StoreContext } from "../context/StoreContext";
import Swal from "sweetalert2";

// Helper functions (Standalone to use in both components)
const getImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/400x400?text=No+Image";
  if (url.startsWith("http")) return url;
  let cleanUrl = url;
  if (!cleanUrl.startsWith("/uploads/") && !cleanUrl.startsWith("uploads/")) {
    cleanUrl = `uploads/${cleanUrl.startsWith("/") ? cleanUrl.slice(1) : cleanUrl}`;
  }
  return `${BASE_URL}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};

const formatTimeAgo = (dateString) => {
  const mailDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - mailDate) / 1000);
  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return mailDate.toLocaleDateString("vi-VN");
};

const getInitialsAvatar = (name) => {
  if (!name) return { char: "?", bg: "gray", color: "#fff" };
  const gradients = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA"];
  const char = name.charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % gradients.length;
  return { char, bg: gradients[colorIndex], color: "#FFFFFF" };
};

const getReviewVariant = (rv) => {
  const dh = rv.don_hang || rv.DonHang;
  if (!dh?.chi_tiet) return null;
  const item = dh.chi_tiet.find(
    (it) => Number(it.bien_the?.san_pham_id) === Number(rv.san_pham_id),
  );
  if (!item || !item.bien_the) return null;
  const { mau_sac, dung_luong, ram } = item.bien_the;
  const parts = [mau_sac, dung_luong, ram].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
};

const ReviewItem = ({
  rv,
  user,
  isReply = false,
  onReply,
  onLike,
  onDelete,
  onHide,
  imgError,
  setImgError,
}) => {
  const avatar = getInitialsAvatar(rv.nguoi_dung?.ho_ten);
  return (
    <div className={`${isReply ? "bg-gray-50/50 p-3 rounded-lg" : ""}`}>
      {/* Phần nội dung có thể bị làm mờ */}
      <div
        className={
          rv.trang_thai === "rejected" ? "opacity-40 grayscale-[0.5]" : ""
        }
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm border border-gray-100"
            style={{ background: avatar.bg, color: avatar.color }}
          >
            {rv.nguoi_dung?.anh_dai_dien && !imgError[rv.id] ? (
              <img
                src={getImageUrl(rv.nguoi_dung.anh_dai_dien)}
                className="w-full h-full object-cover"
                onError={() =>
                  setImgError((prev) => ({ ...prev, [rv.id]: true }))
                }
              />
            ) : (
              avatar.char
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-sm">
                {rv.nguoi_dung?.ho_ten || "Khách hàng"}
                {rv.trang_thai === "rejected" && (
                  <span className="ml-2 text-[10px] text-red-500 font-normal italic">
                    [Đã ẩn với khách]
                  </span>
                )}
              </span>
              {rv.nguoi_dung?.vai_tro === "admin" && (
                <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200">
                  Quản trị viên
                </span>
              )}
              {!isReply && rv.don_hang_id && (
                <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-medium">
                  Đã mua hàng
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400">
              {formatTimeAgo(rv.created_at)}
            </span>
          </div>
        </div>

        {!isReply && rv.so_sao > 0 && (
          <div className="flex text-yellow-400 text-xs mb-1.5 ml-0">
            {"★".repeat(rv.so_sao)}
            {"☆".repeat(5 - rv.so_sao)}
          </div>
        )}

        {!isReply && getReviewVariant(rv) && (
          <p className="text-[11px] text-gray-500 mb-2">
            Phân loại hàng: {getReviewVariant(rv)}
          </p>
        )}

        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {rv.noi_dung}
        </p>

        {!isReply && rv.hinh_anh && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(() => {
              try {
                const imgs = JSON.parse(rv.hinh_anh);
                if (Array.isArray(imgs)) {
                  return imgs.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => window.open(getImageUrl(img), "_blank")}
                    />
                  ));
                }
              } catch {
                return null;
              }
            })()}
          </div>
        )}
      </div>

      {/* Thanh hành động - Tối ưu cho mobile tapping */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
        <button
          onClick={() => onLike("like")}
          className={`flex items-center gap-1.5 text-xs md:text-sm cursor-pointer transition ${rv.user_interaction === "like" ? "text-blue-600 font-bold" : "text-gray-500 hover:text-blue-600"}`}
        >
          <Icons.Like className="w-4 h-4 md:w-5 md:h-5" />
          <span>{rv.total_likes || 0}</span>
        </button>
        <button
          onClick={() => onLike("dislike")}
          className={`flex items-center gap-1.5 text-xs md:text-sm cursor-pointer transition ${rv.user_interaction === "dislike" ? "text-red-500 font-bold" : "text-gray-500 hover:text-red-500"}`}
        >
          <Icons.DisLike className="w-4 h-4 md:w-5 md:h-5" />
          <span>{rv.total_dislikes || 0}</span>
        </button>
        <button
          onClick={onReply}
          className="text-xs md:text-sm text-gray-600 font-medium hover:underline hover:text-blue-600 cursor-pointer"
        >
          Trả lời
        </button>

        {user?.vai_tro === "admin" && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-2">
            <button
              onClick={() =>
                onHide(
                  rv.id,
                  rv.trang_thai === "rejected" ? "approved" : "rejected",
                )
              }
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition cursor-pointer ${rv.trang_thai === "rejected" ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
            >
              {rv.trang_thai === "rejected" ? "Hiện" : "Ẩn"}
            </button>
            <button
              onClick={() => onDelete(rv.id)}
              className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 hover:bg-red-100 transition cursor-pointer"
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { storeConfig } = useContext(StoreContext);

  // 1. Quản lý trạng thái dữ liệu
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // Số lượng đánh giá gốc hiển thị
  const [expandedThreads, setExpandedThreads] = useState({}); // Lưu trạng thái ẩn/hiện reply
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // 2. Quản lý lựa chọn của người dùng
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedVariant && quantity > selectedVariant.ton_kho) {
      setQuantity(Math.max(1, selectedVariant.ton_kho));
    }
  }, [selectedVariant]);

  // 3. Quản lý giao diện
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 4. Quản lý Form Đánh giá
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const [imgError, setImgError] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này!");
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
        toast.success(
          data.isLiked
            ? "Đã thêm vào danh sách yêu thích!"
            : "Đã bỏ yêu thích sản phẩm.",
        );
      } else {
        toast.error(data.message || "Có lỗi xảy ra!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setIsLiking(false);
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        if (!slug || slug === "undefined") return;
        const resDetail = await fetch(
          `${BASE_URL}/api/sanPham/chi-tiet/${slug}`,
        );
        if (!resDetail.ok) throw new Error("Không tìm thấy sản phẩm");
        const dataDetail = await resDetail.json();
        setProduct(dataDetail);

        const COOLDOWN_HOURS = 24;
        const storageKey = `viewed_product_${dataDetail.id}`;
        const lastViewed = localStorage.getItem(storageKey);
        const now = Date.now();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        if (!lastViewed || now - Number(lastViewed) > cooldownMs) {
          localStorage.setItem(storageKey, String(now));
          fetch(`${BASE_URL}/api/sanPham/${dataDetail.id}/view`, {
            method: "POST",
          }).catch(() => {});
        }

        if (dataDetail.bien_the?.length > 0)
          setSelectedVariant(dataDetail.bien_the[0]);
        if (dataDetail.hinh_anh?.length > 0) {
          const mainImg =
            dataDetail.hinh_anh.find((img) => img.la_anh_chinh) ||
            dataDetail.hinh_anh[0];
          setMainImage(mainImg.url_anh);
        }

        const actualId = dataDetail.id;

        try {
          const resSimilar = await fetch(
            `${BASE_URL}/api/sanPham/${actualId}/tuong-tu`,
          );
          if (resSimilar.ok) setSimilarProducts(await resSimilar.json());
        } catch (e) {
          console.error("Lỗi lấy SP tương tự", e);
        }

        fetchReviews(actualId);

        setVisibleCount(5);
        setExpandedThreads({});
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi tải dữ liệu sản phẩm!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductData();
  }, [slug]);

  const fetchReviews = async (productIdToFetch) => {
    const targetId = productIdToFetch || product?.id;
    if (!targetId) return;

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const resReviews = await fetch(
        `${BASE_URL}/api/sanPham/${targetId}/danh-gia`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (resReviews.ok) {
        const data = await resReviews.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Lỗi lấy đánh giá", e);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const scrollToReview = () => {
    const reviewSection = document.getElementById("review-section");
    if (reviewSection) {
      reviewSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá!");
      navigate("/login");
      return;
    }
    if (userRating === 0) return toast.error("Vui lòng chọn số sao đánh giá!");

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append('SoSao', userRating);
      formData.append('NoiDung', reviewText);
      const response = await fetch(
        `${BASE_URL}/api/sanPham/${product.id}/danh-gia`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        toast.success("Cảm ơn bạn! Đánh giá đã được gửi.");
        setUserRating(0);
        setReviewText("");
        fetchReviews(product.id);
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Lỗi khi gửi đánh giá!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để trả lời!");
      navigate("/login");
      return;
    }
    if (replyText.trim().length < 2)
      return toast.error("Vui lòng nhập nội dung!");

    setIsSubmittingReply(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append('NoiDung', replyText);
      formData.append('ParentId', parentId);

      const response = await fetch(
        `${BASE_URL}/api/sanPham/${product.id}/danh-gia`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        toast.success("Đã gửi phản hồi!");
        setReplyText("");
        setReplyingTo(null);
        setExpandedThreads((prev) => ({ ...prev, [parentId]: true }));
        fetchReviews(product.id);
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Lỗi khi gửi phản hồi!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối!");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleLike = async (reviewId, loai) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện!");
      navigate("/login");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      setReviews((prev) =>
        prev.map((rv) => {
          if (rv.id === reviewId) {
            let newLikes = parseInt(rv.total_likes || 0);
            let newDislikes = parseInt(rv.total_dislikes || 0);
            let currentUserInteraction = rv.user_interaction;

            if (currentUserInteraction === "like") newLikes--;
            if (currentUserInteraction === "dislike") newDislikes--;

            if (currentUserInteraction !== loai) {
              if (loai === "like") newLikes++;
              if (loai === "dislike") newDislikes++;
              currentUserInteraction = loai;
            } else {
              currentUserInteraction = null;
            }

            return {
              ...rv,
              total_likes: newLikes,
              total_dislikes: newDislikes,
              user_interaction: currentUserInteraction,
            };
          }
          return rv;
        }),
      );

      const response = await fetch(
        `${BASE_URL}/api/sanPham/danh-gia/${reviewId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ loai }),
        },
      );

      if (!response.ok) {
        fetchReviews(product.id);
        toast.error("Lỗi khi tương tác!");
      }
    } catch (error) {
      console.error(error);
      fetchReviews(product.id);
    }
  };

  const handleAdminDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này sẽ xóa vĩnh viễn đánh giá và không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/sanPham/danh-gia/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          Swal.fire("Đã xóa!", "Đánh giá đã được loại bỏ.", "success");
          fetchReviews(product.id);
        } else {
          const data = await res.json();
          Swal.fire("Lỗi!", data.message || "Không thể xóa đánh giá.", "error");
        }
      } catch {
        Swal.fire("Lỗi!", "Đã xảy ra lỗi kết nối.", "error");
      }
    }
  };

  const handleAdminHide = async (id, status) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/sanPham/danh-gia/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trang_thai: status }),
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: status === "rejected" ? "Đã ẩn!" : "Đã hiện!",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
        fetchReviews(product.id);
      } else {
        const data = await res.json();
        Swal.fire("Lỗi!", data.message || "Lỗi cập nhật trạng thái.", "error");
      }
    } catch {
      Swal.fire("Lỗi!", "Đã xảy ra lỗi kết nối.", "error");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép đường dẫn!");
    setIsShareModalOpen(false);
  };

  const handleAddToCart = async (shouldRedirect = false) => {
    if (!selectedVariant) {
      return toast.error("Vui lòng chọn phân loại sản phẩm!");
    }

    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];

    const cartItem = {
      id: product.id,
      variantId: selectedVariant.id,
      ten_san_pham: product.ten_san_pham,
      hinh_anh: mainImage,
      gia_ban: Number(selectedVariant.gia_ban || selectedVariant.gia_goc || 0),
      dung_luong: selectedVariant.dung_luong || "",
      mau_sac: selectedVariant.mau_sac || "",
      ram: selectedVariant.ram || "",
      sku: selectedVariant.sku || "",
    };

    const existingIndex = currentCart.findIndex(
      (item) => item.variantId === selectedVariant.id,
    );

    const existingQty =
      existingIndex > -1 ? currentCart[existingIndex].so_luong : 0;
    const newTotalQty = existingQty + quantity;

    if (newTotalQty > selectedVariant.ton_kho) {
      return toast.error(
        `Không thể thêm! Bạn đang có ${existingQty} sản phẩm trong giỏ hàng. Số lượng tối đa của sản phẩm này là ${selectedVariant.ton_kho}.`,
      );
    }

    await addToCartHelper(cartItem, quantity);

    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);

    if (shouldRedirect === true) {
      navigate("/cart");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F3F4F6] min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4A44F2]"></div>
        <p className="mt-4 text-gray-500 font-medium">
          Đang tải thông tin sản phẩm...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#F3F4F6] min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-gray-800 font-bold mb-4">
          Sản phẩm không tồn tại hoặc đã bị xóa!
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#4A44F2] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Quay về Trang chủ
        </button>
      </div>
    );
  }

  const giaBan = selectedVariant?.gia_ban || selectedVariant?.gia_goc || 0;
  const giaGoc = selectedVariant?.gia_goc || 0;
  const phanTramGiam =
    giaGoc > giaBan ? Math.round(((giaGoc - giaBan) / giaGoc) * 100) : 0;

  const parentReviews = reviews.filter((r) => !r.parent_id);
  const allReplies = reviews.filter((r) => r.parent_id);
  const avgRating =
    parentReviews.length > 0
      ? (
          parentReviews.reduce((sum, r) => sum + r.so_sao, 0) /
          parentReviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="bg-[#F3F4F6] min-h-screen font-sans relative overflow-x-hidden">
      <Helmet>
        <title>{product.meta_title || product.ten_san_pham}</title>
        <meta
          name="description"
          content={product.meta_description || product.mo_ta_ngan}
        />
        <meta
          property="og:title"
          content={product.meta_title || product.ten_san_pham}
        />
        <meta
          property="og:description"
          content={product.meta_description || product.mo_ta_ngan}
        />
        <meta property="og:image" content={getImageUrl(mainImage)} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <Header />

      <main className="container mx-auto px-4 py-4 md:py-6 max-w-7xl pb-24 md:pb-0">
        {/* Breadcrumb - Cải thiện hiển thị trên mobile */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] md:text-xs text-gray-500 mb-4 overflow-hidden">
          <span
            onClick={() => navigate("/")}
            className="hover:text-[#4A44F2] cursor-pointer whitespace-nowrap"
          >
            Trang chủ
          </span>{" "}
          /
          <span className="hover:text-[#4A44F2] cursor-pointer">
            {product.thuong_hieu || "Điện thoại"}
          </span>{" "}
          /
          <span className="text-gray-800 font-medium">
            {product.ten_san_pham}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                {product.ten_san_pham}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icons.Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(avgRating) ? "fill-yellow-400" : "fill-gray-300"}`}
                    />
                  ))}
                </div>
                <span
                  className="text-blue-600 hover:underline cursor-pointer font-medium"
                  onClick={scrollToReview}
                >
                  ({parentReviews.length} đánh giá)
                </span>
                <span className="text-gray-300 mx-1">|</span>
                <span className="text-gray-500">
                  {product.luot_mua > 0
                    ? `Đã bán: ${product.luot_mua}`
                    : `${product.luot_xem || 0} lượt xem`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-3 md:gap-5 text-[11px] md:text-sm font-medium text-gray-600 mb-3 border-b border-gray-100 pb-4">
                <button
                  onClick={handleToggleFavorite}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 cursor-pointer transition-all ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  } ${isLiking ? "opacity-50" : ""}`}
                >
                  {isLiked ? (
                    <Icons.Favorite className="w-5 h-5 fill-red-500" />
                  ) : (
                    <Icons.Favorite className="w-5 h-5" />
                  )}
                  <span>{isLiked ? "Đã thích" : "Yêu thích"}</span>
                </button>

                <button
                  onClick={scrollToReview}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
                >
                  <Icons.Comment className="w-5 h-5" />
                  <span>Đánh giá</span>
                </button>

                <button
                  onClick={() => setIsSpecsModalOpen(true)}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
                >
                  <Icons.Memory className="w-5 h-5" />
                  <span>Thông số</span>
                </button>

                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
                >
                  <Icons.Compare className="w-5 h-5" />
                  <span>So sánh</span>
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl  flex justify-center items-center h-[370px] p-2 bg-white relative group">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-600 shadow-sm transition opacity-40 group-hover:opacity-100 cursor-pointer"
                  title="Chia sẻ sản phẩm này"
                >
                  <Icons.Share />
                </button>

                <img
                  src={getImageUrl(mainImage)}
                  alt="Main"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 justify-center mt-2">
                {product.hinh_anh &&
                  product.hinh_anh.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img.url_anh)}
                      className={`w-16 h-16 border rounded-lg p-1 shrink-0 transition-all ${mainImage === img.url_anh ? "border-red-600 border-2" : "border-gray-200 hover:border-gray-400"}`}
                    >
                      <img
                        src={getImageUrl(img.url_anh)}
                        alt={`Thumb ${idx}`}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-bold text-red-600">
                  {giaBan > 0 ? formatPrice(giaBan) : "Liên hệ"}
                </span>
                {phanTramGiam > 0 && (
                  <>
                    <span className="text-gray-400 line-through text-base mb-1">
                      {formatPrice(giaGoc)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase">
                      Giảm {phanTramGiam}%
                    </span>
                  </>
                )}
              </div>

              <div className="mb-5">
                <p className="font-semibold text-gray-800 mb-2">
                  Chọn Phân Loại:
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.bien_the &&
                    product.bien_the.map((bt) => (
                      <button
                        key={bt.id}
                        onClick={() => setSelectedVariant(bt)}
                        className={`py-2 px-2 border rounded-lg text-sm cursor-pointer font-medium flex flex-col items-center gap-1 transition ${selectedVariant?.id === bt.id ? "border-red-600 text-red-600 bg-red-50" : "border-gray-300 text-gray-700 hover:border-gray-400"}`}
                      >
                        <span>
                          {bt.dung_luong || ""}{" "}
                          {bt.mau_sac ? `- ${bt.mau_sac}` : ""}
                        </span>
                        <span className="font-bold text-xs">
                          {formatPrice(bt.gia_ban || bt.gia_goc)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="border border-red-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-red-50 text-red-600 font-bold px-4 py-2.5 flex items-center gap-2 border-b border-red-100">
                  <Icons.Box className="w-6 h-6" />
                  Khuyến mãi đi kèm
                </div>
                <div className="p-4 bg-white text-sm text-gray-700 flex flex-col gap-2.5">
                  {(() => {
                    const slug = product.danh_muc?.slug || "";
                    let promos = [
                      "Giảm giá 5% cho thành viên LTLShop",
                      "Miễn phí giao hàng toàn quốc cho đơn từ 300K",
                    ];
                    if (
                      slug.includes("dien-thoai") ||
                      slug.includes("smartphone")
                    ) {
                      promos = [
                        "Tặng gói bảo hành độc quyền LTL Care+ 12 tháng",
                        "Trợ giá thêm 2.000.000đ khi thu cũ đổi mới",
                        "Tặng ốp lưng và dán cường lực cao cấp",
                      ];
                    } else if (
                      slug.includes("laptop") ||
                      slug.includes("may-tinh")
                    ) {
                      promos = [
                        "Tặng Balo Laptop LTL cao cấp",
                        "Tặng chuột không dây chính hãng",
                        "Giảm 20% khi mua kèm tai nghe hoặc phần mềm Office",
                      ];
                    }
                    return promos.map((promo, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="bg-green-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] mt-0.5 shrink-0">
                          ✓
                        </span>
                        <span>{promo}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <p className="font-semibold text-gray-800 w-20">Số lượng:</p>
                <div className="flex items-center border border-gray-300 rounded-lg w-fit h-10 bg-white shrink-0 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 hover:bg-gray-50 h-full font-bold text-gray-500"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-10 text-center font-medium text-gray-800 outline-none bg-transparent text-sm border-x border-gray-200 h-full"
                  />
                  <button
                    onClick={() => {
                      if (selectedVariant) {
                        if (quantity < selectedVariant.ton_kho) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.warning(
                            `Chỉ còn ${selectedVariant.ton_kho} sản phẩm ở cửa hàng!`,
                          );
                        }
                      } else {
                        toast.error("Vui lòng chọn phân loại sản phẩm!");
                      }
                    }}
                    className="px-3 hover:bg-gray-50 h-full font-bold text-gray-500"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full">
                <button
                  onClick={() => {
                    handleAddToCart(true);
                  }}
                  disabled={!selectedVariant || selectedVariant.ton_kho === 0}
                  className={`flex-[1.5] text-white cursor-pointer h-12 rounded-lg font-bold transition shadow-md flex items-center justify-center ${
                    !selectedVariant || selectedVariant.ton_kho === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <span className="text-[16px]">Mua ngay</span>
                </button>
                <button
                  disabled={!selectedVariant || selectedVariant.ton_kho === 0}
                  onClick={() => {
                    handleAddToCart(false);
                  }}
                  className={`flex-1 text-white h-12 rounded-lg cursor-pointer font-bold transition flex items-center justify-center ${!selectedVariant || selectedVariant.ton_kho === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  <span className="text-[16px]">Thêm vào giỏ hàng</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="w-full md:w-8/12 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xl font-bold mb-2 text-red-600">
              Đặc điểm nổi bật
            </h3>
            <div
              className="prose max-w-none text-gray-700 text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{
                __html:
                  product.mo_ta_day_du ||
                  product.mo_ta_ngan ||
                  "Chưa có bài viết cho sản phẩm này.",
              }}
            />
          </div>

          <div className="w-full md:w-4/12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Thông số kỹ thuật
            </h3>
            <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden">
              {product.thuoc_tinh && product.thuoc_tinh.length > 0 ? (
                product.thuoc_tinh.slice(0, 6).map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex py-3 px-3 text-sm ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                  >
                    <span className="w-5/12 text-gray-500 pr-2">
                      {spec.ten_thuoc_tinh}
                    </span>
                    <span className="w-7/12 text-gray-800 font-medium">
                      {spec.gia_tri}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Chưa cập nhật thông số
                </div>
              )}
            </div>
          </div>
        </div>

        <SimilarProducts products={similarProducts} user={user} />

        {storeConfig?.cho_phep_danh_gia && (
          <div
            id="review-section"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Đánh giá sản phẩm
            </h2>
            <div className="flex flex-col lg:flex-row gap-6 border-b border-gray-100 pb-8 mb-6">
              <div className="w-full lg:w-1/3 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0">
                {avgRating > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-gray-800">
                      {avgRating}
                    </span>
                    <div className="flex text-yellow-400 text-lg my-1">
                      {"★".repeat(Math.round(avgRating))}
                      {"☆".repeat(5 - Math.round(avgRating))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {parentReviews.length} đánh giá
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 italic text-sm">
                      Chưa có đánh giá
                    </span>
                    <div className="flex text-gray-200 text-lg my-1">
                      {"☆☆☆☆☆"}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full lg:w-2/3">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Gửi đánh giá của bạn
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">
                      Bạn chấm mấy sao?
                    </span>
                    <div className="flex text-2xl cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setUserRating(star)}
                          className={`transition ${star <= userRating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Mời bạn chia sẻ cảm nhận về sản phẩm..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-24 mb-3"
                  ></textarea>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="w-full bg-[#4A44F2] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                      {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {parentReviews.length > 0 ? (
                parentReviews.slice(0, visibleCount).map((rv) => (
                  <div key={rv.id} className="border-b border-gray-50 pb-6">
                    <ReviewItem
                      rv={rv}
                      user={user}
                      onReply={() => {
                        setReplyingTo(rv.id);
                        setReplyText("");
                      }}
                      onLike={(loai) => handleToggleLike(rv.id, loai)}
                      onDelete={handleAdminDelete}
                      onHide={handleAdminHide}
                      imgError={imgError}
                      setImgError={setImgError}
                    />

                    {replyingTo === rv.id && (
                      <div className="mt-2 ml-12 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                        <textarea
                          value={replyText}
                          onChange={(e) => {
                            setReplyText(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height =
                              e.target.scrollHeight + "px";
                          }}
                          placeholder={`Trả lời ${rv.nguoi_dung?.ho_ten}...`}
                          className="w-full border-none rounded-lg p-2 text-sm outline-none focus:ring-0 resize-none min-h-[40px] max-h-32 overflow-y-auto"
                          rows={1}
                          autoFocus
                        ></textarea>
                        <div className="flex justify-end gap-2 mt-1 border-t border-gray-50 pt-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="px-3 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleReplySubmit(rv.id)}
                            disabled={isSubmittingReply || !replyText.trim()}
                            className="text-blue-600 px-4 py-1 rounded-lg text-xs font-bold hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            {isSubmittingReply ? "..." : "Gửi"}
                          </button>
                        </div>
                      </div>
                    )}

                    {allReplies.filter((rp) => rp.parent_id === rv.id).length >
                      0 && (
                      <div className="mt-2 md:ml-12">
                        {!expandedThreads[rv.id] ? (
                          <button
                            onClick={() =>
                              setExpandedThreads((prev) => ({
                                ...prev,
                                [rv.id]: true,
                              }))
                            }
                            className="flex items-center gap-2 text-xs text-blue-600 font-bold p-1.5 transition cursor-pointer"
                          >
                            Xem{" "}
                            {
                              allReplies.filter((rp) => rp.parent_id === rv.id)
                                .length
                            }{" "}
                            câu trả lời
                          </button>
                        ) : (
                          <div className="space-y-4 border-l-2 border-gray-100 pl-4 animate-in fade-in duration-300">
                            {allReplies
                              .filter((rp) => rp.parent_id === rv.id)
                              .map((reply) => (
                                <React.Fragment key={reply.id}>
                                  <ReviewItem
                                    rv={reply}
                                    user={user}
                                    isReply={true}
                                    onReply={() => {
                                      setReplyingTo(reply.id); // Hiện textarea dưới reply con
                                      setReplyText("");
                                    }}
                                    onLike={(loai) =>
                                      handleToggleLike(reply.id, loai)
                                    }
                                    onDelete={handleAdminDelete}
                                    onHide={handleAdminHide}
                                    imgError={imgError}
                                    setImgError={setImgError}
                                  />

                                  {/* Hộp thoại trả lời cho PHẢN HỒI CON */}
                                  {replyingTo === reply.id && (
                                    <div className="mt-1 ml-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => {
                                          setReplyText(e.target.value);
                                          e.target.style.height = "auto";
                                          e.target.style.height =
                                            e.target.scrollHeight + "px";
                                        }}
                                        placeholder={`Trả lời ${reply.nguoi_dung?.ho_ten}...`}
                                        className="w-full border-none rounded-lg p-2 text-sm outline-none focus:ring-0 resize-none min-h-[36px] max-h-32 overflow-y-auto"
                                        rows={1}
                                        autoFocus
                                      ></textarea>
                                      <div className="flex justify-end gap-2 mt-1 border-t border-gray-50 pt-2">
                                        <button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText("");
                                          }}
                                          className="px-3 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleReplySubmit(rv.id)
                                          }
                                          disabled={
                                            isSubmittingReply ||
                                            !replyText.trim()
                                          }
                                          className="text-blue-600 px-4 py-1 rounded-lg text-xs font-bold hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed transition cursor-pointer"
                                        >
                                          Gửi
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              ))}
                            <button
                              onClick={() =>
                                setExpandedThreads((prev) => ({
                                  ...prev,
                                  [rv.id]: false,
                                }))
                              }
                              className="text-xs text-gray-400 hover:text-blue-600 font-medium transition pl-2 cursor-pointer"
                            >
                              Ẩn bớt
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 italic">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                  </p>
                </div>
              )}

              {/* Nút Xem thêm đánh giá gốc */}
              {parentReviews.length > visibleCount && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="px-8 py-2.5 border border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50 transition active:scale-95 shadow-sm"
                  >
                    Xem thêm đánh giá ({parentReviews.length - visibleCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* ================= MODAL CHIA SẺ ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 flex flex-col shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                Chia sẻ sản phẩm
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-red-500 text-3xl leading-none  cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-4 justify-center mb-6 border-y border-gray-100 py-6">
              <button
                onClick={() =>
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
                    "_blank",
                  )
                }
                className="w-12 h-12 bg-[#1877F2] text-white rounded-full flex items-center justify-center font-bold text-2xl hover:opacity-80 transition cursor-pointer"
                title="Chia sẻ lên Facebook"
              >
                f
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://zalo.me/share?url=${window.location.href}`,
                    "_blank",
                  )
                }
                className="w-12 h-12 bg-[#0068FF] text-white rounded-full flex items-center justify-center font-bold text-[14px] hover:opacity-80 transition cursor-pointer"
                title="Chia sẻ qua Zalo"
              >
                Zalo
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?url=${window.location.href}`,
                    "_blank",
                  )
                }
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl hover:opacity-80 transition cursor-pointer"
                title="Chia sẻ lên X"
              >
                X
              </button>
            </div>

            <p className="text-sm text-gray-500 font-medium mb-2">
              Hoặc sao chép liên kết:
            </p>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-10">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 bg-transparent px-3 text-sm text-gray-600 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 h-full font-semibold text-sm transition  cursor-pointer"
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GỌI MODAL ================= */}
      <SpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        specs={product.thuoc_tinh || []}
      />
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        currentProduct={product}
      />
    </div>
  );
};

export default ProductDetail;
