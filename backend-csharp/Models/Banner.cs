using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class Banner
{
    public long Id { get; set; }

    public string? TieuDe { get; set; }

    public string HinhAnhUrl { get; set; } = null!;

    public string? DuongDan { get; set; }

    public string ViTri { get; set; } = null!;

    public int ThuTu { get; set; }

    public DateTime? NgayBatDau { get; set; }

    public DateTime? NgayKetThuc { get; set; }

    public string TrangThai { get; set; } = null!;
}
