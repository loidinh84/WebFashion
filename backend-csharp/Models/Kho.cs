using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class Kho
{
    public long Id { get; set; }

    public long BienTheId { get; set; }

    public int SoLuongTon { get; set; }

    public int SoLuongGiuCho { get; set; }

    public int NguongCanhBao { get; set; }

    public string? ViTriKho { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual BienTheSanPham BienThe { get; set; } = null!;
}
