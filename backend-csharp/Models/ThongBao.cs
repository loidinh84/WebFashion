using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ThongBao
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public string TieuDe { get; set; } = null!;

    public string NoiDung { get; set; } = null!;

    public string Loai { get; set; } = null!;

    public string? DuongDan { get; set; }

    public bool DaDoc { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
