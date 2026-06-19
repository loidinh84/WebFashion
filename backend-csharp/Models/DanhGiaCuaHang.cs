using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DanhGiaCuaHang
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public byte SoSao { get; set; }

    public string? NoiDung { get; set; }

    public string TrangThai { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
