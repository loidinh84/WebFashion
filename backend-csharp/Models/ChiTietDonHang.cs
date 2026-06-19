using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ChiTietDonHang
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public long BienTheId { get; set; }

    public string TenSpLucMua { get; set; } = null!;

    public string SkuLucMua { get; set; } = null!;

    public int SoLuong { get; set; }

    public decimal DonGia { get; set; }

    public decimal ThanhTien { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual DonHang DonHang { get; set; } = null!;
}
