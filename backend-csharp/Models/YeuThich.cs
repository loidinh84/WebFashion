using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class YeuThich
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public long SanPhamId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual SanPham SanPham { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
