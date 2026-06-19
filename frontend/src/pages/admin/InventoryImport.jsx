import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import * as XLSX from "xlsx";
import * as Icons from "../../assets/icons/index";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);

/* ─── Modal Thêm nhanh hàng hóa ──────────────────────────────────────── */
const QuickAddModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", group: "", unit: "", price: 0 });
  if (!isOpen) return null;

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên hàng hóa!");
    onSave({
      bien_the_id: null,
      sku: null,
      ten_hang: form.name,
      bien_the_mo_ta: [form.unit].filter(Boolean).join(" "),
      don_gia_nhap: Number(form.price) || 0,
      so_luong: 1,
      giam_gia: 0,
      _fromExcel: true,
    });
    setForm({ name: "", group: "", unit: "", price: 0 });
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
              <input readOnly value="Mã Tự động"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Tên hàng hóa <span className="text-red-500">*</span>
              </label>
              <input autoFocus type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nhóm hàng</label>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer">
                <option value="">-- Lựa chọn nhóm --</option>
                <option value="dien-tu">Điện tử</option>
                <option value="thoi-trang">Thời trang</option>
                <option value="phu-kien">Phụ kiện</option>
                <option value="do-uong">Đồ uống</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Đơn vị tính</label>
              <input type="text" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giá bán</label>
            <input type="number" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-right"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded font-semibold text-sm hover:bg-gray-50 cursor-pointer transition">
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

