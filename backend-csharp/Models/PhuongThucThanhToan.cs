using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class PhuongThucThanhToan
{
    public long Id { get; set; }

    public string TenPhuongThuc { get; set; } = null!;

    public string Ma { get; set; } = null!;

    public string Loai { get; set; } = null!;

    public string? LogoUrl { get; set; }

    public string? CauHinh { get; set; }

    public decimal PhiThanhToan { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<GiaoDichThanhToan> GiaoDichThanhToans { get; set; } = new List<GiaoDichThanhToan>();
}
