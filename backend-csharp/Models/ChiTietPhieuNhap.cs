using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ChiTietPhieuNhap
{
    public long Id { get; set; }

    public long PhieuNhapId { get; set; }

    public long BienTheId { get; set; }

    public int? SoLuong { get; set; }

    public decimal? DonGiaNhap { get; set; }

    public decimal? GiamGia { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual PhieuNhapHang PhieuNhap { get; set; } = null!;
}
