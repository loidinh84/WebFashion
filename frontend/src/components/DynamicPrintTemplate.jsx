import React, { useState, useEffect, forwardRef } from "react";
import axios from "axios";
import BASE_URL from "../config/api";

const parseTemplate = (templateStr, dataObj) => {
  if (!templateStr || typeof templateStr !== 'string') return "";
  return templateStr.replace(/\{(\w+)\}/g, (match, key) => {
    return dataObj && dataObj[key] !== undefined ? dataObj[key] : match;
  });
};

const DynamicPrintTemplate = forwardRef(({ templateCode, data }, ref) => {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/mau-in/${templateCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTemplate(res.data);
      } catch (error) {
        // Chỉ log lỗi thật sự, bỏ qua 404 (chưa có mẫu trong DB)
        if (error?.response?.status !== 404) {
          console.error("Lỗi khi tải mẫu in:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (templateCode) {
      fetchTemplate();
    }
  }, [templateCode]);

  // Handle loading and missing states by still passing the ref
  if (isLoading) return <div ref={ref} className="p-4 text-center text-xs text-gray-400">Đang tải mẫu in...</div>;
  // Nếu không tìm thấy template (404), trả về vùng trắng nhỏ để ref vẫn tồn tại
  if (!template) return <div ref={ref} />;

  const noiDung = template.noi_dung_html || template.noi_dung || "";
  
  // Kiểm tra nếu là JSON (Mẫu in kéo thả mới)
  if (noiDung.trim().startsWith("{")) {
    try {
      const labels = JSON.parse(noiDung);
      return (
        <div ref={ref} className="print-container relative w-[380px] bg-white font-sans text-black" style={{ minHeight: '800px' }}>
          <style>
            {`
              @media print {
                @page { margin: 0; }
                body { margin: 0; }
              }
            `}
          </style>
          {Object.entries(labels).map(([key, label]) => {
            // Render danh sách sản phẩm (items table values)
            const orderItemKeys = ["lblItemVal", "lblQtyVal", "lblPriceVal", "lblTotalItemVal"];
            const importItemKeys = ["irSKU", "irTenHang", "irSL", "irDonGia", "irThanhTien"];
            const checkItemKeys = ["crTenSP", "crSLHT", "crSLTT", "crCL"];

            const isItemKey = data && data.items && (
              orderItemKeys.includes(key) ||
              importItemKeys.includes(key) ||
              checkItemKeys.includes(key)
            );

            if (isItemKey) {
              return data.items.map((item, idx) => {
                const itemLabel = { ...label, top: (label.top || 0) + idx * 20, text: parseTemplate(label.text, item) };
                const style = {
                  position: "absolute",
                  top: `${itemLabel.top || 0}px`,
                  left: `${itemLabel.left || 0}px`,
                  width: itemLabel.width ? (typeof itemLabel.width === "number" ? `${itemLabel.width}px` : itemLabel.width) : "auto",
                  textAlign: itemLabel.align || "left",
                  fontSize: `${itemLabel.fontSize || 12}px`,
                  fontWeight: itemLabel.bold ? "bold" : "normal",
                  fontStyle: itemLabel.italic ? "italic" : "normal",
                  whiteSpace: itemLabel.width && itemLabel.width < 100 ? "normal" : "nowrap",
                  fontFamily: "inherit",
                };
                return <div key={`${key}-${idx}`} style={style}>{itemLabel.text}</div>;
              });
            }
            
            // Các label thông thường
            const style = {
              position: "absolute",
              top: `${label.top || 0}px`,
              left: `${label.left || 0}px`,
              width: label.width ? (typeof label.width === "number" ? `${label.width}px` : label.width) : "auto",
              textAlign: label.align || "left",
              fontSize: `${label.fontSize || 12}px`,
              fontWeight: label.bold ? "bold" : "normal",
              fontStyle: label.italic ? "italic" : "normal",
              whiteSpace: label.width && label.width < 100 ? "normal" : "nowrap",
              fontFamily: "inherit",
            };
            
            return (
              <div key={key} style={style}>
                {parseTemplate(label.text, data)}
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      console.error("Lỗi khi parse JSON mẫu in", e);
      return <div ref={ref} className="text-red-500">Mẫu in bị lỗi định dạng (JSON parse error).</div>;
    }
  }

  // Fallback về HTML cũ (dành cho các mẫu in phiên bản cũ nếu có)
  const processContentHtml = () => {
    let html = noiDung;

    // Thay thế các biến đơn giản {{variable}}
    const flatData = { ...data };
    Object.keys(flatData).forEach(key => {
      const val = flatData[key];
      if (typeof val !== "object") {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        html = html.replace(regex, val);
      }
    });

    // Xử lý vòng lặp items (rất cơ bản)
    if (html.includes("{{#items}}") && Array.isArray(data.items)) {
      const loopMatch = html.match(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/);
      if (loopMatch) {
        const itemTemplate = loopMatch[1];
        const itemsHtml = data.items.map((item, idx) => {
          let itemHtml = itemTemplate.replace(/\{\{stt\}\}/g, idx + 1);
          Object.keys(item).forEach(k => {
            const r = new RegExp(`\\{\\{${k}\\}\\}`, "g");
            itemHtml = itemHtml.replace(r, item[k]);
          });
          return itemHtml;
        }).join("");
        html = html.replace(loopMatch[0], itemsHtml);
      }
    }

    return html;
  };

  return (
    <div ref={ref} className="print-container">
      <style>{template.css}</style>
      <div dangerouslySetInnerHTML={{ __html: processContentHtml() }} />
    </div>
  );
});

export default DynamicPrintTemplate;
