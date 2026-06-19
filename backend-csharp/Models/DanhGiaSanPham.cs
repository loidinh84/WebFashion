using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DanhGiaSanPham
{
    public long Id { get; set; }

    public long SanPhamId { get; set; }

    public long TaiKhoanId { get; set; }

    public long? DonHangId { get; set; }

    public int? SoSao { get; set; }

    public string? NoiDung { get; set; }

    public string? HinhAnh { get; set; }

    public string TrangThai { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public long? ParentId { get; set; }

    public virtual DonHang? DonHang { get; set; }

    public virtual ICollection<DanhGiaSanPham> InverseParent { get; set; } = new List<DanhGiaSanPham>();

    public virtual DanhGiaSanPham? Parent { get; set; }

    public virtual SanPham SanPham { get; set; } = null!;

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;

    public virtual ICollection<ThichDanhGium> ThichDanhGia { get; set; } = new List<ThichDanhGium>();
}
