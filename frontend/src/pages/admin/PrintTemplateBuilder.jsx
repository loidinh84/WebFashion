import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../../config/api";
import * as Icons from "../../assets/icons/index";

const TABS = ["ORDER_INVOICE", "IMPORT_RECEIPT", "CHECK_REPORT"];

const TAB_NAMES = {
  ORDER_INVOICE: "Hóa đơn bán hàng",
  IMPORT_RECEIPT: "Phiếu nhập hàng",
  CHECK_REPORT: "Phiếu kiểm kho",
};

const FIELD_CATALOG = {
  ORDER_INVOICE: [
    {
      group: "Thông tin cửa hàng",
      fields: [
        {
          label: "Tên cửa hàng",
          placeholder: "{TEN_CUA_HANG}",
          bold: true,
          align: "center",
          width: 380,
          left: 0,
          fontSize: 13,
        },
        {
          label: "Địa chỉ",
          placeholder: "{DIA_CHI}",
          align: "center",
          width: 380,
          left: 0,
          fontSize: 11,
        },
        {
          label: "Số điện thoại",
          placeholder: "{SDT}",
          align: "center",
          width: 380,
          left: 0,
          fontSize: 11,
        },
      ],
    },
    {
      group: "Thông tin đơn hàng",
      fields: [
        { label: "Mã đơn hàng", placeholder: "{MA_DON_HANG}", fontSize: 12 },
        {
          label: "Ngày in",
          placeholder: "{NGAY_IN}",
          fontSize: 11,
          bold: true,
        },
        {
          label: "Phương thức giao",
          placeholder: "{PHUONG_THUC_GIAO}",
          fontSize: 11,
        },
      ],
    },
    {
      group: "Thông tin khách hàng",
      fields: [
        {
          label: "Tên khách hàng",
          placeholder: "{TEN_KHACH_HANG}",
          fontSize: 11,
          bold: true,
        },
        { label: "SĐT khách hàng", placeholder: "{SDT_KH}", fontSize: 11 },
        { label: "Địa chỉ KH", placeholder: "{DIA_CHI_KH}", fontSize: 11 },
      ],
    },
    {
      group: "Tổng tiền",
      fields: [
        {
          label: "Tổng tiền hàng",
          placeholder: "{TONG_TIEN_HANG}",
          fontSize: 11,
          align: "right",
          width: 80,
        },
        {
          label: "Phí vận chuyển",
          placeholder: "{PHI_VAN_CHUYEN}",
          fontSize: 11,
          align: "right",
          width: 80,
        },
        {
          label: "Giảm giá",
          placeholder: "{GIAM_GIA}",
          fontSize: 11,
          align: "right",
          width: 80,
        },
        {
          label: "Tổng thanh toán",
          placeholder: "{TONG_THANH_TOAN}",
          fontSize: 14,
          bold: true,
          align: "right",
          width: 90,
        },
      ],
    },
    {
      group: "Văn bản tùy chỉnh",
      fields: [
        {
          label: "Tiêu đề (tùy chỉnh)",
          placeholder: "TIÊU ĐỀ",
          fontSize: 16,
          bold: true,
          align: "center",
          width: 380,
          left: 0,
        },
        {
          label: "Ghi chú / Cảm ơn",
          placeholder: "Cảm ơn quý khách!",
          fontSize: 10,
          italic: true,
          align: "center",
          width: 380,
          left: 0,
        },
        {
          label: "Chữ ký người bán",
          placeholder: "Người bán",
          fontSize: 11,
          align: "center",
        },
        {
          label: "Chữ ký người mua",
          placeholder: "Người mua",
          fontSize: 11,
          align: "center",
        },
        { label: "Văn bản trống", placeholder: "...", fontSize: 11 },
      ],
    },
  ],
  IMPORT_RECEIPT: [
    {
      group: "Thông tin cửa hàng",
      fields: [
        {
          label: "Tên cửa hàng",
          placeholder: "{TEN_CUA_HANG}",
          bold: true,
          align: "center",
          width: 380,
          left: 0,
          fontSize: 13,
        },
        {
          label: "Địa chỉ",
          placeholder: "{DIA_CHI}",
          align: "center",
          width: 380,
          left: 0,
          fontSize: 11,
        },
        {
          label: "Số điện thoại",
          placeholder: "{SDT}",
          align: "center",
          width: 380,
          left: 0,
          fontSize: 11,
        },
      ],
    },
    {
      group: "Thông tin phiếu nhập",
      fields: [
        {
          label: "Mã phiếu nhập",
          placeholder: "{MA_PHIEU_NHAP}",
          fontSize: 12,
          bold: true,
        },
        {
          label: "Ngày nhập",
          placeholder: "{NGAY_NHAP}",
          fontSize: 11,
          bold: true,
        },
        {
          label: "Nhà cung cấp",
          placeholder: "{NHA_CUNG_CAP}",
          fontSize: 11,
          bold: true,
        },
      ],
    },
    {
      group: "Bảng sản phẩm",
      fields: [
        { label: "Dữ liệu: Mã SKU", placeholder: "{SKU}", fontSize: 10 },
        { label: "Dữ liệu: Tên hàng", placeholder: "{TEN_HANG}", fontSize: 10 },
        {
          label: "Dữ liệu: SL",
          placeholder: "{SL}",
          fontSize: 10,
          align: "center",
        },
        {
          label: "Dữ liệu: Đơn giá nhập",
          placeholder: "{DON_GIA_NHAP}",
          fontSize: 10,
          align: "right",
        },
        {
          label: "Dữ liệu: Thành tiền",
          placeholder: "{THANH_TIEN}",
          fontSize: 10,
          align: "right",
        },
      ],
    },
    {
      group: "Tổng tiền",
      fields: [
        {
          label: "Tổng tiền hàng",
          placeholder: "{TONG_TIEN_HANG}",
          fontSize: 11,
        },
        {
          label: "Giảm giá phiếu",
          placeholder: "{GIAM_GIA_PHIEU}",
          fontSize: 11,
        },
        {
          label: "Cần trả NCC",
          placeholder: "{CAN_TRA_NCC}",
          fontSize: 14,
          bold: true,
        },
      ],
    },
    {
      group: "Văn bản tùy chỉnh",
      fields: [
        { label: "Ghi chú", placeholder: "{GHI_CHU}", fontSize: 11 },
        {
          label: "Chữ ký",
          placeholder: "Người nhập kho",
          fontSize: 11,
          align: "center",
        },
      ],
    },
  ],
  CHECK_REPORT: [
    {
      group: "Thông tin cửa hàng",
      fields: [
        {
          label: "Tên cửa hàng",
          placeholder: "{TEN_CUA_HANG}",
          bold: true,
          align: "center",
          width: 380,
          left: 0,
          fontSize: 13,
        },
        {
          label: "Địa chỉ",
          placeholder: "{DIA_CHI}",
          align: "center",
          width: 380,
          left: 0,
          fontSize: 11,
        },
      ],
    },
    {
      group: "Thông tin phiếu kiểm",
      fields: [
        {
          label: "Mã phiếu kiểm",
          placeholder: "{MA_PHIEU_KK}",
          fontSize: 12,
          bold: true,
        },
        {
          label: "Ngày kiểm",
          placeholder: "{NGAY_KIEM}",
          fontSize: 11,
          bold: true,
        },
        {
          label: "Người kiểm kho",
          placeholder: "{NGUOI_KIEM}",
          fontSize: 11,
          bold: true,
        },
      ],
    },
    {
      group: "Bảng sản phẩm",
      fields: [
        { label: "Dữ liệu: Tên SP", placeholder: "{TEN_SP}", fontSize: 10 },
        {
          label: "Dữ liệu: SL hệ thống",
          placeholder: "{SL_HE_THONG}",
          fontSize: 10,
          align: "center",
        },
        {
          label: "Dữ liệu: SL thực tế",
          placeholder: "{SL_THUC_TE}",
          fontSize: 10,
          align: "center",
        },
        {
          label: "Dữ liệu: Chênh lệch",
          placeholder: "{CHEN_LECH}",
          fontSize: 10,
          align: "center",
        },
      ],
    },
    {
      group: "Văn bản tùy chỉnh",
      fields: [
        { label: "Ghi chú", placeholder: "{GHI_CHU}", fontSize: 11 },
        {
          label: "Chữ ký kiểm kho",
          placeholder: "Người kiểm kho",
          fontSize: 11,
          align: "center",
        },
      ],
    },
  ],
};

