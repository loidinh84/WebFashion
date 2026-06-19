import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../config/api";
import { Bill, Tick } from "../../assets/icons/index";

const PrintTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/mau-in`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates(res.data);
      if (res.data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(res.data[0]);
      } else if (selectedTemplate) {
        const updated = res.data.find(t => t.loai === selectedTemplate.loai);
        if (updated) setSelectedTemplate(updated);
      }
    } catch (error) {
      console.error("Lỗi khi tải mẫu in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(`${BASE_URL}/api/mau-in`, selectedTemplate, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Đã lưu mẫu in thành công!");
      fetchTemplates();
    } catch {
      alert("Lỗi khi lưu mẫu in!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitDefaults = async () => {
    if (!window.confirm("Bạn có muốn khởi tạo lại các mẫu mặc định? Các thay đổi hiện tại có thể bị mất nếu chưa lưu.")) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.get(`${BASE_URL}/api/mau-in/init-defaults`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
    } catch {
      alert("Lỗi khi khởi tạo mẫu mặc định!");
    }
  };

  const renderPreview = () => {
    if (!selectedTemplate) return "";
    let html = selectedTemplate.noi_dung_html || "";
    
    // Simple variable replacement logic
    const mockData = {
      shop_name: "LTL STORE",
      shop_address: "123 Đường 3/2, Cần Thơ",
      shop_phone: "0333 914 513",
      order_id: "DH123456",
      date: new Date().toLocaleDateString("vi-VN"),
      customer_name: "Nguyễn Văn A",
      customer_phone: "0987654321",
      customer_address: "Ninh Kiều, Cần Thơ",
      total_amount: "1.500.000 đ",
      import_id: "PN001",
      provider_name: "Samsung Vietnam",
      check_id: "PK001"
    };

    // Replace basic variables
    Object.keys(mockData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, mockData[key]);
    });

    // Handle items loop (very basic)
    if (html.includes("{{#items}}")) {
      const itemsHtml = `
        <tr class="item"><td>Sản phẩm mẫu 1 x 1</td><td>1.000.000 đ</td></tr>
        <tr class="item"><td>Sản phẩm mẫu 2 x 1</td><td>500.000 đ</td></tr>
      `;
      html = html.replace(/{{#items}}[\s\S]*?{{\/items}}/, itemsHtml);
    }

    return `
      <style>${selectedTemplate.css || ""}</style>
      <div class="preview-content">
        ${html}
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Bill className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quản lý Mẫu in</h1>
            <p className="text-xs text-gray-500">Tùy chỉnh giao diện hóa đơn và phiếu in hệ thống</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleInitDefaults}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
          >
            Mẫu mặc định
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:bg-gray-400"
          >
            {isSaving ? "Đang lưu..." : (
              <>
                <Tick className="w-4 h-4" /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left: Sidebar + Editor */}
        <div className="w-1/2 flex flex-col gap-4 overflow-hidden">
          {/* Template Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Chọn loại mẫu in</h3>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button
                  key={t.loai}
                  onClick={() => setSelectedTemplate(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    selectedTemplate?.loai === t.loai 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {t.ten_mau}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          {selectedTemplate && (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button className="px-6 py-3 text-sm font-bold border-b-2 border-blue-600 text-blue-600">HTML Content</button>
                <div className="flex-1 bg-gray-50"></div>
              </div>
              <div className="flex-1 p-0 flex flex-col overflow-hidden">
                <textarea
                  className="flex-1 p-4 font-mono text-sm focus:outline-none resize-none bg-[#1e293b] text-gray-100"
                  value={selectedTemplate.noi_dung_html || ""}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, noi_dung_html: e.target.value})}
                  spellCheck="false"
                />
                <div className="h-48 border-t border-gray-200 flex flex-col">
                   <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Custom CSS</div>
                   <textarea
                    className="flex-1 p-4 font-mono text-sm focus:outline-none resize-none bg-[#0f172a] text-blue-300"
                    value={selectedTemplate.css || ""}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, css: e.target.value})}
                    spellCheck="false"
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border-t border-blue-100 text-[11px] text-blue-700 leading-relaxed">
                <strong>Gợi ý:</strong> Sử dụng <code>{"{{variable_name}}"}</code> để chèn dữ liệu động. Ví dụ: <code>{"{{customer_name}}"}</code>, <code>{"{{order_id}}"}</code>, <code>{"{{total_amount}}"}</code>.
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Xem trước kết quả</h3>
             <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">LIVE PREVIEW</span>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-gray-200/50 flex justify-center">
            <div 
              className="bg-white shadow-2xl origin-top transition-transform duration-300 min-h-[297mm] w-[210mm] p-[10mm]"
              style={{ transform: "scale(0.85)" }}
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate;
