using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebFashion.Api.Models;
using WebFashion.Api.Services;

namespace WebFashion.Api.Controllers
{
    [Route("api/ai")]
    [ApiController]
    [AllowAnonymous]
    public class AIController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IGeminiService _geminiService;

        public AIController(AppDbContext context, IGeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        #region DTOs
        public class ChatRequestDto
        {
            [JsonPropertyName("message")]
            public string Message { get; set; } = null!;

            [JsonPropertyName("history")]
            public List<ClientHistoryMsgDto>? History { get; set; }
        }

        public class ClientHistoryMsgDto
        {
            [JsonPropertyName("role")]
            public string Role { get; set; } = null!; // "user" or "model"/"bot"

            [JsonPropertyName("text")]
            public string Text { get; set; } = null!;
        }

        public class BuildPcRequestDto
        {
            [JsonPropertyName("message")]
            public string Message { get; set; } = null!;

            [JsonPropertyName("currentBuild")]
            public Dictionary<string, SelectedPartDto?>? CurrentBuild { get; set; }
        }

        public class SelectedPartDto
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = null!;

            [JsonPropertyName("price")]
            public decimal Price { get; set; }
        }

        public class CompareRequestDto
        {
            [JsonPropertyName("product1")]
            public ProductCompareDto Product1 { get; set; } = null!;

            [JsonPropertyName("product2")]
            public ProductCompareDto Product2 { get; set; } = null!;
        }

        public class ProductCompareDto
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = null!;

            [JsonPropertyName("price")]
            public string? Price { get; set; }

