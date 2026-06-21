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
    [Route("api/khuyenMai")]
    [ApiController]
    [Authorize]
    public class KhuyenMaiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KhuyenMaiController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        #region DTOs
        public class CreateUpdateVoucherDto
        {
            [JsonPropertyName("ma_khuyen_mai")]
            public string MaKhuyenMai { get; set; } = null!;

            [JsonPropertyName("ten_chuong_trinh")]
            public string TenChuongTrinh { get; set; } = null!;

            [JsonPropertyName("loai")]
            public string Loai { get; set; } = null!;

            [JsonPropertyName("gia_tri")]
            public decimal GiaTri { get; set; }

            [JsonPropertyName("gia_tri_toi_da")]
            public decimal? GiaTriToiDa { get; set; }

            [JsonPropertyName("don_hang_toi_thieu")]
            public decimal? DonHangToiThieu { get; set; }

            [JsonPropertyName("so_luong_ma")]
            public int SoLuongMa { get; set; }

            [JsonPropertyName("ngay_bat_dau")]
            public string NgayBatDau { get; set; } = null!;

            [JsonPropertyName("ngay_ket_thuc")]
            public string NgayKetThuc { get; set; } = null!;
        }
        #endregion

        // 1. GET: api/khuyenMai
        [HttpGet]
        public async Task<IActionResult> GetAllKhuyenMai()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var list = await _context.KhuyenMais
                    .OrderByDescending(k => k.Id)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách KM: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi lấy danh sách khuyến mãi!" });
            }
        }

        // 2. POST: api/khuyenMai
        [HttpPost]
        public async Task<IActionResult> CreateKhuyenMai([FromBody] CreateUpdateVoucherDto dto)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                string codeUpper = dto.MaKhuyenMai.Trim().ToUpper();
                var exists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == codeUpper);
                if (exists)
                {
                    return BadRequest(new { message = "Mã khuyến mãi này đã tồn tại trong hệ thống!" });
                }

                DateTime start = DateTime.Parse(dto.NgayBatDau);
                DateTime end = DateTime.Parse(dto.NgayKetThuc);

                var newVoucher = new KhuyenMai
                {
                    MaKhuyenMai = codeUpper,
                    TenChuongTrinh = dto.TenChuongTrinh,
                    Loai = dto.Loai,
                    GiaTri = dto.GiaTri,
                    GiaTriToiDa = dto.GiaTriToiDa,
                    DonHangToiThieu = dto.DonHangToiThieu ?? 0m,
                    SoLuongMa = dto.SoLuongMa,
                    DaSuDung = 0,
                    NgayBatDau = start,
                    NgayKetThuc = end,
                    TrangThai = "active"
                };

                _context.KhuyenMais.Add(newVoucher);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Tạo mã khuyến mãi thành công!", data = newVoucher });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi tạo KM: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi tạo khuyến mãi!" });
            }
        }

        // 3. PUT: api/khuyenMai/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateKhuyenMai(long id, [FromBody] CreateUpdateVoucherDto dto)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var voucher = await _context.KhuyenMais.FindAsync(id);
                if (voucher == null)
                {
                    return NotFound(new { message = "Không tìm thấy mã khuyến mãi!" });
                }

                string codeUpper = dto.MaKhuyenMai.Trim().ToUpper();
                if (codeUpper != voucher.MaKhuyenMai)
                {
                    var exists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == codeUpper);
                    if (exists)
                    {
                        return BadRequest(new { message = "Mã khuyến mãi mới đã tồn tại!" });
                    }
                }

                DateTime start = DateTime.Parse(dto.NgayBatDau);
                DateTime end = DateTime.Parse(dto.NgayKetThuc);

                voucher.MaKhuyenMai = codeUpper;
                voucher.TenChuongTrinh = dto.TenChuongTrinh;
                voucher.Loai = dto.Loai;
                voucher.GiaTri = dto.GiaTri;
                voucher.GiaTriToiDa = dto.GiaTriToiDa;
                voucher.DonHangToiThieu = dto.DonHangToiThieu ?? 0m;
                voucher.SoLuongMa = dto.SoLuongMa;
                voucher.NgayBatDau = start;
                voucher.NgayKetThuc = end;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật mã thành công!", data = voucher });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi update KM: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi cập nhật khuyến mãi!" });
            }
        }

        // 4. PUT: api/khuyenMai/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> ToggleTrangThai(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var voucher = await _context.KhuyenMais.FindAsync(id);
                if (voucher == null)
                {
                    return NotFound(new { message = "Không tìm thấy mã!" });
                }

                string newStatus = voucher.TrangThai == "active" ? "inactive" : "active";
                voucher.TrangThai = newStatus;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật trạng thái thành công!",
                    trang_thai = newStatus
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi toggle KM: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi cập nhật trạng thái!" });
            }
        }

        // 5. DELETE: api/khuyenMai/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteKhuyenMai(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var voucher = await _context.KhuyenMais.FindAsync(id);
                if (voucher == null)
                {
                    return NotFound(new { message = "Không tìm thấy mã!" });
                }

                _context.KhuyenMais.Remove(voucher);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa mã khuyến mãi khỏi hệ thống!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa KM: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi xóa mã khuyến mãi!" });
            }
        }
    }
}
