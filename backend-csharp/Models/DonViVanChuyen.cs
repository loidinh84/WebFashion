using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DonViVanChuyen
{
    public long Id { get; set; }

    public string TenDonVi { get; set; } = null!;

    public string Ma { get; set; } = null!;

    public string? LogoUrl { get; set; }

    public string? ApiKey { get; set; }

    public string? ApiEndpoint { get; set; }

    public decimal PhiCoBan { get; set; }

    public string? ThoiGianDuKien { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();
}
