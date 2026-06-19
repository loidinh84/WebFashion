import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MembershipCarousel from "../components/UserProfileTabs/MembershipCarousel";
import BASE_URL from "../config/api";
import * as Icons from "../assets/icons";
import Overview from "../components/UserProfileTabs/Overview";
import ProfileTab from "../components/UserProfileTabs/Profile";
import OrdersTab from "../components/UserProfileTabs/OrderHistories";
import WishlistTab from "../components/UserProfileTabs/Wishlist";
import ShopFeedback from "../components/UserProfileTabs/ShopFeedback";

const UserProfile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileData, setProfileData] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "overview",
  );
  const [showTabContentMobile, setShowTabContentMobile] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      if (window.innerWidth < 1024) setShowTabContentMobile(true);
    }
  }, [location.state]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) setShowTabContentMobile(true);
  };

  const handleBackToMenu = () => {
    setShowTabContentMobile(false);
  };

  const handleRemoveFromWishlist = (productId) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => item.san_pham.id !== productId),
    );
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/taiKhoan/dashboard/${user.id}`,
      );
      const data = await response.json();
      setProfileData(data);
      if (updateUser && data.userInfo) {
        updateUser({
          ho_ten: data.userInfo.ho_ten,
          so_dien_thoai: data.userInfo.so_dien_thoai,
          anh_dai_dien: data.userInfo.anh_dai_dien,
          diem_tich_luy: data.userInfo.diem_tich_luy || 0,
          mau_the: data.userInfo.hang_thanh_vien?.mau_the || "#9ca3af",
          ty_le_giam_gia: data.userInfo.hang_thanh_vien?.ty_le_giam_gia || 0,
          ten_hang: data.userInfo.hang_thanh_vien?.ten_hang,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchProfile();
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const wishRes = await fetch(
          `${BASE_URL}/api/wishlist/user/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (wishRes.ok) {
          const wishData = await wishRes.json();
          setWishlist(wishData);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id) {
      initData();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất tài khoản!");
    setTimeout(() => navigate("/login"), 1000);
  };

  const [totalSpent, setTotalSpent] = useState(0);
  const [currentRank, setCurrentRank] = useState({
    name: "S-NULL",
    min: 0,
    next: "S-NEW",
    target: 3000000,
  });

  useEffect(() => {
    if (profileData?.userInfo && profileData?.allMemberships) {
      const spent = Number(profileData.userInfo.tong_chi_tieu) || 0;
      setTotalSpent(spent);

      // Tìm hạng hiện tại dựa trên ID hạng của user
      const memberships = profileData.allMemberships;
      const currentIdx = memberships.findIndex(
        (m) => m.id === profileData.userInfo.the_thanh_vien_id,
      );

      if (currentIdx !== -1) {
        const current = memberships[currentIdx];
        const next = memberships[currentIdx + 1];

        setCurrentRank({
          name: current.ten_hang,
          min: current.muc_chi_tieu_tu || 0,
          next: next ? next.ten_hang : "MAX",
          target: next
            ? next.muc_chi_tieu_tu
            : current.muc_chi_tieu_den || current.muc_chi_tieu_tu,
        });
      }
    }
  }, [profileData]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Math.round(price || 0));
  };

  const menuItems = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: <Icons.Home className="w-5 h-5" />,
      className: "hidden lg:flex",
    },
    {
      id: "orders",
      label: "Lịch sử mua hàng",
      icon: <Icons.Bill className="w-5 h-5" />,
    },
    {
      id: "profile",
      label: "Thông tin tài khoản",
      icon: <Icons.User className="w-5 h-5" />,
    },
    {
      id: "feedback",
      label: "Góp ý - Phản hồi",
      icon: <Icons.Comment className="w-5 h-5" />,
    },
    {
      id: "wishlist",
      label: "Sản phẩm yêu thích",
      icon: <Icons.Favorite className="w-5 h-5" />,
    },
    {
      id: "CardMember",
      label: "Thẻ thành viên và ưu đãi",
      icon: <Icons.Discount className="w-5 h-5" />,
    },
  ];

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans flex flex-col">
      <Header />
      <Toaster position="top-center" />

      <main className="container mx-auto max-w-7xl py-2 lg:py-4 px-3 flex-grow">
        {showTabContentMobile && (
          <div className="lg:hidden flex items-center  gap-3 mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100 ">
            <button
              onClick={handleBackToMenu}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icons.ArrowLeftLong className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="font-bold text-gray-800 text-lg ">
              {menuItems.find((item) => item.id === activeTab)?.label}
            </h1>
          </div>
        )}

        {/* HEADER CARD - ẨN KHI ĐANG XEM TAB TRÊN MOBILE */}
        <div
          className={`${showTabContentMobile ? "hidden lg:block" : "block"} bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 p-4 lg:p-6 mb-2`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            {/* Avatar & Thông tin cơ bản */}
            <div className="flex items-center gap-4 lg:w-1/3">
              <div className="relative">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-red-50 shadow-sm">
                  <img
                    src={
                      user?.anh_dai_dien?.startsWith("http")
                        ? user.anh_dai_dien
                        : user?.anh_dai_dien
                          ? `${BASE_URL}${user.anh_dai_dien}`
                          : `https://ui-avatars.com/api/?name=${user?.ho_ten || user?.so_dien_thoai || "U"}&background=random`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-100"></div>
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="font-bold text-gray-900 text-lg lg:text-xl leading-tight">
                  {user?.ho_ten || "Khách hàng"}
                </h2>
                <p className="text-gray-500 text-[13px] font-medium flex items-center gap-1">
                  <Icons.Phone className="w-3 h-3 text-gray-400" />
                  {user?.so_dien_thoai || "Chưa có SĐT"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                    {currentRank.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Thẻ thống kê nhanh */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="bg-red-50/50 p-3 lg:p-2 rounded-lg flex items-center gap-3 border border-red-100/50">
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-white text-red-500 rounded-lg flex items-center justify-center  shrink-0">
                  <Icons.Bill className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm lg:text-xl font-bold text-gray-800 leading-none truncate">
                    {profileData?.orderCount || 0}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-500 font-medium truncate">
                    Tổng đơn hàng
                  </p>
                </div>
              </div>

              <div className="bg-orange-50/50 p-3 lg:p-2 rounded-lg flex items-center gap-3 border border-orange-100/50">
                <div className="w-7 h-7 lg:w-8 lg:h-8 bg-white text-orange-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <Icons.Discount className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm lg:text-xl font-bold text-gray-800 leading-none truncate">
                    {new Intl.NumberFormat("vi-VN").format(profileData?.userInfo?.diem_tich_luy || 0)}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-500 font-medium truncate">
                    Điểm tích lũy
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar thăng hạng */}
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-600 font-medium">
                {currentRank.next === "MAX" ? (
                  <span>
                    Bạn đã đạt hạng cao nhất{" "}
                    <span className="font-bold text-gray-900">
                      {currentRank.name}
                    </span>
                  </span>
                ) : (
                  <span>
                    Cần chi tiêu thêm{" "}
                    <span className="font-bold text-gray-800">
                      {formatPrice(currentRank.target - totalSpent)}
                    </span>{" "}
                    để lên hạng{" "}
                    <span className="font-bold text-gray-800">
                      {currentRank.next}
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-3">
          <div
            className={`${showTabContentMobile ? "hidden lg:block" : "block"} w-full  lg:w-[280px] shrink-0`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-lg items-center justify-between cursor-pointer transition-all mb-1 ${item.className || "flex"} ${activeTab === item.id
                    ? "lg:text-blue-600 lg:bg-blue-50/80 lg:font-bold lg:shadow-sm text-gray-600"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-transform duration-300 ${activeTab === item.id ? "scale-110" : ""}`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[14px]">{item.label}</span>
                  </div>
                  <Icons.ArrowForward
                    className={`w-3.5 h-3.5 opacity-30 lg:${activeTab === item.id ? "opacity-100 -translate-x-1" : "opacity-30"} transition-all`}
                  />
                </button>
              ))}
              <div className="my-1.5 px-4 italic h-px bg-gray-100 mx-2"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-3 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-between transition-all font-bold text-[14px] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Đăng xuất</span>
                </div>
                <Icons.ArrowForward className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          <div
            className={`${showTabContentMobile ? "block" : "hidden lg:block"} w-full lg:flex-1 min-w-0 flex flex-col gap-4 lg:gap-6`}
          >
            {/* TỔNG QUAN */}
            {activeTab === "overview" && (
              <Overview
                profileData={profileData}
                wishlist={wishlist}
                onRemoveWishlistItem={handleRemoveFromWishlist}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  if (window.innerWidth < 1024) setShowTabContentMobile(true);
                }}
                navigate={navigate}
              />
            )}

            {/* TAB: THẺ THÀNH VIÊN */}
            {activeTab === "CardMember" && (
              <MembershipCarousel
                memberships={profileData?.allMemberships || []}
                userInfo={profileData?.userInfo}
              />
            )}

            {/* TAB 2: THÔNG TIN TÀI KHOẢN */}
            {activeTab === "profile" && (
              <ProfileTab
                profileData={profileData}
                onProfileUpdated={fetchProfile}
                onLogout={handleLogout}
              />
            )}

            {/* TAB 3: LỊCH SỬ MUA HÀNG */}
            {activeTab === "orders" && (
              <OrdersTab profileData={profileData} navigate={navigate} />
            )}

            {/* TAB 4: GÓP Ý PHẢN HỒI */}
            {activeTab === "feedback" && <ShopFeedback />}

            {/* TAB 5: SẢN PHẨM YÊU THÍCH */}
            {activeTab === "wishlist" && (
              <WishlistTab
                wishlist={wishlist}
                onRemoveWishlistItem={handleRemoveFromWishlist}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
