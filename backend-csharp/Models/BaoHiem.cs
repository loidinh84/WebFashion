using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class BaoHiem
{
    public long Id { get; set; }

    public string TenGoi { get; set; } = null!;

    public long DonHangId { get; set; }

    public long BienTheId { get; set; }

    public long TaiKhoanId { get; set; }

    public decimal PhiBaoHiem { get; set; }

    public decimal SoTienBh { get; set; }

    public DateOnly NgayBatDau { get; set; }

    public DateOnly NgayKetThuc { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
