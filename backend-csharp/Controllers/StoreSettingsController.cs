using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using WebFashion.Api.Models;

namespace WebFashion.Api.Controllers
{
    [Route("api/store-settings")]
    [ApiController]
    public class StoreSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StoreSettingsController(AppDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var userRole = User.FindFirst("vai_tro")?.Value;
            return userRole == "admin";
        }

        // 1. GET: api/store-settings
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetStoreSettings()
        {
            try
            {
                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                if (config == null)
                {
                    config = new ThietLapCuaHang
                    {
                        Id = 1,
                        TenCuaHang = "Cửa hàng của bạn",
                        SoDienThoai = "0123456789",
                        Email = "admin@gmail.com",
                        UpdatedAt = DateTime.Now
                    };
                    _context.ThietLapCuaHangs.Add(config);
                    await _context.SaveChangesAsync();
                }

                // Mask SMTP password
                var responseData = new ThietLapCuaHang
                {
                    Id = config.Id,
                    TenCuaHang = config.TenCuaHang,
                    LogoUrl = config.LogoUrl,
                    FaviconUrl = config.FaviconUrl,
                    SoDienThoai = config.SoDienThoai,
                    Email = config.Email,
                    DiaChi = config.DiaChi,
                    FacebookUrl = config.FacebookUrl,
                    Zalo = config.Zalo,
                    ChinhSachDoiTra = config.ChinhSachDoiTra,
                    ChinhSachBaoMat = config.ChinhSachBaoMat,
                    TiktokUrl = config.TiktokUrl,
                    InstagramUrl = config.InstagramUrl,
                    VietqrBankBin = config.VietqrBankBin,
                    VietqrAccountNo = config.VietqrAccountNo,
                    VietqrAccountName = config.VietqrAccountName,
                    BaoTriHeThong = config.BaoTriHeThong,
                    TuDongDuyetDon = config.TuDongDuyetDon,
                    ChoPhepDanhGia = config.ChoPhepDanhGia,
                    GuiEmailTuDong = config.GuiEmailTuDong,
                    LamTronTien = config.LamTronTien,
                    SmtpHost = config.SmtpHost,
                    SmtpPort = config.SmtpPort,
                    SmtpUser = config.SmtpUser,
                    SmtpPass = string.IsNullOrEmpty(config.SmtpPass) ? "" : "••••••••",
                    EmailNhanThongBao = config.EmailNhanThongBao,
                    NguongBaoHetHang = config.NguongBaoHetHang,
                    UpdatedAt = config.UpdatedAt
                };

                return Ok(new { success = true, data = responseData });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi getStoreSettings: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ!" });
            }
        }

        // 2. PUT: api/store-settings
        [HttpPut]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateStoreSettings(
            [FromForm] string? ten_cua_hang,
            [FromForm] string? so_dien_thoai,
            [FromForm] string? email,
            [FromForm] string? dia_chi,
            [FromForm] string? vietqr_bank_bin,
            [FromForm] string? vietqr_account_no,
            [FromForm] string? vietqr_account_name,
            [FromForm] bool? bao_tri_he_thong,
            [FromForm] bool? tu_dong_duyet_don,
            [FromForm] bool? cho_phep_danh_gia,
            [FromForm] bool? gui_email_tu_dong,
            [FromForm] bool? lam_tron_tien,
            [FromForm] string? facebook_url,
            [FromForm] string? tiktok_url,
            [FromForm] string? instagram_url,
            [FromForm] string? zalo,
            [FromForm] string? smtp_host,
            [FromForm] int? smtp_port,
            [FromForm] string? smtp_user,
            [FromForm] string? smtp_pass,
            [FromForm] string? email_nhan_thong_bao,
            [FromForm] int? nguong_bao_het_hang,
            IFormFile? logo)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                if (config == null)
                {
                    config = new ThietLapCuaHang { Id = 1, UpdatedAt = DateTime.Now };
                    _context.ThietLapCuaHangs.Add(config);
                }

