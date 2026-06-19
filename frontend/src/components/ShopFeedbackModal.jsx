import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import BASE_URL from "../config/api";

const ShopFeedbackModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi góp ý!");
        return;
      }

      await axios.post(
        `${BASE_URL}/api/danh-gia-shop`,
        { so_sao: rating, noi_dung: content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Cảm ơn bạn đã gửi góp ý cho shop!");
      setContent("");
      setRating(5);
      onClose();
    } catch (error) {
      console.error("Lỗi gửi góp ý:", error);
      toast.error("Không thể gửi góp ý lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-blue-600 px-4 py-2 text-white relative">
          <button
            onClick={onClose}
            className="absolute text-2xl top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold">Góp ý & Khiếu nại</h2>
          <p className="text-blue-100 text-sm mt-1">
            Chúng tôi luôn lắng nghe ý kiến của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
              Trải nghiệm của bạn thế nào?
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer   ${
                    rating >= star
                      ? "text-yellow-400 bg-yellow-50"
                      : "text-gray-300 bg-gray-50"
                  } active:scale-95`}
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

          <div>
            <textarea
              rows="4"
              placeholder="Bạn hãy chia sẻ ý kiến hoặc phản hồi tại đây nhé..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
            >
              Để sau
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopFeedbackModal;
