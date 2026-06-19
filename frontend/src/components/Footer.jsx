import React, { useContext } from "react";
import Logo from "../assets/images/logo.png";
import { StoreContext } from "../context/StoreContext";
import * as Images from "../assets/images/index";
import * as Icons from "../assets/icons/index";

const Footer = () => {
  const { storeConfig } = useContext(StoreContext);

  return (
    <footer className="hidden md:block bg-[#568FDE] text-white font-sans">
      {/* --- PHẦN NỘI DUNG CHÍNH --- */}
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Cột 1: Liên hệ hỗ trợ */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Liên hệ hỗ trợ miễn phí
            </h3>
            <ul className="text-sm space-y-3">
              <li>
                Mua hàng - bảo hành -{" "}
                <span className="hover:underline cursor-pointer">
                  {storeConfig?.so_dien_thoai || "0123456789"}
                </span>
              </li>
              <li>
                Khiếu nại -{" "}
                <span className="hover:underline cursor-pointer">
                  {storeConfig?.so_dien_thoai || "0123456789"}
                </span>
              </li>
              <li>
                Chăm sóc khách hàng -{" "}
                <span className="hover:underline cursor-pointer">
                  {storeConfig?.so_dien_thoai || "0123456789"}
                </span>
              </li>
              <li>
                Gmail:{" "}
                <a
                  href="mailto:dinhhoangloibt@gmail.com"
                  className="text-[#201D8A] font-semibold hover:underline"
                >
                  {storeConfig?.email || "admin@gmail.com"}
                </a>
              </li>
            </ul>
            <img
              src={Logo}
              alt="LTL Shop Logo"
              className="mt-4 w-30 object-contain cursor-pointer hover:opacity-90 transition"
            />
          </div>

          {/* Cột 2: Thông tin về chính sách */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Thông tin về chính sách
            </h3>
            <ul className="text-sm space-y-3">
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Mua hàng và thanh toán Online
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Mua hàng trả góp Online
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Chính sách giao hàng
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Chính sách đổi trả
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Tra thông tin bảo hành
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Tra cứu hóa đơn điện tử
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Thông tin hóa đơn mua hàng
              </li>
            </ul>
          </div>

          {/* Cột 3: Dịch vụ và thông tin khác */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Dịch vụ và thông tin khác
            </h3>
            <ul className="text-sm space-y-3">
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Khách hàng doanh nghiệp (B2B)
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Ưu đãi thanh toán
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Chính sách bảo mật thông tin cá nhân
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Chính sách bảo hành
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                Liên hệ hợp tác kinh doanh
              </li>
              <li className="cursor-pointer hover:text-gray-200 transition hover:underline">
                So sánh sản phẩm
              </li>
            </ul>
          </div>

          {/* Cột 4: Kết nối mạng xã hội */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Kết nối với {storeConfig?.ten_cua_hang || "Cửa hàng của bạn"}
            </h3>
            <div className="flex items-center gap-3">
              {storeConfig?.facebook_url && (
                <a
                  href={storeConfig.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={Images.Facebook}
                    alt="Facebook"
                    className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                  />
                </a>
              )}
              {storeConfig?.tiktok_url && (
                <a
                  href={storeConfig.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={Images.TikTok}
                    alt="TikTok"
                    className="w-11 h-11 cursor-pointer hover:scale-110 transition-transform"
                  />
                </a>
              )}
              {storeConfig?.instagram_url && (
                <a
                  href={storeConfig.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={Images.Instagram}
                    alt="Instagram"
                    className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform"
                  />
                </a>
              )}
              {storeConfig?.zalo && (
                <a href={storeConfig.zalo} target="_blank" rel="noreferrer">
                  <img
                    src={Images.Zalo}
                    alt="Zalo"
                    className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                  />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Copyright --- */}
      <div className="bg-[#497BC5] py-4 text-center text-sm">
        <div className="w-full max-w-7xl mx-auto px-4">
          <p>
            Nhóm 5 thuộc học phần Đồ án cơ sở với 3 thành viên tham gia: Đinh
            Thành Lợi - 2380601285. Vũ Thái Tài - 2380601285. Đỗ khắc levis -
            2380601285
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
