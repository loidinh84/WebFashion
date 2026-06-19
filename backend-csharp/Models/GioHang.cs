using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class GioHang
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public long BienTheId { get; set; }

    public int SoLuong { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
