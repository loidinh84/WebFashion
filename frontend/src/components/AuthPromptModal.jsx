import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StoreContext } from "../context/StoreContext";
import * as Icons from "../assets/icons/index";

const PROMPT_DELAY_MS = 15000;
const DISMISSED_KEY = "auth_prompt_dismissed";

const AuthPromptModal = () => {
  const { user } = useContext(AuthContext);
  const { storeConfig } = useContext(StoreContext);
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user) return;

    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setShow(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const goTo = (path) => {
    dismiss();
    navigate(path);
  };

  if (!show) return null;

  const storeName = storeConfig?.ten_cua_hang || "Cửa hàng";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={dismiss}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[modalIn_0.35s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-2xl rounded-full flex items-center justify-center text-white hover:text-gray-400 transition z-10 cursor-pointer"
        >
          &times;
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-700 px-8 py-3 text-center text-white">
          <h2 className="text-2xl font-bold">Chào bạn!</h2>
          <p className="text-white/90 text-sm leading-relaxed">
            Hãy gia nhập thành viên của{" "}
            <span className="font-bold text-white">{storeName}</span>
          </p>
        </div>

        {/* Nội dung */}
        <div className="px-6 py-3">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <Icons.Tick />
              </span>
              Theo dõi đơn hàng dễ dàng
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <Icons.Tick />
              </span>
              Tích điểm & nhận ưu đãi thành viên
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <Icons.Tick />
              </span>
              Đánh giá sản phẩm & nhận voucher
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => goTo("/register")}
              className="w-full py-2.5 border-2 border-blue-100 hover:border-[#4A44F2] text-gray-700 hover:text-[#4A44F2] font-bold rounded-xl transition-all cursor-pointer text-sm bg-blue-50"
            >
              Đăng ký ngay
            </button>
            <button
              onClick={() => goTo("/login")}
              className="w-full py-2.5 border-2 border-blue-100 hover:border-[#4A44F2] text-gray-700 hover:text-[#4A44F2] font-bold rounded-xl transition-all cursor-pointer text-sm bg-blue-50"
            >
              Đăng nhập lại
            </button>
          </div>

          <p
            onClick={dismiss}
            className="text-center text-xs text-gray-600 my-2 hover:underline hover:text-blue-500 cursor-pointer transition"
          >
            Để sau, tôi muốn tiếp tục xem sản phẩm
          </p>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AuthPromptModal;
