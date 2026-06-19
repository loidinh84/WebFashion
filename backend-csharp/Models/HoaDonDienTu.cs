using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class HoaDonDienTu
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public string MaHoaDon { get; set; } = null!;

    public DateTime NgayXuat { get; set; }

    public string? TenNguoiMua { get; set; }

    public string? MaSoThue { get; set; }

    public string? DiaChiNguoiMua { get; set; }

    public decimal TongTienChuaVat { get; set; }

    public decimal TienVat { get; set; }

    public decimal TongTienVat { get; set; }

    public string? UrlPdf { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;
}
