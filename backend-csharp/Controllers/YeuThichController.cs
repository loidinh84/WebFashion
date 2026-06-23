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
    [Route("api/wishlist")]
    [ApiController]
    [Authorize]
    public class YeuThichController : ControllerBase
    {
        private readonly AppDbContext _context;

        public YeuThichController(AppDbContext context)
        {
            _context = context;
        }

        #region DTOs
        public class ToggleWishlistDto
        {
            [JsonPropertyName("tai_khoan_id")]
            public long TaiKhoanId { get; set; }

            [JsonPropertyName("san_pham_id")]
            public long SanPhamId { get; set; }
        }
        #endregion

        // 1. GET: api/wishlist/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetWishlistByUser(long userId)
        {
            try
            {
                var wishlist = await _context.YeuThiches
                    .Where(y => y.TaiKhoanId == userId)
                    .Include(y => y.SanPham)
                        .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .Include(y => y.SanPham)
                        .ThenInclude(sp => sp.BienTheSanPhams)
                    .OrderByDescending(y => y.CreatedAt)
                    .ToListAsync();

                // Format the returned data to match standard JSON serialization
                var formatted = wishlist.Select(y => new
                {
                    id = y.Id,
                    tai_khoan_id = y.TaiKhoanId,
                    san_pham_id = y.SanPhamId,
                    created_at = y.CreatedAt,
                    san_pham = new
                    {
                        id = y.SanPham.Id,
                        ten_san_pham = y.SanPham.TenSanPham,
                        slug = y.SanPham.Slug,
                        mo_ta_ngan = y.SanPham.MoTaNgan,
                        mo_ta_day_du = y.SanPham.MoTaDayDu,
                        thuong_hieu = y.SanPham.ThuongHieu,
                        trang_thai = y.SanPham.TrangThai,
                        noi_bat = y.SanPham.NoiBat,
                        luot_xem = y.SanPham.LuotXem,
                        luot_mua = y.SanPham.LuotMua,
                        hinh_anh = y.SanPham.HinhAnhSanPhams.Select(img => new
                        {
                            id = img.Id,
                            url_anh = img.UrlAnh,
                            la_anh_chinh = img.LaAnhChinh
                        }).ToList(),
                        bien_the = y.SanPham.BienTheSanPhams.Select(bt => new
                        {
                            id = bt.Id,
                            sku = bt.Sku,
                            mau_sac = bt.MauSac,
                            dung_luong = bt.DungLuong,
                            ram = bt.Ram,
                            gia_goc = (double)bt.GiaGoc,
                            gia_ban = (double)bt.GiaBan,
                            ton_kho = bt.TonKho
                        }).ToList()
                    }
                }).ToList();

                return Ok(formatted);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách yêu thích: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy danh sách yêu thích" });
            }
        }

        // 2. GET: api/wishlist/check/{userId}/{productId}
        [HttpGet("check/{userId}/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckIsLiked(long userId, long productId)
        {
            try
            {
                var existingLike = await _context.YeuThiches
                    .AnyAsync(y => y.TaiKhoanId == userId && y.SanPhamId == productId);

                return Ok(new { isLiked = existingLike });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi checkIsLiked: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 3. POST: api/wishlist/toggle
        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleWishlist([FromBody] ToggleWishlistDto dto)
        {
            try
            {
                if (dto.TaiKhoanId <= 0 || dto.SanPhamId <= 0)
                {
                    return BadRequest(new { message = "Thiếu thông tin người dùng hoặc sản phẩm" });
                }

                var existingLike = await _context.YeuThiches
                    .FirstOrDefaultAsync(y => y.TaiKhoanId == dto.TaiKhoanId && y.SanPhamId == dto.SanPhamId);

                if (existingLike != null)
                {
                    _context.YeuThiches.Remove(existingLike);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Đã bỏ sản phẩm khỏi danh sách yêu thích",
                        isLiked = false
                    });
                }
                else
                {
                    var newLike = new YeuThich
                    {
                        TaiKhoanId = dto.TaiKhoanId,
                        SanPhamId = dto.SanPhamId,
                        CreatedAt = DateTime.Now
                    };

                    _context.YeuThiches.Add(newLike);
                    await _context.SaveChangesAsync();

                    return StatusCode(201, new
                    {
                        message = "Đã thêm vào danh sách yêu thích",
                        isLiked = true,
                        data = newLike
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi toggle yêu thích: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi xử lý yêu thích" });
            }
        }
    }
}
