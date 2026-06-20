using System;
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
    [Route("api/memberships")]
    [ApiController]
    [Authorize]
    public class TheThanhVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TheThanhVienController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        private string? ValidateForm(string? tenHang, decimal tyLeGiamGia, decimal mucChiTieuTu, int diemThuongThem)
        {
            if (string.IsNullOrWhiteSpace(tenHang)) return "Tên hạng thẻ không được để trống!";
            if (mucChiTieuTu < 0) return "Mức chi tiêu không được là số âm!";
            if (tyLeGiamGia < 0 || tyLeGiamGia > 100) return "Tỷ lệ giảm giá phải từ 0 đến 100%!";
            if (diemThuongThem < 0) return "Điểm thưởng thêm không được là số âm!";
            return null;
        }

        // 1. LẤY DANH SÁCH HẠNG THẺ (Dành cho Admin)
        // GET: api/memberships
        [HttpGet]
        public async Task<IActionResult> GetAllTheThanhVien()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var list = await _context.TheThanhViens
                    .OrderBy(m => m.MucChiTieuTu)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách thẻ thành viên: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 2. THÊM HẠNG THẺ MỚI
        // POST: api/memberships
        [HttpPost]
        public async Task<IActionResult> CreateTheThanhVien([FromBody] JsonElement body)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                string? tenHang = body.TryGetProperty("ten_hang", out var tenProp) ? tenProp.GetString() : null;
                decimal mucChiTieuTu = body.TryGetProperty("muc_chi_tieu_tu", out var tuProp) ? tuProp.GetDecimal() : 0m;
                decimal tyLeGiamGia = body.TryGetProperty("ty_le_giam_gia", out var giamProp) ? giamProp.GetDecimal() : 0m;
                int diemThuongThem = body.TryGetProperty("diem_thuong_them", out var diemProp) ? diemProp.GetInt32() : 0;
                string mauThe = body.TryGetProperty("mau_the", out var mauProp) ? (mauProp.GetString() ?? "#2563eb") : "#2563eb";
                string moTaQuyenLoi = body.TryGetProperty("mo_ta_quyen_loi", out var moTaProp) ? (moTaProp.GetString() ?? "") : "";

                var validErr = ValidateForm(tenHang, tyLeGiamGia, mucChiTieuTu, diemThuongThem);
                if (validErr != null)
                {
                    return BadRequest(new { message = validErr });
                }

                string trimmedTenHang = tenHang!.Trim();
                var existing = await _context.TheThanhViens.AnyAsync(m => m.TenHang == trimmedTenHang);
                if (existing)
                {
                    return BadRequest(new { message = $"Hạng thẻ \"{tenHang}\" đã tồn tại!" });
                }

                var newThe = new TheThanhVien
                {
                    TenHang = trimmedTenHang,
                    MucChiTieuTu = mucChiTieuTu,
                    TyLeGiamGia = tyLeGiamGia,
                    DiemThuongThem = diemThuongThem,
                    MauThe = mauThe,
                    MoTaQuyenLoi = moTaQuyenLoi
                };

                _context.TheThanhViens.Add(newThe);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Thêm hạng thẻ thành công!", data = newThe });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm thẻ thành viên: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi thêm hạng thẻ" });
            }
        }

        // 3. CẬP NHẬT CHI TIẾT HẠNG THẺ
        // PUT: api/memberships/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTheThanhVien(long id, [FromBody] JsonElement body)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var the = await _context.TheThanhViens.FindAsync(id);
                if (the == null)
                {
                    return NotFound(new { message = "Không tìm thấy hạng thẻ!" });
                }

                string? tenHang = body.TryGetProperty("ten_hang", out var tenProp) ? tenProp.GetString() : the.TenHang;
                decimal mucChiTieuTu = body.TryGetProperty("muc_chi_tieu_tu", out var tuProp) ? tuProp.GetDecimal() : the.MucChiTieuTu;
                decimal tyLeGiamGia = body.TryGetProperty("ty_le_giam_gia", out var giamProp) ? giamProp.GetDecimal() : the.TyLeGiamGia;
                int diemThuongThem = body.TryGetProperty("diem_thuong_them", out var diemProp) ? diemProp.GetInt32() : the.DiemThuongThem;
                string? mauThe = body.TryGetProperty("mau_the", out var mauProp) ? mauProp.GetString() : the.MauThe;
                string? moTaQuyenLoi = body.TryGetProperty("mo_ta_quyen_loi", out var moTaProp) ? moTaProp.GetString() : the.MoTaQuyenLoi;

                var validErr = ValidateForm(tenHang, tyLeGiamGia, mucChiTieuTu, diemThuongThem);
                if (validErr != null)
                {
                    return BadRequest(new { message = validErr });
                }

                if (tenHang != null && tenHang.Trim() != the.TenHang)
                {
                    string trimmedTen = tenHang.Trim();
                    var duplicate = await _context.TheThanhViens.AnyAsync(m => m.TenHang == trimmedTen && m.Id != id);
                    if (duplicate)
                    {
                        return BadRequest(new { message = $"Hạng thẻ \"{tenHang}\" đã tồn tại!" });
                    }
                    the.TenHang = trimmedTen;
                }

                the.MucChiTieuTu = mucChiTieuTu;
                the.TyLeGiamGia = tyLeGiamGia;
                the.DiemThuongThem = diemThuongThem;
                if (mauThe != null) the.MauThe = mauThe;
                if (moTaQuyenLoi != null) the.MoTaQuyenLoi = moTaQuyenLoi;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công!", data = the });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật thẻ thành viên: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi cập nhật hạng thẻ" });
            }
        }

        // 4. XÓA HẠNG THẺ
        // DELETE: api/memberships/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTheThanhVien(long id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var the = await _context.TheThanhViens.FindAsync(id);
                if (the == null)
                {
                    return NotFound(new { message = "Không tìm thấy hạng thẻ!" });
                }

                // Check if any users are currently in this tier
                int userCount = await _context.TaiKhoans.CountAsync(u => u.TheThanhVienId == id);
                if (userCount > 0)
                {
                    return BadRequest(new
                    {
                        message = $"Không thể xóa! Hiện có {userCount} khách hàng đang ở hạng \"{the.TenHang}\". Vui lòng chuyển họ sang hạng khác trước."
                    });
                }

                _context.TheThanhViens.Remove(the);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa hạng thẻ thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa thẻ thành viên: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi xóa hạng thẻ" });
            }
        }
    }
}
