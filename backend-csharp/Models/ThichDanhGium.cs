using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class ThichDanhGium
{
    public long Id { get; set; }

    public long DanhGiaId { get; set; }

    public long TaiKhoanId { get; set; }

    public string Loai { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public virtual DanhGiaSanPham DanhGia { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
