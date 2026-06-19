using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class TraHangHoanTien
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public long TaiKhoanId { get; set; }

    public string LyDo { get; set; } = null!;

    public string? HinhAnhChungMinh { get; set; }

    public decimal SoTienHoan { get; set; }

    public string HinhThucHoan { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public string? GhiChuXuLy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
