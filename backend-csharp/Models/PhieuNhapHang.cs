using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class PhieuNhapHang
{
    public long Id { get; set; }

    public string MaPhieu { get; set; } = null!;

    public long? NhaCcId { get; set; }

    public long? NguoiTao { get; set; }

    public string? TrangThai { get; set; }

    public decimal? GiamGia { get; set; }

    public decimal? TongTien { get; set; }

    public string? GhiChu { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public virtual ICollection<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; } = new List<ChiTietPhieuNhap>();

    public virtual TaiKhoan? NguoiTaoNavigation { get; set; }

    public virtual NhaCungCap? NhaCc { get; set; }
}