const FRIENDLY_NAMES = {
  title: "Tiêu đề",
  lblStoreName: "Tên cửa hàng",
  lblAddress: "Địa chỉ",
  lblPhone: "SĐT",
  lblInvoice: "Nhãn mã HĐ",
  lblInvoiceVal: "Mã đơn hàng",
  lblDate: "Nhãn ngày",
  lblDateVal: "Ngày in",
  lblCustomer: "Nhãn KH",
  lblCustomerVal: "Tên khách hàng",
  lblItem: "Cột: Tên SP",
  lblQty: "Cột: SL",
  lblPrice: "Cột: Đơn giá",
  lblTotalItem: "Cột: Thành tiền",
  lblItemVal: "Dữ liệu: Tên SP",
  lblQtyVal: "Dữ liệu: SL",
  lblPriceVal: "Dữ liệu: Đơn giá",
  lblTotalItemVal: "Dữ liệu: Thành tiền",
  lblTotalRaw: "Nhãn: Tổng tiền hàng",
  lblTotalRawVal: "Tổng tiền hàng",
  lblShipping: "Nhãn: Phí vận chuyển",
  lblShippingVal: "Phí vận chuyển",
  lblDiscount: "Nhãn: Giảm giá",
  lblDiscountVal: "Giảm giá",
  lblGrandTotal: "Nhãn: Tổng TT",
  lblGrandTotalVal: "Tổng thanh toán",
  footerMsg: "Lời cảm ơn",
  lblCode: "Nhãn mã phiếu",
  lblCodeVal: "Mã phiếu",
};
const getFriendlyName = (key) =>
  FRIENDLY_NAMES[key] || (key.startsWith("custom_") ? "Nhãn tùy chỉnh" : key);

