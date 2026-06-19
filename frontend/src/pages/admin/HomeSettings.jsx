import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";
import Swal from "sweetalert2";

const HomeSettings = () => {
  const [sections, setSections] = useState([]);
  const [originalSections, setOriginalSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);
  const scrollContainerRef = useRef(null);
  const scrollSpeed = useRef(0);
  const animationFrameId = useRef(null);

  const getAuthHeader = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (dragIndex === null) return;

    const handleWindowWheel = (e) => {
      const container = scrollContainerRef.current;
      if (container) {
        e.preventDefault();
        container.scrollTop += e.deltaY;
      }
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWindowWheel);
  }, [dragIndex]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, catRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/cau-hinh/home`),
        axios.get(`${BASE_URL}/api/sanPham/danhMuc`, getAuthHeader()),
      ]);

      const parsedData = (configRes.data || []).map((section) => ({
        ...section,
        du_lieu_json:
          typeof section.du_lieu_json === "string"
            ? JSON.parse(section.du_lieu_json)
            : section.du_lieu_json || [],
      }));

      setSections(parsedData);
      setOriginalSections(JSON.parse(JSON.stringify(parsedData)));
      setCategories(catRes.data || []);
    } catch (error) {
      console.error("Lỗi fetch data:", error);
      toast.error("Không thể tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    if (sections.length >= 10) {
      toast.error("Tối đa 10 tầng sản phẩm để đảm bảo tốc độ tải trang!");
      return;
    }
    setSections([
      ...sections,
      {
        ten_phan: "",
        ten_tab_1: "",
        ten_tab_2: "",
        danh_muc_id_1: null,
        danh_muc_id_2: null,
        loai_hien_thi: "ProductSection",
        du_lieu_json: [],
      },
    ]);
    toast.success("Đã thêm khối mới ở cuối danh sách!");
  };

  const handleRemoveSection = (index) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa toàn bộ khối này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
        toast.success("Đã xóa tầng sản phẩm");
      }
    });
  };

  const handleChange = (index, field, value) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const startAutoScroll = () => {
    if (animationFrameId.current) return;
    const scroll = () => {
      if (scrollContainerRef.current && scrollSpeed.current !== 0) {
        const container = scrollContainerRef.current;
        const oldScroll = container.scrollTop;
        container.scrollTop += scrollSpeed.current;
        if (container.scrollTop === oldScroll) {
          window.scrollBy(0, scrollSpeed.current);
        }
        animationFrameId.current = requestAnimationFrame(scroll);
      } else {
        animationFrameId.current = null;
      }
    };
    animationFrameId.current = requestAnimationFrame(scroll);
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = 120;
      if (mouseY < rect.top + threshold) {
        const dist = Math.max(0, mouseY - rect.top);
        scrollSpeed.current = -5 - 40 * (1 - dist / threshold);
        startAutoScroll();
      } else if (mouseY > rect.bottom - threshold) {
        const dist = Math.max(0, rect.bottom - mouseY);
        scrollSpeed.current = 5 + 40 * (1 - dist / threshold);
        startAutoScroll();
      } else {
        scrollSpeed.current = 0;
      }
    }

    // 2. Chống giật lag: Chỉ đổi chỗ khi vượt qua điểm giữa của khối mục tiêu
    if (dragIndex === null || dragIndex === index) return;

    const targetRect = e.currentTarget.getBoundingClientRect();
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    const mouseY = e.clientY;

    // Nếu đang kéo xuống, phải vượt qua trung tâm khối dưới mới đổi
    if (dragIndex < index && mouseY < targetMiddleY) return;
    // Nếu đang kéo lên, phải vượt qua trung tâm khối trên mới đổi
    if (dragIndex > index && mouseY > targetMiddleY) return;

    const newSections = [...sections];
    const draggedItem = newSections[dragIndex];
    newSections.splice(dragIndex, 1);
    newSections.splice(index, 0, draggedItem);
    setDragIndex(index);
    setSections(newSections);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    scrollSpeed.current = 0;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  const handleSave = async () => {
    try {
      const cleanSections = sections.map((s, index) => ({
        ...s,
        danh_muc_id_1: s.danh_muc_id_1 ? parseInt(s.danh_muc_id_1) : null,
        danh_muc_id_2: s.danh_muc_id_2 ? parseInt(s.danh_muc_id_2) : null,
        thu_tu: index + 1,
      }));

      const invalidSection = cleanSections.find(
        (s) =>
          !s.ten_phan ||
          (s.loai_hien_thi === "ProductSection" && !s.danh_muc_id_1),
      );
      if (invalidSection) {
        toast.error("Vui lòng nhập tiêu đề và chọn danh mục đầy đủ!");
        return;
      }

      // A2: Validate Tab 1 trùng Tab 2
      const duplicateTab = cleanSections.find(
        (s) =>
          s.loai_hien_thi === "ProductSection" &&
          s.danh_muc_id_1 &&
          s.danh_muc_id_2 &&
          s.danh_muc_id_1 === s.danh_muc_id_2,
      );
      if (duplicateTab) {
        toast.error(`Khối "${duplicateTab.ten_phan}" có 2 Tab trùng danh mục!`);
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/cau-hinh/home`,
        { sections: cleanSections },
        getAuthHeader(),
      );

      toast.success(res.data.message || "Cấu hình đã được lưu!");
      fetchData();
    } catch (error) {
      console.error("Lỗi lưu cấu hình:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu!");
    }
  };

  const hasChanges =
    JSON.stringify(sections) !== JSON.stringify(originalSections);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] p-4 overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                Thiết lập Trang chủ
              </h2>
            </div>
          </div>
          <button
            onClick={handleAddSection}
            className="bg-[#4caf50] hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer  "
          >
            <Icons.Add className="w-5 h-5" /> Thêm khối sản phẩm
          </button>
        </div>

        {/* Content Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-gray-50/20 scroll-smooth custom-scrollbar"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Đang đồng bộ dữ liệu...
              </p>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="p-6 bg-gray-50 rounded-full mb-6">
                <Icons.Box className="w-20 h-20 text-gray-200" />
              </div>
              <p className="text-gray-400 text-xl font-bold">
                Trang chủ đang trống
              </p>
              <button
                onClick={handleAddSection}
                className="mt-4 text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                Nhấn để bắt đầu xây dựng bố cục
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-6xl mx-auto">
              {sections.map((section, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm relative group cursor-move
                    ${dragIndex === index ? "opacity-30 border-blue-500 border-2" : "border-gray-100 hover:border-blue-200 hover:shadow-md"}`}
                >
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-blue-400 transition-colors">
                        <Icons.DanhMuc className="w-6 h-6" />
                      </div>
                      <span className="bg-blue-600 text-white w-5 h-5 rounded-lg flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-bold text-gray-800 ">
                        {section.loai_hien_thi === "AccessoryBar"
                          ? "Thanh Tiện Ích"
                          : "Khối Sản Phẩm"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSection(index)}
                      className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-1"
                    >
                      <Icons.Delete className="w-5 h-5" /> Xóa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 ml-1">
                        {section.loai_hien_thi === "ProductSection"
                          ? "Tên gợi nhớ"
                          : "Tiêu đề hiển thị"}
                      </label>
                      <input
                        type="text"
                        value={section.ten_phan}
                        onChange={(e) =>
                          handleChange(index, "ten_phan", e.target.value)
                        }
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-blue-500/20 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700 placeholder:text-gray-300"
                        placeholder={
                          section.loai_hien_thi === "ProductSection"
                            ? "Vd: Khối 1..."
                            : "Vd: Phụ kiện..."
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600 ml-1">
                        Kiểu hiển thị
                      </label>
                      <div className="relative">
                        <select
                          value={section.loai_hien_thi}
                          onChange={(e) =>
                            handleChange(index, "loai_hien_thi", e.target.value)
                          }
                          className="w-full appearance-none bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-blue-500/20 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          <option value="ProductSection">Tab Sản phẩm</option>
                          <option value="AccessoryBar">
                            Dải Tiện ích
                          </option>
                        </select>
                      </div>
                    </div>

                    {section.loai_hien_thi === "ProductSection" && (
                      <>
                        <div className="space-y-3 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 md:col-span-2 lg:col-span-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-blue-500 uppercase ml-1">
                                Tên Tab 1
                              </label>
                              <input
                                type="text"
                                value={section.ten_tab_1 || ""}
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "ten_tab_1",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-white border border-blue-100 rounded-lg px-3 py-1.5 outline-none text-xs font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-blue-500 uppercase ml-1">
                                Danh mục Tab 1
                              </label>
                              <select
                                value={section.danh_muc_id_1 || ""}
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "danh_muc_id_1",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-white border border-blue-100 rounded-lg px-3 py-1.5 outline-none text-xs font-medium cursor-pointer appearance-none"
                              >
                                <option value="">Chọn danh mục</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.ten_danh_muc}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
                                Tên Tab 2
                              </label>
                              <input
                                type="text"
                                value={section.ten_tab_2 || ""}
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "ten_tab_2",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 outline-none text-xs font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
                                Danh mục Tab 2
                              </label>
                              <select
                                value={section.danh_muc_id_2 || ""}
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    "danh_muc_id_2",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 outline-none text-xs font-medium cursor-pointer appearance-none"
                              >
                                <option value="">Không có</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.ten_danh_muc}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {section.loai_hien_thi === "AccessoryBar" && (
                      <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-2 border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-blue-600 ml-1">
                            Danh sách ô tiện ích
                          </label>
                          <button
                            onClick={() => {
                              const newSections = [...sections];
                              const items = Array.isArray(section.du_lieu_json)
                                ? section.du_lieu_json
                                : [];
                              newSections[index].du_lieu_json = [
                                ...items,
                                { label: "", icon: "", categoryId: "" },
                              ];
                              setSections(newSections);
                              toast.success("Đã thêm ô tiện ích mới!");
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Icons.Add className="w-4 h-4" /> Thêm ô
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {(Array.isArray(section.du_lieu_json)
                            ? section.du_lieu_json
                            : []
                          ).map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex flex-wrap items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100"
                            >
                              <div className="flex-1 min-w-[150px]">
                                <input
                                  type="text"
                                  placeholder="Tên hiển thị"
                                  value={item.label}
                                  onChange={(e) => {
                                    const newSections = JSON.parse(
                                      JSON.stringify(sections),
                                    );
                                    newSections[index].du_lieu_json[
                                      itemIdx
                                    ].label = e.target.value;
                                    setSections(newSections);
                                  }}
                                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500/20"
                                />
                              </div>
                              <div className="flex-1 min-w-[150px] flex items-center gap-2">
                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.icon ? (
                                    <img
                                      src={
                                        item.icon.startsWith("/")
                                          ? `${BASE_URL}${item.icon}`
                                          : item.icon
                                      }
                                      alt="preview"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Icons.Box className="w-5 h-5 text-gray-200" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <label className="cursor-pointer bg-white border border-gray-200 hover:border-blue-400 px-3 py-2 rounded-lg text-[10px] font-bold text-gray-500 flex items-center justify-center gap-1 transition-all">
                                    <Icons.Add className="w-3 h-3" />
                                    {item.icon ? "Đổi ảnh" : "Chọn ảnh"}
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append("icon", file);

                                        try {
                                          toast.loading("Đang tải ảnh...", {
                                            id: "uploading",
                                          });
                                          const res = await axios.post(
                                            `${BASE_URL}/api/cau-hinh/upload`,
                                            formData,
                                            getAuthHeader(),
                                          );

                                          const newSections = JSON.parse(
                                            JSON.stringify(sections),
                                          );
                                          newSections[index].du_lieu_json[
                                            itemIdx
                                          ].icon = res.data.imageUrl;
                                          setSections(newSections);
                                          toast.success("Đã tải ảnh lên!", {
                                            id: "uploading",
                                          });
                                        } catch (err) {
                                          console.error("Lỗi upload:", err);
                                          toast.error("Không thể tải ảnh!", {
                                            id: "uploading",
                                          });
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="flex-1 min-w-[150px]">
                                <select
                                  value={item.categoryId || ""}
                                  onChange={(e) => {
                                    const newSections = JSON.parse(
                                      JSON.stringify(sections),
                                    );
                                    newSections[index].du_lieu_json[
                                      itemIdx
                                    ].categoryId = e.target.value;
                                    setSections(newSections);
                                  }}
                                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-medium outline-none appearance-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                                >
                                  <option value="">Chọn danh mục</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.ten_danh_muc}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: "Xóa ô tiện ích?",
                                    icon: "question",
                                    showCancelButton: true,
                                    confirmButtonText: "Xóa",
                                    cancelButtonText: "Hủy",
                                    confirmButtonColor: "#d33",
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      const newSections = [...sections];
                                      newSections[index].du_lieu_json.splice(
                                        itemIdx,
                                        1,
                                      );
                                      setSections(newSections);
                                    }
                                  });
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 cursor-pointer 
                                transition-colors"
                              >
                                <Icons.Delete className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(Array.isArray(section.du_lieu_json)
                            ? section.du_lieu_json
                            : []
                          ).length === 0 && (
                            <p className="text-[11px] text-gray-400 italic text-center py-2">
                              Chưa có ô nào, hãy nhấn nút Thêm ô ở trên.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions - Chỉ hiện khi có thay đổi */}
        {hasChanges && (
          <div className="px-6 py-5 border-t border-gray-100 bg-white flex justify-end gap-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] animate-in slide-in-from-bottom-5 duration-300">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:translate-y-0 text-sm flex items-center gap-2 cursor-pointer"
            >
              Lưu bố cục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeSettings;
