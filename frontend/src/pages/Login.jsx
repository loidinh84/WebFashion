import React, { useState, useContext } from "react";
import BASE_URL from "../config/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import * as Icons from "../assets/icons/index";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";
import { syncLocalCartWithDb } from "../utils/cartHelper";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/taikhoan/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, mat_khau: password, rememberMe: rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token, rememberMe);
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        // Đồng bộ giỏ hàng từ localStorage lên DB
        await syncLocalCartWithDb();

        if (data.user.vai_tro === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Gửi thông tin Google xuống backend
      const response = await fetch(`${BASE_URL}/api/taikhoan/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          ho_ten: googleUser.displayName,
          anh_dai_dien: googleUser.photoURL,
          rememberMe: rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token, rememberMe);

        // Đồng bộ giỏ hàng từ localStorage lên DB
        await syncLocalCartWithDb();

        toast.success("Đăng nhập Google thành công!");
        navigate(data.user.vai_tro === "admin" ? "/admin" : "/");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Đăng nhập Google thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Vui lòng nhập địa chỉ email!");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/taikhoan/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Đã gửi liên kết khôi phục!");
        setShowForgotModal(false);
        setForgotEmail("");
      } else {
        toast.error(data.message || "Lỗi khi yêu cầu đặt lại mật khẩu!");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex flex-col font-sans">
      <Header />
      <Toaster position="top-center" />
      <main className="flex-grow flex flex-col items-center justify-end p-4 pt-12 pb-24 lg:pb-8">
        <div className="max-w-[600px] w-full bg-white shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12">
          <h2 className="text-center text-2xl sm:text-3xl font-bold uppercase mb-8 sm:mb-10 text-gray-800 tracking-tight">
            Đăng nhập tài khoản
          </h2>

          <form className="space-y-7" onSubmit={handleLogin}>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Email / Số điện thoại
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                placeholder="Nhập email hoặc số điện thoại"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Mật khẩu<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.EyeOn />}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 text-[#e31e24] border-gray-300 rounded focus:ring-[#e31e24] cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-3 text-base text-gray-600 font-medium hover:text-gray-800 transition-colors cursor-pointer select-none"
                >
                  Duy trì đăng nhập
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-base text-blue-600 hover:text-blue-800 hover:underline italic font-medium transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                Quên mật khẩu?
              </button>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#e31e24] text-white font-bold py-4 px-4 hover:bg-red-700 transition duration-200 text-base uppercase shadow-sm"
              >
                {loading ? "Đang vào..." : "Đăng nhập"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 text-base">
                  Hoặc đăng nhập bằng
                </span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-4 hover:bg-gray-50 transition duration-200 text-base shadow-sm uppercase"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                GOOGLE
              </button>
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-gray-100 text-center">
            <a
              href="/register"
              className="text-base text-[#e31e24] hover:text-red-700 uppercase font-bold transition-colors underline underline-offset-4"
            >
              ĐĂNG KÝ TÀI KHOẢN Ở ĐÂY
            </a>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 transition-all duration-300 animate-fadeIn">
          <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all scale-100 animate-slideUp">
            {/* Top color accent strip */}
            <div className="h-2 bg-gradient-to-r from-[#e31e24] to-[#b91c1c]" />

            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotEmail("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 sm:p-10">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#e31e24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                Khôi phục mật khẩu
              </h3>
              <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed font-medium">
                Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi một liên kết an toàn để đặt lại mật khẩu mới.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="example@domain.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e31e24]/20 focus:border-[#e31e24] text-base transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotEmail("");
                    }}
                    className="flex-1 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center text-base"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3.5 bg-[#e31e24] text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-red-500/10 disabled:opacity-75"
                  >
                    {forgotLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      "Gửi liên kết"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Login;
