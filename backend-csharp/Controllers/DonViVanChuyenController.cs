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
    [Route("api/logistics")]
    [ApiController]
    public class DonViVanChuyenController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DonViVanChuyenController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        // 1. GET: api/logistics
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveLogistics()
        {
            try
            {
                var list = await _context.DonViVanChuyens
                    .Where(l => l.TrangThai == "active")
                    .OrderBy(l => l.Id)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách vận chuyển active: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 2. GET: api/logistics/admin-logistics
        [HttpGet("admin-logistics")]
        [Authorize]
        public async Task<IActionResult> GetAllLogisticsAdmin()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var list = await _context.DonViVanChuyens
                    .OrderByDescending(l => l.Id)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách vận chuyển admin: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 3. POST: api/logistics
        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateLogistic(
            [FromForm] string ten_don_vi,
            [FromForm] string ma,
            [FromForm] decimal? phi_co_ban,
            [FromForm] string? thoi_gian_du_kien,
            [FromForm] string? trang_thai,
            IFormFile? logo_url)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                string? logoPath = null;
                if (logo_url != null && logo_url.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(logo_url.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await logo_url.CopyToAsync(stream);
                    }

                    logoPath = $"/uploads/{uniqueFileName}";
                }

                var newLogistic = new DonViVanChuyen
                {
                    TenDonVi = ten_don_vi,
                    Ma = ma,
                    LogoUrl = logoPath,
                    PhiCoBan = phi_co_ban ?? 0m,
                    ThoiGianDuKien = thoi_gian_du_kien,
                    TrangThai = trang_thai ?? "active"
                };

                _context.DonViVanChuyens.Add(newLogistic);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Thêm đơn vị vận chuyển thành công", data = newLogistic });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm đơn vị vận chuyển: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi thêm đơn vị vận chuyển" });
            }
        }

        // 4. PUT: api/logistics/{id}
        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateLogistic(
            long id,
            [FromForm] string? ten_don_vi,
            [FromForm] string? ma,
            [FromForm] decimal? phi_co_ban,
            [FromForm] string? thoi_gian_du_kien,
            [FromForm] string? trang_thai,
            IFormFile? logo_url)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var logistic = await _context.DonViVanChuyens.FindAsync(id);
                if (logistic == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn vị vận chuyển" });
                }

                if (!string.IsNullOrEmpty(ten_don_vi)) logistic.TenDonVi = ten_don_vi;
                if (!string.IsNullOrEmpty(ma)) logistic.Ma = ma;
                if (phi_co_ban.HasValue) logistic.PhiCoBan = phi_co_ban.Value;
                if (thoi_gian_du_kien != null) logistic.ThoiGianDuKien = thoi_gian_du_kien;
                if (!string.IsNullOrEmpty(trang_thai)) logistic.TrangThai = trang_thai;

                if (logo_url != null && logo_url.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(logo_url.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await logo_url.CopyToAsync(stream);
                    }

                    // Delete old logo
                    if (!string.IsNullOrEmpty(logistic.LogoUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), logistic.LogoUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFilePath);
                            }
                            catch { }
                        }
                    }

                    logistic.LogoUrl = $"/uploads/{uniqueFileName}";
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công", data = logistic });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật đơn vị vận chuyển: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi cập nhật đơn vị vận chuyển" });
            }
        }

        // 5. PUT: api/logistics/{id}/toggle
        [HttpPut("{id}/toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleLogisticStatus(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var logistic = await _context.DonViVanChuyens.FindAsync(id);
                if (logistic == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn vị vận chuyển" });
                }

                logistic.TrangThai = logistic.TrangThai == "active" ? "inactive" : "active";
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đổi trạng thái thành công",
                    trang_thai = logistic.TrangThai
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi toggle logistic status: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 6. DELETE: api/logistics/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteLogistic(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var logistic = await _context.DonViVanChuyens.FindAsync(id);
                if (logistic == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn vị vận chuyển" });
                }

                // Delete logo file
                if (!string.IsNullOrEmpty(logistic.LogoUrl))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), logistic.LogoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        try
                        {
                            System.IO.File.Delete(filePath);
                        }
                        catch { }
                    }
                }

                _context.DonViVanChuyens.Remove(logistic);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa đơn vị vận chuyển: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }
    }
}
