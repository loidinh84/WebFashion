import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";
import ConfirmModal from "./ConfirmModal";
import { useReactToPrint } from "react-to-print";
import DynamicPrintTemplate from "../../components/DynamicPrintTemplate";
import toast, { Toaster } from "react-hot-toast";

const STATUS_MAP = {
  balanced: { label: "Đã cân bằng kho", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-500 border-red-200" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase border whitespace-nowrap ${s.color}`}>
      {s.label}
    </span>
  );
};

const renderDiff = (val) => {
  if (val === 0) return <span className="text-gray-400 font-bold">0</span>;
  if (val > 0) return <span className="text-green-600 font-bold">+{val}</span>;
  return <span className="text-red-500 font-bold">{val}</span>;
};

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

// ── COMPONENT ──────────────────────────────────────────────────────────────
const InventoryCheck = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [storeInfo, setStoreInfo] = useState(null);
  const printRef = React.useRef();
  const LIMIT = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, checkId: null });

  // ── Fetch list ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("trang_thai", filterStatus);
      if (filterDateFrom) params.set("ngay_tu", filterDateFrom);
      if (filterDateTo) params.set("ngay_den", filterDateTo);

      const res = await fetch(`${BASE_URL}/api/kiem-kho?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      setChecks(json.data || []);
      setTotal(json.total || 0);
    } catch { setChecks([]); }
    finally { setIsLoading(false); }
  }, [searchTerm, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchData(1); setPage(1); }, [fetchData]);

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

  // ── Fetch detail ────────────────────────────────────────────────────────
  const handleToggleRow = async (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    setExpandedId(id);
    setExpandedDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${BASE_URL}/api/kiem-kho/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setExpandedDetail(await res.json());
    } catch { setExpandedDetail(null); }
    finally { setLoadingDetail(false); }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    try {
      await fetch(`${BASE_URL}/api/kiem-kho/${confirmModal.checkId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Đã hủy phiếu kiểm kho!");
      fetchData(page);
      if (expandedId === confirmModal.checkId) { setExpandedId(null); setExpandedDetail(null); }
    } catch { toast.error("Lỗi khi hủy phiếu!"); }
    setConfirmModal({ isOpen: false, checkId: null });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PhieuKiem_${expandedDetail?.ma_phieu || ""}`,
  });

  const preparePrintData = () => {
    if (!expandedDetail) return null;
    return {
      TEN_CUA_HANG: storeInfo?.ten_cua_hang || "Tên Cửa Hàng",
      DIA_CHI: storeInfo?.dia_chi || "Địa chỉ cửa hàng",
      SDT: storeInfo?.so_dien_thoai || "Số điện thoại",
      MA_PHIEU_KK: expandedDetail.ma_phieu,
      NGAY_KIEM: new Date(expandedDetail.created_at).toLocaleString("vi-VN"),
      NGUOI_KIEM: expandedDetail.nguoi_tao_tk?.ho_ten || "Admin",
      GHI_CHU: expandedDetail.ghi_chu || "—",
      items: expandedDetail.chi_tiet?.map(ct => ({
        TEN_SP: (ct.bien_the?.san_pham?.ten_san_pham || "") + (ct.bien_the?.mau_sac ? ` / ${ct.bien_the.mau_sac}` : ""),
        SL_HE_THONG: ct.so_luong_he_thong,
        SL_THUC_TE: ct.so_luong_thuc_te,
        CHENH_LECH: ct.so_luong_thuc_te - ct.so_luong_he_thong
      })) || []
    };
  };

  const hasFilter = filterStatus !== "all" || filterDateFrom || filterDateTo || searchTerm;
  const clearFilters = () => { setFilterStatus("all"); setFilterDateFrom(""); setFilterDateTo(""); setSearchTerm(""); };
  const totalPages = Math.ceil(total / LIMIT);
  const countByStatus = (val) => val === "all" ? total : checks.filter((c) => c.trang_thai === val).length;

  return (
    <div className="flex w-full h-full bg-[#f0f2f5] overflow-hidden font-sans">
      <div className="flex w-full h-full p-4 lg:p-5 gap-4 lg:gap-5">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="w-60 shrink-0 flex flex-col gap-3 overflow-y-auto pb-4">

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Tìm kiếm</h3>
            <input type="text" placeholder="Mã KK, ghi chú..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Trạng thái</h3>
            {[
              { value: "all", label: "Tất cả" },
              { value: "balanced", label: "Đã cân bằng kho" },
              { value: "cancelled", label: "Đã hủy" },
            ].map((item) => (
              <button key={item.value} onClick={() => setFilterStatus(item.value)}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer font-medium
                  ${filterStatus === item.value ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                <span>{item.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{countByStatus(item.value)}</span>
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Ngày kiểm kho</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Từ ngày</label>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Đến ngày</label>
                <input type="date" value={filterDateTo} min={filterDateFrom} onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN TABLE ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">

          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-800">Lịch sử Kiểm kho</h2>
            <button onClick={() => navigate("/admin/inventory-check/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm cursor-pointer transition-colors flex items-center gap-1.5">
              <Icons.Add className="w-4 h-4" /> Tạo phiếu kiểm kho
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-[#e3f2fd] text-[#1565c0] z-10">
                <tr>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Mã kiểm kho</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Thời gian</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-center">Tổng chênh lệch</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-center">Lệch tăng</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-center">Lệch giảm</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200">Ghi chú</th>
                  <th className="py-3 px-5 font-bold border-b border-blue-200 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {isLoading ? (
                  <tr><td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td></tr>
                ) : checks.length === 0 ? (
                  <tr><td colSpan="7" className="py-16 text-center text-gray-400">Không có phiếu kiểm kho nào.</td></tr>
                ) : checks.map((check) => {
                  const isExp = expandedId === check.id;
                  return (
                    <React.Fragment key={check.id}>
                      <tr onClick={() => handleToggleRow(check.id)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors ${isExp ? "bg-blue-50" : "hover:bg-blue-50/40 bg-white"} ${check.trang_thai === "cancelled" ? "opacity-60" : ""}`}>
                        <td className="py-3.5 px-5 font-bold text-blue-700">{check.ma_phieu}</td>
                        <td className="py-3.5 px-5 text-gray-600">{new Date(check.created_at).toLocaleString("vi-VN")}</td>
                        <td className="py-3.5 px-5 text-center">{renderDiff(check.tong_chenh_lech)}</td>
                        <td className="py-3.5 px-5 text-center"><span className="text-green-600 font-bold">+{check.lenh_tang}</span></td>
                        <td className="py-3.5 px-5 text-center"><span className="text-red-500 font-bold">-{check.lenh_giam}</span></td>
                        <td className="py-3.5 px-5 text-gray-500 max-w-xs"><p className="truncate">{check.ghi_chu || "—"}</p></td>
                        <td className="py-3.5 px-5 text-center"><StatusBadge status={check.trang_thai} /></td>
                      </tr>

                      {isExp && (
                        <tr className="border-b border-blue-100">
                          <td colSpan="7" className="p-0">
                            <div className="bg-white border-t-2 border-blue-400">
                              <div className="flex border-b border-gray-200 px-6">
                                <button className="py-2.5 px-4 text-sm font-bold text-blue-600 border-b-2 border-blue-500 -mb-px cursor-default">Chi tiết</button>
                              </div>
                              {loadingDetail ? (
                                <div className="py-8 text-center text-gray-400 text-sm">Đang tải chi tiết...</div>
                              ) : expandedDetail ? (
                                <div className="p-5">
                                  <div className="grid grid-cols-2 gap-6 mb-4 text-sm">
                                    <div className="space-y-1.5">
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Mã phiếu:</span><span className="font-semibold">{expandedDetail.ma_phieu}</span></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Thời gian:</span><span>{new Date(expandedDetail.created_at).toLocaleString("vi-VN")}</span></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Người tạo:</span><span>{expandedDetail.nguoi_tao_tk?.ho_ten || "Admin"}</span></div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Trạng thái:</span><StatusBadge status={expandedDetail.trang_thai} /></div>
                                      <div className="flex gap-2"><span className="text-gray-400 w-28 shrink-0">Ghi chú:</span><span className="text-gray-600">{expandedDetail.ghi_chu || "—"}</span></div>
                                    </div>
                                  </div>

                                  <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-600">
                                      <tr>
                                        <th className="py-2 px-4 text-left font-semibold border-b border-gray-200">Mã SKU</th>
                                        <th className="py-2 px-4 text-left font-semibold border-b border-gray-200">Tên hàng</th>
                                        <th className="py-2 px-4 text-center font-semibold border-b border-gray-200 w-28">Tồn hệ thống</th>
                                        <th className="py-2 px-4 text-center font-semibold border-b border-gray-200 w-28">Thực tế</th>
                                        <th className="py-2 px-4 text-center font-semibold border-b border-gray-200 w-24">Chênh lệch</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedDetail.chi_tiet?.length > 0 ? expandedDetail.chi_tiet.map((ct) => {
                                        const cl = ct.so_luong_thuc_te - ct.so_luong_he_thong;
                                        return (
                                          <tr key={ct.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-2.5 px-4 text-gray-500">{ct.bien_the?.sku || "—"}</td>
                                            <td className="py-2.5 px-4 text-gray-800">
                                              {ct.bien_the?.san_pham?.ten_san_pham || "—"}
                                              {ct.bien_the?.mau_sac && <span className="text-gray-400 ml-1">/ {ct.bien_the.mau_sac}</span>}
                                            </td>
                                            <td className="py-2.5 px-4 text-center text-gray-600">{ct.so_luong_he_thong}</td>
                                            <td className="py-2.5 px-4 text-center font-semibold">{ct.so_luong_thuc_te}</td>
                                            <td className="py-2.5 px-4 text-center">{renderDiff(cl)}</td>
                                          </tr>
                                        );
                                      }) : (
                                        <tr><td colSpan="5" className="py-6 text-center text-gray-400 italic">Không có mặt hàng nào.</td></tr>
                                      )}
                                    </tbody>
                                  </table>

                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-2">
                                      {expandedDetail.trang_thai !== "cancelled" && (
                                        <button onClick={() => setConfirmModal({ isOpen: true, checkId: expandedDetail.id })}
                                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold cursor-pointer transition flex items-center gap-1.5">
                                          <Icons.Delete className="w-4 h-4" /> Hủy phiếu
                                        </button>
                                      )}
                                      <button onClick={handlePrint}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold cursor-pointer transition flex items-center gap-1.5">
                                        In phiếu kiểm
                                      </button>
                                    </div>
                                    <div className="text-sm space-y-1 min-w-[220px]">
                                      <div className="flex justify-between"><span className="text-gray-400">Lệch tăng:</span><span className="text-green-600 font-bold">+{expandedDetail.lenh_tang}</span></div>
                                      <div className="flex justify-between"><span className="text-gray-400">Lệch giảm:</span><span className="text-red-500 font-bold">-{expandedDetail.lenh_giam}</span></div>
                                      <div className="flex justify-between border-t border-gray-200 pt-1.5">
                                        <span className="font-bold text-gray-700">Tổng chênh lệch:</span>
                                        <span className="font-bold">{renderDiff(expandedDetail.tong_chenh_lech)}</span>
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

          <div className="px-5 py-3 border-t border-gray-100 bg-white flex justify-between items-center text-sm text-gray-500 shrink-0">
            <span>
              Hiển thị <strong className="text-gray-800">{checks.length}</strong> / {total} phiếu
              {hasFilter && (
                <button onClick={clearFilters} className="ml-4 text-blue-500 hover:text-blue-700 cursor-pointer text-xs font-medium">
                  ✕ Xóa bộ lọc
                </button>
              )}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded font-medium border cursor-pointer ${page === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2.5 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 cursor-pointer">»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hủy phiếu kiểm kho"
        message="Bạn có chắc chắn muốn hủy phiếu kiểm kho này? Hành động này không thể hoàn tác."
        type="danger"
        onCancel={() => setConfirmModal({ isOpen: false, checkId: null })}
        onConfirm={handleCancel}
      />

      <Toaster position="top-right" />
      <div style={{ display: "none" }}>
        <DynamicPrintTemplate
          ref={printRef}
          templateCode="CHECK_REPORT"
          data={preparePrintData()}
        />
      </div>
    </div>
  );
};

export default InventoryCheck;