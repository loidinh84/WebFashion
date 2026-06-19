using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class TaiKhoan
{
    public long Id { get; set; }

    public string HoTen { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? SoDienThoai { get; set; }

    public string MatKhau { get; set; } = null!;

    public string? AnhDaiDien { get; set; }

    public string VaiTro { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public DateOnly? NgaySinh { get; set; }

    public string? GioiTinh { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? TheThanhVienId { get; set; }

    public decimal? TongChiTieu { get; set; }

    public int? DiemTichLuy { get; set; }

    public virtual ICollection<BaoHanh> BaoHanhs { get; set; } = new List<BaoHanh>();

    public virtual ICollection<BaoHiem> BaoHiems { get; set; } = new List<BaoHiem>();

    public virtual ICollection<DanhGiaCuaHang> DanhGiaCuaHangs { get; set; } = new List<DanhGiaCuaHang>();

    public virtual ICollection<DanhGiaDonHang> DanhGiaDonHangs { get; set; } = new List<DanhGiaDonHang>();

    public virtual ICollection<DanhGiaSanPham> DanhGiaSanPhams { get; set; } = new List<DanhGiaSanPham>();

    public virtual ICollection<DiaChiGiaoHang> DiaChiGiaoHangs { get; set; } = new List<DiaChiGiaoHang>();

    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();

    public virtual ICollection<GioHang> GioHangs { get; set; } = new List<GioHang>();

    public virtual ICollection<LichSuDungVoucher> LichSuDungVouchers { get; set; } = new List<LichSuDungVoucher>();

    public virtual ICollection<PhieuKiemKho> PhieuKiemKhos { get; set; } = new List<PhieuKiemKho>();

    public virtual ICollection<PhieuNhapHang> PhieuNhapHangs { get; set; } = new List<PhieuNhapHang>();

    public virtual ICollection<QuanLyNguoiDung> QuanLyNguoiDungs { get; set; } = new List<QuanLyNguoiDung>();

    public virtual TheThanhVien? TheThanhVien { get; set; }

    public virtual ICollection<ThichDanhGium> ThichDanhGia { get; set; } = new List<ThichDanhGium>();

    public virtual ICollection<ThongBao> ThongBaos { get; set; } = new List<ThongBao>();

    public virtual ICollection<TraHangHoanTien> TraHangHoanTiens { get; set; } = new List<TraHangHoanTien>();

    public virtual ICollection<YeuThich> YeuThiches { get; set; } = new List<YeuThich>();
}
