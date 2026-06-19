using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class NhaCungCap
{
    public long Id { get; set; }

    public string TenNhaCc { get; set; } = null!;

    public string? MaSoThue { get; set; }

    public string? Email { get; set; }

    public string? SoDienThoai { get; set; }

    public string? DiaChi { get; set; }

    public string? QuocGia { get; set; }

    public string TrangThai { get; set; } = null!;

    public string? GhiChu { get; set; }

    public virtual ICollection<PhieuNhapHang> PhieuNhapHangs { get; set; } = new List<PhieuNhapHang>();

    public virtual ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
}
