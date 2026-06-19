using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class KhuyenMai
{
    public long Id { get; set; }

    public string MaKhuyenMai { get; set; } = null!;

    public string TenChuongTrinh { get; set; } = null!;

    public string Loai { get; set; } = null!;

    public decimal GiaTri { get; set; }

    public decimal? GiaTriToiDa { get; set; }

    public decimal DonHangToiThieu { get; set; }

    public int? SoLuongMa { get; set; }

    public int DaSuDung { get; set; }

    public DateTime NgayBatDau { get; set; }

    public DateTime NgayKetThuc { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();

    public virtual ICollection<LichSuDungVoucher> LichSuDungVouchers { get; set; } = new List<LichSuDungVoucher>();
}
