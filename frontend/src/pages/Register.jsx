import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import * as Icons from "../assets/icons/index";
import BASE_URL from "../config/api";
import toast, { Toaster } from "react-hot-toast";
import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    rePassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hàm xử lý cập nhật state khi người dùng gõ phím
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Hàm xử lý đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) return toast.error("Vui lòng nhập họ tên!");

    if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone))
      return toast.error("Số điện thoại không hợp lệ!");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return toast.error("Email không đúng định dạng!");

    if (formData.password.length < 6)
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");

    if (formData.password !== formData.rePassword)
      return toast.error("Mật khẩu nhập lại không khớp!");
    setLoading(true);

    try {
      // Gửi dữ liệu xuống Backend
      const response = await fetch(`${BASE_URL}/api/taikhoan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ho_ten: formData.fullName,
          so_dien_thoai: formData.phone,
          email: formData.email,
          mat_khau: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Lỗi gọi API đăng ký: ", error);
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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Đăng nhập Google thành công!");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Đăng nhập Google thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex flex-col font-sans">
      <Header />
      <Toaster position="top-center" reverseOrder={false} />

      <main className="flex-grow flex flex-col items-center justify-end p-4 pt-12 pb-24 lg:pb-8">
        <div className="max-w-[600px] w-full bg-white shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12">
          <h2 className="text-center text-2xl sm:text-3xl font-bold uppercase mb-8 sm:mb-10 text-gray-800 tracking-tight">
            Đăng ký tài khoản
          </h2>

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Họ và Tên<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Số điện thoại<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Email<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                placeholder="Nhập địa chỉ email"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Mật khẩu<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                  placeholder="Nhập mật khẩu"
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.EyeOn />}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Nhập lại mật khẩu<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showRePassword ? "text" : "password"}
                  name="rePassword"
                  value={formData.rePassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-3.5 focus:outline-none focus:border-blue-500 text-base transition-colors"
                  placeholder="Xác nhận lại mật khẩu"
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors text-gray-500"
                  onClick={() => setShowRePassword(!showRePassword)}
                >
                  {showRePassword ? <Icons.EyeOff /> : <Icons.EyeOn />}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e31e24] text-white font-bold py-4 px-4 hover:bg-red-700 transition duration-200 text-base uppercase shadow-sm"
              >
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-base">
                <span className="px-4 bg-white text-gray-500">
                  Hoặc đăng ký bằng
                </span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center cursor-pointer justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-4 hover:bg-gray-50 transition duration-200 text-base shadow-sm uppercase cursor-not-allowed"
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

          <div className="mt-2 pt-6 border-t border-gray-100 text-center">
            <a
              href="/login"
              className="text-base text-[#4631fe] uppercase font-bold transition-colors underline underline-offset-4"
            >
              Bạn đã có sẵn tài khoản
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
