using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class DanhMuc
{
    public long Id { get; set; }

    public string TenDanhMuc { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public long? DanhMucChaId { get; set; }

    public string? HinhAnh { get; set; }

    public string? MoTa { get; set; }

    public int ThuTu { get; set; }

    public string TrangThai { get; set; } = null!;

    public bool? HienThiSidebar { get; set; }

    public virtual DanhMuc? DanhMucCha { get; set; }

    public virtual ICollection<DanhMuc> InverseDanhMucCha { get; set; } = new List<DanhMuc>();

    public virtual ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
}
