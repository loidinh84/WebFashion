using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/dashboard/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] string? fromDate, [FromQuery] string? toDate)
        {
            try
            {
                var userRole = User.FindFirst("vai_tro")?.Value;
                if (userRole != "admin")
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                DateTime startRange;
                DateTime endRange;

                if (!string.IsNullOrEmpty(fromDate) && !string.IsNullOrEmpty(toDate))
                {
                    if (DateTime.TryParse(fromDate, out var fDate) && DateTime.TryParse(toDate, out var tDate))
                    {
                        startRange = fDate.Date;
                        endRange = tDate.Date.AddDays(1).AddTicks(-1);
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = "Định dạng ngày không hợp lệ!" });
                    }
                }
                else
                {
                    var now = DateTime.Now;
                    startRange = new DateTime(now.Year, now.Month, 1);
                    endRange = now.Date.AddDays(1).AddTicks(-1);
                }

                // 1. Doanh thu
                decimal totalRevenue = await _context.DonHangs
                    .Where(o => o.TrangThai == "delivered" && o.CreatedAt >= startRange && o.CreatedAt <= endRange)
                    .SumAsync(o => (decimal?)o.TongThanhToan) ?? 0m;

                // 2. Đơn hàng mới
                int newOrders = await _context.DonHangs
                    .CountAsync(o => o.CreatedAt >= startRange && o.CreatedAt <= endRange);

                // 3. Số khách hàng
                int totalCustomers = await _context.TaiKhoans
                    .CountAsync(u => u.VaiTro == "customer");

                // 4. Tổng tồn kho
                int totalInventory = await _context.BienTheSanPhams
                    .SumAsync(b => (int?)b.TonKho) ?? 0;

                // 5. Đơn hàng gần đây (limit 6)
                var recentOrdersRaw = await _context.DonHangs
                    .Include(o => o.TaiKhoan)
                    .Include(o => o.ChiTietDonHangs)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(6)
                    .ToListAsync();

                var recentOrders = recentOrdersRaw.Select(order =>
                {
                    string productName = "Không rõ sản phẩm";
                    if (order.ChiTietDonHangs != null && order.ChiTietDonHangs.Count > 0)
                    {
                        var first = order.ChiTietDonHangs.First();
                        if (order.ChiTietDonHangs.Count == 1)
                        {
                            productName = first.TenSpLucMua;
                        }
                        else
                        {
                            productName = $"{first.TenSpLucMua} ... (+{order.ChiTietDonHangs.Count - 1} sp khác)";
                        }
                    }

                    return new
                    {
                        id = order.MaDonHang,
                        customer = order.TaiKhoan?.HoTen ?? "Khách vãng lai",
                        product = productName,
                        amount = order.TongThanhToan.ToString("C0", CultureInfo.GetCultureInfo("vi-VN")),
                        status = order.TrangThai,
                        date = order.CreatedAt.ToString("dd/MM/yyyy")
                    };
                }).ToList();

                // 6. Top sản phẩm bán chạy theo số lượng
                var topQtyRaw = await _context.ChiTietDonHangs
                    .GroupBy(ct => ct.TenSpLucMua)
                    .Select(g => new
                    {
                        Name = g.Key,
                        SoldQty = g.Sum(x => x.SoLuong),
                        TotalRevenue = g.Sum(x => x.ThanhTien)
                    })
                    .OrderByDescending(g => g.SoldQty)
                    .Take(5)
                    .ToListAsync();

                // 7. Top sản phẩm theo doanh thu
                var topRevRaw = await _context.ChiTietDonHangs
                    .GroupBy(ct => ct.TenSpLucMua)
                    .Select(g => new
                    {
                        Name = g.Key,
                        SoldQty = g.Sum(x => x.SoLuong),
                        TotalRevenue = g.Sum(x => x.ThanhTien)
                    })
                    .OrderByDescending(g => g.TotalRevenue)
                    .Take(5)
                    .ToListAsync();

                var maxValQty = topQtyRaw.Count > 0 ? (double)topQtyRaw.Max(x => x.TotalRevenue) : 1.0;
                if (maxValQty <= 0) maxValQty = 1.0;

                var formatTopQty = topQtyRaw.Select(item => new
                {
                    name = item.Name,
                    sold = item.SoldQty,
                    revenue = item.TotalRevenue.ToString("C0", CultureInfo.GetCultureInfo("vi-VN")).Replace("₫", "").Trim(),
                    pct = (int)Math.Round(((double)item.TotalRevenue / maxValQty) * 100)
                }).ToList();

                var maxValRev = topRevRaw.Count > 0 ? (double)topRevRaw.Max(x => x.TotalRevenue) : 1.0;
                if (maxValRev <= 0) maxValRev = 1.0;

                var formatTopRev = topRevRaw.Select(item => new
                {
                    name = item.Name,
                    sold = item.SoldQty,
                    revenue = item.TotalRevenue.ToString("C0", CultureInfo.GetCultureInfo("vi-VN")).Replace("₫", "").Trim(),
                    pct = (int)Math.Round(((double)item.TotalRevenue / maxValRev) * 100)
                }).ToList();

                // 8. Dữ liệu biểu đồ 7 ngày gần đây
                DateTime chartEnd = !string.IsNullOrEmpty(toDate) && DateTime.TryParse(toDate, out var tDt)
                    ? tDt.Date.AddDays(1).AddTicks(-1)
                    : DateTime.Now.Date.AddDays(1).AddTicks(-1);

                DateTime chartStart = chartEnd.Date.AddDays(-6);

                var orders7Days = await _context.DonHangs
                    .Where(o => o.TrangThai == "delivered" && o.CreatedAt >= chartStart && o.CreatedAt <= chartEnd)
                    .Select(o => new { o.CreatedAt, o.TongThanhToan })
                    .ToListAsync();

                var chartData = new List<object>();
                for (int i = 6; i >= 0; i--)
                {
                    var d = chartEnd.Date.AddDays(-i);
                    var dateStr = $"{d.Day:D2}/{d.Month:D2}";

                    decimal dailyValue = orders7Days
                        .Where(o => o.CreatedAt.Date == d.Date)
                        .Sum(o => o.TongThanhToan);

                    chartData.Add(new
                    {
                        day = dateStr,
                        value = (double)dailyValue,
                        amount = dailyValue > 0 ? (dailyValue / 1000000m).ToString("F1", CultureInfo.InvariantCulture) + "tr" : "0"
                    });
                }

                // 9. Dữ liệu biểu đồ tròn trạng thái đơn hàng
                var orderStatusCount = await _context.DonHangs
                    .Where(o => o.CreatedAt >= startRange && o.CreatedAt <= endRange)
                    .GroupBy(o => o.TrangThai)
                    .Select(g => new
                    {
                        TrangThai = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var statusColors = new Dictionary<string, (string Label, string Color)>
                {
                    { "delivered", ("Thành công", "#10b981") },
                    { "shipping", ("Đang giao", "#3b82f6") },
                    { "confirmed", ("Đang xử lý", "#8b5cf6") },
                    { "pending", ("Chờ xử lý", "#f59e0b") },
                    { "cancelled", ("Đã hủy", "#ef4444") },
                    { "refunded", ("Hoàn tiền", "#f97316") }
                };

                int totalOrdersForPie = orderStatusCount.Sum(x => x.Count);

                var pieData = orderStatusCount.Select(item =>
                {
                    var hasConfig = statusColors.TryGetValue(item.TrangThai, out var sc);
                    string label = hasConfig ? sc.Label : item.TrangThai;
                    string color = hasConfig ? sc.Color : "#9ca3af";

                    return new
                    {
                        label = label,
                        value = totalOrdersForPie > 0 ? (int)Math.Round(((double)item.Count / totalOrdersForPie) * 100) : 0,
                        color = color,
                        count = item.Count
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    stats = new
                    {
                        totalRevenue = (double)totalRevenue,
                        newOrders = newOrders,
                        totalCustomers = totalCustomers,
                        totalInventory = totalInventory
                    },
                    recentOrders = recentOrders,
                    topProductsQty = formatTopQty,
                    topProductsRevenue = formatTopRev,
                    revenueChart = chartData,
                    pieData = pieData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getDashboardSummary: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi server" });
            }
        }
    }
}
