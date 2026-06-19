using System.Threading.Tasks;

namespace WebFashion.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendCustomEmailAsync(string toEmail, string subject, string htmlMessage);
        Task<bool> SendOrderConfirmationAsync(string email, string customerName, string maDonHang, string total, string paymentMethod, string address);
        Task<bool> SendNewOrderNotificationAsync(string customerName, string maDonHang, string total, string paymentMethod, string address);
        Task<bool> SendLowStockAlertAsync(string productName, string variantName, int remaining, int threshold);
    }
}
