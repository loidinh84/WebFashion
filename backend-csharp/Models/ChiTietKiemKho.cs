using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ChiTietKiemKho
{
    public long Id { get; set; }

    public long PhieuKiemId { get; set; }

    public long BienTheId { get; set; }

    public int? SoLuongHeThong { get; set; }

    public int? SoLuongThucTe { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual PhieuKiemKho PhieuKiem { get; set; } = null!;
}
