using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class CauHinhTrangChu
{
    public int Id { get; set; }

    public string TenPhan { get; set; } = null!;

    public int? DanhMucId1 { get; set; }

    public int? DanhMucId2 { get; set; }

    public string? LoaiHienThi { get; set; }

    public int? ThuTu { get; set; }

    public string? TrangThai { get; set; }

    public string? DuLieuJson { get; set; }

    public string? TenTab1 { get; set; }

    public string? TenTab2 { get; set; }
}
