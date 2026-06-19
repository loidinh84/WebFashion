using System;
using System.Collections.Generic;

namespace WebFashion.Api.Models;

public partial class MauIn
{
    public long Id { get; set; }

    public string TenMau { get; set; } = null!;

    public string Loai { get; set; } = null!;

    public string NoiDungHtml { get; set; } = null!;

    public bool LaMacDinh { get; set; }

    public string TrangThai { get; set; } = null!;
}
