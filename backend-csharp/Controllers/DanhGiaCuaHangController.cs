using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/danh-gia-shop")]
    [ApiController]
    [Authorize]
    public class DanhGiaCuaHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DanhGiaCuaHangController(AppDbContext context)
        {
            _context = context;
        }

        private long GetUserId()
        {
            var idClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(idClaim) || !long.TryParse(idClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Chưa xác thực người dùng!");
            }
            return userId;
        }

        public class CreateOrUpdateReviewDto
        {
            [JsonPropertyName("so_sao")]
            public byte SoSao { get; set; }

            [JsonPropertyName("noi_dung")]
            public string? NoiDung { get; set; }
        }

        // 1. GET: api/danh-gia-shop/top
        [HttpGet("top")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTopReviews()
        {
            try
            {
                var reviews = await _context.DanhGiaCuaHangs
                    .Where(r => r.TrangThai == "approved")
                    .Include(r => r.TaiKhoan)
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(10)
                    .Select(r => new
                    {
                        id = r.Id,
                        tai_khoan_id = r.TaiKhoanId,
                        so_sao = r.SoSao,
                        noi_dung = r.NoiDung,
                        trang_thai = r.TrangThai,
                        created_at = r.CreatedAt,
                        nguoi_dung = new
                        {
                            ho_ten = r.TaiKhoan.HoTen,
                            anh_dai_dien = r.TaiKhoan.AnhDaiDien
                        }
                    })
                    .ToListAsync();

                var totalUsers = await _context.TaiKhoans
                    .CountAsync(t => t.TrangThai == "active");

                return Ok(new
                {
                    reviews,
                    totalUsers
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy đánh giá cửa hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 2. POST: api/danh-gia-shop
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateOrUpdateReviewDto dto)
        {
            try
            {
                var userId = GetUserId();

                if (dto.SoSao == 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn số sao!" });
                }

                var review = new DanhGiaCuaHang
                {
                    TaiKhoanId = userId,
                    SoSao = dto.SoSao,
                    NoiDung = dto.NoiDung,
                    TrangThai = "approved", // auto-approve as in JS controller
                    CreatedAt = DateTime.Now
                };

                _context.DanhGiaCuaHangs.Add(review);
                await _context.SaveChangesAsync();

                var responseData = new
                {
                    id = review.Id,
                    tai_khoan_id = review.TaiKhoanId,
                    so_sao = review.SoSao,
                    noi_dung = review.NoiDung,
                    trang_thai = review.TrangThai,
                    created_at = review.CreatedAt
                };

                return StatusCode(201, new { message = "Cảm ơn bạn đã đánh giá!", data = responseData });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi gửi đánh giá: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 3. GET: api/danh-gia-shop/user
        [HttpGet("user")]
        public async Task<IActionResult> GetUserReviews()
        {
            try
            {
                var userId = GetUserId();

                var reviews = await _context.DanhGiaCuaHangs
                    .Where(r => r.TaiKhoanId == userId)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        tai_khoan_id = r.TaiKhoanId,
                        so_sao = r.SoSao,
                        noi_dung = r.NoiDung,
                        trang_thai = r.TrangThai,
                        created_at = r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(reviews);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy đánh giá của user: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 4. PUT: api/danh-gia-shop/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(long id, [FromBody] CreateOrUpdateReviewDto dto)
        {
            try
            {
                var userId = GetUserId();

                if (dto.SoSao == 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn số sao!" });
                }

                var review = await _context.DanhGiaCuaHangs
                    .FirstOrDefaultAsync(r => r.Id == id && r.TaiKhoanId == userId);

                if (review == null)
                {
                    return NotFound(new { message = "Không tìm thấy đánh giá này!" });
                }

                review.SoSao = dto.SoSao;
                review.NoiDung = dto.NoiDung;
                review.TrangThai = "approved";

                await _context.SaveChangesAsync();

                var responseData = new
                {
                    id = review.Id,
                    tai_khoan_id = review.TaiKhoanId,
                    so_sao = review.SoSao,
                    noi_dung = review.NoiDung,
                    trang_thai = review.TrangThai,
                    created_at = review.CreatedAt
                };

                return Ok(new { message = "Cập nhật đánh giá thành công!", data = responseData });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật đánh giá: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 5. DELETE: api/danh-gia-shop/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(long id)
        {
            try
            {
                var userId = GetUserId();

                var review = await _context.DanhGiaCuaHangs
                    .FirstOrDefaultAsync(r => r.Id == id && r.TaiKhoanId == userId);

                if (review == null)
                {
                    return NotFound(new { message = "Không tìm thấy đánh giá này!" });
                }

                _context.DanhGiaCuaHangs.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa đánh giá thành công!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa đánh giá: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }
    }
}