const DEFAULT_LABELS = {
  ORDER_INVOICE: {
    title: {
      text: "HÓA ĐƠN BÁN HÀNG",
      top: 80,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 18,
      bold: true,
    },
    lblStoreName: {
      text: "{TEN_CUA_HANG}",
      top: 20,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 13,
      bold: true,
    },
    lblAddress: {
      text: "{DIA_CHI}",
      top: 38,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 11,
    },
    lblPhone: {
      text: "{SDT}",
      top: 54,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 11,
    },
    lblInvoice: {
      text: "Hóa đơn:",
      top: 115,
      left: 130,
      fontSize: 12,
      bold: true,
    },
    lblInvoiceVal: { text: "{MA_DON_HANG}", top: 115, left: 190, fontSize: 12 },
    lblDate: { text: "Ngày in:", top: 140, left: 10, fontSize: 11 },
    lblDateVal: {
      text: "{NGAY_IN}",
      top: 140,
      left: 60,
      fontSize: 11,
      bold: true,
    },
    lblCustomer: { text: "Khách hàng:", top: 155, left: 10, fontSize: 11 },
    lblCustomerVal: {
      text: "{TEN_KHACH_HANG}",
      top: 155,
      left: 80,
      fontSize: 11,
      bold: true,
    },
    lblItem: {
      text: "Tên sản phẩm",
      top: 190,
      left: 10,
      fontSize: 11,
      bold: true,
    },
    lblQty: { text: "SL", top: 190, left: 200, fontSize: 11, bold: true },
    lblPrice: {
      text: "Đơn giá",
      top: 190,
      left: 230,
      fontSize: 11,
      bold: true,
    },
    lblTotalItem: {
      text: "Thành tiền",
      top: 190,
      left: 305,
      fontSize: 11,
      bold: true,
    },
    lblItemVal: {
      text: "{TEN_SP}",
      top: 210,
      left: 10,
      width: 180,
      fontSize: 11,
    },
    lblQtyVal: { text: "{SL}", top: 210, left: 200, fontSize: 11 },
    lblPriceVal: { text: "{DON_GIA}", top: 210, left: 230, fontSize: 11 },
    lblTotalItemVal: {
      text: "{THANH_TIEN}",
      top: 210,
      left: 305,
      fontSize: 11,
    },
    lblTotalRaw: {
      text: "Tổng tiền hàng:",
      top: 260,
      left: 180,
      fontSize: 11,
      bold: true,
    },
    lblTotalRawVal: {
      text: "{TONG_TIEN_HANG}",
      top: 260,
      left: 290,
      fontSize: 11,
      width: 80,
      align: "right",
    },
    lblShipping: {
      text: "Phí vận chuyển:",
      top: 275,
      left: 180,
      fontSize: 11,
      bold: true,
    },
    lblShippingVal: {
      text: "{PHI_VAN_CHUYEN}",
      top: 275,
      left: 290,
      fontSize: 11,
      width: 80,
      align: "right",
    },
    lblDiscount: {
      text: "Giảm giá:",
      top: 290,
      left: 180,
      fontSize: 11,
      bold: true,
    },
    lblDiscountVal: {
      text: "{GIAM_GIA}",
      top: 290,
      left: 290,
      fontSize: 11,
      width: 80,
      align: "right",
    },
    lblGrandTotal: {
      text: "Tổng thanh toán:",
      top: 315,
      left: 150,
      fontSize: 13,
      bold: true,
    },
    lblGrandTotalVal: {
      text: "{TONG_THANH_TOAN}",
      top: 315,
      left: 280,
      fontSize: 14,
      width: 90,
      align: "right",
      bold: true,
    },
    footerMsg: {
      text: "Cảm ơn quý khách!",
      top: 360,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 10,
      italic: true,
    },
  },
  IMPORT_RECEIPT: {
    title: {
      text: "PHIẾU NHẬP HÀNG",
      top: 60,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 18,
      bold: true,
    },
    lblStoreName: {
      text: "{TEN_CUA_HANG}",
      top: 20,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 13,
      bold: true,
    },
    lblAddress: {
      text: "{DIA_CHI}",
      top: 38,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 11,
    },
    lblPhone: {
      text: "{SDT}",
      top: 54,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 11,
    },
    lblCode: {
      text: "Mã phiếu:",
      top: 100,
      left: 100,
      fontSize: 12,
      bold: true,
    },
    lblCodeVal: {
      text: "{MA_PHIEU_NHAP}",
      top: 100,
      left: 165,
      fontSize: 12,
      bold: true,
    },
    lblDate: { text: "Ngày nhập:", top: 118, left: 100, fontSize: 11 },
    lblDateVal: {
      text: "{NGAY_NHAP}",
      top: 118,
      left: 165,
      fontSize: 11,
      bold: true,
    },
    lblNCC: { text: "Nhà CC:", top: 136, left: 100, fontSize: 11 },
    lblNCCVal: {
      text: "{NHA_CUNG_CAP}",
      top: 136,
      left: 165,
      fontSize: 11,
      bold: true,
    },
    // Header bảng
    thSKU: {
      text: "Mã hàng",
      top: 165,
      left: 10,
      width: 70,
      fontSize: 11,
      bold: true,
    },
    thTenHang: {
      text: "Tên hàng",
      top: 165,
      left: 85,
      width: 120,
      fontSize: 11,
      bold: true,
    },
    thSL: {
      text: "SL",
      top: 165,
      left: 210,
      width: 30,
      fontSize: 11,
      bold: true,
      align: "center",
    },
    thDonGia: {
      text: "Đơn giá nhập",
      top: 165,
      left: 245,
      width: 60,
      fontSize: 11,
      bold: true,
      align: "right",
    },
    thThanhTien: {
      text: "Thành tiền",
      top: 165,
      left: 310,
      width: 65,
      fontSize: 11,
      bold: true,
      align: "right",
    },
    // Dữ liệu sản phẩm (lặp theo items)
    irSKU: { text: "{SKU}", top: 185, left: 10, width: 70, fontSize: 10 },
    irTenHang: {
      text: "{TEN_HANG}",
      top: 185,
      left: 85,
      width: 120,
      fontSize: 10,
    },
    irSL: {
      text: "{SL}",
      top: 185,
      left: 210,
      width: 30,
      fontSize: 10,
      align: "center",
    },
    irDonGia: {
      text: "{DON_GIA_NHAP}",
      top: 185,
      left: 245,
      width: 60,
      fontSize: 10,
      align: "right",
    },
    irThanhTien: {
      text: "{THANH_TIEN}",
      top: 185,
      left: 310,
      width: 65,
      fontSize: 10,
      align: "right",
    },
    // Tổng
    lblTotalGoods: {
      text: "Tổng tiền hàng:",
      top: 260,
      left: 190,
      fontSize: 11,
      bold: true,
    },
    lblTotalGoodsVal: {
      text: "{TONG_TIEN_HANG}",
      top: 260,
      left: 300,
      width: 75,
      fontSize: 11,
      align: "right",
    },
    lblDiscount: { text: "Giảm giá phiếu:", top: 275, left: 190, fontSize: 11 },
    lblDiscountVal: {
      text: "{GIAM_GIA_PHIEU}",
      top: 275,
      left: 300,
      width: 75,
      fontSize: 11,
      align: "right",
    },
    lblCanTra: {
      text: "Phải trả NCC:",
      top: 295,
      left: 170,
      fontSize: 13,
      bold: true,
    },
    lblCanTraVal: {
      text: "{CAN_TRA_NCC}",
      top: 295,
      left: 280,
      width: 95,
      fontSize: 14,
      bold: true,
      align: "right",
    },
    footerMsg: {
      text: "Người nhập kho",
      top: 370,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 10,
    },
  },
  CHECK_REPORT: {
    title: {
      text: "PHIẾU KIỂM KHO",
      top: 60,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 18,
      bold: true,
    },
    lblStoreName: {
      text: "{TEN_CUA_HANG}",
      top: 20,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 13,
      bold: true,
    },
    lblAddress: {
      text: "{DIA_CHI}",
      top: 38,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 11,
    },
    lblCode: {
      text: "Mã phiếu:",
      top: 100,
      left: 100,
      fontSize: 12,
      bold: true,
    },
    lblCodeVal: {
      text: "{MA_PHIEU_KK}",
      top: 100,
      left: 165,
      fontSize: 12,
      bold: true,
    },
    lblDate: { text: "Ngày kiểm:", top: 118, left: 100, fontSize: 11 },
    lblDateVal: {
      text: "{NGAY_KIEM}",
      top: 118,
      left: 165,
      fontSize: 11,
      bold: true,
    },
    lblNguoiKiem: { text: "Người kiểm:", top: 136, left: 100, fontSize: 11 },
    lblNguoiKiemVal: {
      text: "{NGUOI_KIEM}",
      top: 136,
      left: 165,
      fontSize: 11,
      bold: true,
    },
    // Header bảng
    thTenSP: {
      text: "Tên sản phẩm",
      top: 165,
      left: 10,
      width: 150,
      fontSize: 11,
      bold: true,
    },
    thSLHT: {
      text: "SL hệ thống",
      top: 165,
      left: 165,
      width: 60,
      fontSize: 11,
      bold: true,
      align: "center",
    },
    thSLTT: {
      text: "SL thực tế",
      top: 165,
      left: 230,
      width: 60,
      fontSize: 11,
      bold: true,
      align: "center",
    },
    thCL: {
      text: "Chênh lệch",
      top: 165,
      left: 295,
      width: 75,
      fontSize: 11,
      bold: true,
      align: "center",
    },
    crTenSP: { text: "{TEN_SP}", top: 185, left: 10, width: 150, fontSize: 10 },
    crSLHT: {
      text: "{SL_HE_THONG}",
      top: 185,
      left: 165,
      width: 60,
      fontSize: 10,
      align: "center",
    },
    crSLTT: {
      text: "{SL_THUC_TE}",
      top: 185,
      left: 230,
      width: 60,
      fontSize: 10,
      align: "center",
    },
    crCL: {
      text: "{CHENH_LECH}",
      top: 185,
      left: 295,
      width: 75,
      fontSize: 10,
      align: "center",
    },
    footerNote: {
      text: "Người kiểm kho",
      top: 370,
      left: 0,
      width: 380,
      align: "center",
      fontSize: 10,
    },
  },
};

