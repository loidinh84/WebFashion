using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class GiaoDichThanhToan
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public long PhuongThucId { get; set; }

    public string? MaGiaoDich { get; set; }

    public string? MaGiaoDichDoiTac { get; set; }

    public decimal SoTien { get; set; }

    public string TrangThai { get; set; } = null!;

    public DateTime? ThoiGianThanhToan { get; set; }

    public string? ResponseData { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual PhuongThucThanhToan PhuongThuc { get; set; } = null!;
}
