const TaiKhoan = require("./TaiKhoan");
const TheThanhVien = require("./TheThanhVien");
const DonHang = require("./DonHang");
const ChiTietDonHang = require("./ChiTietDonHang");
const SanPham = require("./SanPham");
const DanhMuc = require("./DanhMuc");
const NhaCungCap = require("./NhaCungCap");
const GiaoDichThanhToan = require("./GiaoDichThanhToan");
const PhuongThucThanhToan = require("./PhuongThucThanhToan");
const DiaChiGiaoHang = require("./DiaChiGiaoHang");
const YeuThich = require("./YeuThich");
const BienTheSanPham = require("./BienTheSanPham");
const HinhAnhSanPham = require("./HinhAnhSanPham");
const LichSuGiaoHang = require("./LichSuGiaoHang");
const DonViVanChuyen = require("./DonViVanChuyen");
const ThietLapCuaHang = require("./ThietLapCuaHang");
const CauHinhTrangChu = require("./CauHinhTrangChu");
const PhieuNhapHang = require("./PhieuNhapHang");
const ChiTietPhieuNhap = require("./ChiTietPhieuNhap");
const PhieuKiemKho = require("./PhieuKiemKho");
const ChiTietKiemKho = require("./ChiTietKiemKho");
const MauIn = require("./MauIn");

const DanhGiaSanPham = require("./DanhGiaSanPham");
const DanhGiaCuaHang = require("./DanhGiaCuaHang");
const ThichDanhGia = require("./ThichDanhGia");
const GioHang = require("./GioHang");

// Quan hệ Tài Khoản <-> Thẻ Thành Viên
// Một tài khoản thuộc về một hạng thành viên
TaiKhoan.belongsTo(TheThanhVien, {
  foreignKey: "the_thanh_vien_id",
  as: "hang_thanh_vien",
});
// Một hạng thành viên có thể có nhiều tài khoản
TheThanhVien.hasMany(TaiKhoan, {
  foreignKey: "the_thanh_vien_id",
  as: "thanh_vien",
});

// Quan hệ Tài Khoản <-> Đơn Hàng
// Một tài khoản có nhiều đơn hàng
TaiKhoan.hasMany(DonHang, {
  foreignKey: "tai_khoan_id",
  as: "danh_sach_don_hang",
});
TaiKhoan.hasMany(DiaChiGiaoHang, {
  foreignKey: "tai_khoan_id",
  as: "dia_chi_giao_hang",
});
DiaChiGiaoHang.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id" });

DonHang.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id", as: "nguoi_mua" });
// Đơn hàng liên kết với Địa chỉ giao hàng
DonHang.belongsTo(DiaChiGiaoHang, { foreignKey: "dia_chi_id", as: "dia_chi" });
DonHang.belongsTo(DonViVanChuyen, { foreignKey: "don_vi_vc_id", as: "don_vi_vc" });

// Quan hệ Đơn Hàng <-> Lịch Sử Giao Hàng
DonHang.hasMany(LichSuGiaoHang, { foreignKey: "don_hang_id", as: "lich_su_giao_hang" });
LichSuGiaoHang.belongsTo(DonHang, { foreignKey: "don_hang_id" });

// Quan hệ Đơn Hàng <-> Chi Tiết Đơn Hàng
DonHang.hasMany(ChiTietDonHang, { foreignKey: "don_hang_id", as: "chi_tiet" });
DonHang.hasOne(GiaoDichThanhToan, {
  foreignKey: "don_hang_id",
  as: "giao_dich",
});

GiaoDichThanhToan.belongsTo(PhuongThucThanhToan, {
  foreignKey: "phuong_thuc_id",
  as: "phuong_thuc",
});
ChiTietDonHang.belongsTo(DonHang, { foreignKey: "don_hang_id", as: "don_hang" });


SanPham.belongsTo(DanhMuc, { foreignKey: "danh_muc_id", as: "danh_muc" });
DanhMuc.hasMany(SanPham, {
  foreignKey: "danh_muc_id",
  as: "danh_sach_san_pham",
});

// 5. Quan hệ Sản Phẩm <-> Nhà Cung Cấp
SanPham.belongsTo(NhaCungCap, {
  foreignKey: "nha_cung_cap_id",
  as: "nha_cung_cap",
});
NhaCungCap.hasMany(SanPham, {
  foreignKey: "nha_cung_cap_id",
  as: "danh_sach_san_pham",
});

YeuThich.belongsTo(SanPham, { foreignKey: "san_pham_id", as: "san_pham" });
SanPham.hasMany(YeuThich, {
  foreignKey: "san_pham_id",
  as: "danh_sach_yeu_thich",
});

// Quan hệ giữa YeuThich và TaiKhoan
YeuThich.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id", as: "tai_khoan" });
TaiKhoan.hasMany(YeuThich, {
  foreignKey: "tai_khoan_id",
  as: "danh_sach_yeu_thich",
});

