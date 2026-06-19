import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import BASE_URL from "../../config/api";
import Swal from "sweetalert2";

const ShopFeedback = () => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States cho lịch sử và chỉnh sửa
  const [myReviews, setMyReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMyReviews = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/danh-gia-shop/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReviews(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách đánh giá:", error);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/danh-gia-shop`,
        { so_sao: rating, noi_dung: content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Cảm ơn bạn đã gửi góp ý cho shop!");
      setContent("");
      setRating(5);
      fetchMyReviews(); // Tải lại danh sách
    } catch (error) {
      console.error("Lỗi gửi góp ý:", error);
      toast.error("Không thể gửi góp ý lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.so_sao);
    setEditContent(review.noi_dung);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditContent("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý!");
      return;
    }

    setIsUpdating(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/danh-gia-shop/${editingId}`,
        { so_sao: editRating, noi_dung: editContent },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Cập nhật góp ý thành công!");
      setEditingId(null);
      fetchMyReviews();
    } catch (error) {
      console.error("Lỗi cập nhật góp ý:", error);
      toast.error("Không thể chỉnh sửa lúc này!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa góp ý này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy bỏ",
    });

    if (!result.isConfirmed) return;

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/danh-gia-shop/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa góp ý!");
      fetchMyReviews();
    } catch (error) {
      console.error("Lỗi xóa góp ý:", error);
      toast.error("Không thể xóa góp ý lúc này!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Form gửi phản hồi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Góp ý & Phản hồi
          </h2>
          <p className="text-sm text-gray-500">
            Mọi ý kiến của bạn đều giúp cửa hàng hoàn thiện hơn mỗi ngày.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Chọn số sao */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Bạn đánh giá thế nào về trải nghiệm dịch vụ của shop?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    rating >= star
                      ? "text-yellow-400 bg-yellow-50"
                      : "text-gray-300 bg-gray-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nội dung chi tiết
            </label>
            <textarea
              rows="5"
              placeholder="Hãy chia sẻ ý kiến hoặc góp ý của bạn tại đây..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi góp ý ngay"}
          </button>
        </form>
      </div>

      {/* Lịch sử góp ý */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
          Góp ý của bạn
        </h3>

        {myReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-3 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">Bạn chưa gửi góp ý nào cho cửa hàng.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-100 rounded-xl p-4 md:p-5 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                {editingId === review.id ? (
                  /* Form chỉnh sửa inline */
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">
                        Chỉnh sửa góp ý
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={`edit-star-${star}`}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-6 w-6 transition-all ${
                                editRating >= star
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20; fill=currentColor"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows="3"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isUpdating ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Hiển thị bình thường */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Hiển thị sao */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={`display-star-${review.id}-${star}`}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              review.so_sao >= star
                                ? "text-yellow-400"
                                : "text-gray-200"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed py-1">
                      {review.noi_dung}
                    </p>

                    <div className="flex gap-3 justify-end pt-1">
                      <button
                        onClick={() => handleStartEdit(review)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopFeedback;
