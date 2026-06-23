import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

/* ─── Modal Thêm nhanh hàng hóa ─────────────────────────────────────────── */
const QuickAddModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", unit: "" });
  if (!isOpen) return null;

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên hàng hóa!");
    onSave({ bien_the_id: null, sku: null, name: form.name, unit: form.unit, so_luong_he_thong: 0, so_luong_thuc_te: 0 });
    setForm({ name: "", unit: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-green-500 px-5 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-base">Thêm nhanh hàng hóa</h3>
          <button onClick={onClose} className="text-white hover:text-green-100 text-xl leading-none cursor-pointer">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mã hàng hóa</label>
              <input readOnly value="Mã Tự động" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên hàng hóa <span className="text-red-500">*</span></label>
              <input autoFocus type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Đơn vị tính</label>
            <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded font-semibold text-sm hover:bg-gray-50 cursor-pointer transition">
            Bỏ qua
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm cursor-pointer transition flex items-center justify-center gap-1.5">
            <Icons.Tick className="w-4 h-4" /> Lưu hàng hóa
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Component chính ────────────────────────────────────────────────────── */
const InventoryCheckCreate = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debounceRef = useRef(null);

  // ── Debounce search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`${BASE_URL}/api/kiem-kho/search-bien-the?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setSearchResults(await res.json());
      } catch { setSearchResults([]); }
      finally { setLoadingSearch(false); }
    }, 300);
  }, [searchQuery]);

  const addItem = (bt) => {
    setItems((prev) => {
      const id = bt.id || bt.bien_the_id;
      if (prev.find((i) => i.bien_the_id === id)) return prev.map((i) =>
        i.bien_the_id === id ? i : i
      );
      return [...prev, {
        bien_the_id: id,
        sku: bt.sku,
        name: bt.san_pham?.ten_san_pham || bt.name || "Sản phẩm",
        variant: [bt.mau_sac, bt.dung_luong, bt.ram].filter(Boolean).join(" / "),
        so_luong_he_thong: bt.ton_kho ?? bt.tonKho ?? bt.so_luong_he_thong ?? 0,
        so_luong_thuc_te: bt.ton_kho ?? bt.tonKho ?? bt.so_luong_he_thong ?? 0,
      }];
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const totalSystem = items.reduce((s, i) => s + i.so_luong_he_thong, 0);
  const totalActual = items.reduce((s, i) => s + i.so_luong_thuc_te, 0);
  const totalDiff = totalActual - totalSystem;

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async (trang_thai) => {
    if (items.length === 0) { toast.error("Vui lòng thêm ít nhất 1 hàng hóa!"); return; }
    const hasNoId = items.some((i) => !i.bien_the_id);
    if (hasNoId) { toast.error("Có hàng hóa chưa được khớp với biến thể. Vui lòng tìm kiếm và thêm lại!"); return; }

    setSaving(true);
    try {
      const payload = {
        ghi_chu: note,
        trang_thai,
        items: items.map((i) => ({
          bien_the_id: i.bien_the_id,
          so_luong_he_thong: i.so_luong_he_thong,
          so_luong_thuc_te: i.so_luong_thuc_te,
        })),
      };
      const res = await fetch(`${BASE_URL}/api/kiem-kho`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Thành công",
          text: `${trang_thai === "balanced" ? "Cân bằng kho" : "Lưu tạm"} phiếu kiểm kho ${data.data?.ma_phieu} thành công!`,
          icon: "success",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Đồng ý",
          customClass: {
            popup: 'rounded-xl font-sans',
            title: 'text-lg font-bold text-gray-800',
            htmlContainer: 'text-sm text-gray-600',
          }
        }).then(() => {
          navigate("/admin/inventory-check");
        });
      } else {
        Swal.fire({
          title: "Thất bại",
          text: "Lỗi: " + data.message,
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Đóng",
          customClass: {
            popup: 'rounded-xl font-sans',
          }
        });
      }
    } catch {
      Swal.fire({
        title: "Lỗi kết nối",
        text: "Không thể kết nối đến máy chủ!",
        icon: "error",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Đóng",
        customClass: {
          popup: 'rounded-xl font-sans',
        }
      });
    }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-[#f0f2f5] font-sans overflow-hidden">
      {/* Top bar */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-4 shrink-0">
        <button onClick={() => navigate("/admin/inventory-check")} className="text-gray-500 hover:text-gray-800 text-sm font-medium cursor-pointer">
          &lt; Quay lại danh sách
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <h1 className="text-base font-bold text-gray-800">Tạo phiếu kiểm kho</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden p-4 lg:p-5 gap-4 w-full">

        {/* ── Left: item table ─────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-w-0">

          {/* Search bar */}
          <div className="p-3 border-b border-gray-100 flex gap-2 shrink-0 relative">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm hàng hóa cần kiểm (Gõ mã hoặc tên)..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                autoComplete="off"
              />
              {/* Dropdown */}
              {(searchResults.length > 0 || loadingSearch) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto mt-1">
                  {loadingSearch && <div className="py-3 text-center text-gray-400 text-sm">Đang tìm...</div>}
                  {searchResults.map((bt) => (
                    <button key={bt.id} onClick={() => addItem(bt)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 cursor-pointer">
                      <div className="font-semibold text-gray-800 text-sm">{bt.san_pham?.ten_san_pham || "Sản phẩm"}</div>
                      <div className="text-xs text-gray-400">
                        SKU: {bt.sku || "—"}{bt.mau_sac && ` · ${bt.mau_sac}`}
                        <span className="ml-2 text-blue-500 font-medium">Tồn: {bt.ton_kho ?? bt.tonKho ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setIsModalOpen(true)} title="Thêm nhanh hàng hóa"
              className="w-9 h-9 flex items-center justify-center border border-blue-500 text-blue-600 rounded hover:bg-blue-50 cursor-pointer transition">
              <Icons.Add className="h-5 w-5" />
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="sticky top-0 bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-10 text-center">STT</th>
                  <th className="py-2.5 px-4 font-semibold w-32">Mã hàng</th>
                  <th className="py-2.5 px-4 font-semibold">Tên hàng</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-28">Tồn hệ thống</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-28">Tồn thực tế</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-24">Chênh lệch</th>
                  <th className="py-2.5 px-2 w-8" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.length === 0 ? (
                  <tr><td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Icons.Inventory className="h-10 w-10 text-gray-200" />
                      <p className="text-gray-400 font-medium text-sm">Chưa có hàng hóa nào được chọn để kiểm kê.</p>
                      <p className="text-gray-300 text-xs">Tìm kiếm ở trên hoặc bấm + để thêm nhanh</p>
                    </div>
                  </td></tr>
                ) : items.map((item, idx) => {
                  const diff = item.so_luong_thuc_te - item.so_luong_he_thong;
                  return (
                    <tr key={`${item.bien_the_id}-${idx}`} className={`border-b border-gray-100 hover:bg-gray-50 ${!item.bien_the_id ? "bg-yellow-50" : ""}`}>
                      <td className="py-2.5 px-4 text-center text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-blue-600 text-xs">
                        {item.sku || <span className="text-yellow-600">⚠ Chưa khớp</span>}
                      </td>
                      <td className="py-2.5 px-4 text-gray-800">
                        {item.name}
                        {item.variant && <span className="text-xs text-gray-400 ml-1">/ {item.variant}</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center text-gray-600 font-medium">{item.so_luong_he_thong}</td>
                      <td className="py-2.5 px-4">
                        <input type="number" min="0" value={item.so_luong_thuc_te}
                          onChange={(e) => setItems(items.map((i, ii) => ii === idx ? { ...i, so_luong_thuc_te: parseInt(e.target.value) || 0 } : i))}
                          className="w-full text-center border border-gray-300 rounded py-1 focus:border-blue-500 outline-none text-sm font-bold cursor-text"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-sm">
                        {diff === 0 ? <span className="text-gray-400">0</span>
                          : diff > 0 ? <span className="text-green-600">+{diff}</span>
                            : <span className="text-red-500">{diff}</span>}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button onClick={() => setItems(items.filter((_, ii) => ii !== idx))}
                          className="text-red-400 hover:text-red-600 cursor-pointer">
                          <Icons.Delete className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: info panel ─────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 flex-1 flex flex-col gap-0 overflow-y-auto">
            {/* Meta */}
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Icons.User className="h-4 w-4 text-gray-400" /> Admin
              </span>
              <span className="text-gray-400 text-xs">{new Date().toLocaleString("vi-VN")}</span>
            </div>

            <div className="space-y-0 text-sm divide-y divide-dashed divide-gray-200">
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">Mã kiểm kho</span>
                <span className="text-gray-400 italic text-xs">Mã phiếu tự động</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">Trạng thái</span>
                <span className="font-semibold text-blue-600">Đang kiểm</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 bg-gray-50 rounded border border-gray-100 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng SL hệ thống</span>
                <span className="font-semibold text-gray-700">{totalSystem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng SL thực tế</span>
                <span className="font-semibold text-gray-700">{totalActual}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-bold text-gray-700">Tổng chênh lệch</span>
                <span className={`font-bold ${totalDiff === 0 ? "text-gray-400" : totalDiff > 0 ? "text-green-600" : "text-red-500"}`}>
                  {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="mt-3 relative">
              <Icons.Comment className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-300" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú..."
                className="w-full pl-8 pr-3 pt-2 pb-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-400 resize-none h-20 bg-gray-50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
            <button onClick={() => handleSave("balanced")} disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition cursor-pointer text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Icons.Tick className="w-4 h-4" /> Cân bằng kho
            </button>
            <button onClick={() => handleSave("draft")} disabled={saving}
              className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition cursor-pointer text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Icons.Inventory className="w-4 h-4" /> Lưu tạm
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addItem} />
      <Toaster position="top-right" />
    </div>
  );
};

export default InventoryCheckCreate;