// ========================================
// 2. Quan hệ Chi Tiết Đơn Hàng <-> Biến Thể
// ========================================
ChiTietDonHang.belongsTo(BienTheSanPham, {
  foreignKey: "bien_the_id",
  as: "bien_the",
});

BienTheSanPham.hasMany(ChiTietDonHang, {
  foreignKey: "bien_the_id",
  as: "don_hang_chi_tiet",
});

// ========================================
// 3. Quan hệ Biến Thể <-> Sản Phẩm
// ========================================
BienTheSanPham.belongsTo(SanPham, {
  foreignKey: "san_pham_id",
  as: "san_pham",
});

// ========================================
// 4. Quan hệ Đánh giá <-> Đơn hàng/Tài khoản
// ========================================
DonHang.hasMany(DanhGiaSanPham, { foreignKey: "don_hang_id", as: "danh_gia" });
DanhGiaSanPham.belongsTo(DonHang, { foreignKey: "don_hang_id", as: "don_hang" });

DanhGiaCuaHang.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id", as: "nguoi_dung" });
TaiKhoan.hasMany(DanhGiaCuaHang, { foreignKey: "tai_khoan_id", as: "danh_gia_shop" });

// ========================================
// 5. Quan hệ Đánh giá <-> Trả lời & Like
// ========================================
DanhGiaSanPham.hasMany(DanhGiaSanPham, { as: "replies", foreignKey: "parent_id" });
DanhGiaSanPham.belongsTo(DanhGiaSanPham, { as: "parent", foreignKey: "parent_id" });

DanhGiaSanPham.hasMany(ThichDanhGia, { foreignKey: "danh_gia_id", as: "likes" });
ThichDanhGia.belongsTo(DanhGiaSanPham, { foreignKey: "danh_gia_id" });

ThichDanhGia.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id", as: "user" });
TaiKhoan.hasMany(ThichDanhGia, { foreignKey: "tai_khoan_id", as: "likes" });

// ========================================
// PhieuNhapHang associations
// ========================================
PhieuNhapHang.belongsTo(NhaCungCap, { foreignKey: "nha_cc_id", as: "nha_cung_cap" });
NhaCungCap.hasMany(PhieuNhapHang, { foreignKey: "nha_cc_id", as: "phieu_nhap" });

PhieuNhapHang.belongsTo(TaiKhoan, { foreignKey: "nguoi_tao", as: "nguoi_tao_tk" });

PhieuNhapHang.hasMany(ChiTietPhieuNhap, { foreignKey: "phieu_nhap_id", as: "chi_tiet" });
ChiTietPhieuNhap.belongsTo(PhieuNhapHang, { foreignKey: "phieu_nhap_id" });

ChiTietPhieuNhap.belongsTo(BienTheSanPham, { foreignKey: "bien_the_id", as: "bien_the" });
BienTheSanPham.hasMany(ChiTietPhieuNhap, { foreignKey: "bien_the_id", as: "chi_tiet_nhap" });

// PhieuKiemKho associations
PhieuKiemKho.belongsTo(TaiKhoan, { foreignKey: "nguoi_tao", as: "nguoi_tao_tk" });
PhieuKiemKho.hasMany(ChiTietKiemKho, { foreignKey: "phieu_kiem_id", as: "chi_tiet" });
ChiTietKiemKho.belongsTo(PhieuKiemKho, { foreignKey: "phieu_kiem_id" });
ChiTietKiemKho.belongsTo(BienTheSanPham, { foreignKey: "bien_the_id", as: "bien_the" });
BienTheSanPham.hasMany(ChiTietKiemKho, { foreignKey: "bien_the_id", as: "chi_tiet_kiem" });

// ========================================
// 6. Quan hệ Giỏ Hàng <-> Tài Khoản/Biến Thể
// ========================================
TaiKhoan.hasMany(GioHang, { foreignKey: "tai_khoan_id", as: "gio_hang" });
GioHang.belongsTo(TaiKhoan, { foreignKey: "tai_khoan_id", as: "tai_khoan" });
BienTheSanPham.hasMany(GioHang, { foreignKey: "bien_the_id", as: "gio_hang" });
GioHang.belongsTo(BienTheSanPham, { foreignKey: "bien_the_id", as: "bien_the" });


module.exports = {
  TaiKhoan,
  TheThanhVien,
  DonHang,
  ChiTietDonHang,
  SanPham,
  DanhMuc,
  NhaCungCap,
  GiaoDichThanhToan,
  PhuongThucThanhToan,
  DiaChiGiaoHang,
  BienTheSanPham,
  HinhAnhSanPham,
  LichSuGiaoHang,
  DonViVanChuyen,
  ThietLapCuaHang,
  CauHinhTrangChu,
  DanhGiaSanPham,
  DanhGiaCuaHang,
  PhieuNhapHang,
  ChiTietPhieuNhap,
  PhieuKiemKho,
  ChiTietKiemKho,
  ThichDanhGia,
  MauIn,
  GioHang,
};

