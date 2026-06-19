using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class BienTheSanPham
{
    public long Id { get; set; }

    public long SanPhamId { get; set; }

    public string Sku { get; set; } = null!;

    public string? MauSac { get; set; }

    public string? DungLuong { get; set; }

    public string? Ram { get; set; }

    public decimal GiaGoc { get; set; }

    public decimal GiaBan { get; set; }

    public int TonKho { get; set; }

    public string? MaMauHex { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<BaoHanh> BaoHanhs { get; set; } = new List<BaoHanh>();

    public virtual ICollection<BaoHiem> BaoHiems { get; set; } = new List<BaoHiem>();

    public virtual ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();

    public virtual ICollection<ChiTietKiemKho> ChiTietKiemKhos { get; set; } = new List<ChiTietKiemKho>();

    public virtual ICollection<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; } = new List<ChiTietPhieuNhap>();

    public virtual ICollection<GioHang> GioHangs { get; set; } = new List<GioHang>();

    public virtual ICollection<HinhAnhSanPham> HinhAnhSanPhams { get; set; } = new List<HinhAnhSanPham>();

    public virtual Kho? Kho { get; set; }

    public virtual SanPham SanPham { get; set; } = null!;
}
