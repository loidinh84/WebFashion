using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WebFashion.Api.Models;

namespace WebFashion.Api.Services
{
    public class MeiliSearchService : IMeiliSearchService
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string? _meiliHost;
        private readonly string? _meiliApiKey;

        public MeiliSearchService(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _meiliHost = configuration["MeiliSearch:Host"]?.TrimEnd('/');
            _meiliApiKey = configuration["MeiliSearch:ApiKey"];
        }

        private HttpClient CreateMeiliClient()
        {
            var client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(_meiliHost ?? "http://127.0.0.1:7700");
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            if (!string.IsNullOrEmpty(_meiliApiKey))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _meiliApiKey);
            }

            return client;
        }

        public async Task SyncDataToMeilisearchAsync()
        {
            try
            {
                Console.WriteLine("Đang lấy dữ liệu từ SQL Server để đồng bộ MeiliSearch...");
                var products = await _context.SanPhams
                    .Where(sp => sp.TrangThai == "active")
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .ToListAsync();

                if (products.Count == 0)
                {
                    Console.WriteLine("Không có sản phẩm nào để đồng bộ.");
                    return;
                }

                var dataToSync = products.Select(sp => {
                    var firstVariant = sp.BienTheSanPhams.FirstOrDefault();
                    return new {
                        id = sp.Id,
                        ten_san_pham = sp.TenSanPham,
                        slug = sp.Slug,
                        danh_muc_id = sp.DanhMucId,
                        nha_cung_cap_id = sp.NhaCungCapId,
                        mo_ta_ngan = sp.MoTaNgan,
                        mo_ta_day_du = sp.MoTaDayDu,
                        thuong_hieu = sp.ThuongHieu,
                        trang_thai = sp.TrangThai,
                        noi_bat = sp.NoiBat,
                        luot_xem = sp.LuotXem,
                        created_at = sp.CreatedAt,
                        updated_at = sp.UpdatedAt,
                        gia_ban = firstVariant?.GiaBan ?? 0m,
                        ton_kho = firstVariant?.TonKho ?? 0,
                        hinh_anh = sp.HinhAnhSanPhams.Select(img => img.UrlAnh).ToList()
                    };
                }).ToList();

                using var client = CreateMeiliClient();
                
                // 1. Đẩy tài liệu lên Meilisearch
                var docRes = await client.PostAsJsonAsync("/indexes/san_pham/documents?primaryKey=id", dataToSync);
                docRes.EnsureSuccessStatusCode();
                Console.WriteLine($"Đã đẩy {dataToSync.Count} sản phẩm lên Meilisearch thành công!");

                // 2. Cập nhật Settings
                var settingsPayload = new
                {
                    searchableAttributes = new[] { "ten_san_pham", "mo_ta_ngan", "thuong_hieu" },
                    filterableAttributes = new[] { "danh_muc_id", "trang_thai", "thuong_hieu" }
                };

                // Gọi PATCH request bằng JsonContent
                var request = new HttpRequestMessage(new HttpMethod("PATCH"), "/indexes/san_pham/settings")
                {
                    Content = JsonContent.Create(settingsPayload)
                };
                var settingsRes = await client.SendAsync(request);
                settingsRes.EnsureSuccessStatusCode();
                Console.WriteLine("Cấu hình Meilisearch hoàn tất.");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"Meili sync lỗi (server vẫn chạy): {ex.Message}");
                Console.ResetColor();
            }
        }

        public async Task<SearchResponseDto> SearchSanPhamAsync(string query, int limit = 10, string? filter = null)
        {
            try
            {
                if (string.IsNullOrEmpty(_meiliHost))
                {
                    throw new Exception("MeiliSearch chưa được cấu hình.");
                }

                using var client = CreateMeiliClient();
                var body = new Dictionary<string, object>
                {
                    { "q", query ?? "" },
                    { "limit", limit },
                    { "attributesToRetrieve", new[] { "id", "ten_san_pham", "mo_ta_ngan", "thuong_hieu", "slug", "gia_ban", "ton_kho", "hinh_anh" } }
                };

                if (!string.IsNullOrEmpty(filter))
                {
                    body.Add("filter", filter);
                }

                var res = await client.PostAsJsonAsync("/indexes/san_pham/search", body);
                res.EnsureSuccessStatusCode();

                var meiliResult = await res.Content.ReadFromJsonAsync<JsonElement>();
                if (meiliResult.TryGetProperty("hits", out var hitsProperty))
                {
                    var hitsList = new List<SearchHit>();
                    foreach (var element in hitsProperty.EnumerateArray())
                    {
                        var id = element.GetProperty("id").GetInt64();
                        var name = element.GetProperty("ten_san_pham").GetString() ?? "";
                        var desc = element.TryGetProperty("mo_ta_ngan", out var descProp) ? descProp.GetString() : null;
                        var brand = element.TryGetProperty("thuong_hieu", out var brandProp) ? brandProp.GetString() : null;
                        var slug = element.GetProperty("slug").GetString() ?? "";
                        var price = element.GetProperty("gia_ban").GetDecimal();
                        var stock = element.GetProperty("ton_kho").GetInt32();
                        var images = new List<string>();

                        if (element.TryGetProperty("hinh_anh", out var imgsProp) && imgsProp.ValueKind == JsonValueKind.Array)
                        {
                            images = imgsProp.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
                        }

                        hitsList.Add(new SearchHit
                        {
                            Id = id,
                            TenSanPham = name,
                            MoTaNgan = desc,
                            ThuongHieu = brand,
                            Slug = slug,
                            GiaBan = price,
                            TonKho = stock,
                            HinhAnh = images
                        });
                    }

                    return new SearchResponseDto
                    {
                        Hits = hitsList,
                        EstimatedTotalHits = meiliResult.TryGetProperty("estimatedTotalHits", out var totalProp) ? totalProp.GetInt32() : hitsList.Count
                    };
                }

                throw new Exception("MeiliSearch không phản hồi hits hợp lệ.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MeiliSearch Error, falling back to SQL Server]: {ex.Message}");
                return await FallbackSearchSqlAsync(query, limit, filter);
            }
        }

        private async Task<SearchResponseDto> FallbackSearchSqlAsync(string query, int limit, string? filter)
        {
            try
            {
                List<long>? categoryIds = null;
                if (!string.IsNullOrEmpty(filter))
                {
                    var match = Regex.Match(filter, @"danh_muc_id\s*(?:IN\s*\(([^)]+)\)|=\s*(\d+))", RegexOptions.IgnoreCase);
                    if (match.Success)
                    {
                        var idsStr = !string.IsNullOrEmpty(match.Groups[1].Value) 
                            ? match.Groups[1].Value 
                            : match.Groups[2].Value;
                        
                        categoryIds = idsStr.Split(',')
                            .Select(id => id.Trim())
                            .Where(id => long.TryParse(id, out _))
                            .Select(long.Parse)
                            .ToList();
                    }
                }

                var queryable = _context.SanPhams
                    .Where(sp => sp.TrangThai == "active")
                    .AsQueryable();

                if (!string.IsNullOrEmpty(query))
                {
                    queryable = queryable.Where(sp => sp.TenSanPham.Contains(query));
                }

                if (categoryIds != null && categoryIds.Count > 0)
                {
                    queryable = queryable.Where(sp => categoryIds.Contains(sp.DanhMucId));
                }

                var sqlResults = await queryable
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .Take(limit)
                    .ToListAsync();

                var hits = sqlResults.Select(sp => {
                    var firstVariant = sp.BienTheSanPhams.FirstOrDefault();
                    return new SearchHit
                    {
                        Id = sp.Id,
                        TenSanPham = sp.TenSanPham,
                        MoTaNgan = sp.MoTaNgan,
                        ThuongHieu = sp.ThuongHieu,
                        Slug = sp.Slug,
                        GiaBan = firstVariant?.GiaBan ?? 0m,
                        TonKho = firstVariant?.TonKho ?? 0,
                        HinhAnh = sp.HinhAnhSanPhams.Select(img => img.UrlAnh).ToList()
                    };
                }).ToList();

                return new SearchResponseDto
                {
                    Hits = hits,
                    EstimatedTotalHits = hits.Count
                };
            }
            catch (Exception sqlError)
            {
                Console.WriteLine($"[SQL Search Fallback Error]: {sqlError.Message}");
                return new SearchResponseDto { Hits = new List<SearchHit>() };
            }
        }
    }
}
