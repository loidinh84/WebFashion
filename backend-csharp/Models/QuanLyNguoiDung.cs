using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class QuanLyNguoiDung
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public int DiemTichLuy { get; set; }

    public int TongDonHang { get; set; }

    public decimal TongChiTieu { get; set; }

    public DateTime? LanDangNhapCuoi { get; set; }

    public string? GhiChuNoiBo { get; set; }

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
