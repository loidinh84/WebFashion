using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class TheThanhVien
{
    public long Id { get; set; }

    public string TenHang { get; set; } = null!;

    public decimal MucChiTieuTu { get; set; }

    public decimal? MucChiTieuDen { get; set; }

    public decimal TyLeGiamGia { get; set; }

    public int DiemThuongThem { get; set; }

    public string? MauThe { get; set; }

    public string? MoTaQuyenLoi { get; set; }

    public virtual ICollection<TaiKhoan> TaiKhoans { get; set; } = new List<TaiKhoan>();
}
