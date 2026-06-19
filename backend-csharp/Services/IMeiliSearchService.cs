using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebFashion.Api.Services
{
    public class SearchHit
    {
        public long Id { get; set; }
        public string TenSanPham { get; set; } = null!;
        public string? MoTaNgan { get; set; }
        public string? ThuongHieu { get; set; }
        public string Slug { get; set; } = null!;
        public decimal GiaBan { get; set; }
        public int TonKho { get; set; }
        public List<string> HinhAnh { get; set; } = new();
    }

    public class SearchResponseDto
    {
        public List<SearchHit> Hits { get; set; } = new();
        public int EstimatedTotalHits { get; set; }
    }

    public interface IMeiliSearchService
    {
        Task SyncDataToMeilisearchAsync();
        Task<SearchResponseDto> SearchSanPhamAsync(string query, int limit = 10, string? filter = null);
    }
}
