using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/phieu-nhap")]
    [ApiController]
    [Authorize]
    public class PhieuNhapController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PhieuNhapController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        private long? GetUserId()
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (long.TryParse(idClaim, out var userId)) return userId;
            return null;
        }

        #region DTOs
        public class CreateUpdateReceiptDto
        {
            [JsonPropertyName("nha_cc_id")]
            public long? NhaCcId { get; set; }

            [JsonPropertyName("giam_gia")]
            public decimal? GiamGia { get; set; } = 0m;

            [JsonPropertyName("ghi_chu")]
            public string? GhiChu { get; set; }

            [JsonPropertyName("trang_thai")]
            public string? TrangThai { get; set; } = "draft";

            [JsonPropertyName("items")]
            public List<ReceiptItemDto> Items { get; set; } = new();
        }

        public class ReceiptItemDto
        {
            [JsonPropertyName("bien_the_id")]
            public long BienTheId { get; set; }

            [JsonPropertyName("so_luong")]
            public int SoLuong { get; set; }

            [JsonPropertyName("don_gia_nhap")]
            public decimal DonGiaNhap { get; set; }

            [JsonPropertyName("giam_gia")]
            public decimal? GiamGia { get; set; } = 0m;
        }
        #endregion

        // 1. GET: api/phieu-nhap
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string search_ma = "",
            [FromQuery] string search_hang = "",
            [FromQuery] string search_ncc = "",
            [FromQuery] string? trang_thai = null,
            [FromQuery] string? ngay_tu = null,
            [FromQuery] string? ngay_den = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var query = _context.PhieuNhapHangs.AsQueryable();

                if (!string.IsNullOrEmpty(trang_thai))
                {
                    var statuses = trang_thai.Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                    if (statuses.Count > 0)
                    {
                        query = query.Where(p => statuses.Contains(p.TrangThai ?? ""));
                    }
                }

                if (!string.IsNullOrEmpty(search_ma))
                {
                    query = query.Where(p => EF.Functions.Like(p.MaPhieu, $"%{search_ma}%"));
                }

                if (!string.IsNullOrEmpty(ngay_tu))
                {
                    if (DateTime.TryParse(ngay_tu, out var fromDate))
                    {
                        query = query.Where(p => p.CreatedAt >= new DateTimeOffset(fromDate.Date));
                    }
                }

                if (!string.IsNullOrEmpty(ngay_den))
                {
                    if (DateTime.TryParse(ngay_den, out var toDate))
                    {
                        query = query.Where(p => p.CreatedAt <= new DateTimeOffset(toDate.Date.AddDays(1).AddTicks(-1)));
                    }
                }

                if (!string.IsNullOrEmpty(search_ncc))
                {
                    query = query.Where(p => p.NhaCc != null && EF.Functions.Like(p.NhaCc.TenNhaCc, $"%{search_ncc}%"));
                }

                if (!string.IsNullOrEmpty(search_hang))
                {
                    query = query.Where(p => p.ChiTietPhieuNhaps.Any(ct => 
                        ct.BienThe != null && ct.BienThe.SanPham != null && 
                        EF.Functions.Like(ct.BienThe.SanPham.TenSanPham, $"%{search_hang}%")
                    ));
                }

                int offset = (page - 1) * limit;
                int count = await query.CountAsync();

                var list = await query
                    .Include(p => p.NhaCc)
                    .Include(p => p.NguoiTaoNavigation)
                    .Include(p => p.ChiTietPhieuNhaps)
                        .ThenInclude(ct => ct.BienThe)
                            .ThenInclude(bt => bt.SanPham)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip(offset)
                    .Take(limit)
                    .Select(p => new
                    {
                        id = p.Id,
                        ma_phieu = p.MaPhieu,
                        nha_cc_id = p.NhaCcId,
                        nguoi_tao = p.NguoiTao,
                        trang_thai = p.TrangThai,
                        giam_gia = p.GiamGia,
                        tong_tien = p.TongTien,
                        ghi_chu = p.GhiChu,
                        created_at = p.CreatedAt,
                        updated_at = p.UpdatedAt,
                        nha_cung_cap = p.NhaCc != null ? new { id = p.NhaCc.Id, ten_nha_cc = p.NhaCc.TenNhaCc } : null,
                        nguoi_tao_tk = p.NguoiTaoNavigation != null ? new { id = p.NguoiTaoNavigation.Id, ho_ten = p.NguoiTaoNavigation.HoTen } : null,
                        chi_tiet = p.ChiTietPhieuNhaps.Select(ct => new
                        {
                            id = ct.Id,
                            phieu_nhap_id = ct.PhieuNhapId,
                            bien_the_id = ct.BienTheId,
                            so_luong = ct.SoLuong,
                            don_gia_nhap = ct.DonGiaNhap,
                            giam_gia = ct.GiamGia,
                            bien_the = ct.BienThe != null ? new
                            {
                                id = ct.BienThe.Id,
                                sku = ct.BienThe.Sku,
                                mau_sac = ct.BienThe.MauSac,
                                dung_luong = ct.BienThe.DungLuong,
                                san_pham = ct.BienThe.SanPham != null ? new
                                {
                                    id = ct.BienThe.SanPham.Id,
                                    ten_san_pham = ct.BienThe.SanPham.TenSanPham
                                } : null
                            } : null
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { data = list, total = count, page = page, limit = limit });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getAll PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy danh sách phiếu nhập!" });
            }
        }

        // 2. GET: api/phieu-nhap/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var phieu = await _context.PhieuNhapHangs
                    .Include(p => p.NhaCc)
                    .Include(p => p.NguoiTaoNavigation)
                    .Include(p => p.ChiTietPhieuNhaps)
                        .ThenInclude(ct => ct.BienThe)
                            .ThenInclude(bt => bt.SanPham)
                                .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu nhập!" });
                }

                // Format response to match Node.js
                var result = new
                {
                    id = phieu.Id,
                    ma_phieu = phieu.MaPhieu,
                    nha_cc_id = phieu.NhaCcId,
                    nguoi_tao = phieu.NguoiTao,
                    trang_thai = phieu.TrangThai,
                    giam_gia = phieu.GiamGia,
                    tong_tien = phieu.TongTien,
                    ghi_chu = phieu.GhiChu,
                    created_at = phieu.CreatedAt,
                    updated_at = phieu.UpdatedAt,
                    nha_cung_cap = phieu.NhaCc != null ? new
                    {
                        id = phieu.NhaCc.Id,
                        ten_nha_cc = phieu.NhaCc.TenNhaCc,
                        so_dien_thoai = phieu.NhaCc.SoDienThoai,
                        email = phieu.NhaCc.Email
                    } : null,
                    nguoi_tao_tk = phieu.NguoiTaoNavigation != null ? new { id = phieu.NguoiTaoNavigation.Id, ho_ten = phieu.NguoiTaoNavigation.HoTen } : null,
                    chi_tiet = phieu.ChiTietPhieuNhaps.Select(ct => new
                    {
                        id = ct.Id,
                        phieu_nhap_id = ct.PhieuNhapId,
                        bien_the_id = ct.BienTheId,
                        so_luong = ct.SoLuong,
                        don_gia_nhap = ct.DonGiaNhap,
                        giam_gia = ct.GiamGia,
                        bien_the = new
                        {
                            id = ct.BienThe.Id,
                            sku = ct.BienThe.Sku,
                            mau_sac = ct.BienThe.MauSac,
                            dung_luong = ct.BienThe.DungLuong,
                            ram = ct.BienThe.Ram,
                            san_pham = new
                            {
                                id = ct.BienThe.SanPham.Id,
                                ten_san_pham = ct.BienThe.SanPham.TenSanPham,
                                hinh_anh = ct.BienThe.SanPham.HinhAnhSanPhams.Take(1).Select(img => new { url_anh = img.UrlAnh }).ToList()
                            }
                        }
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getById PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 3. POST: api/phieu-nhap
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUpdateReceiptDto dto)
        {
            if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Tự động sinh mã
                var last = await _context.PhieuNhapHangs.OrderByDescending(p => p.Id).FirstOrDefaultAsync();
                long nextNum = last != null ? long.Parse(last.MaPhieu.Replace("PN", "")) + 1 : 1;
                string maPhieu = "PN" + nextNum.ToString("D6");

                long? nguoiTao = GetUserId();

                // Tính tổng tiền
                decimal tongTien = dto.Items.Sum(i => (i.SoLuong * i.DonGiaNhap) - (i.GiamGia ?? 0m)) - (dto.GiamGia ?? 0m);

                var phieu = new PhieuNhapHang
                {
                    MaPhieu = maPhieu,
                    NhaCcId = dto.NhaCcId,
                    NguoiTao = nguoiTao,
                    TrangThai = dto.TrangThai ?? "draft",
                    GiamGia = dto.GiamGia ?? 0m,
                    TongTien = tongTien,
                    GhiChu = dto.GhiChu ?? "",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.PhieuNhapHangs.Add(phieu);
                await _context.SaveChangesAsync();

                if (dto.Items.Count > 0)
                {
                    var details = dto.Items.Select(i => new ChiTietPhieuNhap
                    {
                        PhieuNhapId = phieu.Id,
                        BienTheId = i.BienTheId,
                        SoLuong = i.SoLuong,
                        DonGiaNhap = i.DonGiaNhap,
                        GiamGia = i.GiamGia ?? 0m
                    }).ToList();

                    _context.ChiTietPhieuNhaps.AddRange(details);
                    await _context.SaveChangesAsync();
                }

                if (phieu.TrangThai == "completed")
                {
                    await UpdateTonKhoAsync(dto.Items);
                }

                await transaction.CommitAsync();
                return StatusCode(201, new { message = "Tạo phiếu nhập thành công!", data = new { id = phieu.Id, ma_phieu = maPhieu } });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Lỗi create PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi tạo phiếu nhập!" });
            }
        }

        // 4. PUT: api/phieu-nhap/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] CreateUpdateReceiptDto dto)
        {
            if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var phieu = await _context.PhieuNhapHangs.FindAsync(id);
                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu!" });
                }

                if (phieu.TrangThai != "draft")
                {
                    return BadRequest(new { message = "Chỉ có thể sửa phiếu tạm!" });
                }

                // Xóa chi tiết cũ và tạo lại
                var oldDetails = await _context.ChiTietPhieuNhaps.Where(ct => ct.PhieuNhapId == id).ToListAsync();
                if (oldDetails.Count > 0)
                {
                    _context.ChiTietPhieuNhaps.RemoveRange(oldDetails);
                    await _context.SaveChangesAsync();
                }

                // Tính tổng tiền
                decimal tongTien = dto.Items.Sum(i => (i.SoLuong * i.DonGiaNhap) - (i.GiamGia ?? 0m)) - (dto.GiamGia ?? 0m);

                phieu.NhaCcId = dto.NhaCcId;
                phieu.GiamGia = dto.GiamGia ?? 0m;
                phieu.TongTien = tongTien;
                phieu.GhiChu = dto.GhiChu ?? "";
                phieu.UpdatedAt = DateTimeOffset.UtcNow;

                if (dto.Items.Count > 0)
                {
                    var details = dto.Items.Select(i => new ChiTietPhieuNhap
                    {
                        PhieuNhapId = id,
                        BienTheId = i.BienTheId,
                        SoLuong = i.SoLuong,
                        DonGiaNhap = i.DonGiaNhap,
                        GiamGia = i.GiamGia ?? 0m
                    }).ToList();

                    _context.ChiTietPhieuNhaps.AddRange(details);
                    await _context.SaveChangesAsync();
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Cập nhật phiếu thành công!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Lỗi update PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật phiếu!" });
            }
        }

        // 5. PATCH: api/phieu-nhap/{id}/complete
        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> Complete(long id)
        {
            if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var phieu = await _context.PhieuNhapHangs
                    .Include(p => p.ChiTietPhieuNhaps)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu!" });
                }

                if (phieu.TrangThai != "draft")
                {
                    return BadRequest(new { message = "Phiếu này không thể hoàn thành!" });
                }

                // Cập nhật tồn kho
                var items = phieu.ChiTietPhieuNhaps.Select(ct => new ReceiptItemDto
                {
                    BienTheId = ct.BienTheId,
                    SoLuong = ct.SoLuong ?? 0,
                    DonGiaNhap = ct.DonGiaNhap ?? 0m,
                    GiamGia = ct.GiamGia ?? 0m
                }).ToList();

                await UpdateTonKhoAsync(items);

                phieu.TrangThai = "completed";
                phieu.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { message = "Hoàn thành phiếu nhập thành công! Tồn kho đã được cập nhật." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Lỗi complete PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi hoàn thành phiếu!" });
            }
        }

        // 6. PATCH: api/phieu-nhap/{id}/cancel
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(long id)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var phieu = await _context.PhieuNhapHangs.FindAsync(id);
                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu!" });
                }

                if (phieu.TrangThai == "completed")
                {
                    return BadRequest(new { message = "Không thể hủy phiếu đã hoàn thành!" });
                }

                phieu.TrangThai = "cancelled";
                phieu.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã hủy phiếu nhập!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cancel PhieuNhap: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi hủy phiếu!" });
            }
        }

        // 7. GET: api/phieu-nhap/search-bien-the
        [HttpGet("search-bien-the")]
        public async Task<IActionResult> SearchBienThe([FromQuery] string q = "")
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                string queryText = $"%{q}%";

                var query = _context.BienTheSanPhams
                    .Include(b => b.SanPham)
                        .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(q))
                {
                    query = query.Where(b => 
                        EF.Functions.Like(b.Sku, queryText) || 
                        EF.Functions.Like(b.SanPham.TenSanPham, queryText)
                    );
                }

                var list = await query.Take(20).ToListAsync();

                // Format to match unique output
                var unique = list.GroupBy(b => b.Id).Select(g => g.First()).Select(b => new
                {
                    b.Id,
                    b.SanPhamId,
                    b.Sku,
                    b.MauSac,
                    b.DungLuong,
                    b.Ram,
                    b.GiaGoc,
                    b.GiaBan,
                    b.TonKho,
                    b.MaMauHex,
                    b.TrangThai,
                    san_pham = new
                    {
                        b.SanPham.Id,
                        b.SanPham.TenSanPham,
                        hinh_anh = b.SanPham.HinhAnhSanPhams.Take(1).Select(img => new { url_anh = img.UrlAnh }).ToList()
                    }
                }).ToList();

                return Ok(unique);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi searchBienThe: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi tìm kiếm biến thể!" });
            }
        }

        #region Helpers
        private async Task UpdateTonKhoAsync(List<ReceiptItemDto> items)
        {
            foreach (var item in items)
            {
                var bienThe = await _context.BienTheSanPhams.FindAsync(item.BienTheId);
                if (bienThe != null)
                {
                    bienThe.TonKho += item.SoLuong;
                }

                var kho = await _context.Khos.FirstOrDefaultAsync(k => k.BienTheId == item.BienTheId);
                if (kho != null)
                {
                    kho.SoLuongTon += item.SoLuong;
                    kho.UpdatedAt = DateTime.Now;
                }
                else
                {
                    _context.Khos.Add(new Kho
                    {
                        BienTheId = item.BienTheId,
                        SoLuongTon = item.SoLuong,
                        SoLuongGiuCho = 0,
                        NguongCanhBao = 5,
                        UpdatedAt = DateTime.Now
                    });
                }
            }
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}
