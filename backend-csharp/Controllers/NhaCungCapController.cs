using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/sanPham/nhaCungCap")]
    [ApiController]
    public class NhaCungCapController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NhaCungCapController(AppDbContext context)
        {
            _context = context;
        }

        // 1. LẤY DANH SÁCH NHÀ CUNG CẤP (Hoạt động)
        // GET: api/sanPham/nhaCungCap
        [HttpGet]
        public async Task<IActionResult> GetAllNhaCungCap()
        {
            try
            {
                var list = await _context.NhaCungCaps
                    .Where(n => n.TrangThai != "deleted")
                    .ToListAsync();
                
                return Ok(list);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách NCC: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy dữ liệu." });
            }
        }

        // 2. THÊM MỚI NHÀ CUNG CẤP
        // POST: api/sanPham/nhaCungCap
        [HttpPost]
        public async Task<IActionResult> CreateNhaCungCap([FromBody] NhaCungCap dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.TenNhaCc))
                {
                    return BadRequest(new { message = "Tên nhà cung cấp không được để trống!" });
                }

                var existingNCC = await _context.NhaCungCaps
                    .FirstOrDefaultAsync(n => n.TenNhaCc == dto.TenNhaCc && n.TrangThai != "deleted");

                if (existingNCC != null)
                {
                    return BadRequest(new { message = "Nhà cung cấp này đã tồn tại!" });
                }

                var newNCC = new NhaCungCap
                {
                    TenNhaCc = dto.TenNhaCc,
                    TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? "active" : dto.TrangThai,
                    MaSoThue = dto.MaSoThue,
                    Email = dto.Email,
                    SoDienThoai = dto.SoDienThoai,
                    DiaChi = dto.DiaChi,
                    QuocGia = dto.QuocGia,
                    GhiChu = dto.GhiChu
                };

                _context.NhaCungCaps.Add(newNCC);
                await _context.SaveChangesAsync();

                return StatusCode(201, newNCC);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm nhà cung cấp: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi thêm nhà cung cấp." });
            }
        }

        // 3. CẬP NHẬT NHÀ CUNG CẤP
        // PUT: api/sanPham/nhaCungCap/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNhaCungCap(long id, [FromBody] NhaCungCap dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.TenNhaCc))
                {
                    return BadRequest(new { message = "Tên nhà cung cấp không được để trống!" });
                }

                var ncc = await _context.NhaCungCaps.FindAsync(id);
                if (ncc == null || ncc.TrangThai == "deleted")
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp!" });
                }

                var checkDuplicate = await _context.NhaCungCaps
                    .FirstOrDefaultAsync(n => n.TenNhaCc == dto.TenNhaCc && n.Id != id && n.TrangThai != "deleted");

                if (checkDuplicate != null)
                {
                    return BadRequest(new { message = "Tên nhà cung cấp đã được sử dụng!" });
                }

                ncc.TenNhaCc = dto.TenNhaCc;
                ncc.MaSoThue = dto.MaSoThue;
                ncc.Email = dto.Email;
                ncc.SoDienThoai = dto.SoDienThoai;
                ncc.DiaChi = dto.DiaChi;
                ncc.QuocGia = dto.QuocGia;
                ncc.GhiChu = dto.GhiChu;
                ncc.TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? ncc.TrangThai : dto.TrangThai;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công!", data = ncc });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật NCC: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật." });
            }
        }

        // 4. XÓA NHÀ CUNG CẤP (Soft delete)
        // DELETE: api/sanPham/nhaCungCap/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNhaCungCap(long id)
        {
            try
            {
                var ncc = await _context.NhaCungCaps.FindAsync(id);
                if (ncc == null || ncc.TrangThai == "deleted")
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp!" });
                }

                // Kiểm tra ràng buộc sản phẩm
                var hasProducts = await _context.SanPhams.AnyAsync(sp => sp.NhaCungCapId == id);
                if (hasProducts)
                {
                    return BadRequest(new { message = "Không thể xóa! Nhà cung cấp này đang chứa sản phẩm." });
                }

                ncc.TrangThai = "deleted";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa nhà cung cấp thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi xóa NCC: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi xóa." });
            }
        }
    }
}
