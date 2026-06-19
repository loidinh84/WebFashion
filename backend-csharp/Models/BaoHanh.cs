using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class BaoHanh
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public long BienTheId { get; set; }

    public long TaiKhoanId { get; set; }

    public string SoSerial { get; set; } = null!;

    public DateOnly NgayBatDau { get; set; }

    public DateOnly NgayKetThuc { get; set; }

    public int ThoiHanThang { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
