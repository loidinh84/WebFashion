using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DonHang
{
    public long Id { get; set; }

    public string MaDonHang { get; set; } = null!;

    public long TaiKhoanId { get; set; }

    public long? DiaChiId { get; set; }

    public long? DonViVcId { get; set; }

    public long? KhuyenMaiId { get; set; }

    public decimal TongTienHang { get; set; }

    public decimal PhiVanChuyen { get; set; }

    public decimal TienGiamGia { get; set; }

    public decimal TongThanhToan { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public string? MaVanDon { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? HoTenNguoiNhan { get; set; }

    public string? SoDienThoai { get; set; }

    public string? DiaChiCuThe { get; set; }

    public string? TinhThanh { get; set; }

    public string? QuanHuyen { get; set; }

    public string? PhuongXa { get; set; }

    public virtual ICollection<BaoHanh> BaoHanhs { get; set; } = new List<BaoHanh>();

    public virtual ICollection<BaoHiem> BaoHiems { get; set; } = new List<BaoHiem>();

    public virtual ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();

    public virtual ICollection<DanhGiaDonHang> DanhGiaDonHangs { get; set; } = new List<DanhGiaDonHang>();

    public virtual ICollection<DanhGiaSanPham> DanhGiaSanPhams { get; set; } = new List<DanhGiaSanPham>();

    public virtual DiaChiGiaoHang? DiaChi { get; set; }

    public virtual DonViVanChuyen? DonViVc { get; set; }

    public virtual ICollection<GiaoDichThanhToan> GiaoDichThanhToans { get; set; } = new List<GiaoDichThanhToan>();

    public virtual ICollection<HoaDonDienTu> HoaDonDienTus { get; set; } = new List<HoaDonDienTu>();

    public virtual KhuyenMai? KhuyenMai { get; set; }

    public virtual ICollection<LichSuDungVoucher> LichSuDungVouchers { get; set; } = new List<LichSuDungVoucher>();

    public virtual ICollection<LichSuGiaoHang> LichSuGiaoHangs { get; set; } = new List<LichSuGiaoHang>();

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;

    public virtual ICollection<TraHangHoanTien> TraHangHoanTiens { get; set; } = new List<TraHangHoanTien>();
}
