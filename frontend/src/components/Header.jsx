import React, { useState, useEffect, useRef, useContext } from "react";
import * as Icons from "../assets/icons/index";
import Logo from "../assets/images/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BASE_URL from "../config/api";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const [storeConfig, setStoreConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const categoryMenuRef = useRef(null);
  const [brands, setBrands] = useState({});
  const [cart, setCart] = useState([]);
  const [activeMobileCategory, setActiveMobileCategory] = useState(null);
  const mobileContentRef = useRef(null);

  useEffect(() => {
    if (mobileContentRef.current) {
      mobileContentRef.current.scrollTo(0, 0);
    }
  }, [activeMobileCategory]);

  const fetchBrandsForCategory = async (categoryId) => {
    if (brands[categoryId]) return;
    try {
      const bRes = await fetch(
        `${BASE_URL}/api/sanPham/thuong-hieu/${categoryId}`,
      );
      if (bRes.ok) {
        const bData = await bRes.json();
        setBrands((prev) => ({ ...prev, [categoryId]: bData }));
      }
    } catch (err) {
      console.error("Lỗi tải thương hiệu:", err);
    }
  };

  useEffect(() => {
    const fetchCart = () => {
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(savedCart);
    };
    fetchCart();

    window.addEventListener("storage", fetchCart);
    window.addEventListener("cartUpdated", fetchCart);

    return () => {
      window.removeEventListener("storage", fetchCart);
      window.removeEventListener("cartUpdated", fetchCart);
    };
  }, []);

  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/store-settings`);
        const result = await response.json();
        if (result.success) {
          setStoreConfig(result.data);
        }
      } catch (error) {
        console.error("Lỗi tải cấu hình cửa hàng:", error);
      }
    };
    fetchStoreConfig();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/sanPham/danhMuc-sidebar`);
        if (res.ok) {
          let flatData = await res.json();
          const lookup = {};
          flatData.forEach((cat) => {
            lookup[cat.id] = { ...cat, children: [] };
          });

          const roots = [];
          flatData.forEach((cat) => {
            if (cat.danh_muc_cha_id) {
              if (lookup[cat.danh_muc_cha_id]) {
                lookup[cat.danh_muc_cha_id].children.push(lookup[cat.id]);
              }
            } else {
              roots.push(lookup[cat.id]);
            }
          });

          const grouped = {};
          roots.forEach((root) => {
            const order = parseInt(root.thu_tu, 10) || 0;
            if (!grouped[order]) grouped[order] = [];
            grouped[order].push(root);
          });

          const sortedGroups = Object.keys(grouped)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((orderKey) => {
              return grouped[orderKey].sort((a, b) => {
                const nameA = (a.ten_danh_muc || "").trim().toLowerCase();
                const nameB = (b.ten_danh_muc || "").trim().toLowerCase();
                return nameA.localeCompare(nameB, "vi");
              });
            });

          setCategoryGroups(sortedGroups);
          if (sortedGroups.length > 0) {
            setActiveMobileCategory(sortedGroups[0][0]);
          }

          flatData.forEach(async (cat) => {
            if (!cat.danh_muc_cha_id) {
              try {
                const bRes = await fetch(
                  `${BASE_URL}/api/sanPham/thuong-hieu/${cat.id}`,
                );
                if (bRes.ok) {
                  const bData = await bRes.json();
                  setBrands((prev) => ({ ...prev, [cat.id]: bData }));
                }
              } catch (err) {
                console.error("Lỗi tải trước thương hiệu:", err);
              }
            }
          });
        }
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const mobileMenuRef = useRef(null);
  const categoryToggleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop =
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target);
      const isOutsideMobile =
        mobileMenuRef.current && !mobileMenuRef.current.contains(event.target);
      const isOutsideToggle =
        categoryToggleRef.current &&
        !categoryToggleRef.current.contains(event.target);

      // Chỉ đóng nếu click ra ngoài cả Desktop Menu, Mobile Menu và nút Toggle
      if (isOutsideDesktop && isOutsideMobile && isOutsideToggle) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsScrolled(false);
      } else if (currentScrollY > lastScrollY.current + 8) {
        setIsScrolled(true);
      } else if (currentScrollY < lastScrollY.current - 8) {
        setIsScrolled(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHoverGroup = (group) => {
    group.forEach(async (parent) => {
      if (!brands[parent.id]) {
        try {
          const res = await fetch(
            `${BASE_URL}/api/sanPham/thuong-hieu/${parent.id}`,
          );
          if (res.ok) {
            const data = await res.json();
            setBrands((prev) => ({ ...prev, [parent.id]: data }));
          }
        } catch (error) {
          console.error(
            `Lỗi tải thương hiệu cho danh mục ${parent.id}:`,
            error,
          );
        }
      }
    });
  };

  const renderCategoryIcon = (categoryName, className) => {
    const name = (categoryName || "").toLowerCase();

    if (name.includes("điện thoại"))
      return <Icons.Phone className={className} />;
    if (name.includes("laptop")) return <Icons.Laptop className={className} />;
    if (name.includes("tablet")) return <Icons.Phone className={className} />;
    if (name.includes("pc") || name.includes("máy tính"))
      return <Icons.PC className={className} />;
    if (name.includes("màn hình")) return <Icons.PC className={className} />;
    if (name.includes("phụ kiện") || name.includes("tai nghe"))
      return <Icons.Headphone className={className} />;
    if (name.includes("bàn phím") || name.includes("chuột"))
      return <Icons.Keyboard className={className} />;
    if (name.includes("Hàng cũ")) return <Icons.Box className={className} />;
    if (name.includes("cũ")) return <Icons.Box className={className} />;

    return <Icons.DanhMuc className={className} />;
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (searchTerm.trim()) {
        navigate(`/search?keyword=${encodeURIComponent(searchTerm.trim())}`);
        setSearchTerm("");
      }
    }
  };

  return (
    <>
      <header className="bg-[#4A44F2] text-white font-sans shadow-md sticky top-0 z-[1000] transition-all duration-300">
        {/* --- 1. THANH TOP BAR TRÊN CÙNG --- */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#3a35d1] relative z-[1001] will-change-[max-height,opacity] ${
            isScrolled
              ? "max-h-0 opacity-0 pointer-events-none"
              : "max-h-[60px] opacity-100"
          }`}
        >
          {/* Desktop Top Bar */}
          <div className="hidden md:flex w-full max-w-7xl mx-auto px-4 py-2 justify-between items-center h-full">
            <div className="flex items-center gap-6 overflow-hidden flex-1 mr-4">
              <div className="flex items-center gap-12 animate-marquee-slow hover:[animation-play-state:paused]">
                <span className="flex items-center text-sm gap-1.5 hover:text-gray-200 transition-colors whitespace-nowrap">
                  <Icons.ChinhHang className=" w-4 h-4 brightness-0 invert" />
                  Sản phẩm chính hãng - Xuất hóa đơn đầy đủ
                </span>
                <span className="flex items-center text-sm gap-1.5 hover:text-gray-200 transition-colors whitespace-nowrap">
                  <Icons.Delivery className="w-4 h-4 brightness-0 invert" />
                  Giao nhanh - miễn phí cho hóa đơn 300k
                </span>
                <span className="flex items-center text-sm gap-1.5 hover:text-gray-200 transition-colors whitespace-nowrap">
                  <Icons.Build className=" w-4 h-4 brightness-0 invert" />
                  Lắp đặt tại nhà - Giao hàng tận tay
                </span>
                {/* Nhân đôi để chạy vô tận */}
                <span className="flex items-center text-sm gap-1.5 hover:text-gray-200 transition-colors whitespace-nowrap">
                  <Icons.ChinhHang className=" w-4 h-4 brightness-0 invert" />
                  Sản phẩm chính hãng - Xuất hóa đơn đầy đủ
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <span
                onClick={() => {
                  if (user) {
                    navigate("/profile", { state: { activeTab: "orders" } });
                  } else {
                    navigate("/login");
                  }
                }}
                className="cursor-pointer text-sm hover:text-gray-200 flex items-center gap-1.5 text-white/90 transition-colors whitespace-nowrap"
              >
                <Icons.Bill className="w-4 h-4 brightness-0 invert" />
                Tra cứu đơn hàng
              </span>
              <span className="text-white/40">|</span>
              <span className="font-semibold cursor-pointer text-sm hover:text-gray-200 flex items-center gap-1.5 text-white/90 transition-colors whitespace-nowrap">
                <Icons.Call className="w-4 h-4 brightness-0 invert" />
                {storeConfig?.so_dien_thoai}
              </span>
            </div>
          </div>

          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center h-full overflow-hidden whitespace-nowrap py-1.5">
            <div className="animate-marquee inline-block pl-4">
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.ChinhHang className="w-3.5 h-3.5 brightness-0 invert" />
                Sản phẩm chính hãng - Xuất hóa đơn đầy đủ
              </span>
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.Delivery className="w-3.5 h-3.5 brightness-0 invert" />
                Giao nhanh - miễn phí cho hóa đơn 300k
              </span>
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.Build className="w-3.5 h-3.5 brightness-0 invert" />
                Lắp đặt tại nhà - Giao hàng tận tay
              </span>
            </div>
            {/* Duplicate for seamless loop */}
            <div className="animate-marquee inline-block">
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.ChinhHang className="w-3.5 h-3.5 brightness-0 invert" />
                Sản phẩm chính hãng - Xuất hóa đơn đầy đủ
              </span>
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.Delivery className="w-3.5 h-3.5 brightness-0 invert" />
                Giao nhanh - miễn phí cho hóa đơn 300k
              </span>
              <span className="inline-flex items-center gap-2 text-xs mr-12">
                <Icons.Build className="w-3.5 h-3.5 brightness-0 invert" />
                Lắp đặt tại nhà - Giao hàng tận tay
              </span>
            </div>
          </div>
        </div>

        {/* --- 2. THANH HEADER CHÍNH --- */}
        <div className="w-full bg-[#4A44F2] border-b border-white/10">
          <div className="w-full max-w-7xl mx-auto px-4 pt-2 pb-1 md:py-2 flex items-center justify-between gap-3 md:gap-6">
            <div className="flex md:hidden items-center justify-between w-full gap-2">
              <Link
                to="/"
                className="shrink-0"
                onClick={() => {
                  setShowCategories(false);
                  setSearchTerm("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <img
                  src={
                    storeConfig?.logo_url
                      ? `${BASE_URL}${storeConfig.logo_url}`
                      : Logo
                  }
                  alt="Logo"
                  className="h-9 w-auto object-contain"
                />
              </Link>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Hôm nay bạn tìm gì?"
                  className="w-full py-2 pl-9 pr-3 rounded-lg text-gray-800 bg-white/95 outline-none text-xs"
                />
                <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 brightness-0 opacity-50" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/cart")}
                  className="p-2 hover:bg-white/10 rounded-xl transition relative"
                >
                  <Icons.ShoppingCart className="w-7 h-7 brightness-0 invert" />
                  {user?.id && cart.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-between w-full gap-6">
              <Link
                to="/"
                className="shrink-0"
                onClick={() => {
                  setShowCategories(false);
                  setSearchTerm("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition">
                  <img
                    src={
                      storeConfig?.logo_url
                        ? `${BASE_URL}${storeConfig.logo_url}`
                        : Logo
                    }
                    alt="Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <span className="brightness font-bold text-xl pl-1">
                    {storeConfig?.ten_cua_hang || ""}
                  </span>
                </div>
              </Link>

              <div className="relative shrink-0" ref={categoryMenuRef}>
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Icons.DanhMuc className="w-5 h-5 brightness-0 invert" />
                  <span className="font-semibold text-sm">Danh mục</span>
                  <Icons.ArrowDown className="w-4 h-4 opacity-70" />
                </button>

                {showCategories && (
                  <div className="hidden md:block absolute top-full -left-47 mt-7 w-[246px] bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-2 text-gray-800 animate-fade-in z-[1001]">
                    <div className="relative px-2 flex flex-col">
                      <Link
                        onClick={() => setShowCategories(false)}
                        to="/"
                        className="flex items-center gap-3 px-2 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors hover:text-[#4A44F2]"
                      >
                        <Icons.Home className="w-6 h-6 text-[#2621a3]" />
                        Trang chủ
                      </Link>

                      {categoryGroups.length > 0 ? (
                        categoryGroups.map((group, groupIndex) => {
                          const shouldShowPopup = group.some(
                            (p) =>
                              p.children.length > 0 ||
                              (brands[p.id] && brands[p.id].length > 0),
                          );
                          return (
                            <div
                              key={groupIndex}
                              className="group"
                              onMouseEnter={() => handleHoverGroup(group)}
                            >
                              <div className="flex items-center p-2 rounded-lg transition-colors group-hover:bg-gray-50 cursor-default">
                                {renderCategoryIcon(
                                  group[0].ten_danh_muc,
                                  "w-6 h-6 text-[#2621a3] mr-3",
                                )}
                                <div className="flex flex-wrap items-center flex-1 gap-x-1.5">
                                  {group.map((parent, catIndex) => (
                                    <div
                                      key={parent.id}
                                      className="flex items-center"
                                    >
                                      <Link
                                        to={`/category/${parent.slug}`}
                                        onClick={() => setShowCategories(false)}
                                        className="font-medium text-sm text-gray-700 hover:text-[#4A44F2] transition-colors"
                                      >
                                        {parent.ten_danh_muc}
                                      </Link>
                                      {catIndex < group.length - 1 && (
                                        <span className="text-gray-700 text-sm font-medium">
                                          ,
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {shouldShowPopup && (
                                  <Icons.ArrowForward className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                                )}
                              </div>
                              {shouldShowPopup && (
                                <div className="absolute -top-2.5 bottom-0 left-full ml-4 w-[731px] min-h-full bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  <div className="flex flex-col gap-8">
                                    {group.map((parent) => {
                                      const parentBrands =
                                        brands[parent.id] || [];
                                      if (
                                        parent.children.length === 0 &&
                                        parentBrands.length === 0
                                      )
                                        return null;
                                      return (
                                        <div
                                          key={parent.id}
                                          className="flex flex-col gap-4"
                                        >
                                          <h3 className="font-bold text-base text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                                            {parent.ten_danh_muc}
                                          </h3>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {parentBrands.length > 0 && (
                                              <div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                                  Thương hiệu nổi bật
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                  {parentBrands.map(
                                                    (brandName, bIndex) => (
                                                      <Link
                                                        key={bIndex}
                                                        to={`/category/${parent.slug}?brand=${encodeURIComponent(brandName)}`}
                                                        onClick={() =>
                                                          setShowCategories(
                                                            false,
                                                          )
                                                        }
                                                        className="border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:border-[#4A44F2] hover:text-[#4A44F2] transition-all"
                                                      >
                                                        {brandName}
                                                      </Link>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                            {parent.children.length > 0 && (
                                              <div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                                  Dòng sản phẩm
                                                </p>
                                                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                                  {parent.children.map(
                                                    (child) => (
                                                      <Link
                                                        key={child.id}
                                                        to={`/category/${child.slug}`}
                                                        onClick={() =>
                                                          setShowCategories(
                                                            false,
                                                          )
                                                        }
                                                        className="text-sm text-gray-600 hover:text-[#4A44F2] transition-all flex items-center gap-2"
                                                      >
                                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full inline-block"></span>
                                                        {child.ten_danh_muc}
                                                      </Link>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="block px-4 py-3 text-sm text-gray-400 italic">
                          Đang tải danh mục...
                        </span>
                      )}

                      <Link
                        onClick={() => setShowCategories(false)}
                        to="/so-sanh"
                        className="flex items-center gap-3 px-2 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors hover:text-[#4A44F2]"
                      >
                        <Icons.Compare className="w-6 h-6 text-[#2621a3]" />
                        So sánh Sản phẩm
                      </Link>
                      <Link
                        onClick={() => setShowCategories(false)}
                        to="/build-pc"
                        className="flex items-center gap-3 px-2 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors hover:text-[#4A44F2]"
                      >
                        <Icons.ChatAI className="w-6 h-6 text-[#2621a3]" />
                        Build PC với AI
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 relative max-w-xl">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Bạn tìm gì hôm nay?"
                  className="w-full py-2.5 pl-11 pr-4 rounded-xl text-gray-800 bg-white outline-none shadow-sm text-sm focus:ring-2 focus:ring-blue-400 transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition"
                >
                  <Icons.Search className="w-5 h-5 brightness-0 opacity-60" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/cart")}
                  className="flex items-center gap-1.5 hover:bg-white/10 px-4 py-2 rounded-xl transition relative cursor-pointer"
                >
                  <Icons.ShoppingCart className="w-5 h-5 brightness-0 invert" />
                  <span className="font-semibold text-sm">Giỏ hàng</span>
                  {user && cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#4A44F2]">
                      {cart.length}
                    </span>
                  )}
                </button>

                {user ? (
                  <div
                    className="relative group py-1"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center gap-2 hover:bg-white/20 transition px-2 py-1.5 rounded-xl cursor-pointer  bg-white/10">
                      <span className="font-bold text-sm max-w-[100px] truncate">
                        {user.ho_ten || user.so_dien_thoai}
                      </span>
                      <img
                        src={
                          user.anh_dai_dien?.startsWith("http")
                            ? user.anh_dai_dien
                            : user.anh_dai_dien
                              ? `${BASE_URL}${user.anh_dai_dien}`
                              : `https://ui-avatars.com/api/?name=${user.ho_ten || user.so_dien_thoai || "User"}&background=random`
                        }
                        alt="User"
                        className="w-9 h-9 rounded-full object-cover border-2 border-white/20"
                      />
                    </div>
                    {showDropdown && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-2xl border border-gray-100 py-2 text-gray-800 z-[1100] animate-in fade-in slide-in-from-top-2 duration-200 font-medium">
                        <button
                          onClick={() => navigate("/profile")}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition flex items-center gap-3 cursor-pointer"
                        >
                          Hồ sơ tài khoản
                        </button>
                        <button
                          onClick={() =>
                            navigate("/profile", {
                              state: { activeTab: "orders" },
                            })
                          }
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition flex items-center gap-3 cursor-pointer"
                        >
                          Đơn hàng của tôi
                        </button>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-1 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-3 font-semibold cursor-pointer"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate("/register")}
                      className="px-4 py-2 border border-white/30 rounded-xl hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icons.User className="w-5 h-5 brightness-0 invert" />
                      <span className="font-semibold text-sm">Đăng ký</span>
                    </button>
                    <button
                      onClick={() => navigate("/login")}
                      className="px-4 py-2 border border-white/30 rounded-xl hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Icons.User className="w-5 h-5 brightness-0 invert" />
                      <span className="font-semibold text-sm">Đăng nhập</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- MENU DANH MỤC MOBILE  --- */}
        {showCategories && (
          <div
            ref={mobileMenuRef}
            className={`md:hidden fixed inset-x-0 bottom-[55px] bg-[#f4f6f8] z-[2001] flex overflow-hidden animate-fade-in transition-all duration-300 ${
              isScrolled ? "top-[60px]" : "top-[100px]"
            }`}
          >
            {/* Cột trái: Danh sách danh mục chính (Sidebar) */}
            <div className="w-[100px] flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto no-scrollbar">
              <div className="flex flex-col">
                {categoryGroups.flat().map((category) => (
                  <button
                    key={`mobile-cat-${category.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMobileCategory(category);
                      fetchBrandsForCategory(category.id);
                    }}
                    className={`flex flex-col items-center justify-center py-4 px-1 gap-1.5 transition-all border-b border-gray-50 cursor-pointer ${
                      activeMobileCategory?.id === category.id
                        ? "bg-[#f4f6f8] text-[#4A44F2] border-l-4 border-l-[#4A44F2]"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {renderCategoryIcon(
                      category.ten_danh_muc,
                      `w-7 h-7 ${activeMobileCategory?.id === category.id ? "text-[#4A44F2]" : "text-gray-400"}`,
                    )}
                    <span
                      className={`text-[10px] font-bold text-center leading-tight px-1`}
                    >
                      {category.ten_danh_muc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cột phải: Chi tiết (Brands & Sub-categories) */}
            <div
              ref={mobileContentRef}
              className="flex-1 overflow-y-auto bg-[#f4f6f8] p-4"
            >
              {activeMobileCategory && (
                <div
                  key={activeMobileCategory.id}
                  className="flex flex-col gap-6 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-gray-800">
                      {activeMobileCategory.ten_danh_muc}
                    </h3>
                    <Link
                      to={`/category/${activeMobileCategory.slug}`}
                      onClick={() => setShowCategories(false)}
                      className="text-[#4A44F2] text-xs font-semibold flex items-center gap-1"
                    >
                      Xem tất cả <Icons.ArrowForward className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Thương hiệu */}
                  {(brands[activeMobileCategory.id] || []).length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Thương hiệu
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {brands[activeMobileCategory.id].map(
                          (brandName, bIndex) => (
                            <Link
                              key={bIndex}
                              to={`/category/${activeMobileCategory.slug}?brand=${encodeURIComponent(brandName)}`}
                              onClick={() => setShowCategories(false)}
                              className="bg-gray-50 border border-gray-100 py-2 px-3 rounded-lg text-[11px] font-medium text-gray-700 text-center hover:border-[#4A44F2] hover:text-[#4A44F2] transition-all"
                            >
                              {brandName}
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dòng sản phẩm (Children) */}
                  {activeMobileCategory.children.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Dòng sản phẩm
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {activeMobileCategory.children.map((child) => (
                          <Link
                            key={child.id}
                            to={`/category/${child.slug}`}
                            onClick={() => setShowCategories(false)}
                            className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0"
                          >
                            <span className="text-sm text-gray-700 font-medium">
                              {child.ten_danh_muc}
                            </span>
                            <Icons.ArrowForward className="w-3.5 h-3.5 text-gray-300" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Build PC & So sánh (Nếu là danh mục liên quan) */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Link
                      to="/so-sanh"
                      onClick={() => setShowCategories(false)}
                      className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-2"
                    >
                      <Icons.Compare className="w-6 h-6 text-[#4A44F2]" />
                      <span className="text-[10px] font-bold text-gray-700">
                        So sánh
                      </span>
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setShowCategories(false)}
                      className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-2"
                    >
                      <Icons.ChatAI className="w-6 h-6 text-[#4A44F2]" />
                      <span className="text-[10px] font-bold text-gray-700">
                        Build PC
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* --- 3. BOTTOM NAVIGATION BAR (Mobile Only) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[2000] px-2 py-1 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${location.pathname === "/" && !showCategories ? "text-[#4A44F2]" : "text-gray-500"}`}
          >
            <Icons.Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Trang chủ</span>
          </Link>

          <button
            ref={categoryToggleRef}
            onClick={() => setShowCategories(!showCategories)}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${showCategories ? "text-[#4A44F2]" : "text-gray-500"}`}
          >
            <Icons.DanhMuc className="w-6 h-6" />
            <span className="text-[10px] font-medium">Danh mục</span>
          </button>

          <Link
            to="/cart"
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] relative ${location.pathname === "/cart" ? "text-[#4A44F2]" : "text-gray-500"}`}
          >
            <Icons.ShoppingCart className="w-6 h-6" />
            <span className="text-[10px] font-medium">Giỏ hàng</span>
            {user && cart.length > 0 && (
              <span className="absolute top-1 right-3 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {cart.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => navigate(user ? "/profile" : "/login")}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${location.pathname === "/profile" || location.pathname === "/login" ? "text-[#4A44F2]" : "text-gray-500"}`}
          >
            <Icons.User className="w-6 h-6" />
            <span className="text-[10px] font-medium">
              {user ? "Tài khoản" : "Đăng nhập"}
            </span>
          </button>
        </div>
      </nav>

      {/* Categories Desktop Overlay */}
      {showCategories && (
        <div
          className="fixed inset-0 w-full h-screen bg-black/40 z-[999]"
          onClick={() => setShowCategories(false)}
        />
      )}
    </>
  );
};

export default Header;
