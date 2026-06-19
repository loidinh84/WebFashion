import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BASE_URL from "../config/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast, { Toaster } from "react-hot-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!token) {
      toast.error("Không tìm thấy mã bảo mật khôi phục mật khẩu!");
    }
  }, [token]);

  useEffect(() => {
    if (success) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Yêu cầu không hợp lệ. Vui lòng kiểm tra lại liên kết trong email.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải chứa ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/taikhoan/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Đặt lại mật khẩu thành công!");
        setSuccess(true);
      } else {
        toast.error(data.message || "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex flex-col font-sans">
      <Header />
      <Toaster position="top-center" />
      
      <main className="flex-grow flex flex-col items-center justify-end p-4 pt-12 pb-24 lg:pb-8">
        <div className="max-w-[600px] w-full bg-white shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12 relative overflow-hidden">
          {/* Decorative colored strip at the top */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#e31e24] to-[#b91c1c]" />

          {success ? (
            <div className="text-center py-8 animate-fadeIn">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-md">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">
                Đặt lại thành công!
              </h2>
              <p className="text-gray-600 text-base mb-8 max-w-sm mx-auto leading-relaxed font-medium">
                Mật khẩu của bạn đã được cập nhật thành công. Hệ thống sẽ tự động đưa bạn trở lại trang đăng nhập sau{" "}
                <span className="text-[#e31e24] font-bold text-xl px-1.5 py-0.5 bg-red-50 rounded-md border border-red-100">{countdown}s</span>
              </p>

              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#e31e24] hover:bg-red-700 text-white font-bold rounded-xl transition duration-200 text-base uppercase shadow-lg shadow-red-500/10"
              >
                Chuyển hướng ngay
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <h2 className="text-center text-2xl sm:text-3xl font-bold uppercase mb-4 text-gray-800 tracking-tight">
                Đặt lại mật khẩu mới
              </h2>
              <p className="text-center text-gray-500 text-base mb-8 max-w-md mx-auto leading-relaxed font-medium">
                Nhập mật khẩu mới cho tài khoản của bạn. Đảm bảo mật khẩu mạnh và dễ nhớ.
              </p>

              {!token ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl mb-8">
                  <div className="flex gap-3">
                    <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-red-800 font-bold text-base mb-1">Thiếu liên kết bảo mật</h4>
                      <p className="text-red-700 text-sm leading-relaxed font-medium">
                        Có vẻ như bạn đã truy cập trực tiếp vào trang này hoặc liên kết không có mã bảo mật hợp lệ.
                        Vui lòng quay lại trang đăng nhập và chọn "Quên mật khẩu" để nhận liên kết mới.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => navigate("/login")}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all rounded-lg"
                        placeholder="Nhập ít nhất 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all rounded-lg"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#e31e24] hover:bg-red-700 text-white font-bold py-4 px-4 transition duration-200 text-base uppercase rounded-lg shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận mật khẩu mới"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