                if (ten_cua_hang != null) config.TenCuaHang = ten_cua_hang;
                if (so_dien_thoai != null) config.SoDienThoai = so_dien_thoai;
                if (email != null) config.Email = email;
                if (dia_chi != null) config.DiaChi = dia_chi;
                if (vietqr_bank_bin != null) config.VietqrBankBin = vietqr_bank_bin;
                if (vietqr_account_no != null) config.VietqrAccountNo = vietqr_account_no;
                if (vietqr_account_name != null) config.VietqrAccountName = vietqr_account_name;
                if (bao_tri_he_thong.HasValue) config.BaoTriHeThong = bao_tri_he_thong;
                if (tu_dong_duyet_don.HasValue) config.TuDongDuyetDon = tu_dong_duyet_don;
                if (cho_phep_danh_gia.HasValue) config.ChoPhepDanhGia = cho_phep_danh_gia;
                if (gui_email_tu_dong.HasValue) config.GuiEmailTuDong = gui_email_tu_dong;
                if (lam_tron_tien.HasValue) config.LamTronTien = lam_tron_tien;
                if (facebook_url != null) config.FacebookUrl = facebook_url;
                if (tiktok_url != null) config.TiktokUrl = tiktok_url;
                if (instagram_url != null) config.InstagramUrl = instagram_url;
                if (zalo != null) config.Zalo = zalo;
                if (smtp_host != null) config.SmtpHost = smtp_host;
                if (smtp_port.HasValue) config.SmtpPort = smtp_port;
                if (smtp_user != null) config.SmtpUser = smtp_user;

                if (smtp_pass != null && smtp_pass != "••••••••")
                {
                    config.SmtpPass = smtp_pass;
                }

                if (email_nhan_thong_bao != null) config.EmailNhanThongBao = email_nhan_thong_bao;
                if (nguong_bao_het_hang.HasValue) config.NguongBaoHetHang = nguong_bao_het_hang;

                if (logo != null && logo.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(logo.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await logo.CopyToAsync(stream);
                    }

                    // Delete old logo
                    if (!string.IsNullOrEmpty(config.LogoUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), config.LogoUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            try
                            {
                                System.IO.File.Delete(oldFilePath);
                            }
                            catch { }
                        }
                    }

                    config.LogoUrl = $"/uploads/{uniqueFileName}";
                }

                config.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã lưu cấu hình!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi updateStoreSettings: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi khi lưu dữ liệu!" });
            }
        }

        // 3. POST: api/store-settings/test-email
        [HttpPost("test-email")]
        [Authorize]
        public async Task<IActionResult> TestEmailConfig()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { success = false, message = "Quyền truy cập bị từ chối!" });
                }

                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                if (config == null || string.IsNullOrEmpty(config.SmtpUser) || string.IsNullOrEmpty(config.SmtpPass))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Chưa cấu hình SMTP. Vui lòng điền đầy đủ thông tin SMTP trước!"
                    });
                }

                string host = config.SmtpHost ?? "smtp.gmail.com";
                int port = config.SmtpPort ?? 587;
                string user = config.SmtpUser;
                string pass = config.SmtpPass;

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    var secureOption = port == 465
                        ? MailKit.Security.SecureSocketOptions.SslOnConnect
                        : MailKit.Security.SecureSocketOptions.StartTls;

                    await client.ConnectAsync(host, port, secureOption);
                    await client.AuthenticateAsync(user, pass);

                    string toEmail = config.EmailNhanThongBao ?? config.SmtpUser;
                    string tenStore = config.TenCuaHang ?? "Store";

                    var message = new MimeMessage();
                    message.From.Add(new MailboxAddress(tenStore, user));
                    message.To.Add(new MailboxAddress("", toEmail));
                    message.Subject = "Test Email — Cấu hình SMTP thành công";

                    string html = $@"
                        <div style=""font-family:Arial,sans-serif;max-width:480px;padding:24px;border:1px solid #e5e7eb;border-radius:12px"">
                          <h2 style=""color:#2563eb;margin-bottom:8px"">Email test thành công!</h2>
                          <p style=""color:#374151"">Cấu hình SMTP của <b>{tenStore}</b> đang hoạt động tốt.</p>
                          <hr style=""border:none;border-top:1px solid #f3f4f6;margin:16px 0""/>
                          <p style=""color:#6b7280;font-size:12px"">Email này được gửi tự động từ trang Thiết lập cửa hàng.</p>
                        </div>
                    ";

                    message.Body = new TextPart("html") { Text = html };

                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);

                    return Ok(new
                    {
                        success = true,
                        message = $"Đã gửi email test đến {toEmail}. Vui lòng kiểm tra hộp thư!"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi test email: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = $"Kết nối SMTP thất bại: {ex.Message}"
                });
            }
        }
    }
}
