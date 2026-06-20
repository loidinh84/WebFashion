using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/cart")]
    [ApiController]
    [Authorize]
    public class GioHangController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GioHangController(AppDbContext context)
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

        // 1. LẤY GIỎ HÀNG CỦA NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
        // GET: api/cart
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetUserId();
                var items = await _context.GioHangs
                    .Where(g => g.TaiKhoanId == userId)
                    .Include(g => g.BienThe)
                        .ThenInclude(bt => bt.SanPham)
                            .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .ToListAsync();

                var formattedCart = items.Select(item =>
                {
                    var bt = item.BienThe;
                    if (bt == null) return null;
                    var sp = bt.SanPham;
                    if (sp == null) return null;

                    // Match image: specific variant image or main product image
                    string hinhAnh = "";
                    if (sp.HinhAnhSanPhams != null && sp.HinhAnhSanPhams.Count > 0)
                    {
                        var variantImg = sp.HinhAnhSanPhams.FirstOrDefault(img => img.BienTheId == bt.Id);
                        if (variantImg != null)
                        {
                            hinhAnh = variantImg.UrlAnh;
                        }
                        else
                        {
                            var mainImg = sp.HinhAnhSanPhams.FirstOrDefault(img => img.LaAnhChinh) ?? sp.HinhAnhSanPhams.First();
                            hinhAnh = mainImg.UrlAnh;
                        }
                    }

                    return new
                    {
                        id = sp.Id,
                        variantId = bt.Id,
                        ten_san_pham = sp.TenSanPham,
                        hinh_anh = hinhAnh,
                        gia_ban = (double)bt.GiaBan,
                        dung_luong = bt.DungLuong ?? "",
                        mau_sac = bt.MauSac ?? "",
                        ram = bt.Ram ?? "",
                        sku = bt.Sku,
                        so_luong = item.SoLuong,
                        selected = true // Default true for client checkout selectors
                    };
                })
                .Where(x => x != null)
                .ToList();

                return Ok(formattedCart);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy giỏ hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy giỏ hàng" });
            }
        }

        // 2. THÊM MẶT HÀNG VÀO GIỎ HÀNG DB
        // POST: api/cart
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] JsonElement body)
        {
            try
            {
                var userId = GetUserId();
                
                if (!body.TryGetProperty("bien_the_id", out var vtProp) || 
                    !body.TryGetProperty("so_luong", out var qtyProp))
                {
                    return BadRequest(new { message = "Thiếu thông tin biến thể hoặc số lượng!" });
                }

                long bienTheId = vtProp.GetInt64();
                int soLuong = qtyProp.GetInt32();

                if (bienTheId <= 0 || soLuong <= 0)
                {
                    return BadRequest(new { message = "Thông tin không hợp lệ!" });
                }

                var bt = await _context.BienTheSanPhams.FindAsync(bienTheId);
                if (bt == null)
                {
                    return NotFound(new { message = "Biến thể sản phẩm không tồn tại!" });
                }

                // Check if already in cart
                var existing = await _context.GioHangs
                    .FirstOrDefaultAsync(g => g.TaiKhoanId == userId && g.BienTheId == bienTheId);

                int newQty = existing != null ? existing.SoLuong + soLuong : soLuong;

                if (newQty > bt.TonKho)
                {
                    return BadRequest(new
                    {
                        message = $"Không thể thêm! Bạn đã có {(existing != null ? existing.SoLuong : 0)} sản phẩm trong giỏ hàng. Tồn kho khả dụng là {bt.TonKho}."
                    });
                }

                if (existing != null)
                {
                    existing.SoLuong = newQty;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var newCartItem = new GioHang
                    {
                        TaiKhoanId = userId,
                        BienTheId = bienTheId,
                        SoLuong = newQty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.GioHangs.Add(newCartItem);
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đã thêm vào giỏ hàng thành công!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm vào giỏ hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi thêm vào giỏ hàng" });
            }
        }

        // 3. CẬP NHẬT SỐ LƯỢNG MỘT MẶT HÀNG
        // PUT: api/cart
        [HttpPut]
        public async Task<IActionResult> UpdateQuantity([FromBody] JsonElement body)
        {
            try
            {
                var userId = GetUserId();

                if (!body.TryGetProperty("bien_the_id", out var vtProp) || 
                    !body.TryGetProperty("so_luong", out var qtyProp))
                {
                    return BadRequest(new { message = "Thiếu thông tin!" });
                }

                long bienTheId = vtProp.GetInt64();
                int targetQty = qtyProp.GetInt32();

                if (targetQty <= 0)
                {
                    var itemToDelete = await _context.GioHangs
                        .FirstOrDefaultAsync(g => g.TaiKhoanId == userId && g.BienTheId == bienTheId);
                    
                    if (itemToDelete != null)
                    {
                        _context.GioHangs.Remove(itemToDelete);
                        await _context.SaveChangesAsync();
                    }
                    return Ok(new { success = true, message = "Đã xóa sản phẩm khỏi giỏ hàng!" });
                }

                var bt = await _context.BienTheSanPhams.FindAsync(bienTheId);
                if (bt == null)
                {
                    return NotFound(new { message = "Biến thể không tồn tại!" });
                }

                if (targetQty > bt.TonKho)
                {
                    return BadRequest(new { message = $"Chỉ còn {bt.TonKho} sản phẩm khả dụng!" });
                }

                var item = await _context.GioHangs
                    .FirstOrDefaultAsync(g => g.TaiKhoanId == userId && g.BienTheId == bienTheId);

                if (item == null)
                {
                    item = new GioHang
                    {
                        TaiKhoanId = userId,
                        BienTheId = bienTheId,
                        SoLuong = targetQty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.GioHangs.Add(item);
                }
                else
                {
                    item.SoLuong = targetQty;
                    item.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đã cập nhật số lượng!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật số lượng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật số lượng" });
            }
        }

        // 4. XÓA MỘT SẢN PHẨM KHỎI GIỎ HÀNG
        // DELETE: api/cart/{bien_the_id}
        [HttpDelete("{bien_the_id}")]
        public async Task<IActionResult> RemoveFromCart(long bien_the_id)
        {
            try
            {
                var userId = GetUserId();
                var item = await _context.GioHangs
                    .FirstOrDefaultAsync(g => g.TaiKhoanId == userId && g.BienTheId == bien_the_id);

                if (item != null)
                {
                    _context.GioHangs.Remove(item);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "Đã xóa sản phẩm khỏi giỏ hàng!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa giỏ hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi xóa sản phẩm" });
            }
        }

        // 5. ĐỒNG BỘ GỘP GIỎ HÀNG (Local storage to DB on login)
        // POST: api/cart/sync
        [HttpPost("sync")]
        public async Task<IActionResult> SyncCart([FromBody] JsonElement body)
        {
            try
            {
                var userId = GetUserId();

                if (body.TryGetProperty("items", out var itemsProp) && itemsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in itemsProp.EnumerateArray())
                    {
                        if (!item.TryGetProperty("variantId", out var vIdProp) || 
                            !item.TryGetProperty("so_luong", out var qtyProp))
                        {
                            continue;
                        }

                        long variantId = vIdProp.GetInt64();
                        int qty = qtyProp.GetInt32();

                        if (variantId <= 0 || qty <= 0) continue;

                        var bt = await _context.BienTheSanPhams.FindAsync(variantId);
                        if (bt == null) continue;

                        var existing = await _context.GioHangs
                            .FirstOrDefaultAsync(g => g.TaiKhoanId == userId && g.BienTheId == variantId);

                        int mergedQty = existing != null ? existing.SoLuong + qty : qty;

                        // Bound by stock
                        if (mergedQty > bt.TonKho)
                        {
                            mergedQty = bt.TonKho;
                        }

                        if (mergedQty > 0)
                        {
                            if (existing != null)
                            {
                                existing.SoLuong = mergedQty;
                                existing.UpdatedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                var newCartItem = new GioHang
                                {
                                    TaiKhoanId = userId,
                                    BienTheId = variantId,
                                    SoLuong = mergedQty,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };
                                _context.GioHangs.Add(newCartItem);
                            }
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                // Return active mapped cart items directly after sync completes
                return await GetCart();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi đồng bộ giỏ hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi đồng bộ giỏ hàng" });
            }
        }

        // 6. XÓA CÁC SẢN PHẨM ĐÃ THANH TOÁN KHỎI GIỎ HÀNG DB
        // POST: api/cart/clear-selected
        [HttpPost("clear-selected")]
        public async Task<IActionResult> ClearSelected([FromBody] JsonElement body)
        {
            try
            {
                var userId = GetUserId();

                if (!body.TryGetProperty("variantIds", out var idsProp) || idsProp.ValueKind != JsonValueKind.Array)
                {
                    return BadRequest(new { message = "Thiếu danh sách mặt hàng cần xóa!" });
                }

                var variantIds = new List<long>();
                foreach (var idEl in idsProp.EnumerateArray())
                {
                    variantIds.Add(idEl.GetInt64());
                }

                if (variantIds.Count == 0)
                {
                    return BadRequest(new { message = "Danh sách mặt hàng trống!" });
                }

                var itemsToDelete = await _context.GioHangs
                    .Where(g => g.TaiKhoanId == userId && variantIds.Contains(g.BienTheId))
                    .ToListAsync();

                if (itemsToDelete.Count > 0)
                {
                    _context.GioHangs.RemoveRange(itemsToDelete);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "Đã dọn dẹp các sản phẩm đã thanh toán!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi dọn dẹp giỏ hàng: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi dọn dẹp giỏ hàng" });
            }
        }
    }
}
