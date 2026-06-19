using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;
using WebFashion.Api.Services;

namespace WebFashion.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SanPhamController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMeiliSearchService _meiliSearchService;

        public SanPhamController(AppDbContext context, IMeiliSearchService meiliSearchService)
        {
            _context = context;
            _meiliSearchService = meiliSearchService;
        }

        private string GenerateSlug(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            var normalized = text.Normalize(System.Text.NormalizationForm.FormD);
            var reg = new Regex(@"[\u0300-\u036f]");
            var cleanText = reg.Replace(normalized, "")
                .Replace('đ', 'd')
                .Replace('Đ', 'D')
                .ToLower();

            cleanText = Regex.Replace(cleanText, @"\s+", "-");
            cleanText = Regex.Replace(cleanText, @"[^\w\-]+", "");
            cleanText = Regex.Replace(cleanText, @"\-\-+", "-");
            cleanText = cleanText.Trim('-');
            return cleanText;
        }

        private async Task<string> CreateUniqueSlug(string name, long? currentId = null)
        {
            string slug = GenerateSlug(name);
            string uniqueSlug = slug;
            int counter = 1;

            while (true)
            {
                var query = _context.SanPhams.AsQueryable();
                if (currentId.HasValue)
                {
                    query = query.Where(sp => sp.Id != currentId.Value);
                }

                var existing = await query.AnyAsync(sp => sp.Slug == uniqueSlug);
                if (!existing) break;

                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }
            return uniqueSlug;
        }

        // GET: api/sanPham/search
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q = "", [FromQuery] int limit = 30, [FromQuery] string? danhMucId = null)
        {
            try
            {
                string? filter = !string.IsNullOrEmpty(danhMucId) ? $"danh_muc_id = {danhMucId}" : null;
                var result = await _meiliSearchService.SearchSanPhamAsync(q, limit, filter);

                return Ok(new
                {
                    hits = result.Hits,
                    total = result.EstimatedTotalHits
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi tìm kiếm!" });
            }
        }

        // GET: api/sanPham
        [HttpGet]
        public async Task<IActionResult> GetAllSanPham(
            [FromQuery] string? danhMucId,
            [FromQuery] string? thuongHieu,
            [FromQuery] string? ram,
            [FromQuery] string? dung_luong,
            [FromQuery] string? mau_sac,
            [FromQuery] string? search,
            [FromQuery] string? sort,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                int pageNumber = page > 0 ? page : 1;
                int limitNumber = limit > 0 ? limit : 20;
                int offset = (pageNumber - 1) * limitNumber;

                // 1. Check if it is a Search query
                if (!string.IsNullOrEmpty(search))
                {
                    var searchResult = await _meiliSearchService.SearchSanPhamAsync(search, limitNumber);
                    if (searchResult == null || searchResult.Hits.Count == 0)
                    {
                        return Ok(new
                        {
                            data = new List<object>(),
                            currentPage = pageNumber,
                            totalPages = 0,
                            totalItems = 0
                        });
                    }

                    var matchedIds = searchResult.Hits.Select(h => h.Id).ToList();

                    var productsList = await _context.SanPhams
                        .Where(sp => matchedIds.Contains(sp.Id) && sp.TrangThai == "active")
                        .Include(sp => sp.DanhMuc)
                        .Include(sp => sp.BienTheSanPhams)
                        .Include(sp => sp.HinhAnhSanPhams)
                        .ToListAsync();

                    // Keep search relevancy order
                    var sortedProducts = productsList
                        .OrderBy(p => matchedIds.IndexOf(p.Id))
                        .ToList();

                    return Ok(new
                    {
                        data = sortedProducts,
                        currentPage = pageNumber,
                        totalPages = (int)Math.Ceiling((double)searchResult.EstimatedTotalHits / limitNumber),
                        totalItems = searchResult.EstimatedTotalHits
                    });
                }

                // 2. Query building for filters
                var queryable = _context.SanPhams
                    .Where(sp => sp.TrangThai == "active")
                    .AsQueryable();

                if (!string.IsNullOrEmpty(danhMucId) && long.TryParse(danhMucId, out long categoryId))
                {
                    var childCategories = await _context.DanhMucs
                        .Where(d => d.DanhMucChaId == categoryId)
                        .Select(d => d.Id)
                        .ToListAsync();

                    var allCategoryIds = new List<long> { categoryId };
                    allCategoryIds.AddRange(childCategories);

                    queryable = queryable.Where(sp => allCategoryIds.Contains(sp.DanhMucId));
                }

                if (!string.IsNullOrEmpty(thuongHieu))
                {
                    queryable = queryable.Where(sp => sp.ThuongHieu == thuongHieu);
                }

                // Filter variants
                var filterVariant = !string.IsNullOrEmpty(ram) || !string.IsNullOrEmpty(dung_luong) || !string.IsNullOrEmpty(mau_sac);
                if (filterVariant)
                {
                    queryable = queryable.Where(sp => sp.BienTheSanPhams.Any(bt => 
                        (string.IsNullOrEmpty(ram) || bt.Ram == ram) &&
                        (string.IsNullOrEmpty(dung_luong) || bt.DungLuong == dung_luong) &&
                        (string.IsNullOrEmpty(mau_sac) || bt.MauSac == mau_sac)
                    ));
                }

                // Sort conditions
                if (sort == "Giá Thấp - Cao")
                {
                    queryable = queryable.OrderBy(sp => sp.BienTheSanPhams.Min(bt => bt.GiaBan));
                }
                else if (sort == "Giá Cao - Thấp")
                {
                    queryable = queryable.OrderByDescending(sp => sp.BienTheSanPhams.Max(bt => bt.GiaBan));
                }
                else if (sort == "Bán chạy")
                {
                    queryable = queryable.OrderByDescending(sp => sp.LuotXem);
                }
                else
                {
                    queryable = queryable.OrderByDescending(sp => sp.CreatedAt);
                }

                var totalCount = await queryable.CountAsync();
                var products = await queryable
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.ThuocTinhSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .Skip(offset)
                    .Take(limitNumber)
                    .ToListAsync();

                // Select results and mapping rating aggregates
                var mappedResult = new List<object>();
                foreach (var sp in products)
                {
                    var approvedReviews = await _context.DanhGiaSanPhams
                        .Where(r => r.SanPhamId == sp.Id && r.TrangThai == "approved")
                        .ToListAsync();

                    double avgRating = approvedReviews.Any() ? Math.Round(approvedReviews.Average(r => (double)r.SoSao), 1) : 0.0;
                    int countReviews = approvedReviews.Count;

                    mappedResult.Add(new
                    {
                        sp.Id,
                        sp.TenSanPham,
                        sp.Slug,
                        sp.DanhMucId,
                        sp.NhaCungCapId,
                        sp.MoTaNgan,
                        sp.MoTaDayDu,
                        sp.ThuongHieu,
                        sp.TrangThai,
                        sp.NoiBat,
                        sp.LuotXem,
                        sp.CreatedAt,
                        sp.UpdatedAt,
                        bien_the = sp.BienTheSanPhams,
                        thuoc_tinh = sp.ThuocTinhSanPhams,
                        hinh_anh = sp.HinhAnhSanPhams,
                        tong_danh_gia = countReviews,
                        diem_danh_gia = avgRating
                    });
                }

                return Ok(new
                {
                    data = mappedResult,
                    currentPage = pageNumber,
                    totalPages = (int)Math.Ceiling((double)totalCount / limitNumber),
                    totalItems = totalCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // GET: api/sanPham/tatCaSanPham (Admin view)
        [HttpGet("tatCaSanPham")]
        public async Task<IActionResult> GetAdminSanPham(
            [FromQuery] long? danhMucId,
            [FromQuery] long? nhaCungCapId,
            [FromQuery] string? noiBat,
            [FromQuery] string? trangThai,
            [FromQuery] string? thuongHieu,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                int pageNumber = page > 0 ? page : 1;
                int limitNumber = limit > 0 ? limit : 10;
                int offset = (pageNumber - 1) * limitNumber;

                var queryable = _context.SanPhams
                    .Where(sp => sp.TrangThai != "deleted")
                    .AsQueryable();

                if (danhMucId.HasValue) queryable = queryable.Where(sp => sp.DanhMucId == danhMucId);
                if (nhaCungCapId.HasValue) queryable = queryable.Where(sp => sp.NhaCungCapId == nhaCungCapId);
                if (!string.IsNullOrEmpty(trangThai)) queryable = queryable.Where(sp => sp.TrangThai == trangThai);
                if (noiBat == "true") queryable = queryable.Where(sp => sp.NoiBat == true);
                if (!string.IsNullOrEmpty(thuongHieu)) queryable = queryable.Where(sp => sp.ThuongHieu == thuongHieu);
                if (!string.IsNullOrEmpty(search)) queryable = queryable.Where(sp => sp.TenSanPham.Contains(search));

                var totalCount = await queryable.CountAsync();
                var products = await queryable
                    .Include(sp => sp.DanhMuc)
                    .Include(sp => sp.NhaCungCap)
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.ThuocTinhSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .OrderByDescending(sp => sp.CreatedAt)
                    .Skip(offset)
                    .Take(limitNumber)
                    .ToListAsync();

                var mappedList = products.Select(p => new
                {
                    p.Id,
                    p.TenSanPham,
                    p.Slug,
                    p.DanhMucId,
                    p.NhaCungCapId,
                    p.MoTaNgan,
                    p.MoTaDayDu,
                    p.ThuongHieu,
                    p.TrangThai,
                    p.NoiBat,
                    p.LuotXem,
                    p.CreatedAt,
                    p.UpdatedAt,
                    danh_muc = p.DanhMuc != null ? new { p.DanhMuc.Id, p.DanhMuc.TenDanhMuc } : null,
                    nha_cung_cap = p.NhaCungCap != null ? new { p.NhaCungCap.Id, p.NhaCungCap.TenNhaCc } : null,
                    bien_the = p.BienTheSanPhams,
                    thuoc_tinh = p.ThuocTinhSanPhams,
                    hinh_anh = p.HinhAnhSanPhams
                });

                return Ok(new
                {
                    data = mappedList,
                    currentPage = pageNumber,
                    totalPages = (int)Math.Ceiling((double)totalCount / limitNumber),
                    totalItems = totalCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // GET: api/sanPham/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSanPhamById(long id)
        {
            try
            {
                var sanPham = await _context.SanPhams
                    .Include(sp => sp.DanhMuc)
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.ThuocTinhSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .FirstOrDefaultAsync(sp => sp.Id == id);

                if (sanPham == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm!" });
                }

                return Ok(new
                {
                    sanPham.Id,
                    sanPham.TenSanPham,
                    sanPham.Slug,
                    sanPham.DanhMucId,
                    sanPham.NhaCungCapId,
                    sanPham.MoTaNgan,
                    sanPham.MoTaDayDu,
                    sanPham.ThuongHieu,
                    sanPham.TrangThai,
                    sanPham.NoiBat,
                    sanPham.LuotXem,
                    sanPham.CreatedAt,
                    sanPham.UpdatedAt,
                    danh_muc = sanPham.DanhMuc != null ? new { sanPham.DanhMuc.Id, sanPham.DanhMuc.TenDanhMuc, sanPham.DanhMuc.Slug } : null,
                    bien_the = sanPham.BienTheSanPhams,
                    thuoc_tinh = sanPham.ThuocTinhSanPhams,
                    hinh_anh = sanPham.HinhAnhSanPhams
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi lấy chi tiết sản phẩm!" });
            }
        }

        // GET: api/sanPham/chi-tiet/{slug}
        [HttpGet("chi-tiet/{slug}")]
        public async Task<IActionResult> GetSanPhamBySlug(string slug)
        {
            try
            {
                var sanPham = await _context.SanPhams
                    .Include(sp => sp.DanhMuc)
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.ThuocTinhSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .FirstOrDefaultAsync(sp => sp.Slug == slug);

                if (sanPham == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm!" });
                }

                return Ok(new
                {
                    sanPham.Id,
                    sanPham.TenSanPham,
                    sanPham.Slug,
                    sanPham.DanhMucId,
                    sanPham.NhaCungCapId,
                    sanPham.MoTaNgan,
                    sanPham.MoTaDayDu,
                    sanPham.ThuongHieu,
                    sanPham.TrangThai,
                    sanPham.NoiBat,
                    sanPham.LuotXem,
                    sanPham.CreatedAt,
                    sanPham.UpdatedAt,
                    danh_muc = sanPham.DanhMuc != null ? new { sanPham.DanhMuc.Id, sanPham.DanhMuc.TenDanhMuc, sanPham.DanhMuc.Slug, sanPham.DanhMuc.DanhMucChaId } : null,
                    bien_the = sanPham.BienTheSanPhams,
                    thuoc_tinh = sanPham.ThuocTinhSanPhams,
                    hinh_anh = sanPham.HinhAnhSanPhams
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi lấy chi tiết sản phẩm!" });
            }
        }

        // POST: api/sanPham/{id}/view
        [HttpPost("{id}/view")]
        public async Task<IActionResult> IncrementLuotXem(long id)
        {
            try
            {
                var p = await _context.SanPhams.FindAsync(id);
                if (p == null) return NotFound();

                p.LuotXem += 1;
                await _context.SaveChangesAsync();

                return Ok(new { success = true });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // POST: api/sanPham
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateSanPham(
            [FromForm] string ten_san_pham,
            [FromForm] long? danh_muc_id,
            [FromForm] long? nha_cung_cap_id,
            [FromForm] string? mo_ta_ngan,
            [FromForm] string? mo_ta_day_du,
            [FromForm] string? thuong_hieu,
            [FromForm] string? trang_thai,
            [FromForm] string? noi_bat,
            [FromForm] string? bien_the,
            [FromForm] string? thuoc_tinh,
            [FromForm] string? hinh_anh,
            List<IFormFile> hinh_anh_files)
        {
            using var t = await _context.Database.BeginTransactionAsync();
            try
            {
                if (string.IsNullOrEmpty(ten_san_pham))
                {
                    return BadRequest(new { message = "Tên sản phẩm không được để trống!" });
                }

                var slug = await CreateUniqueSlug(ten_san_pham);
                var isNoiBat = noi_bat == "true" || noi_bat == "1";

                var newProduct = new SanPham
                {
                    TenSanPham = ten_san_pham,
                    Slug = slug,
                    DanhMucId = danh_muc_id ?? 0,
                    NhaCungCapId = nha_cung_cap_id ?? 0,
                    MoTaNgan = mo_ta_ngan,
                    MoTaDayDu = mo_ta_day_du,
                    ThuongHieu = thuong_hieu,
                    TrangThai = string.IsNullOrEmpty(trang_thai) ? "active" : trang_thai,
                    NoiBat = isNoiBat,
                    LuotXem = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SanPhams.Add(newProduct);
                await _context.SaveChangesAsync(); // Generates ID

                // Save variants
                if (!string.IsNullOrEmpty(bien_the))
                {
                    var variants = JsonSerializer.Deserialize<List<BienTheSanPham>>(bien_the, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (variants != null)
                    {
                        foreach (var bt in variants)
                        {
                            bt.SanPhamId = newProduct.Id;
                            bt.TrangThai = string.IsNullOrEmpty(bt.TrangThai) ? "active" : bt.TrangThai;
                            _context.BienTheSanPhams.Add(bt);
                        }
                    }
                }

                // Save attributes
                if (!string.IsNullOrEmpty(thuoc_tinh))
                {
                    var attributes = JsonSerializer.Deserialize<List<ThuocTinhSanPham>>(thuoc_tinh, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (attributes != null)
                    {
                        foreach (var tt in attributes)
                        {
                            tt.SanPhamId = newProduct.Id;
                            _context.ThuocTinhSanPhams.Add(tt);
                        }
                    }
                }

                // Save images
                var imagesList = new List<HinhAnhSanPham>();

                if (hinh_anh_files != null && hinh_anh_files.Count > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

                    for (int i = 0; i < hinh_anh_files.Count; i++)
                    {
                        var file = hinh_anh_files[i];
                        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                        var filePath = Path.Combine(uploadsDir, uniqueFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        imagesList.Add(new HinhAnhSanPham
                        {
                            SanPhamId = newProduct.Id,
                            UrlAnh = $"/uploads/{uniqueFileName}",
                            AltText = ten_san_pham,
                            LaAnhChinh = i == 0
                        });
                    }
                }
                else if (!string.IsNullOrEmpty(hinh_anh))
                {
                    var imgJson = JsonSerializer.Deserialize<List<JsonElement>>(hinh_anh);
                    if (imgJson != null)
                    {
                        for (int i = 0; i < imgJson.Count; i++)
                        {
                            var el = imgJson[i];
                            var url = el.GetProperty("url_anh").GetString() ?? "";
                            var isMain = el.TryGetProperty("la_anh_chinh", out var mainProp) ? mainProp.GetBoolean() : (i == 0);

                            imagesList.Add(new HinhAnhSanPham
                            {
                                SanPhamId = newProduct.Id,
                                UrlAnh = url,
                                AltText = ten_san_pham,
                                LaAnhChinh = isMain
                            });
                        }
                    }
                }

                if (imagesList.Count > 0)
                {
                    _context.HinhAnhSanPhams.AddRange(imagesList);
                }

                await _context.SaveChangesAsync();
                await t.CommitAsync();

                // Trigger async index sync
                _ = _meiliSearchService.SyncDataToMeilisearchAsync();

                return StatusCode(201, new { message = "Thêm sản phẩm và chi tiết thành công!", data = newProduct });
            }
            catch (Exception ex)
            {
                await t.RollbackAsync();
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server khi thêm sản phẩm!" });
            }
        }

        // PUT: api/sanPham/{id}/status (Toggle status)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> ToggleTrangThai(long id)
        {
            try
            {
                var sanPham = await _context.SanPhams.FindAsync(id);
                if (sanPham == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm!" });
                }

                var newStatus = sanPham.TrangThai == "active" ? "inactive" : "active";
                sanPham.TrangThai = newStatus;
                await _context.SaveChangesAsync();

                _ = _meiliSearchService.SyncDataToMeilisearchAsync();

                return Ok(new { message = "Cập nhật trạng thái thành công!", trang_thai = newStatus });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi cập nhật trạng thái!" });
            }
        }

        // DELETE: api/sanPham/{id} (Soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSanPham(long id)
        {
            try
            {
                var sanPham = await _context.SanPhams.FindAsync(id);
                if (sanPham == null || sanPham.TrangThai == "deleted")
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm!" });
                }

                // Check processing orders containing variants of this product
                var processingOrders = await _context.ChiTietDonHangs
                    .Include(ct => ct.BienThe)
                    .Include(ct => ct.DonHang)
                    .Where(ct => ct.BienThe.SanPhamId == id && 
                                 new[] { "pending", "confirmed", "processing", "shipping" }.Contains(ct.DonHang.TrangThai))
                    .ToListAsync();

                if (processingOrders.Count > 0)
                {
                    var orderCodes = processingOrders
                        .Select(ct => ct.DonHang.MaDonHang)
                        .Distinct()
                        .Take(5)
                        .ToList();

                    return Conflict(new
                    {
                        message = $"Không thể xóa! Sản phẩm \"{sanPham.TenSanPham}\" đang có trong {processingOrders.Count} đơn hàng chưa hoàn tất.",
                        so_don_hang = processingOrders.Count,
                        ma_don_hangs = orderCodes,
                        ten_san_pham = sanPham.TenSanPham,
                        san_pham_id = id,
                        trang_thai_hien_tai = sanPham.TrangThai
                    });
                }

                sanPham.TrangThai = "deleted";
                await _context.SaveChangesAsync();

                _ = _meiliSearchService.SyncDataToMeilisearchAsync();

                return Ok(new { message = "Đã xóa sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server khi xóa sản phẩm." });
            }
        }

        // PUT: api/sanPham/{id} (Update Product)
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateSanPham(
            long id,
            [FromForm] string ten_san_pham,
            [FromForm] string? thuong_hieu,
            [FromForm] long? danh_muc_id,
            [FromForm] long? nha_cung_cap_id,
            [FromForm] string? mo_ta_ngan,
            [FromForm] string? mo_ta_day_du,
            [FromForm] string? trang_thai,
            [FromForm] string? noi_bat,
            [FromForm] string? bien_the,
            [FromForm] string? thuoc_tinh,
            [FromForm] string? hinh_anh,
            List<IFormFile> hinh_anh_files)
        {
            using var t = await _context.Database.BeginTransactionAsync();
            try
            {
                var sanPham = await _context.SanPhams.FindAsync(id);
                if (sanPham == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm!" });
                }

                var isNoiBat = noi_bat == "true" || noi_bat == "1";

                sanPham.TenSanPham = ten_san_pham;
                sanPham.ThuongHieu = thuong_hieu;
                sanPham.DanhMucId = danh_muc_id ?? sanPham.DanhMucId;
                sanPham.NhaCungCapId = nha_cung_cap_id ?? sanPham.NhaCungCapId;
                sanPham.MoTaNgan = mo_ta_ngan;
                sanPham.MoTaDayDu = mo_ta_day_du;
                sanPham.TrangThai = string.IsNullOrEmpty(trang_thai) ? sanPham.TrangThai : trang_thai;
                sanPham.NoiBat = isNoiBat;
                sanPham.UpdatedAt = DateTime.UtcNow;

                if (ten_san_pham != sanPham.TenSanPham)
                {
                    sanPham.Slug = await CreateUniqueSlug(ten_san_pham, id);
                }

                await _context.SaveChangesAsync();

                // Handle variants updates
                if (!string.IsNullOrEmpty(bien_the))
                {
                    var variants = JsonSerializer.Deserialize<List<BienTheSanPham>>(bien_the, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (variants != null)
                    {
                        foreach (var bt in variants)
                        {
                            if (bt.Id > 0) // existing variant
                            {
                                var existingBt = await _context.BienTheSanPhams.FirstOrDefaultAsync(b => b.Id == bt.Id && b.SanPhamId == id);
                                if (existingBt != null)
                                {
                                    existingBt.MauSac = bt.MauSac;
                                    existingBt.DungLuong = bt.DungLuong;
                                    existingBt.Ram = bt.Ram;
                                    existingBt.GiaGoc = bt.GiaGoc;
                                    existingBt.GiaBan = bt.GiaBan;
                                    existingBt.TonKho = bt.TonKho;
                                    existingBt.MaMauHex = bt.MaMauHex;
                                    existingBt.TrangThai = string.IsNullOrEmpty(bt.TrangThai) ? existingBt.TrangThai : bt.TrangThai;
                                }
                            }
                            else // new variant
                            {
                                bt.SanPhamId = id;
                                bt.TrangThai = string.IsNullOrEmpty(bt.TrangThai) ? "active" : bt.TrangThai;
                                _context.BienTheSanPhams.Add(bt);
                            }
                        }
                    }
                }

                // Rewrite attributes (Delete old, write new)
                var oldAttributes = await _context.ThuocTinhSanPhams.Where(tt => tt.SanPhamId == id).ToListAsync();
                _context.ThuocTinhSanPhams.RemoveRange(oldAttributes);

                if (!string.IsNullOrEmpty(thuoc_tinh))
                {
                    var attributes = JsonSerializer.Deserialize<List<ThuocTinhSanPham>>(thuoc_tinh, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (attributes != null)
                    {
                        foreach (var tt in attributes)
                        {
                            tt.SanPhamId = id;
                            _context.ThuocTinhSanPhams.Add(tt);
                        }
                    }
                }

                // Rewrite images (Delete old, rebuild keeping selected ones)
                var oldImages = await _context.HinhAnhSanPhams.Where(ha => ha.SanPhamId == id).ToListAsync();
                _context.HinhAnhSanPhams.RemoveRange(oldImages);

                var finalImagesList = new List<HinhAnhSanPham>();

                // Keep selected existing images
                if (!string.IsNullOrEmpty(hinh_anh))
                {
                    var retainedImgList = JsonSerializer.Deserialize<List<JsonElement>>(hinh_anh);
                    if (retainedImgList != null)
                    {
                        foreach (var el in retainedImgList)
                        {
                            var url = el.GetProperty("url_anh").GetString() ?? "";
                            var isMain = el.TryGetProperty("la_anh_chinh", out var mainProp) && mainProp.GetBoolean();

                            finalImagesList.Add(new HinhAnhSanPham
                            {
                                SanPhamId = id,
                                UrlAnh = url,
                                AltText = ten_san_pham,
                                LaAnhChinh = isMain
                            });
                        }
                    }
                }

                // Upload new image files
                if (hinh_anh_files != null && hinh_anh_files.Count > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

                    foreach (var file in hinh_anh_files)
                    {
                        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                        var filePath = Path.Combine(uploadsDir, uniqueFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        finalImagesList.Add(new HinhAnhSanPham
                        {
                            SanPhamId = id,
                            UrlAnh = $"/uploads/{uniqueFileName}",
                            AltText = ten_san_pham,
                            LaAnhChinh = false
                        });
                    }
                }

                // Ensure at least one main image is set
                if (finalImagesList.Count > 0 && !finalImagesList.Any(img => img.LaAnhChinh))
                {
                    finalImagesList[0].LaAnhChinh = true;
                }

                if (finalImagesList.Count > 0)
                {
                    _context.HinhAnhSanPhams.AddRange(finalImagesList);
                }

                await _context.SaveChangesAsync();
                await t.CommitAsync();

                _ = _meiliSearchService.SyncDataToMeilisearchAsync();

                return Ok(new { message = "Cập nhật sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                await t.RollbackAsync();
                Console.WriteLine($"Lỗi khi cập nhật sản phẩm: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật sản phẩm!" });
            }
        }

        // GET: api/sanPham/{id}/tuong-tu (Similar products)
        [HttpGet("{id}/tuong-tu")]
        public async Task<IActionResult> GetSanPhamTuongTu(long id)
        {
            try
            {
                var currentProduct = await _context.SanPhams.FindAsync(id);
                if (currentProduct == null)
                {
                    return NotFound(new { message = "Không tìm thấy" });
                }

                var similarProducts = await _context.SanPhams
                    .Where(p => p.DanhMucId == currentProduct.DanhMucId && p.Id != id && p.TrangThai == "active")
                    .Include(p => p.BienTheSanPhams)
                    .Include(p => p.HinhAnhSanPhams)
                    .Include(p => p.DanhGiaSanPhams)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(8)
                    .ToListAsync();

                var mappedList = similarProducts.Select(p => new
                {
                    p.Id,
                    p.TenSanPham,
                    p.Slug,
                    p.DanhMucId,
                    p.NhaCungCapId,
                    p.MoTaNgan,
                    p.MoTaDayDu,
                    p.ThuongHieu,
                    p.TrangThai,
                    p.NoiBat,
                    p.LuotXem,
                    p.CreatedAt,
                    p.UpdatedAt,
                    bien_the = p.BienTheSanPhams,
                    hinh_anh = p.HinhAnhSanPhams,
                    danh_gia = p.DanhGiaSanPhams.Select(d => new { d.SoSao })
                });

                return Ok(mappedList);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy SP tương tự: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }

        // GET: api/sanPham/{id}/danh-gia (Reviews lookup)
        [HttpGet("{id}/danh-gia")]
        public async Task<IActionResult> GetReviewsBySanPham(long id)
        {
            try
            {
                // Authenticated user parsing if authorization header exists
                long? userId = null;
                bool isUserAdmin = false;

                if (User.Identity?.IsAuthenticated == true)
                {
                    var idClaim = User.FindFirst("id")?.Value;
                    if (long.TryParse(idClaim, out var parsedId)) userId = parsedId;
                    
                    var roleClaim = User.FindFirst("vai_tro")?.Value;
                    isUserAdmin = roleClaim == "admin";
                }

                var reviewsQuery = _context.DanhGiaSanPhams.AsQueryable();
                if (isUserAdmin)
                {
                    reviewsQuery = reviewsQuery.Where(r => r.SanPhamId == id);
                }
                else
                {
                    reviewsQuery = reviewsQuery.Where(r => r.SanPhamId == id && r.TrangThai == "approved");
                }

                var reviews = await reviewsQuery
                    .Include(r => r.TaiKhoan)
                    .Include(r => r.DonHang)
                        .ThenInclude(o => o.ChiTietDonHangs)
                            .ThenInclude(ct => ct.BienThe)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                var mappedReviews = new List<object>();
                foreach (var r in reviews)
                {
                    var totalLikes = await _context.ThichDanhGia.CountAsync(l => l.DanhGiaId == r.Id && l.Loai == "like");
                    var totalDislikes = await _context.ThichDanhGia.CountAsync(l => l.DanhGiaId == r.Id && l.Loai == "dislike");

                    string? userInteraction = null;
                    if (userId.HasValue)
                    {
                        var interaction = await _context.ThichDanhGia.FirstOrDefaultAsync(l => l.DanhGiaId == r.Id && l.TaiKhoanId == userId.Value);
                        userInteraction = interaction?.Loai;
                    }

                    mappedReviews.Add(new
                    {
                        r.Id,
                        r.SanPhamId,
                        r.TaiKhoanId,
                        r.DonHangId,
                        r.SoSao,
                        r.NoiDung,
                        r.HinhAnh,
                        r.TrangThai,
                        r.CreatedAt,
                        r.ParentId,
                        total_likes = totalLikes,
                        total_dislikes = totalDislikes,
                        user_interaction = userInteraction,
                        nguoi_dung = r.TaiKhoan != null ? new { r.TaiKhoan.HoTen, r.TaiKhoan.AnhDaiDien, r.TaiKhoan.VaiTro } : null,
                        don_hang = r.DonHang != null ? new
                        {
                            r.DonHang.Id,
                            chi_tiet = r.DonHang.ChiTietDonHangs.Select(ct => new
                            {
                                ct.Id,
                                bien_the = ct.BienThe != null ? new
                                {
                                    ct.BienThe.Id,
                                    ct.BienThe.MauSac,
                                    ct.BienThe.DungLuong,
                                    ct.BienThe.Ram
                                } : null
                            })
                        } : null
                    });
                }

                return Ok(mappedReviews);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy đánh giá: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi lấy đánh giá!" });
            }
        }

        // POST: api/sanPham/danh-gia/{danhGiaId}/like (Toggle Like/Dislike)
        [HttpPost("danh-gia/{danhGiaId}/like")]
        public async Task<IActionResult> ToggleLikeReview(long danhGiaId, [FromBody] JsonElement body)
        {
            try
            {
                // Authenticate check
                var idClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(idClaim) || !long.TryParse(idClaim, out var userId))
                {
                    return Unauthorized(new { message = "Chưa xác thực người dùng!" });
                }

                string? loai = body.TryGetProperty("loai", out var loaiProp) ? loaiProp.GetString() : null;
                if (loai != "like" && loai != "dislike")
                {
                    return BadRequest(new { message = "Loại tương tác không hợp lệ!" });
                }

                var interaction = await _context.ThichDanhGia
                    .FirstOrDefaultAsync(l => l.DanhGiaId == danhGiaId && l.TaiKhoanId == userId);

                if (interaction != null)
                {
                    if (interaction.Loai == loai)
                    {
                        _context.ThichDanhGia.Remove(interaction);
                        await _context.SaveChangesAsync();
                        return Ok(new { message = "Đã hủy tương tác", action = "removed" });
                    }
                    else
                    {
                        interaction.Loai = loai;
                        await _context.SaveChangesAsync();
                        return Ok(new { message = "Đã cập nhật tương tác", action = "updated" });
                    }
                }
                else
                {
                    var newInteraction = new ThichDanhGium
                    {
                        DanhGiaId = danhGiaId,
                        TaiKhoanId = userId,
                        Loai = loai
                    };
                    _context.ThichDanhGia.Add(newInteraction);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Đã thêm tương tác", action = "created" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi xử lý like/dislike!" });
            }
        }

        // POST: api/sanPham/{id}/danh-gia (Create product review)
        [HttpPost("{id}/danh-gia")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateReview(
            long id,
            [FromForm] string? so_sao,
            [FromForm] string? noi_dung,
            [FromForm] string? don_hang_id,
            [FromForm] string? parent_id,
            List<IFormFile> hinh_anh)
        {
            try
            {
                var idClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(idClaim) || !long.TryParse(idClaim, out var userId))
                {
                    return Unauthorized(new { message = "Chưa xác thực người dùng!" });
                }

                var cleanNoiDung = string.IsNullOrEmpty(noi_dung) || noi_dung == "undefined" || string.IsNullOrWhiteSpace(noi_dung)
                    ? "Sản phẩm rất tốt!"
                    : noi_dung.Trim();

                long? cleanParentId = null;
                if (long.TryParse(parent_id, out var parsedParentId)) cleanParentId = parsedParentId;

                byte? cleanSoSao = null;
                if (!cleanParentId.HasValue)
                {
                    cleanSoSao = byte.TryParse(so_sao, out var parsedSoSao) ? parsedSoSao : (byte)5;
                }

                long? cleanDonHangId = null;
                if (long.TryParse(don_hang_id, out var parsedDonHangId)) cleanDonHangId = parsedDonHangId;

                var uploadedFilesList = new List<string>();
                if (hinh_anh != null && hinh_anh.Count > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

                    foreach (var file in hinh_anh)
                    {
                        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                        var filePath = Path.Combine(uploadsDir, uniqueFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        uploadedFilesList.Add(uniqueFileName);
                    }
                }

                var imageString = uploadedFilesList.Count > 0 ? JsonSerializer.Serialize(uploadedFilesList) : null;

                var newReview = new DanhGiaSanPham
                {
                    SanPhamId = id,
                    TaiKhoanId = userId,
                    SoSao = cleanSoSao,
                    NoiDung = cleanNoiDung,
                    DonHangId = cleanDonHangId ?? 0,
                    HinhAnh = imageString,
                    TrangThai = "approved",
                    ParentId = cleanParentId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.DanhGiaSanPhams.Add(newReview);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Đánh giá thành công!", data = newReview });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi thêm đánh giá!" });
            }
        }

        // GET: api/sanPham/{id}/check-purchased
        [HttpGet("{id}/check-purchased")]
        public async Task<IActionResult> CheckPurchased(long id)
        {
            try
            {
                var idClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(idClaim) || !long.TryParse(idClaim, out var userId))
                {
                    return Unauthorized(new { message = "Chưa xác thực người dùng!" });
                }

                var orderExists = await _context.DonHangs
                    .AnyAsync(o => o.TaiKhoanId == userId && 
                                   o.TrangThai == "delivered" && 
                                   o.ChiTietDonHangs.Any(ct => ct.BienThe.SanPhamId == id));

                return Ok(new { isPurchased = orderExists });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi checkPurchased: {ex.Message}");
                return StatusCode(500, new { isPurchased = false });
            }
        }

        // GET: api/sanPham/thuong-hieu/{danhMucId}
        [HttpGet("thuong-hieu/{danhMucId}")]
        public async Task<IActionResult> GetBrandsByCategory(long danhMucId)
        {
            try
            {
                var childCategories = await _context.DanhMucs
                    .Where(d => d.DanhMucChaId == danhMucId)
                    .Select(d => d.Id)
                    .ToListAsync();

                var allCategoryIds = new List<long> { danhMucId };
                allCategoryIds.AddRange(childCategories);

                var brands = await _context.SanPhams
                    .Where(sp => allCategoryIds.Contains(sp.DanhMucId) && sp.TrangThai == "active")
                    .Select(sp => sp.ThuongHieu)
                    .Where(b => b != null && b.Trim() != "")
                    .Distinct()
                    .ToListAsync();

                return Ok(brands);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy danh sách thương hiệu: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy thương hiệu!" });
            }
        }

        // GET: api/sanPham/boloc/{danhMucId} (Filters config)
        [HttpGet("boloc/{danhMucId}")]
        public async Task<IActionResult> GetFilterConfigByCategory(long danhMucId)
        {
            try
            {
                var childCategories = await _context.DanhMucs
                    .Where(d => d.DanhMucChaId == danhMucId)
                    .Select(d => d.Id)
                    .ToListAsync();

                var allCategoryIds = new List<long> { danhMucId };
                allCategoryIds.AddRange(childCategories);

                var variants = await _context.BienTheSanPhams
                    .Include(bt => bt.SanPham)
                    .Where(bt => allCategoryIds.Contains(bt.SanPham.DanhMucId) && bt.SanPham.TrangThai == "active")
                    .Select(bt => new { bt.Ram, bt.DungLuong, bt.MauSac })
                    .ToListAsync();

                var ramsList = variants.Select(v => v.Ram).Where(r => !string.IsNullOrEmpty(r)).Distinct().OrderBy(r => r).ToList();
                var capacitiesList = variants.Select(v => v.DungLuong).Where(c => !string.IsNullOrEmpty(c)).Distinct().OrderBy(c => c).ToList();
                var colorsList = variants.Select(v => v.MauSac).Where(c => !string.IsNullOrEmpty(c)).Distinct().OrderBy(c => c).ToList();

                return Ok(new
                {
                    rams = ramsList,
                    dung_luongs = capacitiesList,
                    mau_sacs = colorsList
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy cấu hình bộ lọc: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy bộ lọc!" });
            }
        }

        // PUT: api/sanPham/danh-gia/{id}/status (Update review status by admin)
        [HttpPut("danh-gia/{id}/status")]
        public async Task<IActionResult> UpdateReviewStatus(long id, [FromBody] JsonElement body)
        {
            try
            {
                string? status = body.TryGetProperty("trang_thai", out var statusProp) ? statusProp.GetString() : null;
                if (string.IsNullOrEmpty(status))
                {
                    return BadRequest(new { message = "Thiếu trạng thái!" });
                }

                var review = await _context.DanhGiaSanPhams.FindAsync(id);
                if (review == null)
                {
                    return NotFound(new { message = "Không tìm thấy đánh giá!" });
                }

                review.TrangThai = status;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã cập nhật trạng thái!", data = review });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi cập nhật trạng thái!" });
            }
        }

        // DELETE: api/sanPham/danh-gia/{id} (Delete review)
        [HttpDelete("danh-gia/{id}")]
        public async Task<IActionResult> DeleteReview(long id)
        {
            try
            {
                var review = await _context.DanhGiaSanPhams.FindAsync(id);
                if (review == null)
                {
                    return NotFound(new { message = "Không tìm thấy!" });
                }

                _context.DanhGiaSanPhams.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa đánh giá thành công!" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi xóa đánh giá!" });
            }
        }
    }
}
