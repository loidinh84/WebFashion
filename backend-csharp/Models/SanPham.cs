using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class SanPham
{
    public long Id { get; set; }

    public string TenSanPham { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public long DanhMucId { get; set; }

    public long NhaCungCapId { get; set; }

    public string? MoTaNgan { get; set; }

    public string? MoTaDayDu { get; set; }

    public string? ThuongHieu { get; set; }

    public string TrangThai { get; set; } = null!;

    public bool NoiBat { get; set; }

    public int LuotXem { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public int LuotMua { get; set; }

    public int? CanNang { get; set; }

    public int? ChieuDai { get; set; }

    public int? ChieuRong { get; set; }

    public int? ChieuCao { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public virtual ICollection<BienTheSanPham> BienTheSanPhams { get; set; } = new List<BienTheSanPham>();

    public virtual ICollection<DanhGiaSanPham> DanhGiaSanPhams { get; set; } = new List<DanhGiaSanPham>();

    public virtual DanhMuc DanhMuc { get; set; } = null!;

    public virtual ICollection<HinhAnhSanPham> HinhAnhSanPhams { get; set; } = new List<HinhAnhSanPham>();

    public virtual NhaCungCap NhaCungCap { get; set; } = null!;

    public virtual ICollection<ThuocTinhSanPham> ThuocTinhSanPhams { get; set; } = new List<ThuocTinhSanPham>();

    public virtual ICollection<YeuThich> YeuThiches { get; set; } = new List<YeuThich>();
}
