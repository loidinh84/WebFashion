using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MailKit.Net.Smtp;
using MimeKit;
using WebFashion.Api.Models;

namespace WebFashion.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly AppDbContext _context;

        public EmailService(AppDbContext context)
        {
            _context = context;
        }

        private async Task<(string storeName, string senderEmail, string host, int port, string user, string pass)> GetMailConfigAsync()
        {
            var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
            if (config == null || string.IsNullOrEmpty(config.SmtpUser) || string.IsNullOrEmpty(config.SmtpPass))
            {
                throw new Exception("Admin chưa cấu hình SMTP trong hệ thống!");
            }

            return (
                config.TenCuaHang ?? "WebFashion",
                config.SmtpUser,
                config.SmtpHost ?? "smtp.gmail.com",
                config.SmtpPort ?? 587,
                config.SmtpUser,
                config.SmtpPass
            );
        }

        public async Task<bool> SendCustomEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            try
            {
                var cfg = await GetMailConfigAsync();
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(cfg.storeName, cfg.senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = htmlMessage };

                using (var client = new SmtpClient())
                {
                    var secureOption = cfg.port == 465 
                        ? MailKit.Security.SecureSocketOptions.SslOnConnect 
                        : MailKit.Security.SecureSocketOptions.StartTls;

                    await client.ConnectAsync(cfg.host, cfg.port, secureOption);
                    await client.AuthenticateAsync(cfg.user, cfg.pass);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Error]: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendOrderConfirmationAsync(string email, string customerName, string maDonHang, string total, string paymentMethod, string address)
        {
            try
            {
                var cfg = await GetMailConfigAsync();
                var subject = $"Xác nhận đơn hàng #{maDonHang} — {cfg.storeName}";
                var html = $@"
                    <div style=""font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"">
                      <div style=""background:#2563eb;padding:24px 28px"">
                        <h1 style=""color:#fff;margin:0;font-size:20px"">{cfg.storeName}</h1>
                      </div>
                      <div style=""padding:28px"">
                        <h2 style=""color:#111827;margin-top:0"">Cảm ơn bạn đã đặt hàng!</h2>
                        <p style=""color:#374151"">Xin chào <b>{customerName}</b>,</p>
                        <p style=""color:#374151"">Đơn hàng <b style=""color:#2563eb"">#{maDonHang}</b> của bạn đã được tiếp nhận thành công.</p>

                        <div style=""background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0"">
                          <table style=""width:100%;font-size:14px;color:#374151;border-collapse:collapse"">
                            <tr><td style=""padding:6px 0;color:#6b7280"">Tổng thanh toán:</td><td style=""text-align:right;font-weight:700;color:#dc2626"">{total}</td></tr>
                            <tr><td style=""padding:6px 0;color:#6b7280"">Phương thức:</td><td style=""text-align:right"">{paymentMethod}</td></tr>
                            <tr><td style=""padding:6px 0;color:#6b7280;vertical-align:top"">Địa chỉ giao:</td><td style=""text-align:right"">{address}</td></tr>
                          </table>
                        </div>

                        <p style=""color:#374151"">Nhân viên <b>{cfg.storeName}</b> sẽ sớm liên hệ để xác nhận đơn hàng.</p>
                        <p style=""color:#6b7280;font-size:13px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px"">
                          Email này được gửi tự động, vui lòng không trả lời trực tiếp.
                        </p>
                      </div>
                    </div>
                ";

                return await SendCustomEmailAsync(email, subject, html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Confirmation Error]: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendNewOrderNotificationAsync(string customerName, string maDonHang, string total, string paymentMethod, string address)
        {
            try
            {
                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                var adminEmail = config?.EmailNhanThongBao;
                if (string.IsNullOrEmpty(adminEmail)) return false;

                var cfg = await GetMailConfigAsync();
                var subject = $"Đơn hàng mới #{maDonHang}";
                var html = $@"
                    <div style=""font-family:Arial,sans-serif;max-width:480px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"">
                      <div style=""background:#059669;padding:16px 20px"">
                        <h2 style=""color:#fff;margin:0;font-size:16px"">Có đơn hàng mới!</h2>
                      </div>
                      <div style=""padding:20px;font-size:14px;color:#374151"">
                        <p>Mã đơn: <b style=""color:#2563eb"">#{maDonHang}</b></p>
                        <p>Khách hàng: <b>{customerName}</b></p>
                        <p>Tổng tiền: <b style=""color:#dc2626"">{total}</b></p>
                        <p>Phương thức: {paymentMethod}</p>
                      </div>
                    </div>
                ";

                return await SendCustomEmailAsync(adminEmail, subject, html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Admin Notification Error]: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendLowStockAlertAsync(string productName, string variantName, int remaining, int threshold)
        {
            try
            {
                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);
                var adminEmail = config?.EmailNhanThongBao;
                if (string.IsNullOrEmpty(adminEmail)) return false;

                var cfg = await GetMailConfigAsync();
                var subject = $"[CẢNH BÁO KHO] Sản phẩm sắp hết hàng - {productName}";
                var html = $@"
                    <div style=""font-family:Arial,sans-serif;max-width:480px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"">
                      <div style=""background:#dc2626;padding:16px 20px"">
                        <h2 style=""color:#fff;margin:0;font-size:16px"">Báo động sắp hết hàng!</h2>
                      </div>
                      <div style=""padding:20px;font-size:14px;color:#374151"">
                        <p>Hệ thống ghi nhận sản phẩm dưới đây vừa chạm ngưỡng báo động:</p>
                        <div style=""background:#fef2f2;border:1px solid #f87171;border-radius:8px;padding:16px;margin:16px 0"">
                          <p style=""margin:0 0 8px 0"">Sản phẩm: <b>{productName}</b></p>
                          {(string.IsNullOrEmpty(variantName) ? "" : $"<p style=\"margin:0 0 8px 0\">Phân loại: <b>{variantName}</b></p>")}
                          <p style=""margin:0"">Tồn kho hiện tại: <b style=""color:#dc2626;font-size:18px"">{remaining}</b> (Ngưỡng: {threshold})</p>
                        </div>
                        <p>Vui lòng kiểm tra và nhập thêm hàng để không làm gián đoạn việc kinh doanh.</p>
                      </div>
                    </div>
                ";

                return await SendCustomEmailAsync(adminEmail, subject, html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Low Stock Error]: {ex.Message}");
                return false;
            }
        }
    }
}
