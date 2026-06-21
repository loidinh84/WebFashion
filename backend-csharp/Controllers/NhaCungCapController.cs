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

        public class NhaCungCapDto
        {
            public string? ten_nha_cc { get; set; }
            public string? trang_thai { get; set; }
            public string? ma_so_thue { get; set; }
            public string? email { get; set; }
            public string? so_dien_thoai { get; set; }
            public string? dia_chi { get; set; }
            public string? quoc_gia { get; set; }
            public string? ghi_chu { get; set; }
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
                    .OrderBy(n => n.Id)
                    .Select(n => new
                    {
                        id = n.Id,
                        ten_nha_cc = n.TenNhaCc,
                        ma_so_thue = n.MaSoThue,
                        email = n.Email,
                        so_dien_thoai = n.SoDienThoai,
                        dia_chi = n.DiaChi,
                        quoc_gia = n.QuocGia,
                        trang_thai = n.TrangThai,
                        ghi_chu = n.GhiChu
                    })
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
        public async Task<IActionResult> CreateNhaCungCap([FromBody] NhaCungCapDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.ten_nha_cc))
                {
                    return BadRequest(new { message = "Tên nhà cung cấp không được để trống!" });
                }

                var existingNCC = await _context.NhaCungCaps
                    .FirstOrDefaultAsync(n => n.TenNhaCc == dto.ten_nha_cc && n.TrangThai != "deleted");

                if (existingNCC != null)
                {
                    return BadRequest(new { message = "Nhà cung cấp này đã tồn tại!" });
                }

                var newNCC = new NhaCungCap
                {
                    TenNhaCc = dto.ten_nha_cc,
                    TrangThai = string.IsNullOrEmpty(dto.trang_thai) ? "active" : dto.trang_thai,
                    MaSoThue = dto.ma_so_thue,
                    Email = dto.email,
                    SoDienThoai = dto.so_dien_thoai,
                    DiaChi = dto.dia_chi,
                    QuocGia = dto.quoc_gia,
                    GhiChu = dto.ghi_chu
                };

                _context.NhaCungCaps.Add(newNCC);
                await _context.SaveChangesAsync();

                return StatusCode(201, new
                {
                    id = newNCC.Id,
                    ten_nha_cc = newNCC.TenNhaCc,
                    ma_so_thue = newNCC.MaSoThue,
                    email = newNCC.Email,
                    so_dien_thoai = newNCC.SoDienThoai,
                    dia_chi = newNCC.DiaChi,
                    quoc_gia = newNCC.QuocGia,
                    trang_thai = newNCC.TrangThai,
                    ghi_chu = newNCC.GhiChu
                });
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
        public async Task<IActionResult> UpdateNhaCungCap(long id, [FromBody] NhaCungCapDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.ten_nha_cc))
                {
                    return BadRequest(new { message = "Tên nhà cung cấp không được để trống!" });
                }

                var ncc = await _context.NhaCungCaps.FindAsync(id);
                if (ncc == null || ncc.TrangThai == "deleted")
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp!" });
                }

                var checkDuplicate = await _context.NhaCungCaps
                    .FirstOrDefaultAsync(n => n.TenNhaCc == dto.ten_nha_cc && n.Id != id && n.TrangThai != "deleted");

                if (checkDuplicate != null)
                {
                    return BadRequest(new { message = "Tên nhà cung cấp đã được sử dụng!" });
                }

                ncc.TenNhaCc = dto.ten_nha_cc;
                ncc.MaSoThue = dto.ma_so_thue;
                ncc.Email = dto.email;
                ncc.SoDienThoai = dto.so_dien_thoai;
                ncc.DiaChi = dto.dia_chi;
                ncc.QuocGia = dto.quoc_gia;
                ncc.GhiChu = dto.ghi_chu;
                ncc.TrangThai = string.IsNullOrEmpty(dto.trang_thai) ? ncc.TrangThai : dto.trang_thai;

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Cập nhật thành công!", 
                    data = new {
                        id = ncc.Id,
                        ten_nha_cc = ncc.TenNhaCc,
                        ma_so_thue = ncc.MaSoThue,
                        email = ncc.Email,
                        so_dien_thoai = ncc.SoDienThoai,
                        dia_chi = ncc.DiaChi,
                        quoc_gia = ncc.QuocGia,
                        trang_thai = ncc.TrangThai,
                        ghi_chu = ncc.GhiChu
                    }
                });
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
