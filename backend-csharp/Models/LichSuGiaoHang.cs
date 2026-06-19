using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class LichSuGiaoHang
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public string? TieuDe { get; set; }

    public string? MoTa { get; set; }

    public DateTimeOffset? ThoiGian { get; set; }

    public decimal? Lat { get; set; }

    public decimal? Lng { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;
}
