using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class HinhAnhSanPham
{
    public long Id { get; set; }

    public long SanPhamId { get; set; }

    public long? BienTheId { get; set; }

    public string UrlAnh { get; set; } = null!;

    public string? AltText { get; set; }

    public bool LaAnhChinh { get; set; }

    public int ThuTu { get; set; }

    public virtual BienTheSanPham? BienThe { get; set; }

    public virtual SanPham SanPham { get; set; } = null!;
}