const getMockData = (tab, store) => {
  const storeName = store?.ten_cua_hang || "Tên Cửa Hàng";
  const storeAddress = store?.dia_chi || "Địa chỉ cửa hàng";
  const storePhone = store?.so_dien_thoai || "Số điện thoại";
  const now = new Date().toLocaleString("vi-VN");
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

  if (tab === "ORDER_INVOICE")
    return {
      TEN_CUA_HANG: storeName,
      DIA_CHI: storeAddress,
      SDT: storePhone,
      MA_DON_HANG: "DH-2026-00123",
      NGAY_IN: now,
      TEN_KHACH_HANG: "Nguyễn Văn A",
      SDT_KH: "0987 654 321",
      DIA_CHI_KH: "123 Lê Lợi, Q.1, TP.HCM",
      PHUONG_THUC_GIAO: "Giao hàng tận nơi",
      items: [
        {
          TEN_SP: "iPhone 15 Pro Max (Titan Đen)",
          SL: 1,
          DON_GIA: fmt(29500000),
          THANH_TIEN: fmt(29500000),
        },
        {
          TEN_SP: "Ốp lưng Silicon",
          SL: 2,
          DON_GIA: fmt(150000),
          THANH_TIEN: fmt(300000),
        },
      ],
      TONG_TIEN_HANG: fmt(29800000) + " đ",
      PHI_VAN_CHUYEN: fmt(30000) + " đ",
      GIAM_GIA: "-" + fmt(100000) + " đ",
      TONG_THANH_TOAN: fmt(29730000) + " đ",
    };

  if (tab === "IMPORT_RECEIPT")
    return {
      TEN_CUA_HANG: storeName,
      DIA_CHI: storeAddress,
      SDT: storePhone,
      MA_PHIEU_NHAP: "PN-2026-0501",
      NGAY_NHAP: now,
      NHA_CUNG_CAP: "Nhà cung cấp",
      GHI_CHU: "Nhập lô hàng tháng 5",
      GIAM_GIA_PHIEU: fmt(500000) + " đ",
      TONG_TIEN_HANG: fmt(42000000) + " đ",
      CAN_TRA_NCC: fmt(41500000) + " đ",
      items: [
        {
          TEN_HANG: "iPhone 15 Pro Max",
          SKU: "IPH15PM-DEN-1T",
          SL: 3,
          DON_GIA_NHAP: fmt(22000000),
          THANH_TIEN: fmt(66000000),
        },
        {
          TEN_HANG: "Sạc nhanh 20W",
          SKU: "SAC-20W-001",
          SL: 5,
          DON_GIA_NHAP: fmt(350000),
          THANH_TIEN: fmt(1750000),
        },
      ],
    };

  // CHECK_REPORT
  return {
    TEN_CUA_HANG: storeName,
    DIA_CHI: storeAddress,
    SDT: storePhone,
    MA_PHIEU_KK: "PK-2026-0501",
    NGAY_KIEM: now,
    NGUOI_KIEM: "Admin",
    GHI_CHU: "Kiểm kho định kỳ",
    items: [
      {
        TEN_SP: "iPhone 15 Pro Max",
        SL_HE_THONG: 10,
        SL_THUC_TE: 9,
        CHENH_LECH: -1,
      },
      {
        TEN_SP: "Sạc nhanh 20W",
        SL_HE_THONG: 20,
        SL_THUC_TE: 20,
        CHENH_LECH: 0,
      },
    ],
  };
};

