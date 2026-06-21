using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/banners")]
    [ApiController]
    public class BannerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BannerController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        // 1. LẤY DANH SÁCH BANNER ĐANG HOẠT ĐỘNG (Dành cho Client)
        // GET: api/banners
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveBanners([FromQuery] string? vi_tri)
        {
            try
            {
                var now = DateTime.Now;
                string viTriSearch = vi_tri ?? "main_slider";

                var banners = await _context.Banners
                    .Where(b => b.TrangThai == "active" && b.ViTri == viTriSearch)
                    .Where(b => (b.NgayBatDau == null || b.NgayBatDau <= now) && (b.NgayKetThuc == null || b.NgayKetThuc >= now))
                    .OrderBy(b => b.ThuTu)
                    .Select(b => new
                    {
                        id = b.Id,
                        tieu_de = b.TieuDe,
                        hinh_anh_url = b.HinhAnhUrl,
                        duong_dan = b.DuongDan,
                        vi_tri = b.ViTri,
                        thu_tu = b.ThuTu,
                        ngay_bat_dau = b.NgayBatDau,
                        ngay_ket_thuc = b.NgayKetThuc,
                        trang_thai = b.TrangThai
                    })
                    .ToListAsync();

                return Ok(banners);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lấy danh sách banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách banner" });
            }
        }

        // 2. LẤY TẤT CẢ BANNER (Dành cho Admin)
        // GET: api/banners/admin-banner
        [HttpGet("admin-banner")]
        [Authorize]
        public async Task<IActionResult> GetAllBannersAdmin()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var banners = await _context.Banners
                    .OrderBy(b => b.ViTri)
                    .ThenBy(b => b.ThuTu)
                    .Select(b => new
                    {
                        id = b.Id,
                        tieu_de = b.TieuDe,
                        hinh_anh_url = b.HinhAnhUrl,
                        duong_dan = b.DuongDan,
                        vi_tri = b.ViTri,
                        thu_tu = b.ThuTu,
                        ngay_bat_dau = b.NgayBatDau,
                        ngay_ket_thuc = b.NgayKetThuc,
                        trang_thai = b.TrangThai
                    })
                    .ToListAsync();

                return Ok(banners);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi lấy danh sách banner" });
            }
        }

        // 3. THÊM BANNER MỚI
        // POST: api/banners
        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateBanner(
            [FromForm] string? tieu_de,
            [FromForm] string? duong_dan,
            [FromForm] string? vi_tri,
            [FromForm] int? thu_tu,
            [FromForm] string? ngay_bat_dau,
            [FromForm] string? ngay_ket_thuc,
            [FromForm] string? trang_thai,
            IFormFile? hinh_anh)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                string? hinh_anh_url = null;
                if (hinh_anh != null && hinh_anh.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(hinh_anh.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await hinh_anh.CopyToAsync(stream);
                    }

                    hinh_anh_url = $"/uploads/{uniqueFileName}";
                }

                if (string.IsNullOrEmpty(hinh_anh_url))
                {
                    return BadRequest(new { message = "Vui lòng chọn hình ảnh cho banner!" });
                }

                DateTime? start = null;
                if (DateTime.TryParse(ngay_bat_dau, out var sDt)) start = sDt;

                DateTime? end = null;
                if (DateTime.TryParse(ngay_ket_thuc, out var eDt)) end = eDt;

                var banner = new Banner
                {
                    TieuDe = tieu_de,
                    HinhAnhUrl = hinh_anh_url,
                    DuongDan = duong_dan,
                    ViTri = vi_tri ?? "homepage",
                    ThuTu = thu_tu ?? 0,
                    NgayBatDau = start,
                    NgayKetThuc = end,
                    TrangThai = trang_thai ?? "active"
                };

                _context.Banners.Add(banner);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Tạo banner thành công", data = ProjectBanner(banner) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi tạo banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi tạo banner" });
            }
        }

        // 4. CẬP NHẬT TRẠNG THÁI ACTIVE / INACTIVE
        // PUT: api/banners/{id}/toggle
        [HttpPut("{id}/toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleBannerStatus(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var banner = await _context.Banners.FindAsync(id);
                if (banner == null)
                {
                    return NotFound(new { message = "Không tìm thấy banner" });
                }

                banner.TrangThai = banner.TrangThai == "active" ? "inactive" : "active";
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật trạng thái thành công",
                    trang_thai = banner.TrangThai
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật trạng thái banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi cập nhật trạng thái" });
            }
        }

        // 5. CẬP NHẬT CHI TIẾT BANNER
        // PUT: api/banners/{id}
        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateBanner(
            long id,
            [FromForm] string? tieu_de,
            [FromForm] string? duong_dan,
            [FromForm] int? thu_tu,
            [FromForm] string? vi_tri,
            IFormFile? hinh_anh)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var banner = await _context.Banners.FindAsync(id);
                if (banner == null)
                {
                    return NotFound(new { message = "Không tìm thấy banner" });
                }

                banner.TieuDe = tieu_de;
                banner.DuongDan = duong_dan;
                if (thu_tu.HasValue) banner.ThuTu = thu_tu.Value;
                if (!string.IsNullOrEmpty(vi_tri)) banner.ViTri = vi_tri;

                if (hinh_anh != null && hinh_anh.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(hinh_anh.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await hinh_anh.CopyToAsync(stream);
                    }

                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(banner.HinhAnhUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), banner.HinhAnhUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFilePath);
                            }
                            catch { }
                        }
                    }

                    banner.HinhAnhUrl = $"/uploads/{uniqueFileName}";
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật banner thành công", data = ProjectBanner(banner) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi cập nhật banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi cập nhật banner" });
            }
        }

        // 6. XÓA BANNER
        // DELETE: api/banners/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteBanner(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var banner = await _context.Banners.FindAsync(id);
                if (banner == null)
                {
                    return NotFound(new { message = "Không tìm thấy banner" });
                }

                // Delete image file from filesystem
                if (!string.IsNullOrEmpty(banner.HinhAnhUrl))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), banner.HinhAnhUrl.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        try
                        {
                            System.IO.File.Delete(filePath);
                        }
                        catch { }
                    }
                }

                _context.Banners.Remove(banner);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa banner" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa banner: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi xóa banner" });
            }
        }

        private object ProjectBanner(Banner b)
        {
            return new
            {
                id = b.Id,
                tieu_de = b.TieuDe,
                hinh_anh_url = b.HinhAnhUrl,
                duong_dan = b.DuongDan,
                vi_tri = b.ViTri,
                thu_tu = b.ThuTu,
                ngay_bat_dau = b.NgayBatDau,
                ngay_ket_thuc = b.NgayKetThuc,
                trang_thai = b.TrangThai
            };
        }
    }
}
