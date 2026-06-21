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
    [Route("api/payments")]
    [ApiController]
    public class MethodPayController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MethodPayController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        // 1. GET: api/payments
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActivePayments()
        {
            try
            {
                var list = await _context.PhuongThucThanhToans
                    .Where(p => p.TrangThai == "active")
                    .OrderBy(p => p.Id)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy phương thức thanh toán active: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 2. GET: api/payments/admin-pay
        [HttpGet("admin-pay")]
        [Authorize]
        public async Task<IActionResult> GetAllPaymentsAdmin()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var list = await _context.PhuongThucThanhToans
                    .OrderByDescending(p => p.Id)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy phương thức thanh toán admin: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 3. POST: api/payments
        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreatePayment(
            [FromForm] string ten_phuong_thuc,
            [FromForm] string ma,
            [FromForm] string loai,
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

                var newPayment = new PhuongThucThanhToan
                {
                    TenPhuongThuc = ten_phuong_thuc,
                    Ma = ma,
                    Loai = loai,
                    LogoUrl = logoPath,
                    TrangThai = trang_thai ?? "active",
                    PhiThanhToan = 0m
                };

                _context.PhuongThucThanhToans.Add(newPayment);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Thêm thành công", data = newPayment });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm phương thức thanh toán: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi thêm phương thức" });
            }
        }

        // 4. PUT: api/payments/{id}
        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdatePayment(
            long id,
            [FromForm] string? ten_phuong_thuc,
            [FromForm] string? ma,
            [FromForm] string? loai,
            [FromForm] string? trang_thai,
            IFormFile? logo_url)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var payment = await _context.PhuongThucThanhToans.FindAsync(id);
                if (payment == null)
                {
                    return NotFound(new { message = "Không tìm thấy" });
                }

                if (!string.IsNullOrEmpty(ten_phuong_thuc)) payment.TenPhuongThuc = ten_phuong_thuc;
                if (!string.IsNullOrEmpty(ma)) payment.Ma = ma;
                if (!string.IsNullOrEmpty(loai)) payment.Loai = loai;
                if (!string.IsNullOrEmpty(trang_thai)) payment.TrangThai = trang_thai;

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
                    if (!string.IsNullOrEmpty(payment.LogoUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), payment.LogoUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFilePath);
                            }
                            catch { }
                        }
                    }

                    payment.LogoUrl = $"/uploads/{uniqueFileName}";
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công", data = payment });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật phương thức thanh toán: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi cập nhật" });
            }
        }

        // 5. PUT: api/payments/{id}/toggle
        [HttpPut("{id}/toggle")]
        [Authorize]
        public async Task<IActionResult> TogglePaymentStatus(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var payment = await _context.PhuongThucThanhToans.FindAsync(id);
                if (payment == null)
                {
                    return NotFound(new { message = "Không tìm thấy" });
                }

                payment.TrangThai = payment.TrangThai == "active" ? "inactive" : "active";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã đổi trạng thái", trang_thai = payment.TrangThai });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi toggle payment status: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 6. DELETE: api/payments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePayment(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var payment = await _context.PhuongThucThanhToans.FindAsync(id);
                if (payment == null)
                {
                    return NotFound(new { message = "Không tìm thấy" });
                }

                // Delete logo file
                if (!string.IsNullOrEmpty(payment.LogoUrl))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), payment.LogoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        try
                        {
                            System.IO.File.Delete(filePath);
                        }
                        catch { }
                    }
                }

                _context.PhuongThucThanhToans.Remove(payment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa phương thức thanh toán: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi xóa" });
            }
        }
    }
}