/* ─── Modal Thêm nhanh sản phẩm (search từ DB) ──────────────────────────── */
const QuickSearchModal = ({ isOpen, onClose, onAdd }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/phieu-nhap/search-bien-the?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(await res.json());
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, [q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="bg-blue-600 px-5 py-4 rounded-t-xl flex justify-between items-center">
          <h3 className="text-white font-bold">Tìm kiếm sản phẩm</h3>
          <button onClick={onClose} className="text-white hover:text-blue-200 text-xl cursor-pointer">✕</button>
        </div>
        <div className="p-4">
          <input autoFocus type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập mã SKU hoặc tên sản phẩm..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="mt-3 max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
            {loading && <div className="py-4 text-center text-gray-400 text-sm">Đang tìm...</div>}
            {!loading && results.length === 0 && q && (
              <div className="py-4 text-center text-gray-400 text-sm">Không tìm thấy sản phẩm.</div>
            )}
            {results.map((bt) => (
              <button key={bt.id} onClick={() => { onAdd(bt); setQ(""); setResults([]); }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer">
                <div className="font-semibold text-gray-800 text-sm">{bt.san_pham?.ten_san_pham || "Sản phẩm"}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  SKU: {bt.sku || "—"}
                  {bt.mau_sac && ` · ${bt.mau_sac}`}
                  {bt.dung_luong && ` · ${bt.dung_luong}`}
                  {bt.ram && ` · RAM ${bt.ram}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Component chính ────────────────────────────────────────────────────── */
const InventoryImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchInline, setSearchInline] = useState("");
  const [inlineResults, setInlineResults] = useState([]);
  const [loadingInline, setLoadingInline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const debounceRef = useRef(null);

  // Lấy danh sách NCC
  useEffect(() => {
    const fetchNCC = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/sanPham/nhaCungCap`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuppliers(await res.json());
      } catch { setSuppliers([]); }
    };
    fetchNCC();
  }, []);

  // Inline search debounce
  useEffect(() => {
    if (!searchInline.trim()) { setInlineResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingInline(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/phieu-nhap/search-bien-the?q=${encodeURIComponent(searchInline)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInlineResults(await res.json());
      } catch { setInlineResults([]); }
      finally { setLoadingInline(false); }
    }, 300);
  }, [searchInline]);

  const addItem = (bt) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bien_the_id === bt.id);
      if (existing) return prev.map((i) => i.bien_the_id === bt.id ? { ...i, so_luong: i.so_luong + 1 } : i);
      return [...prev, {
        bien_the_id: bt.id,
        sku: bt.sku,
        ten_hang: bt.san_pham?.ten_san_pham || "Sản phẩm",
        bien_the_mo_ta: [bt.mau_sac, bt.dung_luong, bt.ram].filter(Boolean).join(" / "),
        so_luong: 1,
        don_gia_nhap: 0,
        giam_gia: 0,
      }];
    });
    setSearchInline("");
    setInlineResults([]);
  };

  // ── Import Excel ───────────────────────────────────────
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const errors = [];
        const newItems = [];

        rows.forEach((row, idx) => {
          const sku = String(row["Mã SKU"] || row["sku"] || "").trim();
          const so_luong = parseInt(row["Số lượng"] || row["so_luong"] || 0);
          const don_gia_nhap = parseInt(row["Đơn giá nhập"] || row["don_gia_nhap"] || 0);

          if (!sku) { errors.push(`Dòng ${idx + 2}: Thiếu mã SKU`); return; }
          if (so_luong <= 0) { errors.push(`Dòng ${idx + 2}: Số lượng không hợp lệ (SKU: ${sku})`); return; }

          newItems.push({
            bien_the_id: null, // sẽ cần resolve sau nếu muốn full feature
            sku,
            ten_hang: String(row["Tên hàng"] || row["ten_hang"] || ""),
            bien_the_mo_ta: "",
            so_luong,
            don_gia_nhap,
            giam_gia: parseInt(row["Giảm giá"] || row["giam_gia"] || 0),
            _fromExcel: true,
          });
        });

        setImportErrors(errors);
        if (newItems.length > 0) setItems((prev) => [...prev, ...newItems]);
      } catch {
        setImportErrors(["File không hợp lệ. Vui lòng kiểm tra định dạng!"]);
      }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // ── Download template Excel ───────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Mã SKU": "SP001-DEN-256GB", "Tên hàng": "Tên sản phẩm", "Số lượng": 10, "Đơn giá nhập": 500000, "Giảm giá": 0 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "mau_nhap_kho.xlsx");
  };

  // ── Tính tổng ──────────────────────────────────────────
  const totalGoods = items.reduce((s, i) => s + i.so_luong * i.don_gia_nhap, 0);
  const totalDiscount = Number(discount) || 0;
  const totalPayable = totalGoods - totalDiscount;

  // ── Save ───────────────────────────────────────────────
  const handleSave = async (trang_thai) => {
    if (items.length === 0) { toast.error("Vui lòng thêm ít nhất 1 sản phẩm!"); return; }
    const hasNoId = items.some((i) => !i.bien_the_id);
    if (hasNoId) { toast.error("Có sản phẩm thiếu biến thể ID (từ file Excel chưa được khớp). Vui lòng tìm kiếm và thêm thủ công!"); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const payload = {
        nha_cc_id: supplierId || null,
        giam_gia: totalDiscount,
        ghi_chu: note,
        trang_thai,
        items: items.map((i) => ({
          bien_the_id: i.bien_the_id,
          so_luong: i.so_luong,
          don_gia_nhap: i.don_gia_nhap,
          giam_gia: i.giam_gia || 0,
        })),
      };

      const res = await fetch(`${BASE_URL}/api/phieu-nhap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Thành công",
          text: `${trang_thai === "completed" ? "Hoàn thành" : "Lưu tạm"} phiếu nhập ${data.data?.ma_phieu} thành công!`,
          icon: "success",
          confirmButtonColor: "#3b82f6", // Tailwind blue-500
          confirmButtonText: "Đồng ý",
          customClass: {
            popup: 'rounded-xl font-sans',
            title: 'text-lg font-bold text-gray-800',
            htmlContainer: 'text-sm text-gray-600',
          }
        }).then(() => {
          navigate("/admin/inventory");
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
        <button onClick={() => navigate("/admin/inventory")} className="text-gray-500 hover:text-gray-800 text-sm font-medium cursor-pointer">
          &lt; Quay lại danh sách
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <h1 className="text-base font-bold text-gray-800">Tạo phiếu nhập hàng</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden p-4 lg:p-5 gap-4 w-full">

        {/* ── Left: item table ─────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-w-0">

          {/* Search bar + button + */}
          <div className="p-3 border-b border-gray-100 flex gap-2 shrink-0 relative">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" value={searchInline}
                onChange={(e) => setSearchInline(e.target.value)}
                placeholder="Thêm hàng hóa vào phiếu nhập (Gõ mã hoặc tên)..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                autoComplete="off"
              />
              {/* Dropdown results */}
              {(inlineResults.length > 0 || loadingInline) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto mt-1">
                  {loadingInline && <div className="py-3 text-center text-gray-400 text-sm">Đang tìm...</div>}
                  {inlineResults.map((bt) => (
                    <button key={bt.id} onClick={() => addItem(bt)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 cursor-pointer">
                      <div className="font-semibold text-gray-800 text-sm">{bt.san_pham?.ten_san_pham || "Sản phẩm"}</div>
                      <div className="text-xs text-gray-400">SKU: {bt.sku || "—"}{bt.mau_sac && ` · ${bt.mau_sac}`}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setIsQuickAddOpen(true)} title="Thêm nhanh hàng hóa"
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
                  <th className="py-2.5 px-4 font-semibold text-center w-24">Số lượng</th>
                  <th className="py-2.5 px-4 font-semibold text-right w-36">Đơn giá nhập</th>
                  <th className="py-2.5 px-4 font-semibold text-right w-32">Thành tiền</th>
                  <th className="py-2.5 px-2 w-8" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="font-bold text-gray-600">Thêm sản phẩm vào phiếu nhập</p>
                        <p className="text-gray-400 text-xs">
                          Tìm kiếm ở trên hoặc{" "}
                          <button onClick={downloadTemplate} className="text-blue-500 hover:underline cursor-pointer">tải file mẫu Excel</button>
                          {" "}và nhập từ file
                        </p>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
                        <button onClick={() => fileInputRef.current?.click()}
                          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded font-semibold flex items-center gap-2 text-sm cursor-pointer transition">
                          ↑ Chọn file dữ liệu
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {items.map((item, idx) => (
                      <tr key={`${item.bien_the_id}-${idx}`} className={`border-b border-gray-100 hover:bg-gray-50 ${item._fromExcel && !item.bien_the_id ? "bg-yellow-50" : ""}`}>
                        <td className="py-2.5 px-4 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-blue-600 text-xs">{item.sku || <span className="text-yellow-600">⚠ Chưa khớp</span>}</td>
                        <td className="py-2.5 px-4 text-gray-800">
                          {item.ten_hang}
                          {item.bien_the_mo_ta && <span className="text-xs text-gray-400 ml-1">/ {item.bien_the_mo_ta}</span>}
                        </td>
                        <td className="py-2.5 px-4">
                          <input type="number" min="1" value={item.so_luong}
                            onChange={(e) => setItems(items.map((i, ii) => ii === idx ? { ...i, so_luong: parseInt(e.target.value) || 1 } : i))}
                            className="w-full text-center border border-gray-300 rounded py-1 focus:border-blue-500 outline-none text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input type="number" min="0" value={item.don_gia_nhap}
                            onChange={(e) => setItems(items.map((i, ii) => ii === idx ? { ...i, don_gia_nhap: parseInt(e.target.value) || 0 } : i))}
                            className="w-full text-right border border-gray-300 rounded py-1 focus:border-blue-500 outline-none text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-gray-800">{fmt(item.so_luong * item.don_gia_nhap)}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button onClick={() => setItems(items.filter((_, ii) => ii !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <Icons.Delete className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Upload more button inside table */}
                    <tr>
                      <td colSpan="7" className="py-3 px-4 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-3">
                          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
                          <button onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer font-medium">
                            ↑ Thêm từ file Excel
                          </button>
                          <button onClick={downloadTemplate} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">Tải file mẫu</button>
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Import errors */}
          {importErrors.length > 0 && (
            <div className="p-4 border-t border-red-100 bg-red-50">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-red-600">⚠ Phát hiện {importErrors.length} lỗi trong file:</p>
                <button onClick={() => setImportErrors([])} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">Đóng</button>
              </div>
              <ul className="space-y-1">
                {importErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600">• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: info panel ────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-1">
            {/* Admin + time */}
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-semibold text-gray-700">Admin</span>
              <span className="text-gray-400 text-xs">{new Date().toLocaleString("vi-VN")}</span>
            </div>

            {/* Supplier */}
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white mb-3 cursor-pointer">
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              {suppliers.map((ncc) => (
                <option key={ncc.id} value={ncc.id}>{ncc.ten_nha_cc}</option>
              ))}
            </select>

            {/* Info rows */}
            <div className="space-y-0 text-sm divide-y divide-dashed divide-gray-200">
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">Mã phiếu nhập</span>
                <span className="text-gray-400 italic text-xs">Mã phiếu tự động</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">Trạng thái</span>
                <span className="font-semibold text-yellow-600">Phiếu tạm</span>
              </div>
              <div className="flex justify-between py-2.5 items-center">
                <span className="text-gray-600 font-medium">
                  Tổng tiền hàng
                  <span className="ml-1 bg-gray-100 text-gray-500 px-1.5 rounded text-xs">{items.length}</span>
                </span>
                <span className="font-bold text-gray-800">{fmt(totalGoods)}</span>
              </div>
              <div className="flex justify-between py-2.5 items-center">
                <span className="text-gray-500">Giảm giá</span>
                <input type="number" value={discount} min={0}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-24 text-right border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm font-medium"
                />
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-bold text-gray-800">Cần trả nhà cung cấp</span>
                <span className="font-bold text-blue-600">{fmt(totalPayable)}</span>
              </div>
            </div>

            {/* Note */}
            <div className="mt-3 relative">
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú..."
                className="w-full px-3 pt-2 pb-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-400 resize-none h-20 bg-gray-50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <button onClick={() => handleSave("draft")} disabled={saving}
              className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition cursor-pointer text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Icons.Inventory className="w-4 h-4" /> Lưu tạm
            </button>
            <button onClick={() => handleSave("completed")} disabled={saving}
              className="flex-1 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition cursor-pointer text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Icons.Tick className="w-4 h-4" /> Hoàn thành
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal (nhấn nút +) */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)}
        onSave={(item) => setItems((prev) => [...prev, item])} />

      {/* Search Modal (nếu muốn tìm từ DB) */}
      <QuickSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onAdd={addItem} />
      <Toaster position="top-right" />
    </div>
  );
};

export default InventoryImport;
