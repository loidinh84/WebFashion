import React, { forwardRef } from "react";
import DynamicPrintTemplate from "../../components/DynamicPrintTemplate";

// Chuyển đổi dữ liệu đơn hàng sang các key {PLACEHOLDER} mà template JSON dùng
const InvoiceTemplate = forwardRef(({ order }, ref) => {
  const preparePrintData = () => {
    if (!order) return null;
    return {
      TEN_CUA_HANG: "LGBTSHOP - THƯƠNG MẠI ĐIỆN TỬ",
      DIA_CHI: "123 Đường 3/2, Quận Ninh Kiều, TP. Cần Thơ",
      SDT: "0333 914 513",
      MA_DON_HANG: order.id || order.ma_don_hang || "",
      NGAY_IN: new Date().toLocaleString("vi-VN"),
      TEN_KHACH_HANG: order.customerName || order.ten_khach_hang || "",
      SDT_KH: order.phone || order.sdt || "",
      DIA_CHI_KH: order.address || order.dia_chi || "",
      TONG_THANH_TOAN: new Intl.NumberFormat("vi-VN").format(order.total || 0) + " đ",
      TONG_TIEN_HANG: new Intl.NumberFormat("vi-VN").format(
        (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
      ) + " đ",
      PHI_VAN_CHUYEN: new Intl.NumberFormat("vi-VN").format(order.shippingFee || order.phi_van_chuyen || 0) + " đ",
      GIAM_GIA: new Intl.NumberFormat("vi-VN").format(order.discount || order.giam_gia || 0) + " đ",
      items: (order.items || []).map((item) => ({
        TEN_SP: item.name + (item.variant ? ` (${item.variant})` : ""),
        SL: item.qty || 1,
        DON_GIA: new Intl.NumberFormat("vi-VN").format(item.price || 0),
        THANH_TIEN: new Intl.NumberFormat("vi-VN").format((item.price || 0) * (item.qty || 1)),
      })),
    };
  };

  return (
    <DynamicPrintTemplate
      ref={ref}
      templateCode="ORDER_INVOICE"
      data={preparePrintData()}
    />
  );
});

export default InvoiceTemplate;
