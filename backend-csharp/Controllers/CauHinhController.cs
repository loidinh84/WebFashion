using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/cau-hinh")]
    [ApiController]
    public class CauHinhController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CauHinhController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        #region DTOs
        public class UpdateHomeConfigDto
        {
            [JsonPropertyName("sections")]
            public List<HomeSectionDto> Sections { get; set; } = new();
        }

        public class HomeSectionDto
        {
            [JsonPropertyName("ten_phan")]
            public string TenPhan { get; set; } = null!;

            [JsonPropertyName("ten_tab_1")]
            public string? TenTab1 { get; set; }

            [JsonPropertyName("danh_muc_id_1")]
            public int? DanhMucId1 { get; set; }

            [JsonPropertyName("ten_tab_2")]
            public string? TenTab2 { get; set; }

            [JsonPropertyName("danh_muc_id_2")]
            public int? DanhMucId2 { get; set; }

            [JsonPropertyName("loai_hien_thi")]
            public string? LoaiHienThi { get; set; }

            [JsonPropertyName("du_lieu_json")]
            public object? DuLieuJson { get; set; }
        }
        #endregion

        // 1. GET: api/cau-hinh/home
        [HttpGet("home")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomeConfiguration()
        {
            try
            {
                var config = await _context.CauHinhTrangChus
                    .Where(c => c.TrangThai == "active")
                    .OrderBy(c => c.ThuTu)
                    .ToListAsync();

                var parsedConfig = config.Select(item =>
                {
                    object? parsedJson = null;
                    if (!string.IsNullOrEmpty(item.DuLieuJson))
                    {
                        try
                        {
                            parsedJson = JsonSerializer.Deserialize<JsonElement>(item.DuLieuJson);
                        }
                        catch
                        {
                            parsedJson = new List<object>();
                        }
                    }

                    return new
                    {
                        id = item.Id,
                        ten_phan = item.TenPhan,
                        ten_tab_1 = item.TenTab1,
                        danh_muc_id_1 = item.DanhMucId1,
                        ten_tab_2 = item.TenTab2,
                        danh_muc_id_2 = item.DanhMucId2,
                        loai_hien_thi = item.LoaiHienThi,
                        du_lieu_json = parsedJson,
                        thu_tu = item.ThuTu,
                        trang_thai = item.TrangThai
                    };
                }).ToList();

                return Ok(parsedConfig);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy cấu hình trang chủ: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 2. POST: api/cau-hinh/home
        [HttpPost("home")]
        [Authorize]
        public async Task<IActionResult> UpdateHomeConfiguration([FromBody] UpdateHomeConfigDto dto)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var all = await _context.CauHinhTrangChus.ToListAsync();
                if (all.Count > 0)
                {
                    _context.CauHinhTrangChus.RemoveRange(all);
                    await _context.SaveChangesAsync();
                }

                if (dto.Sections != null && dto.Sections.Count > 0)
                {
                    int index = 1;
                    foreach (var s in dto.Sections)
                    {
                        string? jsonStr = null;
                        if (s.DuLieuJson != null)
                        {
                            jsonStr = JsonSerializer.Serialize(s.DuLieuJson);
                        }

                        var newItem = new CauHinhTrangChu
                        {
                            TenPhan = s.TenPhan,
                            TenTab1 = s.TenTab1,
                            DanhMucId1 = s.DanhMucId1,
                            TenTab2 = s.TenTab2,
                            DanhMucId2 = s.DanhMucId2,
                            LoaiHienThi = s.LoaiHienThi ?? "ProductSection",
                            DuLieuJson = jsonStr,
                            ThuTu = index++,
                            TrangThai = "active"
                        };
                        _context.CauHinhTrangChus.Add(newItem);
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Cập nhật cấu hình thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật cấu hình: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 3. POST: api/cau-hinh/upload (Upload icon cho dải tiện ích)
        [HttpPost("upload")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadIcon(IFormFile icon)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                if (icon == null || icon.Length == 0)
                {
                    return BadRequest(new { message = "Không có file nào được tải lên!" });
                }

                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(icon.FileName)}";
                var filePath = Path.Combine(uploadsDir, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await icon.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/{uniqueFileName}";
                return Ok(new { imageUrl });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi upload icon: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi upload icon!" });
            }
        }
    }
}
