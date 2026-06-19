using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DanhGiaDonHang
{
    public long Id { get; set; }

    public long DonHangId { get; set; }

    public long TaiKhoanId { get; set; }

    public byte SoSaoGiaoHang { get; set; }

    public byte SoSaoDongGoi { get; set; }

    public string? NoiDung { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
