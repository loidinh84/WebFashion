import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import { useReactToPrint } from "react-to-print";
import DynamicPrintTemplate from "../../components/DynamicPrintTemplate";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);

const STATUS_MAP = {
  draft: { label: "Phiếu tạm", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  completed: { label: "Đã nhập hàng", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border whitespace-nowrap ${s.color}`}>
      {s.label}
    </span>
  );
};

const Inventory = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const printRef = React.useRef();

  // Filters
  const [searchMa, setSearchMa] = useState("");
  const [searchHang, setSearchHang] = useState("");
  const [searchNcc, setSearchNcc] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // all | today | custom
  const [ngayTu, setNgayTu] = useState("");
  const [ngayDen, setNgayDen] = useState("");
  const [statusFilters, setStatusFilters] = useState({ draft: false, completed: false, cancelled: false });

  const LIMIT = 20;

  // ── Fetch list ─────────────────────────────────────────
  const fetchData = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("page", p);
      params.set("limit", LIMIT);
      if (searchMa) params.set("search_ma", searchMa);
      if (searchHang) params.set("search_hang", searchHang);
      if (searchNcc) params.set("search_ncc", searchNcc);

      const selected = Object.keys(statusFilters).filter((k) => statusFilters[k]);
      if (selected.length) params.set("trang_thai", selected.join(","));

      let tu = ngayTu, den = ngayDen;
      if (timeFilter === "today") {
        const d = new Date().toISOString().split("T")[0];
        tu = d; den = d;
      }
      if (tu) params.set("ngay_tu", tu);
      if (den) params.set("ngay_den", den);

      const res = await fetch(`${BASE_URL}/api/phieu-nhap?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchMa, searchHang, searchNcc, statusFilters, timeFilter, ngayTu, ngayDen]);

  useEffect(() => { fetchData(1); setPage(1); }, [searchMa, searchHang, searchNcc, statusFilters, timeFilter, ngayTu, ngayDen]);
  useEffect(() => { fetchData(page); }, [page]);

  // Fetch store info for printing
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/store-settings`, { headers: { Authorization: `Bearer ${token}` } });
        setStoreInfo(await res.json());
      } catch { }
    };
    fetchStore();
  }, []);

  // ── Fetch detail ───────────────────────────────────────
  const handleToggleRow = async (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    setExpandedId(id);
    setExpandedDetail(null);
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/phieu-nhap/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setExpandedDetail(json);
    } catch { setExpandedDetail(null); }
    finally { setLoadingDetail(false); }
  };

  // ── Cancel phiếu ──────────────────────────────────────
  const handleCancel = async (id, e) => {
    e.stopPropagation();
    Swal.fire({
      title: "Hủy phiếu nhập",
      text: "Bạn có chắc chắn muốn hủy phiếu nhập này? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy bỏ",
      customClass: {
        popup: 'rounded-xl font-sans',
        title: 'text-lg font-bold text-gray-800',
        htmlContainer: 'text-sm text-gray-600',
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          const res = await fetch(`${BASE_URL}/api/phieu-nhap/${id}/cancel`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (res.ok) {
            toast.success("Đã hủy phiếu nhập thành công!");
            fetchData(page);
            if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
          } else {
            toast.error(json.message || "Lỗi khi hủy phiếu!");
          }
        } catch {
          toast.error("Lỗi khi hủy phiếu!");
        }
      }
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PhieuNhap_${expandedDetail?.ma_phieu || ""}`,
  });

  const preparePrintData = () => {
    if (!expandedDetail) return null;
    return {
      TEN_CUA_HANG: storeInfo?.ten_cua_hang || "Tên Cửa Hàng",
      DIA_CHI: storeInfo?.dia_chi || "Địa chỉ cửa hàng",
      SDT: storeInfo?.so_dien_thoai || "Số điện thoại",
      MA_PHIEU_NHAP: expandedDetail.ma_phieu,
      NGAY_NHAP: new Date(expandedDetail.created_at).toLocaleString("vi-VN"),
      NHA_CUNG_CAP: expandedDetail.nha_cung_cap?.ten_nha_cc || "—",
      GHI_CHU: expandedDetail.ghi_chu || "—",
      TONG_TIEN_HANG: fmt(expandedDetail.tong_tien + Number(expandedDetail.giam_gia)) + " đ",
      GIAM_GIA_PHIEU: fmt(expandedDetail.giam_gia) + " đ",
      CAN_TRA_NCC: fmt(expandedDetail.tong_tien) + " đ",
      items: expandedDetail.chi_tiet?.map(ct => ({
        SKU: ct.bien_the?.sku || ct.bien_the_id,
        TEN_HANG: (ct.bien_the?.san_pham?.ten_san_pham || "") + (ct.bien_the?.mau_sac ? ` / ${ct.bien_the.mau_sac}` : ""),
        SL: ct.so_luong,
        DON_GIA_NHAP: fmt(ct.don_gia_nhap),
        THANH_TIEN: fmt(ct.so_luong * ct.don_gia_nhap - (ct.giam_gia || 0))
      })) || []
    };
  };

  // ── Status filter toggle ───────────────────────────────
  const toggleStatus = (key) => setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden font-sans">
      <div className="flex w-full h-full p-4 lg:p-5 gap-4 lg:gap-5">

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <div className="w-60 shrink-0 flex flex-col gap-3 overflow-y-auto hide-scrollbar pb-4">

          {/* Tìm kiếm */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Tìm kiếm</h3>
            <div className="space-y-2">
              <input
                type="text" placeholder="Theo mã phiếu nhập"
                value={searchMa} onChange={(e) => setSearchMa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
              <input
                type="text" placeholder="Theo mã, tên hàng"
                value={searchHang} onChange={(e) => setSearchHang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
              <input
                type="text" placeholder="Theo mã, tên NCC"
                value={searchNcc} onChange={(e) => setSearchNcc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Thời gian */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Thời gian</h3>
            <div className="space-y-1.5">
              {[
                { value: "all", label: "Tất cả" },
                { value: "today", label: "Hôm nay" },
                { value: "custom", label: "Lựa chọn khác" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio" name="time" value={opt.value}
                    checked={timeFilter === opt.value}
                    onChange={() => { setTimeFilter(opt.value); if (opt.value !== "custom") { setNgayTu(""); setNgayDen(""); } }}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {timeFilter === "custom" && (
              <div className="mt-3 space-y-2">
                <input type="date" value={ngayTu} onChange={(e) => setNgayTu(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                />
                <input type="date" value={ngayDen} min={ngayTu} onChange={(e) => setNgayDen(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Trạng thái */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Trạng thái</h3>
            <div className="space-y-1.5">
              {[
                { key: "draft", label: "Phiếu tạm" },
                { key: "completed", label: "Đã nhập hàng" },
                { key: "cancelled", label: "Đã hủy" },
              ].map((s) => (
                <label key={s.key} className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox" checked={statusFilters[s.key]}
                    onChange={() => toggleStatus(s.key)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN TABLE ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">

          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-800">Phiếu nhập hàng</h2>
            <button
              onClick={() => navigate("/admin/inventory/import")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm cursor-pointer transition-colors flex items-center gap-2"
            >
              + Nhập hàng
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-[#e3f2fd] text-[#1565c0] z-10">
                <tr>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Mã phiếu nhập</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Thời gian</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Nhà cung cấp</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-right">Tổng tiền</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {isLoading ? (
                  <tr><td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan="5" className="py-16 text-center text-gray-400">Không có phiếu nhập nào.</td></tr>
                ) : data.map((row) => {
                  const isExp = expandedId === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => handleToggleRow(row.id)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors ${isExp ? "bg-blue-50" : "hover:bg-blue-50/40 bg-white"}`}
                      >
                        <td className="py-3.5 px-5 font-bold text-blue-700">{row.ma_phieu}</td>
                        <td className="py-3.5 px-5 text-gray-600">
                          {new Date(row.created_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-5">{row.nha_cung_cap?.ten_nha_cc || <span className="text-gray-400 italic">Chưa chọn</span>}</td>
                        <td className="py-3.5 px-5 text-right font-semibold">{fmt(row.tong_tien)} đ</td>
                        <td className="py-3.5 px-5 text-center"><StatusBadge status={row.trang_thai} /></td>
                      </tr>

                      {/* Detail row */}
                      {isExp && (
                        <tr className="border-b border-blue-100">
                          <td colSpan="5" className="p-0">
                            <div className="bg-white border-t-2 border-blue-400">
                              {/* Tab bar */}
                              <div className="flex border-b border-gray-200 px-6">
                                <button className="py-2.5 px-4 text-sm font-bold text-blue-600 border-b-2 border-blue-500 -mb-px">
                                  Thông tin
                                </button>
                              </div>

                              {loadingDetail ? (
                                <div className="py-8 text-center text-gray-400 text-sm">Đang tải chi tiết...</div>
                              ) : expandedDetail ? (
                                <div className="p-5">
                                  {/* Header grid */}
                                  <div className="grid grid-cols-3 gap-6 mb-4 text-sm">
                                    <div className="space-y-1.5">
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Mã phiếu:</span><span className="font-semibold">{expandedDetail.ma_phieu}</span></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Thời gian:</span><span>{new Date(expandedDetail.created_at).toLocaleString("vi-VN")}</span></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Nhà cung cấp:</span><span className="text-blue-600 font-medium">{expandedDetail.nha_cung_cap?.ten_nha_cc || "—"}</span></div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Trạng thái:</span><StatusBadge status={expandedDetail.trang_thai} /></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Người tạo:</span><span>{expandedDetail.nguoi_tao_tk?.ho_ten || "Admin"}</span></div>
                                    </div>
                                    <textarea readOnly value={expandedDetail.ghi_chu || ""} placeholder="Ghi chú..."
                                      className="w-full h-20 border border-gray-200 rounded p-2 text-sm text-gray-500 bg-gray-50 resize-none outline-none"
                                    />
                                  </div>

                                  {/* Chi tiết sản phẩm */}
                                  <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-600">
                                      <tr>
                                        <th className="py-2 px-4 text-left font-semibold border-b border-gray-200">Mã hàng hóa</th>
                                        <th className="py-2 px-4 text-left font-semibold border-b border-gray-200">Tên hàng</th>
                                        <th className="py-2 px-4 text-center font-semibold border-b border-gray-200 w-20">SL</th>
                                        <th className="py-2 px-4 text-right font-semibold border-b border-gray-200 w-32">Đơn giá nhập</th>
                                        <th className="py-2 px-4 text-right font-semibold border-b border-gray-200 w-24">Giảm giá</th>
                                        <th className="py-2 px-4 text-right font-semibold border-b border-gray-200 w-32">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedDetail.chi_tiet?.length > 0 ? expandedDetail.chi_tiet.map((ct) => {
                                        const thanh_tien = ct.so_luong * ct.don_gia_nhap - (ct.giam_gia || 0);
                                        return (
                                          <tr key={ct.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-2.5 px-4 text-gray-500">{ct.bien_the?.sku || ct.bien_the_id}</td>
                                            <td className="py-2.5 px-4 text-gray-800">
                                              {ct.bien_the?.san_pham?.ten_san_pham || "—"}
                                              {ct.bien_the?.mau_sac && <span className="text-gray-400 ml-1">/ {ct.bien_the.mau_sac}</span>}
                                            </td>
                                            <td className="py-2.5 px-4 text-center">{ct.so_luong}</td>
                                            <td className="py-2.5 px-4 text-right">{fmt(ct.don_gia_nhap)}</td>
                                            <td className="py-2.5 px-4 text-right">{fmt(ct.giam_gia)}</td>
                                            <td className="py-2.5 px-4 text-right font-semibold">{fmt(thanh_tien)}</td>
                                          </tr>
                                        );
                                      }) : (
                                        <tr><td colSpan="6" className="py-6 text-center text-gray-400 italic">Chưa có hàng hóa.</td></tr>
                                      )}
                                    </tbody>
                                  </table>

                                  {/* Totals + Actions */}
                                  <div className="flex justify-between items-end mt-4">
                                    <div className="flex gap-2">
                                      {expandedDetail.trang_thai === "draft" && (
                                        <button onClick={(e) => handleCancel(expandedDetail.id, e)}
                                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold cursor-pointer transition">
                                          Hủy phiếu
                                        </button>
                                      )}
                                      <button onClick={handlePrint}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold cursor-pointer transition flex items-center gap-1.5">
                                        In phiếu nhập
                                      </button>
                                    </div>
                                    <div className="text-sm space-y-1 min-w-[240px]">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Tổng tiền hàng:</span>
                                        <span className="font-semibold">{fmt(expandedDetail.tong_tien + Number(expandedDetail.giam_gia))} đ</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Giảm giá phiếu:</span>
                                        <span className="font-semibold">{fmt(expandedDetail.giam_gia)} đ</span>
                                      </div>
                                      <div className="flex justify-between border-t border-gray-200 pt-1.5">
                                        <span className="font-bold text-gray-700">Thực trả NCC:</span>
                                        <span className="font-bold text-blue-600">{fmt(expandedDetail.tong_tien)} đ</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-6 text-center text-gray-400 text-sm">Không thể tải chi tiết.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 bg-white flex justify-between items-center text-sm text-gray-500 shrink-0">
            <span>Hiển thị <strong className="text-gray-800">{data.length}</strong> / {total} phiếu</span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded font-medium border cursor-pointer ${page === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">»</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "none" }}>
        <DynamicPrintTemplate
          ref={printRef}
          templateCode="IMPORT_RECEIPT"
          data={preparePrintData()}
        />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Inventory;