            [JsonPropertyName("specs")]
            public object? Specs { get; set; }
        }

        public class CheckTypeRequestDto
        {
            [JsonPropertyName("product1Name")]
            public string Product1Name { get; set; } = null!;

            [JsonPropertyName("product2Name")]
            public string Product2Name { get; set; } = null!;
        }
        #endregion

        // 1. GET: api/ai/history
        [HttpGet("history")]
        public async Task<IActionResult> GetChatHistory()
        {
            try
            {
                var history = await _context.ChatHistories
                    .OrderBy(h => h.CreatedAt)
                    .Take(50)
                    .ToListAsync();
                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy lịch sử AI: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 2. DELETE: api/ai/history
        [HttpDelete("history")]
        public async Task<IActionResult> ClearHistory()
        {
            try
            {
                var histories = await _context.ChatHistories.ToListAsync();
                if (histories.Count > 0)
                {
                    _context.ChatHistories.RemoveRange(histories);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { message = "Đã xóa sạch trí nhớ AI!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi xóa lịch sử AI: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // 3. POST: api/ai/chat
        [HttpPost("chat")]
        public async Task<IActionResult> ChatWithAI([FromBody] ChatRequestDto dto)
        {
            try
            {
                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                string tenCuaHang = config?.TenCuaHang ?? "LTLShop";
                string hotline = config?.SoDienThoai ?? "Liên hệ website";
                string diaChi = config?.DiaChi ?? "";
                string email = config?.Email ?? "";
                string chinhSachDoiTra = config?.ChinhSachDoiTra ?? "Đổi trả trong 7 ngày nếu sản phẩm lỗi nhà sản xuất, còn nguyên hộp, đầy đủ phụ kiện.";

                var listSP = await _context.SanPhams
                    .Where(sp => sp.TrangThai == "active")
                    .Include(sp => sp.BienTheSanPhams)
                    .Take(100)
                    .ToListAsync();

                var listSpLines = listSP.Select(sp =>
                {
                    var bt = sp.BienTheSanPhams.FirstOrDefault();
                    string giaMoi = bt != null ? bt.GiaBan.ToString("C0", System.Globalization.CultureInfo.GetCultureInfo("vi-VN")) : "Liên hệ";
                    var specList = new List<string?>();
                    if (bt != null)
                    {
                        if (!string.IsNullOrEmpty(bt.Ram)) specList.Add(bt.Ram);
                        if (!string.IsNullOrEmpty(bt.DungLuong)) specList.Add(bt.DungLuong);
                    }
                    string specs = string.Join(", ", specList.Where(x => !string.IsNullOrEmpty(x)));
                    return $"- {sp.TenSanPham}{(string.IsNullOrEmpty(specs) ? "" : $" ({specs})")}: {giaMoi}";
                });

                string danhSachSP = string.Join("\n", listSpLines);
                string ngayHienTai = DateTime.Now.ToString("dddd, dd MMMM yyyy", System.Globalization.CultureInfo.GetCultureInfo("vi-VN"));

                string systemInstruction = $@"
Bạn là trợ lý chăm sóc khách hàng của {tenCuaHang} — một cửa hàng thương mại điện tử chuyên về điện thoại, laptop, máy tính bảng, linh kiện PC, phụ kiện và gaming gear.
Hôm nay là {ngayHienTai}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN CỬA HÀNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tên cửa hàng: {tenCuaHang}
- Hotline hỗ trợ: {hotline}{(string.IsNullOrEmpty(diaChi) ? "" : $"\n- Địa chỉ: {diaChi}")}{(string.IsNullOrEmpty(email) ? "" : $"\n- Email: {email}")}
- Chính sách bảo hành: 12–24 tháng tùy sản phẩm, bảo hành tại cửa hàng hoặc hãng.
- Chính sách đổi trả: {chinhSachDoiTra}
- Giao hàng: Toàn quốc, giao nhanh trong 2–4h nội thành, 1–3 ngày tỉnh thành khác. Miễn phí vận chuyển đơn hàng từ 500.000đ.
- Thanh toán: COD (thanh toán khi nhận hàng), chuyển khoản ngân hàng, thẻ Visa/Mastercard, ví MoMo, ZaloPay, trả góp 0%.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
DANH SÁCH SẢN PHẨM ĐANG BÁN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
{(string.IsNullOrEmpty(danhSachSP) ? "Đang cập nhật..." : danhSachSP)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHONG CÁCH & QUY TẮC TRẢ LỜI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GIỌNG ĐIỆU: Thân thiện, nhiệt tình, tôn trọng khách hàng. Xưng ""mình"" với khách hàng (không dùng ""tôi"" lạnh lùng). Gọi khách là ""bạn"".
2. NGẮN GỌN & DỄ HIỂU: Trả lời đủ ý, không dài dòng. Dùng gạch đầu dòng khi liệt kê nhiều thông tin.
3. CHỦ ĐỘNG ĐỀ XUẤT: Nếu khách hỏi chung chung, hãy hỏi lại nhu cầu (ngân sách, mục đích sử dụng) để tư vấn chính xác hơn.
4. TRUNG THỰC: Chỉ tư vấn sản phẩm có trong danh sách kho hàng ở trên. Nếu không có sản phẩm phù hợp, thành thật nói và mời khách liên hệ hotline.
5. KHÔNG PHÁN XÉT: Không chê sản phẩm của đối thủ, không ép khách mua đồ đắt tiền hơn nhu cầu thực sự.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÁC TÌNH HUỐNG THƯỜNG GẶP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TƯ VẤN SẢN PHẨM]
- Hỏi rõ nhu cầu: dùng làm gì, ngân sách bao nhiêu, thích thương hiệu nào.
- Đề xuất 2–3 lựa chọn phù hợp từ danh sách kho hàng với giá cụ thể.
- Nêu ngắn gọn điểm nổi bật của từng lựa chọn.

[HỎI GIÁ & KHUYẾN MÃI]
- Cung cấp giá chính xác từ danh sách kho hàng.
- Thông báo nếu đang có chương trình giảm giá (ví dụ: ""Sản phẩm này đang được giảm X%, giá còn Y"").
- Mời khách đến cửa hàng hoặc hotline để nhận báo giá tốt nhất khi mua số lượng lớn.

[THEO DÕI ĐƠN HÀNG]
- Hướng dẫn khách vào mục ""Đơn hàng của tôi"" trong trang cá nhân để theo dõi trạng thái.
- Nếu có vấn đề, mời khách cung cấp mã đơn hàng và liên hệ hotline để được hỗ trợ nhanh nhất.

[BẢO HÀNH & ĐỔI TRẢ]
- Áp dụng chính sách đổi trả của cửa hàng như trên.
- Bảo hành 12–24 tháng tùy sản phẩm. Mang sản phẩm và hóa đơn đến cửa hàng hoặc trung tâm bảo hành hãng.
- Nếu sản phẩm bị lỗi do người dùng (rơi vỡ, vô nước), hướng dẫn đến cửa hàng để kiểm tra và báo giá sửa chữa.

[VẬN CHUYỂN & GIAO HÀNG]
- Nội thành: 2–4 giờ. Tỉnh thành: 1–3 ngày làm việc.
- Miễn phí vận chuyển cho đơn từ 500.000đ.
- Cho phép kiểm tra hàng trước khi nhận (COD).

[THANH TOÁN & TRẢ GÓP]
- Hỗ trợ COD, chuyển khoản, Visa/Mastercard, MoMo, ZaloPay.
- Trả góp 0% qua thẻ tín dụng hoặc công ty tài chính (FE Credit, Home Credit...).
- Hướng dẫn khách liên hệ hotline để được hỗ trợ hồ sơ trả góp.

[KHIẾU NẠI & PHÀN NÀN]
- Luôn xin lỗi khách trước, thể hiện sự thấu hiểu.
- Hỏi rõ vấn đề và mã đơn hàng, sau đó hướng dẫn xử lý hoặc chuyển lên hotline.
- Cam kết xử lý trong 24 giờ làm việc.

[CÂU HỎI NGOÀI PHẠM VI]
- Nếu khách hỏi điều không liên quan đến mua sắm/cửa hàng, lịch sự từ chối và chuyển hướng: ""Mình chỉ có thể hỗ trợ các vấn đề liên quan đến sản phẩm và dịch vụ tại {tenCuaHang}. Bạn cần mình hỗ trợ gì về cửa hàng không?""
";

                // Format history
                var historyForGemini = new List<GeminiMessage>();
                if (dto.History != null)
                {
                    foreach (var hMsg in dto.History.Take(dto.History.Count - 1))
                    {
                        historyForGemini.Add(new GeminiMessage
                        {
                            Role = hMsg.Role == "user" ? "user" : "model",
                            Parts = new List<GeminiPart> { new GeminiPart { Text = hMsg.Text } }
                        });
                    }
                }

                // Filter alternating role history
                var cleanHistory = new List<GeminiMessage>();
                string expectedRole = "user";
                foreach (var msg in historyForGemini)
                {
                    if (msg.Role == expectedRole)
                    {
                        cleanHistory.Add(msg);
                        expectedRole = expectedRole == "user" ? "model" : "user";
                    }
                }

                if (cleanHistory.Count > 0 && cleanHistory.Last().Role == "user")
                {
                    cleanHistory.RemoveAt(cleanHistory.Count - 1);
                }

                string reply = await _geminiService.ChatWithAIAsync(systemInstruction, cleanHistory, dto.Message);

                return Ok(new { reply = reply });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi Gemini Chat: {ex.Message}");
                string errorMsg = ex.Message.Contains("503") || ex.Message.Contains("429")
                    ? "Hệ thống AI đang quá tải, bạn vui lòng đợi 1 phút rồi thử lại nhé!"
                    : "Rất tiếc, AI đang gặp chút sự cố kỹ thuật. Bạn có thể liên hệ hotline để được hỗ trợ ngay!";
                return Ok(new { reply = errorMsg });
            }
        }

        // 4. POST: api/ai/build-pc
        [HttpPost("build-pc")]
        public async Task<IActionResult> BuildPcWithAI([FromBody] BuildPcRequestDto dto)
        {
            try
            {
                string buildText = "Chưa chọn gì";
                if (dto.CurrentBuild != null)
                {
                    var activeParts = dto.CurrentBuild
                        .Where(x => x.Value != null)
                        .Select(x => $"- {x.Key.ToUpper()}: {x.Value!.Name} ({x.Value.Price}đ)");
                    
                    if (activeParts.Any())
                    {
                        buildText = string.Join("\n", activeParts);
                    }
                }

                var listSP = await _context.SanPhams
                    .Where(sp => sp.TrangThai == "active")
                    .Include(sp => sp.BienTheSanPhams)
                    .Include(sp => sp.HinhAnhSanPhams)
                    .Take(1000)
                    .ToListAsync();

                var khoHang = listSP.Select(sp => new
                {
                    name = sp.TenSanPham,
                    price = sp.BienTheSanPhams.FirstOrDefault() != null ? (double)sp.BienTheSanPhams.First().GiaBan : 0.0
                }).ToList();

                string systemInstruction = $@"
      Bạn là Chuyên gia Build PC & Gaming Setup chuyên nghiệp. Nhiệm vụ của bạn là giúp khách hàng sở hữu dàn máy mơ ước.
      
      QUY TẮC TƯ VẤN CAO CẤP:
      1. CẤU HÌNH HIỆN TẠI:
      {buildText}
      => Hãy phân tích cấu hình này, khen ngợi nếu nó hợp lý hoặc cảnh báo nếu có sự mất cân đối. Đừng hỏi lại những gì khách đã chọn.

      2. PHẠM VI TƯ VẤN RỘNG: Bạn hỗ trợ trọn gói 21 món linh kiện. TUYỆT ĐỐI KHÔNG ĐƯỢC TỪ CHỐI tư vấn bất kỳ món nào trong danh sách 21 món (đặc biệt là Chuột, Bàn phím, Màn hình, Ghế). Nếu khách hỏi, bạn BẮT BUỘC phải đưa ra gợi ý từ kho hàng.
      3. TƯ DUY TỐI ƯU: Nếu khách có ngân sách cụ thể, hãy phân bổ tiền cực kỳ thông minh giữa hiệu năng (CPU/VGA) và thẩm mỹ (Case/Fan/Gear).
      4. ĐA DẠNG LỰA CHỌN: Mỗi món cần đề xuất 3-4 phương án (Giá rẻ - Hiệu năng - Cao cấp) để khách dễ chọn.

      KHO HÀNG HIỆN CÓ: {JsonSerializer.Serialize(khoHang)}.
      
      BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI JSON:
      {{
        ""text"": ""Lời tư vấn ráp máy (Ngắn gọn, chuyên nghiệp, nhiệt tình)"",
        ""options"": [
          {{
            ""type"": ""MÃ LOẠI LINH KIỆN"", // CHỈ ĐƯỢC DÙNG 1 TRONG CÁC MÃ SAU: cpu, mainboard, ram, ssd1, ssd2, hdd, vga, psu, case, cooler_air, cooler_aio, cooler_custom, fan, monitor1, monitor2, keyboard, mouse, pad, headphone, speaker, chair
            ""name"": ""Tên linh kiện LẤY TỪ KHO HÀNG"",
            ""price"": 1000000, // Số nguyên
            ""image"": """", // Bạn hãy để trống trường này, hệ thống backend của cửa hàng sẽ tự bổ sung
            ""desc"": ""Ưu điểm ngắn gọn""
          }}
        ]
      }}
      
      LƯU Ý: Nếu khách hàng chưa chọn xong các linh kiện trước đó (CPU, Mainboard...), hãy nhắc nhở họ chọn các bước quan trọng đó trước để có thể tư vấn PSU/VGA chính xác nhất.
    ";

                string rawReply = await _geminiService.ChatWithAIAsync(systemInstruction, new List<GeminiMessage>(), dto.Message);

                JsonElement botResponseData;
                try
                {
                    var jsonMatch = Regex.Match(rawReply, @"\{[\s\S]*\}");
                    string cleanJson = jsonMatch.Success ? jsonMatch.Value : rawReply;
                    botResponseData = JsonSerializer.Deserialize<JsonElement>(cleanJson);

                    var optionsList = new List<object>();
                    if (botResponseData.TryGetProperty("options", out var optionsProp) && optionsProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var opt in optionsProp.EnumerateArray())
                        {
                            string optName = opt.GetProperty("name").GetString() ?? "";
                            string optType = opt.GetProperty("type").GetString() ?? "";
                            double optPrice = opt.GetProperty("price").GetDouble();
                            string optDesc = opt.TryGetProperty("desc", out var descProp) ? (descProp.GetString() ?? "") : "";

                            var matchedProd = listSP.FirstOrDefault(sp => sp.TenSanPham == optName);
                            string imageUrl = "";
                            if (matchedProd != null)
                            {
                                var mainImage = matchedProd.HinhAnhSanPhams.FirstOrDefault(img => img.LaAnhChinh) ?? matchedProd.HinhAnhSanPhams.FirstOrDefault();
                                imageUrl = mainImage != null ? mainImage.UrlAnh : "https://placehold.co/150";
                            }
                            else
                            {
                                imageUrl = "https://placehold.co/150";
                            }

                            optionsList.Add(new
                            {
                                type = optType,
                                name = optName,
                                price = optPrice,
                                image = imageUrl,
                                desc = optDesc
                            });
                        }
                    }

                    string textMsg = botResponseData.TryGetProperty("text", out var textProp) ? (textProp.GetString() ?? "") : "";

                    return Ok(new
                    {
                        text = textMsg,
                        options = optionsList
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi parse JSON AI: {ex.Message}");
                    string textOnly = Regex.Replace(rawReply, @"\{[\s\S]*\}", "");
                    textOnly = textOnly.Replace("```json", "").Replace("```", "").Replace("`", "").Trim();

                    return Ok(new
                    {
                        text = string.IsNullOrEmpty(textOnly) ? "Mình đã tìm được những linh kiện tuyệt vời nhất cho bạn!" : textOnly,
                        options = new List<object>()
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi Gemini Build PC: {ex.Message}");
                return Ok(new
                {
                    text = "AI đang bận một chút, bạn nhấn gửi lại để mình tư vấn tiếp nhé!",
                    options = new List<object>()
                });
            }
        }

        // 5. POST: api/ai/compare
        [HttpPost("compare")]
        public async Task<IActionResult> CompareProductsAI([FromBody] CompareRequestDto dto)
        {
            try
            {
                string systemInstruction = @"
      Bạn là chuyên gia tư vấn công nghệ của Shop. 
      Nhiệm vụ của bạn là so sánh 2 sản phẩm dựa trên thông số kỹ thuật được cung cấp nếu sản phẩm không có hãy lên mạng và tìm lấy những thông tin liên quan.
      
      YÊU CẦU:
      1. Phân tích khách quan, chính xác dựa trên dữ liệu.
      2. Nêu bật điểm mạnh, điểm yếu của từng sản phẩm.
      3. Đưa ra lời khuyên chọn mua phù hợp với từng nhu cầu (ví dụ: ""chọn A nếu thích chụp ảnh, chọn B nếu cần chơi game"").
      4. Ngôn từ thân thiện, dễ hiểu, KHÔNG quá dài dòng.

      BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU (Không có markdown block ```json):
      {
        ""summary"": ""Một câu tóm tắt chung về sự khác biệt chính giữa 2 sản phẩm"",
        ""product1"": {
          ""pros"": [""ưu điểm 1"", ""ưu điểm 2""],
          ""cons"": [""nhược điểm 1""]
        },
        ""product2"": {
          ""pros"": [""ưu điểm 1"", ""ưu điểm 2""],
          ""cons"": [""nhược điểm 1""]
        },
        ""verdict"": ""Kết luận chi tiết: Ai nên mua sản phẩm nào?""
      }
    ";

                string prompt = $@"
      Sản phẩm 1:
      - Tên: {dto.Product1.Name}
      - Giá: {dto.Product1.Price}
      - Thông số: {JsonSerializer.Serialize(dto.Product1.Specs)}

      Sản phẩm 2:
      - Tên: {dto.Product2.Name}
      - Giá: {dto.Product2.Price}
      - Thông số: {JsonSerializer.Serialize(dto.Product2.Specs)}
    ";

                string rawReply = await _geminiService.GenerateContentAsync(systemInstruction, prompt);

                try
                {
                    var jsonMatch = Regex.Match(rawReply, @"\{[\s\S]*\}");
                    string cleanJson = jsonMatch.Success ? jsonMatch.Value : rawReply;
                    var botResponseData = JsonSerializer.Deserialize<JsonElement>(cleanJson);
                    return Ok(botResponseData);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi parse JSON từ Gemini: {ex.Message}, Raw: {rawReply}");
                    return StatusCode(500, new { message = "Lỗi xử lý ngôn ngữ AI" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi Compare AI: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi kết nối AI" });
            }
        }

        // 6. POST: api/ai/check-type
        [HttpPost("check-type")]
        public async Task<IActionResult> CheckProductType([FromBody] CheckTypeRequestDto dto)
        {
            try
            {
                string prompt = $@"
      Nhiệm vụ của bạn là kiểm tra xem 2 sản phẩm sau đây có cùng chủng loại (ví dụ: cùng là điện thoại, cùng là laptop, cùng là chuột, cùng là máy tính bảng, v.v) hay không.
      Đừng phân biệt ""cũ"" và ""mới"" (ví dụ ""Điện thoại cũ iPhone 13"" và ""Điện thoại iPhone 15"" vẫn là cùng chủng loại).
      Sản phẩm 1: ""{dto.Product1Name}""
      Sản phẩm 2: ""{dto.Product2Name}""
      
      BẮT BUỘC trả về ĐÚNG định dạng JSON như sau, không kèm bất kỳ text nào khác (không có markdown block ```json):
      {{
        ""isSameType"": true hoặc false,
        ""reason"": ""Giải thích ngắn gọn""
      }}
    ";

                string rawReply = await _geminiService.GenerateContentAsync("", prompt);
                
                try
                {
                    var jsonMatch = Regex.Match(rawReply, @"\{[\s\S]*\}");
                    string cleanJson = jsonMatch.Success ? jsonMatch.Value : rawReply;
                    var botResponseData = JsonSerializer.Deserialize<JsonElement>(cleanJson);
                    return Ok(botResponseData);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi parse JSON check type AI: {ex.Message}");
                    return Ok(new { isSameType = true, reason = "Bỏ qua kiểm tra do lỗi AI" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi check type AI: {ex.Message}");
                return Ok(new { isSameType = true, reason = "Bỏ qua kiểm tra do lỗi AI" });
            }
        }
    }
}
