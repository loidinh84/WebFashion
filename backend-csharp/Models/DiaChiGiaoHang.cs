using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DiaChiGiaoHang
{
    public long Id { get; set; }

    public long TaiKhoanId { get; set; }

    public string HoTenNguoiNhan { get; set; } = null!;

    public string SoDienThoai { get; set; } = null!;

    public string DiaChiCuThe { get; set; } = null!;

    public string? PhuongXa { get; set; }

    public string? QuanHuyen { get; set; }

    public string TinhThanh { get; set; } = null!;

    public bool LaMacDinh { get; set; }

    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();

    public virtual TaiKhoan TaiKhoan { get; set; } = null!;
}
