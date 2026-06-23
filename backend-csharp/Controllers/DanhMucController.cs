using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/sanPham")]
    [ApiController]
    public class DanhMucController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DanhMucController(AppDbContext context)
        {
            _context = context;
        }

        public class DanhMucDto
        {
            public string? ten_danh_muc { get; set; }
            public string? slug { get; set; }
            public long? danh_muc_cha_id { get; set; }
            public string? hinh_anh { get; set; }
            public string? mo_ta { get; set; }
            public int? thu_tu { get; set; }
            public string? trang_thai { get; set; }
            public bool? hien_thi_sidebar { get; set; }
        }

        // 1. THÊM DANH MỤC MỚI
        // POST: api/sanPham/danhMuc
        [HttpPost("danhMuc")]
        public async Task<IActionResult> CreateDanhMuc([FromBody] DanhMucDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.ten_danh_muc) || string.IsNullOrEmpty(dto.slug))
                {
                    return BadRequest(new { message = "Thiếu thông tin tên danh mục hoặc slug!" });
                }

                // Kiểm tra trùng lặp tên hoặc slug
                var duplicate = await _context.DanhMucs
                    .FirstOrDefaultAsync(d => d.TenDanhMuc.ToLower() == dto.ten_danh_muc.Trim().ToLower() 
                                           || d.Slug.ToLower() == dto.slug.Trim().ToLower());

                if (duplicate != null)
                {
                    if (duplicate.TenDanhMuc.Equals(dto.ten_danh_muc.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new { message = "Tên danh mục đã tồn tại!" });
                    }
                    return BadRequest(new { message = "Slug danh mục đã tồn tại!" });
                }

                var newDanhMuc = new DanhMuc
                {
                    TenDanhMuc = dto.ten_danh_muc.Trim(),
                    Slug = dto.slug.Trim(),
                    DanhMucChaId = dto.danh_muc_cha_id > 0 ? dto.danh_muc_cha_id : null,
                    MoTa = dto.mo_ta,
                    ThuTu = dto.thu_tu ?? 0,
                    TrangThai = string.IsNullOrEmpty(dto.trang_thai) ? "active" : dto.trang_thai,
                    HienThiSidebar = dto.hien_thi_sidebar ?? true,
                    HinhAnh = dto.hinh_anh
                };

                _context.DanhMucs.Add(newDanhMuc);
                await _context.SaveChangesAsync();

                return StatusCode(201, ProjectCategory(newDanhMuc));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi tạo danh mục: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi tạo danh mục!" });
            }
        }

        // 2. CẬP NHẬT DANH MỤC
        // PUT: api/sanPham/danhMuc/{id}
        [HttpPut("danhMuc/{id}")]
        public async Task<IActionResult> UpdateDanhMuc(long id, [FromBody] DanhMucDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.ten_danh_muc) || string.IsNullOrEmpty(dto.slug))
                {
                    return BadRequest(new { message = "Thiếu thông tin tên danh mục hoặc slug!" });
                }

                var danhMuc = await _context.DanhMucs.FindAsync(id);
                if (danhMuc == null)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục!" });
                }

                // Kiểm tra trùng lặp tên hoặc slug (ngoại trừ chính nó)
                var duplicate = await _context.DanhMucs
                    .FirstOrDefaultAsync(d => d.Id != id && 
                                           (d.TenDanhMuc.ToLower() == dto.ten_danh_muc.Trim().ToLower() 
                                            || d.Slug.ToLower() == dto.slug.Trim().ToLower()));

                if (duplicate != null)
                {
                    if (duplicate.TenDanhMuc.Equals(dto.ten_danh_muc.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new { message = "Tên danh mục đã tồn tại!" });
                    }
                    return BadRequest(new { message = "Slug danh mục đã tồn tại!" });
                }

                danhMuc.TenDanhMuc = dto.ten_danh_muc.Trim();
                danhMuc.Slug = dto.slug.Trim();
                danhMuc.DanhMucChaId = dto.danh_muc_cha_id > 0 ? dto.danh_muc_cha_id : null;
                danhMuc.MoTa = dto.mo_ta;
                danhMuc.ThuTu = dto.thu_tu ?? danhMuc.ThuTu;
                danhMuc.TrangThai = string.IsNullOrEmpty(dto.trang_thai) ? danhMuc.TrangThai : dto.trang_thai;
                danhMuc.HienThiSidebar = dto.hien_thi_sidebar ?? danhMuc.HienThiSidebar;
                danhMuc.HinhAnh = dto.hinh_anh ?? danhMuc.HinhAnh;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật danh mục thành công!", danhMuc = ProjectCategory(danhMuc) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật danh mục: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật danh mục!" });
            }
        }

        // 3. XÓA DANH MỤC
        // DELETE: api/sanPham/danhMuc/{id}
        [HttpDelete("danhMuc/{id}")]
        public async Task<IActionResult> DeleteDanhMuc(long id)
        {
            try
            {
                // Kiểm tra xem có Sản phẩm nào đang dùng danh mục này không
                var spCount = await _context.SanPhams.CountAsync(sp => sp.DanhMucId == id);
                if (spCount > 0)
                {
                    return BadRequest(new { message = $"Không thể xóa! Đang có {spCount} sản phẩm thuộc danh mục này." });
                }

                // Kiểm tra xem nó có đang làm cha của danh mục nào khác không
                var childCount = await _context.DanhMucs.CountAsync(d => d.DanhMucChaId == id);
                if (childCount > 0)
                {
                    return BadRequest(new { message = "Không thể xóa! Vui lòng xóa các danh mục con của nó trước." });
                }

                var danhMuc = await _context.DanhMucs.FindAsync(id);
                if (danhMuc == null)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục!" });
                }

                _context.DanhMucs.Remove(danhMuc);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa danh mục thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa danh mục: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi xóa danh mục!" });
            }
        }

        // 4. ĐỔI TRẠNG THÁI
        // PUT: api/sanPham/danhMuc/{id}/status
        [HttpPut("danhMuc/{id}/status")]
        public async Task<IActionResult> ToggleTrangThai(long id)
        {
            try
            {
                var danhMuc = await _context.DanhMucs.FindAsync(id);
                if (danhMuc == null)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục!" });
                }

                var newStatus = danhMuc.TrangThai == "active" ? "inactive" : "active";
                danhMuc.TrangThai = newStatus;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã cập nhật trạng thái!", trang_thai = newStatus });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi đổi trạng thái!" });
            }
        }

        // 5. LẤY DANH MỤC THEO SLUG
        // GET: api/sanPham/danh-muc/slug/{slug}
        [HttpGet("danh-muc/slug/{slug}")]
        public async Task<IActionResult> GetDanhMucBySlug(string slug)
        {
            try
            {
                var danhMuc = await _context.DanhMucs.FirstOrDefaultAsync(d => d.Slug == slug && d.TrangThai == "active");
                if (danhMuc == null)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục!" });
                }

                return Ok(ProjectCategory(danhMuc));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh mục theo slug: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 6. LẤY DANH MỤC THEO ID
        // GET: api/sanPham/danh-muc/id/{id}
        [HttpGet("danh-muc/id/{id}")]
        public async Task<IActionResult> GetDanhMucById(long id)
        {
            try
            {
                var danhMuc = await _context.DanhMucs.FindAsync(id);
                if (danhMuc == null || danhMuc.TrangThai != "active")
                {
                    return NotFound(new { message = "Không tìm thấy danh mục!" });
                }

                return Ok(ProjectCategory(danhMuc));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh mục theo id: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // GET: api/sanPham/danhMuc
        [HttpGet("danhMuc")]
        public async Task<IActionResult> GetAllDanhMuc()
        {
            try
            {
                var list = await _context.DanhMucs.ToListAsync();
                return Ok(list.Select(ProjectCategory));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy tất cả danh mục: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 7. GET: api/sanPham/danhMuc-sidebar
        [HttpGet("danhMuc-sidebar")]
        public async Task<IActionResult> GetPublicSidebarCategories()
        {
            try
            {
                var danhMucs = await _context.DanhMucs
                    .Where(d => d.TrangThai == "active" && d.HienThiSidebar == true)
                    .OrderBy(d => d.ThuTu)
                    .ToListAsync();
                
                return Ok(danhMucs.Select(ProjectCategory));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh mục public: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // 8. LẤY CÂY DANH MỤC (Category Tree Hierarchy)
        // GET: api/sanPham/danh-muc/tree
        [HttpGet("danh-muc/tree")]
        public async Task<IActionResult> GetCategoryTree()
        {
            try
            {
                var allCategories = await _context.DanhMucs
                    .Where(d => d.TrangThai == "active" && d.HienThiSidebar == true)
                    .OrderBy(d => d.ThuTu)
                    .ToListAsync();

                // Define tree node response structure
                List<object> BuildTree(long? parentId = null)
                {
                    return allCategories
                        .Where(c => c.DanhMucChaId == parentId)
                        .Select(c => new
                        {
                            c.Id,
                            ten_danh_muc = c.TenDanhMuc,
                            slug = c.Slug,
                            danh_muc_cha_id = c.DanhMucChaId,
                            hinh_anh = c.HinhAnh,
                            mo_ta = c.MoTa,
                            thu_tu = c.ThuTu,
                            trang_thai = c.TrangThai,
                            hien_thi_sidebar = c.HienThiSidebar,
                            children = BuildTree(c.Id)
                        })
                        .Cast<object>()
                        .ToList();
                }

                var tree = BuildTree(null);
                return Ok(tree);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy cây danh mục: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy dữ liệu menu!" });
            }
        }

        private object ProjectCategory(DanhMuc c)
        {
            return new
            {
                id = c.Id,
                ten_danh_muc = c.TenDanhMuc,
                slug = c.Slug,
                danh_muc_cha_id = c.DanhMucChaId,
                hinh_anh = c.HinhAnh,
                mo_ta = c.MoTa,
                thu_tu = c.ThuTu,
                trang_thai = c.TrangThai,
                hien_thi_sidebar = c.HienThiSidebar
            };
        }
    }
}
