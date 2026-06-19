import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "../assets/icons/index";
import BASE_URL from "../config/api";

const SidebarMenu = () => {
  // State quản lý dữ liệu động giống hệt Header
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [brands, setBrands] = useState({});
  const [hoveredGroup, setHoveredGroup] = useState(null); // Lưu trữ NHÓM đang được hover

  // 1. TẢI DỮ LIỆU DANH MỤC VÀ THƯƠNG HIỆU TỪ API
  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
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

          // Gom nhóm theo số thứ tự
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

          // Tải Thương hiệu ngầm
          const brandData = {};
          await Promise.all(
            roots.map(async (root) => {
              try {
                const brandRes = await fetch(
                  `${BASE_URL}/api/sanPham/thuong-hieu/${root.id}`,
                );
                if (brandRes.ok) {
                  const bData = await brandRes.json();
                  brandData[root.id] = Array.isArray(bData)
                    ? bData
                    : bData.data || [];
                }
              } catch (e) {
                console.error(`Lỗi lấy thương hiệu cho ${root.id}:`, e);
              }
            }),
          );
          setBrands(brandData);
        }
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategoriesAndBrands();
  }, []);

  // 2. TỪ ĐIỂN ICON
  const renderCategoryIcon = (categoryName, className) => {
    const name = (categoryName || "").toLowerCase();
    if (name.includes("điện thoại"))
      return <Icons.Phone className={className} />;
    if (name.includes("laptop")) return <Icons.Laptop className={className} />;
    if (name.includes("tablet")) return <Icons.Phone className={className} />; // Nếu có Icons.Tablet thì thay đổi nhé
    if (
      name.includes("pc") ||
      name.includes("máy tính") ||
      name.includes("màn hình")
    )
      return <Icons.PC className={className} />;
    if (name.includes("phụ kiện") || name.includes("tai nghe"))
      return <Icons.Headphone className={className} />;
    if (name.includes("bàn phím") || name.includes("chuột"))
      return <Icons.Keyboard className={className} />;
    if (name.includes("cũ") || name.includes("hàng cũ"))
      return <Icons.Box className={className} />;
    return <Icons.DanhMuc className={className} />;
  };

  return (
    <div
      className="flex flex-col gap-4 w-full h-full relative"
      onMouseLeave={() => setHoveredGroup(null)} // Đóng menu khi di chuột ra ngoài khu vực Sidebar
    >
      <div className="bg-white rounded-lg shadow-sm text-sm font-medium h-full">
        <ul className="flex flex-col py-2">
          {/* CÁC DANH MỤC ĐỘNG TỪ API */}
          {categoryGroups.map((group, index) => {
            const hasChildrenInGroup = group.some(
              (parent) => parent.children.length > 0,
            );
            const hasBrandsInGroup = group.some(
              (p) => brands[p.id] && brands[p.id].length > 0,
            );
            const hasMegaMenu = hasChildrenInGroup || hasBrandsInGroup;

            return (
              <li
                key={index}
                className="px-4 py-2.5 hover:bg-gray-50 transition-colors group flex items-center justify-between cursor-pointer"
                onMouseEnter={() => setHoveredGroup(hasMegaMenu ? group : null)}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg opacity-70 group-hover:opacity-100 text-[#2621a3] transition-opacity">
                    {renderCategoryIcon(group[0].ten_danh_muc, "w-6 h-6")}
                  </span>

                  <div className="flex items-center gap-1 text-gray-800 text-sm w-full flex-wrap">
                    {group.map((parent, idx) => (
                      <React.Fragment key={parent.id}>
                        <Link
                          to={`/category/${parent.slug}`}
                          className="hover:text-[#4A44F2] transition-colors font-medium"
                        >
                          {parent.ten_danh_muc}
                        </Link>
                        {idx < group.length - 1 && (
                          <span className="text-gray-400">,</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {hasMegaMenu && (
                  <Icons.ArrowForward className="h-3 w-3 text-gray-400 group-hover:text-[#4A44F2]" />
                )}
              </li>
            );
          })}

          <li
            className="px-4 py-2 hover:bg-gray-50 transition-colors group flex items-center justify-between cursor-pointer"
            onMouseEnter={() => setHoveredGroup(null)}
          >
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg opacity-70 group-hover:opacity-100 text-[#2621a3] transition-opacity">
                <Icons.Compare className="w-6 h-6" />
              </span>
              <Link
                to="/so-sanh"
                className="text-gray-800 font-medium text-[13px] group-hover:text-[#4A44F2] transition-colors w-full block"
              >
                So sánh thiết bị
              </Link>
            </div>
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-50 transition-colors group flex items-center justify-between cursor-pointer"
            onMouseEnter={() => setHoveredGroup(null)}
          >
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg opacity-70 group-hover:opacity-100 text-[#2621a3] transition-opacity">
                <Icons.ChatAI className="w-6 h-6" />
              </span>
              <Link
                to="/build-pc"
                className="text-gray-800 font-medium text-[13px] group-hover:text-[#4A44F2] transition-colors w-full block"
              >
                Build PC với AI
              </Link>
            </div>
          </li>
        </ul>
      </div>

      {/* --- PHẦN MEGA MENU ĐỘNG XUẤT HIỆN KHI HOVER --- */}
      {hoveredGroup && (
        <div className="absolute top-0 left-full ml-2 w-[750px] bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 z-[100] min-h-full animate-fade-in">
          <div className="flex flex-col gap-8">
            {hoveredGroup.map((parent) => {
              const parentBrands = brands[parent.id] || [];
              const parentChildren = parent.children || [];

              const hasChildren = parentChildren.length > 0;
              const hasBrands = parentBrands.length > 0;

              if (!hasChildren && !hasBrands) return null;

              return (
                <div key={parent.id} className="flex flex-col gap-4">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 text-[15px]">
                    Các dòng {parent.ten_danh_muc}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* CỘT THƯƠNG HIỆU */}
                    {hasBrands && (
                      <div className="col-span-1 lg:col-span-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Thương hiệu nổi bật
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {parentBrands.map((brandName, bIndex) => (
                            <Link
                              key={`brand-${bIndex}`}
                              to={`/category/${parent.slug}?brand=${encodeURIComponent(brandName)}`}
                              className="border border-gray-200 bg-gray-50 rounded-md py-1.5 px-2 text-center text-xs font-medium text-gray-700 hover:border-[#4A44F2] hover:text-[#4A44F2] hover:bg-blue-50 transition-all"
                            >
                              {brandName}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CỘT DANH MỤC CON */}
                    {hasChildren && (
                      <div className="col-span-1">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Dòng sản phẩm
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {parentChildren.map((child) => (
                            <Link
                              key={child.id}
                              to={`/category/${child.slug}`}
                              className="text-[13px] text-gray-600 hover:text-[#4A44F2] hover:font-medium transition-all flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full inline-block"></span>
                              {child.ten_danh_muc}
                            </Link>
                          ))}
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
};

export default SidebarMenu;