const parseTemplate = (str, data) => {
  if (!str) return "";
  return str.replace(/\{(\w+)\}/g, (m, k) =>
    data[k] !== undefined ? data[k] : m,
  );
};

const EditableSpan = ({ value, onChange }) => {
  const handleBlur = (e) => {
    if (onChange) onChange(e.target.textContent);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="border border-transparent hover:border-dashed focus:border-solid focus:border-blue-500 focus:bg-white focus:outline-none rounded px-1 cursor-text transition-all inline-block min-w-[20px]"
    >
      {value}
    </span>
  );
};

const DraggableItem = ({
  id,
  label,
  isPreview,
  onDrag,
  onChange,
  mockData,
  selectedId,
  setSelectedId,
  canvasRef,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

  const getOffset = () => {
    if (!canvasRef?.current) return { left: 0, top: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { left: r.left, top: r.top };
  };

  const handleMouseDown = (e) => {
    if (isPreview || e.target.hasAttribute("contenteditable")) return;
    const off = getOffset();
    setIsDragging(true);
    if (onDrag) onDrag("start"); // Trigger history push
    setStartPos({
      x: e.clientX - off.left - (label.left || 0),
      y: e.clientY - off.top - (label.top || 0),
    });
    e.preventDefault();
  };

  React.useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      const off = getOffset();
      onDrag(id, {
        left: Math.max(0, e.clientX - off.left - startPos.x),
        top: Math.max(0, e.clientY - off.top - startPos.y),
      });
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, startPos, id, onDrag]);

  const style = {
    position: "absolute",
    top: `${label.top || 0}px`,
    left: `${label.left || 0}px`,
    width: label.width
      ? typeof label.width === "number"
        ? `${label.width}px`
        : label.width
      : "auto",
    textAlign: label.align || "left",
    fontSize: `${label.fontSize || 12}px`,
    fontWeight: label.bold ? "bold" : "normal",
    fontStyle: label.italic ? "italic" : "normal",
    cursor: isPreview ? "default" : isDragging ? "grabbing" : "grab",
    userSelect: "none",
    border: isPreview
      ? "none"
      : id === selectedId
        ? "1px solid #4154F1"
        : "1px dashed #cbd5e1",
    background: isPreview
      ? "transparent"
      : id === selectedId
        ? "rgba(65,84,241,0.05)"
        : "transparent",
    padding: "2px",
    whiteSpace: "nowrap",
    zIndex: id === selectedId ? 50 : isDragging ? 10 : 1,
  };

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isPreview) {
          setSelectedId(id);
          e.stopPropagation();
        }
      }}
      className={!isPreview ? "hover:border-blue-400 rounded" : ""}
    >
      {isPreview ? (
        parseTemplate(label.text, mockData)
      ) : (
        <EditableSpan value={label.text} onChange={(v) => onChange(id, v)} />
      )}
    </div>
  );
};

