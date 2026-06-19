using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class PhieuKiemKho
{
    public long Id { get; set; }

    public string MaPhieu { get; set; } = null!;

    public long? NguoiTao { get; set; }

    public string? TrangThai { get; set; }

    public string? GhiChu { get; set; }

    public int? TongChenhLech { get; set; }

    public int? LenhTang { get; set; }

    public int? LenhGiam { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public virtual ICollection<ChiTietKiemKho> ChiTietKiemKhos { get; set; } = new List<ChiTietKiemKho>();

    public virtual TaiKhoan? NguoiTaoNavigation { get; set; }
}
