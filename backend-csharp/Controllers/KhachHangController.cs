using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;
using WebFashion.Api.Services;

namespace WebFashion.Api.Controllers
{
    [Route("api/customers")]
    [ApiController]
    [Authorize]
    public class KhachHangController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public KhachHangController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        // 1. GET: api/customers
        [HttpGet]
        public async Task<IActionResult> GetCustomers()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                var tiersRaw = await _context.TheThanhViens
                    .OrderByDescending(t => t.MucChiTieuTu)
                    .ToListAsync();

                var formattedTiers = tiersRaw.Select(t => new
                {
                    id = t.Id.ToString(),
                    name = t.TenHang,
                    minSpent = (double)t.MucChiTieuTu,
                    color = t.MauThe
                }).ToList();

                var customersRaw = await _context.TaiKhoans
                    .Where(u => u.VaiTro == "customer" && u.TrangThai != "deleted")
                    .Include(u => u.DiaChiGiaoHangs)
                    .Include(u => u.DonHangs)
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync();

                var formattedCustomers = customersRaw.Select(customer =>
                {
                    string addressStr = "Chưa cập nhật địa chỉ";
                    int totalAddresses = customer.DiaChiGiaoHangs?.Count ?? 0;

                    if (totalAddresses > 0)
                    {
                        var defaultAddr = customer.DiaChiGiaoHangs!.FirstOrDefault(a => a.LaMacDinh) 
                                           ?? customer.DiaChiGiaoHangs!.First();
                        var parts = new List<string?>
                        {
                            defaultAddr.DiaChiCuThe,
                            defaultAddr.PhuongXa,
                            defaultAddr.QuanHuyen,
                            defaultAddr.TinhThanh
                        };
                        addressStr = string.Join(", ", parts.Where(x => !string.IsNullOrEmpty(x)));
                    }

                    var orders = customer.DonHangs ?? new List<DonHang>();
                    var sortedOrders = orders.OrderByDescending(o => o.CreatedAt).ToList();

                    var deliveredOrders = orders.Where(o => o.TrangThai == "delivered").ToList();
                    decimal actualTotalSpent = deliveredOrders.Sum(o => o.TongThanhToan);

                    string lastOrderDate = sortedOrders.Count > 0
                        ? sortedOrders.First().CreatedAt.ToString("dd/MM/yyyy")
                        : "Chưa mua hàng";

                    var recentOrders = sortedOrders.Take(2).Select(order =>
                    {
                        string uiStatus = order.TrangThai;
                        if (uiStatus == "delivered") uiStatus = "completed";
                        if (uiStatus == "shipping" || uiStatus == "pending") uiStatus = "processing";

                        return new
                        {
                            id = order.MaDonHang,
                            date = order.CreatedAt.ToString("dd/MM/yyyy"),
                            total = (double)order.TongThanhToan,
                            status = uiStatus
                        };
                    }).ToList();

                    var j = customer.CreatedAt;
                    string joinedDateFixed = $"{j.Day:D2}/{j.Month:D2}/{j.Year}";

                    return new
                    {
                        id = customer.Id,
                        name = string.IsNullOrEmpty(customer.HoTen) ? "Khách chưa nhập tên" : customer.HoTen,
                        email = customer.Email,
                        phone = string.IsNullOrEmpty(customer.SoDienThoai) ? "Chưa cập nhật" : customer.SoDienThoai,
                        address = addressStr,
                        joinedDate = joinedDateFixed,
                        totalOrders = orders.Count,
                        totalSpent = (double)actualTotalSpent,
                        status = customer.TrangThai ?? "active",
                        recentOrders = recentOrders,
                        lastOrderDate = lastOrderDate,
                        savedAddresses = totalAddresses
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    customers = formattedCustomers,
                    tiers = formattedTiers
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getCustomers: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi server" });
            }
        }

        // 2. PUT: api/customers/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> ToggleStatus(long id, [FromBody] JsonElement body)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                if (!body.TryGetProperty("newStatus", out var statusProp))
                {
                    return BadRequest(new { success = false, message = "Thiếu trạng thái mới!" });
                }
                string newStatus = statusProp.GetString() ?? "";

                var user = await _context.TaiKhoans.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khách hàng!" });
                }

                user.TrangThai = newStatus;
                user.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi ToggleStatus: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi cập nhật trạng thái" });
            }
        }

        // 3. POST: api/customers/send-email
        [HttpPost("send-email")]
        public async Task<IActionResult> SendEmailToCustomer([FromBody] JsonElement body)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                string? email = body.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                string? subject = body.TryGetProperty("subject", out var subProp) ? subProp.GetString() : null;
                string? message = body.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : null;

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(subject) || string.IsNullOrEmpty(message))
                {
                    return BadRequest(new { success = false, message = "Vui lòng điền đủ thông tin!" });
                }

                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                string storeName = config?.TenCuaHang ?? "Cửa hàng";

                string htmlMessage = $@"
                    <div style=""font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;"">
                      <h2 style=""color: #2563eb;"">Thông báo từ {storeName}</h2>
                      <p>{message.Replace("\n", "<br>")}</p>
                      <hr style=""border: 1px solid #eee; margin: 20px 0;"" />
                      <p style=""font-size: 12px; color: #666;"">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                ";

                await _emailService.SendCustomEmailAsync(email, subject, htmlMessage);

                return Ok(new { success = true, message = "Gửi email thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi gửi email: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Không thể gửi email lúc này!" });
            }
        }
    }
}