export default function PrintTemplateBuilder() {
  const [activeTab, setActiveTab] = useState("ORDER_INVOICE");
  const [labels, setLabels] = useState(DEFAULT_LABELS["ORDER_INVOICE"]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedField, setSelectedField] = useState("");
  const [storeInfo, setStoreInfo] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);

  const pushHistory = () => {
    setHistory((p) => [...p.slice(-49), JSON.parse(JSON.stringify(labels))]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((p) => p.slice(0, -1));
    setLabels(prev);
    if (history.length === 1) setIsDirty(false);
  };

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/store-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStoreInfo(res.data);
      } catch {
        // giữ null, getMockData sẽ dùng placeholder
      }
    };
    fetchStore();
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      setSelectedId(null);
      setIsDirty(false);
      setHistory([]);
      const defaultLabels = DEFAULT_LABELS[activeTab] || {};
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/mau-in/${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.noi_dung_html) {
          const parsed = JSON.parse(res.data.noi_dung_html);
          // Nếu DB lưu rỗng {} thì dùng default
          setLabels(Object.keys(parsed).length > 0 ? parsed : defaultLabels);
        } else {
          setLabels(defaultLabels);
        }
      } catch {
        setLabels(defaultLabels);
      }
    };
    fetchTemplate();
  }, [activeTab]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    if (isDirty) {
      Swal.fire({
        title: "Thay đổi chưa lưu",
        text: "Bạn có thay đổi chưa lưu trên mẫu này. Bạn muốn lưu lại trước khi chuyển tab hay bỏ qua?",
        icon: "warning",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Lưu thay đổi",
        denyButtonText: "Bỏ qua thay đổi",
        cancelButtonText: "Tiếp tục chỉnh sửa",
        confirmButtonColor: "#4154F1",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "#cbd5e1",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const saved = await handleSave();
          if (saved) {
            setActiveTab(tab);
            setIsDirty(false);
          }
        } else if (result.isDenied) {
          setActiveTab(tab);
          setIsDirty(false);
        }
      });
      return;
    }
    setActiveTab(tab);
    setIsDirty(false);
    setHistory([]);
  };

  const handleLabelDrag = (key, pos) => {
    if (key === "start") {
      pushHistory();
      return;
    }
    setLabels((p) => ({ ...p, [key]: { ...p[key], ...pos } }));
    setIsDirty(true);
  };
  const handleLabelChange = (key, text) => {
    pushHistory();
    setLabels((p) => ({ ...p, [key]: { ...p[key], text } }));
    setIsDirty(true);
  };
  const updateStyle = (key, value) => {
    if (!selectedId) return;
    pushHistory();
    setLabels((p) => ({
      ...p,
      [selectedId]: { ...p[selectedId], [key]: value },
    }));
    setIsDirty(true);
  };
  const alignElement = (type) => {
    if (!selectedId) return;
    const cur = labels[selectedId];
    if (type === "center")
      handleLabelDrag(selectedId, { align: "center", width: 380, left: 0 });
    else if (type === "left")
      handleLabelDrag(selectedId, { left: 10, align: "left", width: "auto" });
    else if (type === "right")
      handleLabelDrag(selectedId, {
        left: 380 - (cur.width || 80) - 10,
        align: "right",
      });
  };
  const handleDeleteLabel = (id) => {
    if (!id) return;
    pushHistory();
    setLabels((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setSelectedId(null);
    setIsDirty(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        undo();
        e.preventDefault();
        return;
      }

      if (!selectedId || !labels[selectedId]) return;
      const step = e.shiftKey ? 10 : 1;
      const cur = labels[selectedId];

      const move = (pos) => {
        pushHistory();
        handleLabelDrag(selectedId, pos);
      };

      if (e.key === "ArrowUp") {
        move({ top: Math.max(0, (cur.top || 0) - step) });
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        move({ top: (cur.top || 0) + step });
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        move({ left: Math.max(0, (cur.left || 0) - step) });
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        move({ left: (cur.left || 0) + step });
        e.preventDefault();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (e.target === document.body) {
          handleDeleteLabel(selectedId);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, labels]);

  const handleAddLabel = () => {
    if (!selectedField) return;
    // Tìm field từ catalog
    const catalog = FIELD_CATALOG[activeTab] || [];
    let fieldDef = null;
    for (const group of catalog) {
      fieldDef = group.fields.find((f) => f.placeholder === selectedField);
      if (fieldDef) break;
    }
    const {
      placeholder,
      label: _lbl,
      ...defaultStyle
    } = fieldDef || { placeholder: selectedField };
    const key = `custom_${Date.now()}`;
    pushHistory();
    setLabels((p) => ({
      ...p,
      [key]: {
        text: placeholder,
        top: 420,
        left: 10,
        fontSize: 12,
        ...defaultStyle,
      },
    }));
    setSelectedId(key);
    setSelectedField("");
    setIsDirty(true);
  };

  const handleResetDefault = () => {
    Swal.fire({
      title: "Đặt lại mặc định",
      text: "Đặt lại mẫu về mặc định? Các thay đổi chưa lưu sẽ mất.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy bỏ",
    }).then((result) => {
      if (result.isConfirmed) {
        pushHistory();
        setLabels(DEFAULT_LABELS[activeTab] || {});
        setSelectedId(null);
        setIsDirty(true);
      }
    });
  };

  const handleSave = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/mau-in`,
        {
          loai: activeTab,
          ten_mau: TAB_NAMES[activeTab],
          noi_dung_html: JSON.stringify(labels),
          la_mac_dinh: true,
          trang_thai: "active",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Swal.fire({
        title: "Thành công!",
        text: "Lưu mẫu in thành công!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setIsDirty(false);
      return true;
    } catch {
      Swal.fire({
        title: "Lỗi!",
        text: "Lỗi khi lưu mẫu in",
        icon: "error",
      });
      return false;
    }
  };

  const mockData = getMockData(activeTab, storeInfo);

  const renderCanvas = (isPreview) => {
    const gridStyle =
      !isPreview && showGrid
        ? {
            backgroundImage:
              "linear-gradient(to right,#cbd5e1 1px,transparent 1px),linear-gradient(to bottom,#cbd5e1 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }
        : {};
    return (
      <div
        className="relative w-[380px] min-h-[800px] bg-white shadow-lg mx-auto font-sans"
        ref={!isPreview ? canvasRef : undefined}
        style={{
          ...gridStyle,
          border: isPreview ? "none" : "1px solid #e2e8f0",
        }}
        onClick={() => !isPreview && setSelectedId(null)}
      >
        {Object.entries(labels).map(([key, label]) => {
          // ORDER_INVOICE item rows
          const orderItemKeys = [
            "lblItemVal",
            "lblQtyVal",
            "lblPriceVal",
            "lblTotalItemVal",
          ];
          // IMPORT_RECEIPT item rows
          const importItemKeys = [
            "irSKU",
            "irTenHang",
            "irSL",
            "irDonGia",
            "irThanhTien",
          ];
          // CHECK_REPORT item rows
          const checkItemKeys = ["crTenSP", "crSLHT", "crSLTT", "crCL"];

          const isItemKey =
            mockData.items &&
            (orderItemKeys.includes(key) ||
              importItemKeys.includes(key) ||
              checkItemKeys.includes(key));

          if (isItemKey) {
            return mockData.items.map((item, idx) => {
              const il = {
                ...label,
                top: (label.top || 0) + idx * 20,
                text: parseTemplate(label.text, item),
              };
              return (
                <DraggableItem
                  key={`${key}-${idx}`}
                  id={key}
                  label={il}
                  isPreview={isPreview}
                  onDrag={handleLabelDrag}
                  onChange={handleLabelChange}
                  mockData={mockData}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  canvasRef={canvasRef}
                />
              );
            });
          }
          return (
            <DraggableItem
              key={key}
              id={key}
              label={label}
              isPreview={isPreview}
              onDrag={handleLabelDrag}
              onChange={handleLabelChange}
              mockData={mockData}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              canvasRef={canvasRef}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#f0f2f5] font-sans pb-10 min-h-screen">
      <div className="max-w-[1536px] mx-auto p-4 lg:p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Thiết kế Mẫu in
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-8 text-[14px] font-bold mb-4 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`cursor-pointer pb-2 border-b-2 -mb-[1px] px-1 transition-all ${activeTab === tab ? "text-[#4154F1] border-[#4154F1]" : "text-slate-500 border-transparent hover:text-slate-800"}`}
            >
              {TAB_NAMES[tab]}
              {activeTab === tab && isDirty && (
                <span className="ml-1 text-[10px] text-orange-500 font-normal">
                  (có thay đổi)
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${showGrid ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-500"}`}
            >
              {showGrid ? "Ẩn lưới" : "Hiện lưới"}
            </button>

            {/* Undo */}
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="px-3 py-1 text-[11px] font-bold bg-white border border-slate-200 text-slate-700 rounded cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Hoàn tác (Ctrl+Z)"
            >
              ↺ Quay lại
            </button>

            {/* Add label - Dropdown thân thiện */}
            <div className="flex items-center gap-1">
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="text-[11px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 max-w-[220px] bg-white text-slate-700 cursor-pointer"
              >
                <option value="">Chọn thành phần để thêm</option>
                {(FIELD_CATALOG[activeTab] || []).map((group) => (
                  <optgroup key={group.group} label={`── ${group.group} ──`}>
                    {group.fields.map((f) => (
                      <option key={f.placeholder} value={f.placeholder}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={handleAddLabel}
                disabled={!selectedField}
                className="px-2 py-1 text-[11px] font-bold bg-green-50 border border-green-200 text-green-700 rounded cursor-pointer hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
            </div>

            {/* Delete selected */}
            {selectedId && (
              <button
                onClick={() => handleDeleteLabel(selectedId)}
                className="px-2 py-1 text-[11px] font-bold bg-red-50 border border-red-200 text-red-600 rounded cursor-pointer hover:bg-red-100"
              >
                Xóa: {getFriendlyName(selectedId)}
              </button>
            )}

            {/* Reset */}
            <button
              onClick={handleResetDefault}
              className="px-2 py-1 text-[11px] font-bold bg-orange-50 border border-orange-200 text-orange-600 rounded cursor-pointer hover:bg-orange-100"
            >
              ↺ Mặc định
            </button>
          </div>

          {/* Style controls */}
          {selectedId && labels[selectedId] && (
            <div className="flex items-center gap-1 bg-white border border-blue-100 p-1 rounded shadow-sm flex-wrap">
              <span className="text-[10px] font-bold text-blue-600 px-2 border-r border-blue-100 mr-1">
                {getFriendlyName(selectedId)}
              </span>
              <span className="text-[10px] font-bold text-blue-400 px-1 uppercase">
                Căn:
              </span>
              {["left", "center", "right"].map((t) => (
                <button
                  key={t}
                  onClick={() => alignElement(t)}
                  className="px-2 py-1 text-[11px] hover:bg-blue-50 text-blue-600 rounded cursor-pointer font-bold uppercase"
                >
                  {t[0]}
                </button>
              ))}
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button
                onClick={() => updateStyle("bold", !labels[selectedId].bold)}
                className={`px-2 py-1 rounded cursor-pointer font-bold text-[11px] ${labels[selectedId].bold ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-blue-600"}`}
              >
                B
              </button>
              <button
                onClick={() =>
                  updateStyle("italic", !labels[selectedId].italic)
                }
                className={`px-2 py-1 rounded cursor-pointer italic text-[11px] ${labels[selectedId].italic ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-blue-600"}`}
              >
                I
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button
                onClick={() =>
                  updateStyle(
                    "fontSize",
                    (labels[selectedId].fontSize || 12) - 1,
                  )
                }
                className="px-1 py-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer text-[13px] font-bold"
              >
                -
              </button>
              <span className="text-[11px] font-bold w-5 text-center">
                {labels[selectedId].fontSize || 12}
              </span>
              <button
                onClick={() =>
                  updateStyle(
                    "fontSize",
                    (labels[selectedId].fontSize || 12) + 1,
                  )
                }
                className="px-1 py-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer text-[13px] font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Canvases */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Editor */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-700 text-sm">
                Chỉnh sửa Mẫu in
              </h3>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Lưu mẫu in
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-50/50">
              {renderCanvas(false)}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-700 text-sm text-right">
                Xem trước bản in
              </h3>
            </div>
            <div className="p-6 flex justify-center bg-gray-50/50">
              {renderCanvas(true)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
