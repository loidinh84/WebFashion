import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import BASE_URL from "../config/api";
import { StoreContext } from "../context/StoreContext";

const ShopReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { storeConfig } = useContext(StoreContext);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/danh-gia-shop/top`);
        setReviews(res.data.reviews || []);
        setTotalUsers(res.data.totalUsers || 0);
      } catch (error) {
        console.error("Lỗi lấy đánh giá shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const getRandomColor = (name) => {
    const colors = ["bg-blue-500", "bg-pink-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 my-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-8 my-2 md:my-8">
      {/* Tiêu đề */}
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Khách hàng nói gì về {storeConfig?.ten_cua_hang || "Shop"}
        </h2>
        <p className="text-sm text-gray-500">
          Hơn {totalUsers.toLocaleString("vi-VN")}+ khách hàng đã tin tưởng và đồng hành cùng chúng tôi
        </p>
      </div>

      {/* Lưới Đánh giá - Hỗ trợ cuộn ngang nếu nhiều */}
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x no-scrollbar">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-[#F8F9FA] rounded-xl p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col h-full min-w-[260px] md:min-w-[350px] snap-center"
          >
            {/* Header: Avatar + Tên + Sao */}
            <div className="flex items-center gap-4 mb-4">
              {review.nguoi_dung?.anh_dai_dien ? (
                <img 
                  src={`${BASE_URL}${review.nguoi_dung.anh_dai_dien}`} 
                  alt={review.nguoi_dung.ho_ten}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${getRandomColor(review.nguoi_dung?.ho_ten)}`}
                >
                  {review.nguoi_dung?.ho_ten?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-800 text-sm">
                  {review.nguoi_dung?.ho_ten || "Khách hàng"}
                </h4>
                <div className="flex text-yellow-400 text-sm my-0.5">
                  {[...Array(review.so_sao)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Nội dung đánh giá */}
            <div className="text-gray-600 text-sm italic flex-grow">
              "{review.noi_dung}"
            </div>

            {/* Ngày tháng */}
            <div className="mt-4 text-right text-xs text-gray-400 font-medium">
              {new Date(review.created_at).toLocaleDateString("vi-VN")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopReviews;
