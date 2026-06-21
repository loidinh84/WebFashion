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
    [Route("api/mau-in")]
    [ApiController]
    [Authorize]
    public class MauInController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MauInController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        #region DTOs
        public class SaveTemplateDto
        {
            [JsonPropertyName("loai")]
            public string Loai { get; set; } = null!;

            [JsonPropertyName("ten_mau")]
            public string TenMau { get; set; } = null!;

            [JsonPropertyName("noi_dung_html")]
            public string NoiDungHtml { get; set; } = null!;

            [JsonPropertyName("la_mac_dinh")]
            public bool LaMacDinh { get; set; }

            [JsonPropertyName("trang_thai")]
            public string TrangThai { get; set; } = "active";
        }
        #endregion

        // 1. GET: api/mau-in
        [HttpGet]
        public async Task<IActionResult> GetAllTemplates()
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var templates = await _context.MauIns
                    .Select(m => new
                    {
                        id = m.Id,
                        loai = m.Loai,
                        ten_mau = m.TenMau,
                        noi_dung_html = m.NoiDungHtml,
                        la_mac_dinh = m.LaMacDinh,
                        trang_thai = m.TrangThai
                    })
                    .ToListAsync();
                return Ok(templates);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getAllTemplates: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách mẫu in" });
            }
        }

        // 2. GET: api/mau-in/init-defaults
        [HttpGet("init-defaults")]
        public async Task<IActionResult> InitDefaultTemplates()
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var defaults = new List<(string Loai, string TenMau)>
                {
                    ("ORDER_INVOICE", "Hóa đơn bán hàng"),
                    ("IMPORT_RECEIPT", "Phiếu nhập hàng"),
                    ("CHECK_REPORT", "Phiếu kiểm kho")
                };

                foreach (var d in defaults)
                {
                    var exists = await _context.MauIns.AnyAsync(m => m.Loai == d.Loai);
                    if (!exists)
                    {
                        var newTemplate = new MauIn
                        {
                            Loai = d.Loai,
                            TenMau = d.TenMau,
                            NoiDungHtml = "{}",
                            LaMacDinh = true,
                            TrangThai = "active"
                        };
                        _context.MauIns.Add(newTemplate);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã khởi tạo các mẫu mặc định" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khởi tạo mẫu in: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khởi tạo mẫu in", error = ex.Message });
            }
        }

        // 3. GET: api/mau-in/{code}
        [HttpGet("{code}")]
        public async Task<IActionResult> GetTemplateByCode(string code)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var template = await _context.MauIns.FirstOrDefaultAsync(m => m.Loai == code);
                if (template == null)
                {
                    return NotFound(new { message = "Không tìm thấy mẫu in" });
                }
                return Ok(ProjectTemplate(template));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy mẫu in: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy mẫu in" });
            }
        }

        // 4. POST: api/mau-in
        [HttpPost]
        public async Task<IActionResult> SaveTemplate([FromBody] SaveTemplateDto dto)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var template = await _context.MauIns.FirstOrDefaultAsync(m => m.Loai == dto.Loai);

                if (template != null)
                {
                    template.TenMau = dto.TenMau;
                    template.NoiDungHtml = dto.NoiDungHtml;
                    template.LaMacDinh = dto.LaMacDinh;
                    template.TrangThai = dto.TrangThai;

                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Cập nhật mẫu in thành công", data = ProjectTemplate(template) });
                }
                else
                {
                    var newTemplate = new MauIn
                    {
                        Loai = dto.Loai,
                        TenMau = dto.TenMau,
                        NoiDungHtml = dto.NoiDungHtml,
                        LaMacDinh = dto.LaMacDinh,
                        TrangThai = dto.TrangThai
                    };
                    _context.MauIns.Add(newTemplate);
                    await _context.SaveChangesAsync();
                    return StatusCode(201, new { message = "Tạo mẫu in thành công", data = ProjectTemplate(newTemplate) });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lưu mẫu in: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lưu mẫu in", error = ex.Message });
            }
        }

        // 5. DELETE: api/mau-in/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(long id)
        {
            try
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });

                var template = await _context.MauIns.FindAsync(id);
                if (template == null)
                {
                    return NotFound(new { message = "Không tìm thấy mẫu in để xóa" });
                }

                _context.MauIns.Remove(template);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa mẫu in thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi xóa mẫu in: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi xóa mẫu in" });
            }
        }

        private object ProjectTemplate(MauIn m)
        {
            return new
            {
                id = m.Id,
                loai = m.Loai,
                ten_mau = m.TenMau,
                noi_dung_html = m.NoiDungHtml,
                la_mac_dinh = m.LaMacDinh,
                trang_thai = m.TrangThai
            };
        }
    }
}
