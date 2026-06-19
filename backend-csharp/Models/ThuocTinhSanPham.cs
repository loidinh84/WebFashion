using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ThuocTinhSanPham
{
    public long Id { get; set; }

    public long SanPhamId { get; set; }

    public string TenThuocTinh { get; set; } = null!;

    public string GiaTri { get; set; } = null!;

    public string? Nhom { get; set; }

    public int ThuTu { get; set; }

    public virtual SanPham SanPham { get; set; } = null!;
}
