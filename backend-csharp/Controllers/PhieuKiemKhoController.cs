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
    [Route("api/kiem-kho")]
    [ApiController]
    [Authorize]
    public class PhieuKiemKhoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PhieuKiemKhoController(AppDbContext context)
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
        public class CreateAuditDto
        {
            [JsonPropertyName("ghi_chu")]
            public string? GhiChu { get; set; }

            [JsonPropertyName("trang_thai")]
            public string? TrangThai { get; set; } = "balanced";

            [JsonPropertyName("items")]
            public List<AuditItemDto> Items { get; set; } = new();
        }

        public class AuditItemDto
        {
            [JsonPropertyName("bien_the_id")]
            public long BienTheId { get; set; }

            [JsonPropertyName("so_luong_he_thong")]
            public int SoLuongHeThong { get; set; }

            [JsonPropertyName("so_luong_thuc_te")]
            public int SoLuongThucTe { get; set; }
        }
        #endregion

        // 1. GET: api/kiem-kho
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string search = "",
            [FromQuery] string? trang_thai = null,
            [FromQuery] string? ngay_tu = null,
            [FromQuery] string? ngay_den = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var query = _context.PhieuKiemKhos.AsQueryable();

                if (!string.IsNullOrEmpty(trang_thai) && trang_thai != "all")
                {
                    query = query.Where(p => p.TrangThai == trang_thai);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p => EF.Functions.Like(p.MaPhieu, $"%{search}%"));
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

                int offset = (page - 1) * limit;
                int total = await query.CountAsync();

                var list = await query
                    .Include(p => p.NguoiTaoNavigation)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip(offset)
                    .Take(limit)
                    .Select(p => new
                    {
                        p.Id,
                        p.MaPhieu,
                        p.NguoiTao,
                        p.TrangThai,
                        p.GhiChu,
                        p.TongChenhLech,
                        p.LenhTang,
                        p.LenhGiam,
                        p.CreatedAt,
                        p.UpdatedAt,
                        nguoi_tao_tk = p.NguoiTaoNavigation != null ? new { id = p.NguoiTaoNavigation.Id, ho_ten = p.NguoiTaoNavigation.HoTen } : null
                    })
                    .ToListAsync();

                return Ok(new { data = list, total = total, page = page });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getAll PhieuKiemKho: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 2. GET: api/kiem-kho/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var phieu = await _context.PhieuKiemKhos
                    .Include(p => p.NguoiTaoNavigation)
                    .Include(p => p.ChiTietKiemKhos)
                        .ThenInclude(ct => ct.BienThe)
                            .ThenInclude(bt => bt.SanPham)
                                .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu kiểm kho!" });
                }

                // Format response to match Node.js
                var result = new
                {
                    phieu.Id,
                    phieu.MaPhieu,
                    phieu.NguoiTao,
                    phieu.TrangThai,
                    phieu.GhiChu,
                    phieu.TongChenhLech,
                    phieu.LenhTang,
                    phieu.LenhGiam,
                    phieu.CreatedAt,
                    phieu.UpdatedAt,
                    nguoi_tao_tk = phieu.NguoiTaoNavigation != null ? new { id = phieu.NguoiTaoNavigation.Id, ho_ten = phieu.NguoiTaoNavigation.HoTen } : null,
                    chi_tiet = phieu.ChiTietKiemKhos.Select(ct => new
                    {
                        ct.Id,
                        ct.PhieuKiemId,
                        ct.BienTheId,
                        ct.SoLuongHeThong,
                        ct.SoLuongThucTe,
                        bien_the = new
                        {
                            ct.BienThe.Id,
                            ct.BienThe.Sku,
                            ct.BienThe.MauSac,
                            ct.BienThe.DungLuong,
                            ct.BienThe.Ram,
                            ct.BienThe.TonKho,
                            san_pham = new
                            {
                                ct.BienThe.SanPham.Id,
                                ct.BienThe.SanPham.TenSanPham,
                                hinh_anh = ct.BienThe.SanPham.HinhAnhSanPhams.Take(1).Select(img => new { url_anh = img.UrlAnh }).ToList()
                            }
                        }
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getById PhieuKiemKho: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 3. POST: api/kiem-kho
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAuditDto dto)
        {
            if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (dto.Items.Count == 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn ít nhất 1 hàng hóa để kiểm!" });
                }

                // Tự động sinh mã
                var last = await _context.PhieuKiemKhos.OrderByDescending(p => p.Id).FirstOrDefaultAsync();
                long nextNum = last != null ? long.Parse(last.MaPhieu.Replace("KK", "")) + 1 : 1;
                string maPhieu = "KK" + nextNum.ToString("D6");

                long? nguoiTao = GetUserId();

                int lenhTang = 0, lenhGiam = 0, tongChenhLech = 0;
                foreach (var item in dto.Items)
                {
                    int cl = item.SoLuongThucTe - item.SoLuongHeThong;
                    tongChenhLech += cl;
                    if (cl > 0) lenhTang += cl;
                    if (cl < 0) lenhGiam += Math.Abs(cl);
                }

                var phieu = new PhieuKiemKho
                {
                    MaPhieu = maPhieu,
                    NguoiTao = nguoiTao,
                    TrangThai = dto.TrangThai ?? "balanced",
                    GhiChu = dto.GhiChu ?? "",
                    TongChenhLech = tongChenhLech,
                    LenhTang = lenhTang,
                    LenhGiam = lenhGiam,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.PhieuKiemKhos.Add(phieu);
                await _context.SaveChangesAsync();

                var details = dto.Items.Select(i => new ChiTietKiemKho
                {
                    PhieuKiemId = phieu.Id,
                    BienTheId = i.BienTheId,
                    SoLuongHeThong = i.SoLuongHeThong,
                    SoLuongThucTe = i.SoLuongThucTe
                }).ToList();

                _context.ChiTietKiemKhos.AddRange(details);
                await _context.SaveChangesAsync();

                if (phieu.TrangThai == "balanced")
                {
                    await CapNhatTonKhoAsync(dto.Items);
                }

                await transaction.CommitAsync();
                return StatusCode(201, new { message = "Tạo phiếu kiểm kho thành công!", data = new { id = phieu.Id, ma_phieu = maPhieu } });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Lỗi create PhieuKiemKho: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi tạo phiếu kiểm kho!" });
            }
        }

        // 4. PATCH: api/kiem-kho/{id}/cancel
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(long id)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var phieu = await _context.PhieuKiemKhos.FindAsync(id);
                if (phieu == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu kiểm kho!" });
                }

                if (phieu.TrangThai == "cancelled")
                {
                    return BadRequest(new { message = "Phiếu đã hủy rồi!" });
                }

                phieu.TrangThai = "cancelled";
                phieu.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã hủy phiếu kiểm kho!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cancel PhieuKiemKho: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 5. GET: api/kiem-kho/search-bien-the
        [HttpGet("search-bien-the")]
        public async Task<IActionResult> SearchBienThe([FromQuery] string q = "")
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                if (string.IsNullOrWhiteSpace(q)) return Ok(new List<object>());

                string queryText = $"%{q}%";

                var byName = await _context.BienTheSanPhams
                    .Include(b => b.SanPham)
                        .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .Where(b => EF.Functions.Like(b.SanPham.TenSanPham, queryText))
                    .Take(15)
                    .ToListAsync();

                var bySku = await _context.BienTheSanPhams
                    .Include(b => b.SanPham)
                        .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .Where(b => EF.Functions.Like(b.Sku, queryText))
                    .Take(10)
                    .ToListAsync();

                var all = byName.Concat(bySku).ToList();
                var unique = all.GroupBy(b => b.Id).Select(g => g.First()).Take(20).Select(b => new
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
                Console.WriteLine($"Lỗi searchBienThe KiemKho: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi tìm kiếm!" });
            }
        }

        #region Helpers
        private async Task CapNhatTonKhoAsync(List<AuditItemDto> items)
        {
            foreach (var item in items)
            {
                var bienThe = await _context.BienTheSanPhams.FindAsync(item.BienTheId);
                if (bienThe != null)
                {
                    bienThe.TonKho = item.SoLuongThucTe;
                }

                var kho = await _context.Khos.FirstOrDefaultAsync(k => k.BienTheId == item.BienTheId);
                if (kho != null)
                {
                    kho.SoLuongTon = item.SoLuongThucTe;
                    kho.UpdatedAt = DateTime.Now;
                }
                else
                {
                    _context.Khos.Add(new Kho
                    {
                        BienTheId = item.BienTheId,
                        SoLuongTon = item.SoLuongThucTe,
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
