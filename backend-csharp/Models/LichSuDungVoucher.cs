using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class LichSuDungVoucher
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public long KhuyenMaiId { get; set; }

    public long DonHangId { get; set; }

    public DateTime? NgaySuDung { get; set; }

    public virtual DonHang DonHang { get; set; } = null!;

    public virtual KhuyenMai KhuyenMai { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
