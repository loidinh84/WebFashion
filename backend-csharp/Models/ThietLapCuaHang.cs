using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ThietLapCuaHang
{
    public long Id { get; set; }

    public string TenCuaHang { get; set; } = null!;

    public string? LogoUrl { get; set; }

    public string? FaviconUrl { get; set; }

    public string? SoDienThoai { get; set; }

    public string? Email { get; set; }

    public string? DiaChi { get; set; }

    public string? FacebookUrl { get; set; }

    public string? Zalo { get; set; }

    public string? ChinhSachDoiTra { get; set; }

    public string? ChinhSachBaoMat { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? TiktokUrl { get; set; }

    public string? InstagramUrl { get; set; }

    public string? VietqrBankBin { get; set; }

    public string? VietqrAccountNo { get; set; }

    public string? VietqrAccountName { get; set; }

    public bool? BaoTriHeThong { get; set; }

    public bool? TuDongDuyetDon { get; set; }

    public bool? ChoPhepDanhGia { get; set; }

    public bool? GuiEmailTuDong { get; set; }

    public bool? LamTronTien { get; set; }

    public string? SmtpHost { get; set; }

    public int? SmtpPort { get; set; }

    public string? SmtpUser { get; set; }

    public string? SmtpPass { get; set; }

    public string? EmailNhanThongBao { get; set; }

    public int? NguongBaoHetHang { get; set; }
}
