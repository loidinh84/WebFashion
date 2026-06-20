using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
    [Route("api/donHang")]
    [ApiController]
    public class DonHangController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public DonHangController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        #region DTOs
        public class CreateOrderDto
        {
            [JsonPropertyName("tai_khoan_id")]
            public long TaiKhoanId { get; set; }

            [JsonPropertyName("dia_chi_id")]
            public long DiaChiId { get; set; }

            [JsonPropertyName("don_vi_vc_id")]
            public long? DonViVcId { get; set; }

            [JsonPropertyName("tong_tien_hang")]
            public decimal TongTienHang { get; set; }

            [JsonPropertyName("phi_van_chuyen")]
            public decimal PhiVanChuyen { get; set; }

            [JsonPropertyName("tien_giam_gia")]
            public decimal TienGiamGia { get; set; }

            [JsonPropertyName("tong_thanh_toan")]
            public decimal TongThanhToan { get; set; }

            [JsonPropertyName("ghi_chu")]
            public string? GhiChu { get; set; }

            [JsonPropertyName("phuong_thuc_tt")]
            public long PhuongThucTt { get; set; }

            [JsonPropertyName("items")]
            public List<OrderItemDto> Items { get; set; } = new();

            [JsonPropertyName("voucher_code")]
            public string? VoucherCode { get; set; }

            [JsonPropertyName("vat_info")]
            public VatInfoDto? VatInfo { get; set; }

            [JsonPropertyName("receive_email")]
            public bool? ReceiveEmail { get; set; }

            [JsonPropertyName("dung_diem")]
            public int? DungDiem { get; set; }
        }

        public class OrderItemDto
        {
            [JsonPropertyName("variantId")]
            public long VariantId { get; set; }

            [JsonPropertyName("so_luong")]
            public int SoLuong { get; set; }

            [JsonPropertyName("ten_san_pham")]
            public string TenSanPham { get; set; } = null!;

            [JsonPropertyName("sku")]
            public string? Sku { get; set; }

            [JsonPropertyName("gia_ban")]
            public decimal GiaBan { get; set; }

            [JsonPropertyName("dung_luong")]
            public string? DungLuong { get; set; }

            [JsonPropertyName("mau_sac")]
            public string? MauSac { get; set; }
        }

        public class VatInfoDto
        {
            [JsonPropertyName("ten_cong_ty")]
            public string? TenCongTy { get; set; }

            [JsonPropertyName("mst")]
            public string? Mst { get; set; }

            [JsonPropertyName("dia_chi_cty")]
            public string? DiaChiCty { get; set; }
        }

        public class CheckVoucherDto
        {
            [JsonPropertyName("code")]
            public string Code { get; set; } = null!;

            [JsonPropertyName("userId")]
            public long UserId { get; set; }

            [JsonPropertyName("totalAmount")]
            public decimal TotalAmount { get; set; }
        }
        #endregion

        #region Helpers
        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;

            text = text.Replace("đ", "d").Replace("Đ", "D");

            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        private string GenerateOrderCode(ThietLapCuaHang? config)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            string storeName = config?.TenCuaHang ?? "HD";

            string normalized = RemoveDiacritics(storeName);
            var regex = new Regex("[^a-zA-Z0-9]");
            string prefix = regex.Replace(normalized, "").ToUpper();
            if (prefix.Length > 8)
            {
                prefix = prefix.Substring(0, 8);
            }

            var random = new Random();
            var result = new StringBuilder($"{prefix}-");
            for (int i = 0; i < 6; i++)
            {
                result.Append(chars[random.Next(chars.Length)]);
            }
            return result.ToString();
        }
        #endregion

        // 1. TẠO ĐƠN HÀNG MỚI
        // POST: api/donHang/dat-hang
        [HttpPost("dat-hang")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDonHang([FromBody] CreateOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                KhuyenMai? voucherData = null;

                // --- KIỂM TRA VOUCHER ---
                if (!string.IsNullOrEmpty(dto.VoucherCode))
                {
                    voucherData = await _context.KhuyenMais
                        .FirstOrDefaultAsync(km => km.MaKhuyenMai == dto.VoucherCode && km.TrangThai == "active");
                    if (voucherData == null)
                        throw new Exception("Mã giảm giá không tồn tại hoặc đã hết hạn!");

                    var now = DateTime.Now;
                    if (now < voucherData.NgayBatDau || now > voucherData.NgayKetThuc)
                    {
                        throw new Exception("Mã giảm giá hiện không trong thời gian sử dụng!");
                    }

                    if (voucherData.DaSuDung >= (voucherData.SoLuongMa ?? 0))
                    {
                        throw new Exception("Mã giảm giá đã hết lượt sử dụng!");
                    }

                    var usageCount = await _context.LichSuDungVouchers
                        .CountAsync(l => l.TaiKhoanId == dto.TaiKhoanId && l.KhuyenMaiId == voucherData.Id);
                    if (usageCount > 0)
                    {
                        throw new Exception("Bạn đã sử dụng mã giảm giá này cho một đơn hàng trước đó!");
                    }
                }

                var config = await _context.ThietLapCuaHangs.FirstOrDefaultAsync(c => c.Id == 1);

                // Tạo mã đơn hàng tự động
                string maDonHang = GenerateOrderCode(config);

                decimal finalThanhToan = dto.TongThanhToan;
                if (config != null && config.LamTronTien == true)
                {
                    finalThanhToan = Math.Round(dto.TongThanhToan / 1000m) * 1000m;
                }

                var phuongThucDinhDanh = await _context.PhuongThucThanhToans.FindAsync(dto.PhuongThucTt);

                string initialStatus = "pending";
                if (config != null && config.TuDongDuyetDon == true && phuongThucDinhDanh != null && phuongThucDinhDanh.Loai == "cod")
                {
                    initialStatus = "confirmed";
                }

                // Lấy thông tin địa chỉ thật để snapshot
                var thongTinDiaChi = await _context.DiaChiGiaoHangs.FindAsync(dto.DiaChiId);
                if (thongTinDiaChi == null)
                {
                    throw new Exception("Không tìm thấy địa chỉ giao hàng!");
                }

                // Lưu vào bảng DonHang (cùng với snapshot địa chỉ)
                var newOrder = new DonHang
                {
                    MaDonHang = maDonHang,
                    TaiKhoanId = dto.TaiKhoanId,
                    DiaChiId = dto.DiaChiId,
                    DonViVcId = dto.DonViVcId,
                    TongTienHang = dto.TongTienHang,
                    PhiVanChuyen = dto.PhiVanChuyen,
                    TongThanhToan = finalThanhToan,
                    TienGiamGia = Math.Round(dto.TienGiamGia),
                    TrangThai = initialStatus,
                    GhiChu = dto.GhiChu ?? "",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    // Các cột snapshot
                    HoTenNguoiNhan = thongTinDiaChi.HoTenNguoiNhan,
                    SoDienThoai = thongTinDiaChi.SoDienThoai,
                    DiaChiCuThe = thongTinDiaChi.DiaChiCuThe,
                    TinhThanh = thongTinDiaChi.TinhThanh,
                    QuanHuyen = thongTinDiaChi.QuanHuyen,
                    PhuongXa = thongTinDiaChi.PhuongXa,
                    KhuyenMaiId = voucherData?.Id
                };

                _context.DonHangs.Add(newOrder);
                await _context.SaveChangesAsync(); // Lưu để sinh newOrder.Id

                var random = new Random();
                string maGiaoDich = $"GD-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{random.Next(100000, 1000000)}";

                var transLog = new GiaoDichThanhToan
                {
                    DonHangId = newOrder.Id,
                    PhuongThucId = dto.PhuongThucTt,
                    MaGiaoDich = maGiaoDich,
                    SoTien = finalThanhToan,
                    TrangThai = "pending"
                };
                _context.GiaoDichThanhToans.Add(transLog);

                if (voucherData != null)
                {
                    voucherData.DaSuDung += 1;
                    var voucherUsage = new LichSuDungVoucher
                    {
                        TaiKhoanId = dto.TaiKhoanId,
                        KhuyenMaiId = voucherData.Id,
                        DonHangId = newOrder.Id,
                        NgaySuDung = DateTime.Now
                    };
                    _context.LichSuDungVouchers.Add(voucherUsage);
                }

                // Xử lý từng sản phẩm: Kiểm tra kho + Trừ tồn kho
                foreach (var item in dto.Items)
                {
                    var bienThe = await _context.BienTheSanPhams.FindAsync(item.VariantId);
                    if (bienThe == null || bienThe.TonKho < item.SoLuong)
                    {
                        throw new Exception($"Sản phẩm {item.TenSanPham} đã hết hàng hoặc không đủ số lượng!");
                    }

                    int tonKhoCu = bienThe.TonKho;
                    int tonKhoMoi = tonKhoCu - item.SoLuong;

                    // Trừ kho
                    bienThe.TonKho = tonKhoMoi;

                    if (config != null && config.NguongBaoHetHang.HasValue)
                    {
                        if (tonKhoCu > config.NguongBaoHetHang.Value && tonKhoMoi <= config.NguongBaoHetHang.Value)
                        {
                            var variantName = $"{item.DungLuong ?? ""} {item.MauSac ?? ""}".Trim();
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await _emailService.SendLowStockAlertAsync(
                                        item.TenSanPham,
                                        variantName,
                                        tonKhoMoi,
                                        config.NguongBaoHetHang.Value
                                    );
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Lỗi gửi mail báo hết hàng: {ex.Message}");
                                }
                            });
                        }
                    }

                    var detail = new ChiTietDonHang
                    {
                        DonHangId = newOrder.Id,
                        BienTheId = item.VariantId,
                        TenSpLucMua = item.TenSanPham,
                        SkuLucMua = item.Sku ?? $"SKU-{item.VariantId}",
                        SoLuong = item.SoLuong,
                        DonGia = item.GiaBan,
                        ThanhTien = item.GiaBan * item.SoLuong
                    };
                    _context.ChiTietDonHangs.Add(detail);
                }

                // Nếu khách yêu cầu VAT, lưu vào bảng HoaDonDienTu
                if (dto.VatInfo != null && !string.IsNullOrEmpty(dto.VatInfo.TenCongTy))
                {
                    var vatInvoice = new HoaDonDienTu
                    {
                        DonHangId = newOrder.Id,
                        TenNguoiMua = dto.VatInfo.TenCongTy,
                        MaSoThue = dto.VatInfo.Mst,
                        DiaChiNguoiMua = dto.VatInfo.DiaChiCty,
                        TongTienChuaVat = dto.TongTienHang,
                        TienVat = dto.TongTienHang * 0.1m,
                        TongTienVat = dto.TongTienHang * 1.1m,
                        NgayXuat = DateTime.Now
                    };
                    _context.HoaDonDienTus.Add(vatInvoice);
                }

                if (dto.DungDiem.HasValue && dto.DungDiem.Value > 0)
                {
                    var userToUpdate = await _context.TaiKhoans.FindAsync(dto.TaiKhoanId);
                    if (userToUpdate == null)
                    {
                        throw new Exception("Không tìm thấy thông tin tài khoản!");
                    }
                    if ((userToUpdate.DiemTichLuy ?? 0) < dto.DungDiem.Value)
                    {
                        throw new Exception("Số dư điểm tích lũy không đủ!");
                    }
                    userToUpdate.DiemTichLuy = (userToUpdate.DiemTichLuy ?? 0) - dto.DungDiem.Value;
                    userToUpdate.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Tạo log lịch sử đầu tiên
                var log1 = new LichSuGiaoHang
                {
                    DonHangId = newOrder.Id,
                    TieuDe = "Đơn Hàng Đã Đặt",
                    MoTa = "Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được ghi nhận.",
                    ThoiGian = DateTimeOffset.UtcNow
                };
                _context.LichSuGiaoHangs.Add(log1);

                if (initialStatus == "confirmed")
                {
                    var log2 = new LichSuGiaoHang
                    {
                        DonHangId = newOrder.Id,
                        TieuDe = "Đã Xác Nhận Đơn Hàng",
                        MoTa = "Đơn hàng được tự động xác nhận, đang chuẩn bị hàng.",
                        ThoiGian = DateTimeOffset.UtcNow
                    };
                    _context.LichSuGiaoHangs.Add(log2);
                }
                await _context.SaveChangesAsync();

                var taiKhoan = await _context.TaiKhoans.FindAsync(dto.TaiKhoanId);
                if (taiKhoan != null)
                {
                    try
                    {
                        decimal tongChiTieuMoi = (taiKhoan.TongChiTieu ?? 0m) + finalThanhToan;
                        var hangMoi = await _context.TheThanhViens
                            .Where(m => m.MucChiTieuTu <= tongChiTieuMoi)
                            .OrderByDescending(m => m.MucChiTieuTu)
                            .FirstOrDefaultAsync();

                        taiKhoan.TongChiTieu = tongChiTieuMoi;
                        if (hangMoi != null)
                        {
                            taiKhoan.TheThanhVienId = hangMoi.Id;
                        }
                        taiKhoan.UpdatedAt = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Lỗi cập nhật thẻ thành viên: {ex.Message}");
                    }
                }

                if (config != null && config.GuiEmailTuDong == true)
                {
                    string currencyFormatted = finalThanhToan.ToString("C0", System.Globalization.CultureInfo.GetCultureInfo("vi-VN"));
                    string addressText = (dto.GhiChu ?? "").Contains("Địa chỉ:") ? dto.GhiChu : "Xem trong lịch sử đơn hàng";
                    string paymentMethodText = phuongThucDinhDanh?.Loai == "cod" ? "Tiền mặt (COD)" : "Chuyển khoản";
                    string customerName = taiKhoan?.HoTen ?? "Khách hàng";

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            if (taiKhoan != null && !string.IsNullOrEmpty(taiKhoan.Email))
                            {
                                await _emailService.SendOrderConfirmationAsync(
                                    taiKhoan.Email,
                                    customerName,
                                    maDonHang,
                                    currencyFormatted,
                                    paymentMethodText,
                                    addressText
                                );
                            }

                            await _emailService.SendNewOrderNotificationAsync(
                                customerName,
                                maDonHang,
                                currencyFormatted,
                                paymentMethodText,
                                addressText
                            );
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Lỗi gửi mail thông báo đơn hàng: {ex.Message}");
                        }
                    });
                }

                return StatusCode(201, new
                {
                    message = "Đặt hàng thành công!",
                    maDonHang = maDonHang
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Lỗi đặt hàng: {ex.Message}");
                return BadRequest(new { message = ex.Message ?? "Lỗi hệ thống khi tạo đơn hàng!" });
            }
        }

        // 2. KIỂM TRA MÃ GIẢM GIÁ (VOUCHER)
        // POST: api/donHang/check-voucher
        [HttpPost("check-voucher")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckVoucher([FromBody] CheckVoucherDto dto)
        {
            try
            {
                var voucher = await _context.KhuyenMais
                    .FirstOrDefaultAsync(km => km.MaKhuyenMai == dto.Code && km.TrangThai == "active");

                if (voucher == null)
                {
                    return NotFound(new { message = "Mã giảm giá không tồn tại!" });
                }

                var now = DateTime.Now;
                if (now < voucher.NgayBatDau || now > voucher.NgayKetThuc)
                {
                    return BadRequest(new { message = "Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng!" });
                }

                if (voucher.DaSuDung >= (voucher.SoLuongMa ?? 0))
                {
                    return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng!" });
                }

                if (dto.TotalAmount < voucher.DonHangToiThieu)
                {
                    return BadRequest(new { message = $"Đơn hàng tối thiểu phải từ {voucher.DonHangToiThieu}đ để dùng mã này!" });
                }

                var used = await _context.LichSuDungVouchers
                    .AnyAsync(l => l.TaiKhoanId == dto.UserId && l.KhuyenMaiId == voucher.Id);
                if (used)
                {
                    return BadRequest(new { message = "Bạn đã sử dụng mã này rồi!" });
                }

                return Ok(new
                {
                    message = "Áp dụng mã thành công!",
                    discount = new
                    {
                        id = voucher.Id,
                        loai = voucher.Loai,
                        gia_tri = voucher.GiaTri,
                        gia_tri_toi_da = voucher.GiaTriToiDa
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi check-voucher: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi kiểm tra voucher!" });
            }
        }

        // 3. ADMIN: LẤY DANH SÁCH ĐƠN HÀNG (PHÂN TRANG, TÌM KIẾM, LỌC)
        // GET: api/donHang
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAdminOrders([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? fromDate, [FromQuery] string? toDate)
        {
            try
            {
                var userRole = User.FindFirst("vai_tro")?.Value;
                if (userRole != "admin")
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var query = _context.DonHangs.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(o =>
                        EF.Functions.Like(o.MaDonHang, $"%{search}%") ||
                        (o.HoTenNguoiNhan != null && EF.Functions.Like(o.HoTenNguoiNhan, $"%{search}%")) ||
                        (o.DiaChi != null && EF.Functions.Like(o.DiaChi.HoTenNguoiNhan, $"%{search}%")) ||
                        (o.SoDienThoai != null && EF.Functions.Like(o.SoDienThoai, $"%{search}%")) ||
                        (o.DiaChi != null && EF.Functions.Like(o.DiaChi.SoDienThoai, $"%{search}%"))
                    );
                }

                if (!string.IsNullOrEmpty(status) && status != "all")
                {
                    query = query.Where(o => o.TrangThai == status);
                }

                if (!string.IsNullOrEmpty(fromDate))
                {
                    if (DateTime.TryParse(fromDate, out var fDate))
                    {
                        query = query.Where(o => o.CreatedAt >= fDate);
                    }
                }

                if (!string.IsNullOrEmpty(toDate))
                {
                    if (DateTime.TryParse(toDate, out var tDate))
                    {
                        var endDate = tDate.Date.AddDays(1).AddTicks(-1);
                        query = query.Where(o => o.CreatedAt <= endDate);
                    }
                }

                int pageNum = 1;
                if (Request.Query.ContainsKey("page") && int.TryParse(Request.Query["page"], out var p))
                {
                    pageNum = p;
                }

                int limitNum = 10;
                if (Request.Query.ContainsKey("limit") && int.TryParse(Request.Query["limit"], out var l))
                {
                    limitNum = l;
                }

                int offset = (pageNum - 1) * limitNum;

                int totalItems = await query.CountAsync();

                var orders = await query
                    .Include(o => o.DiaChi)
                    .Include(o => o.ChiTietDonHangs)
                    .Include(o => o.GiaoDichThanhToans)
                        .ThenInclude(gd => gd.PhuongThuc)
                    .Include(o => o.TaiKhoan)
                    .Include(o => o.LichSuGiaoHangs)
                    .Include(o => o.KhuyenMai)
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip(offset)
                    .Take(limitNum)
                    .ToListAsync();

                var formattedOrders = orders.Select(order =>
                {
                    var diaChi = order.DiaChi;
                    var nguoiMua = order.TaiKhoan;
                    var hoTen = order.HoTenNguoiNhan ?? diaChi?.HoTenNguoiNhan ?? nguoiMua?.HoTen ?? "Khách vãng lai";
                    var sdt = order.SoDienThoai ?? diaChi?.SoDienThoai ?? nguoiMua?.SoDienThoai ?? "Chưa cập nhật";
                    var diachiCuthe = order.DiaChiCuThe ?? diaChi?.DiaChiCuThe;
                    var phuongXa = order.PhuongXa ?? diaChi?.PhuongXa;
                    var quanHuyen = order.QuanHuyen ?? diaChi?.QuanHuyen;
                    var tinhThanh = order.TinhThanh ?? diaChi?.TinhThanh;

                    var giaoDich = order.GiaoDichThanhToans.FirstOrDefault();
                    var phuongThuc = giaoDich?.PhuongThuc;

                    var d = order.CreatedAt;
                    var dateStr = $"{d.Day:D2}/{d.Month:D2}/{d.Year} {d.Hour:D2}:{d.Minute:D2}";

                    var addressParts = new List<string?> { diachiCuthe, phuongXa, quanHuyen, tinhThanh };
                    var fullAddress = string.Join(", ", addressParts.Where(x => !string.IsNullOrEmpty(x)));

                    string paymentStatus = (giaoDich?.TrangThai == "success" || new[] { "delivered", "completed" }.Contains(order.TrangThai))
                        ? "Đã thanh toán"
                        : "Chưa thanh toán";

                    return new
                    {
                        id = order.MaDonHang,
                        customerName = hoTen,
                        phone = sdt,
                        address = string.IsNullOrEmpty(fullAddress) ? "Chưa cập nhật" : fullAddress,
                        date = dateStr,
                        total = (double)order.TongThanhToan,
                        shippingFee = (double)order.PhiVanChuyen,
                        discount = (double)order.TienGiamGia,
                        voucherCode = order.KhuyenMai?.MaKhuyenMai,
                        subTotal = (double)order.TongTienHang,
                        note = order.GhiChu,
                        paymentMethod = phuongThuc?.TenPhuongThuc ?? "COD",
                        paymentStatus = paymentStatus,
                        orderStatus = order.TrangThai,
                        lichSu = order.LichSuGiaoHangs
                            .OrderByDescending(ls => ls.ThoiGian)
                            .Select(ls => new
                            {
                                id = ls.Id,
                                tieuDe = ls.TieuDe,
                                moTa = ls.MoTa,
                                thoiGian = ls.ThoiGian.HasValue
                                    ? $"{ls.ThoiGian.Value.LocalDateTime.Day:D2}/{ls.ThoiGian.Value.LocalDateTime.Month:D2}/{ls.ThoiGian.Value.LocalDateTime.Year} {ls.ThoiGian.Value.LocalDateTime.Hour:D2}:{ls.ThoiGian.Value.LocalDateTime.Minute:D2}"
                                    : ""
                            })
                            .ToList(),
                        items = order.ChiTietDonHangs.Select(item => new
                        {
                            name = item.TenSpLucMua,
                            variant = item.SkuLucMua,
                            qty = item.SoLuong,
                            price = (double)item.DonGia
                        }).ToList()
                    };
                }).ToList();

                return Ok(new
                {
                    orders = formattedOrders,
                    currentPage = pageNum,
                    totalPages = (int)Math.Ceiling((double)totalItems / limitNum),
                    totalItems = totalItems
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi lấy đơn hàng Admin: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy đơn hàng" });
            }
        }

        // 4. ADMIN: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
        // PUT: api/donHang/{id}/status
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] JsonElement body)
        {
            try
            {
                var userRole = User.FindFirst("vai_tro")?.Value;
                if (userRole != "admin")
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                if (!body.TryGetProperty("trang_thai", out var statusProp))
                {
                    return BadRequest(new { message = "Thiếu trạng thái cập nhật!" });
                }
                string trang_thai = statusProp.GetString() ?? "";

                var donHang = await _context.DonHangs.FirstOrDefaultAsync(o => o.MaDonHang == id);
                if (donHang == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng này!" });
                }

                if (donHang.TrangThai == "cancelled" || donHang.TrangThai == "delivered")
                {
                    return BadRequest(new { message = "Đơn hàng đã đóng, không thể thay đổi trạng thái!" });
                }

                if (trang_thai == "cancelled")
                {
                    if (donHang.TrangThai == "shipping")
                    {
                        return BadRequest(new { message = "Đơn hàng đã được giao cho Shipper, không thể hủy!" });
                    }
                }

                donHang.TrangThai = trang_thai;
                donHang.UpdatedAt = DateTime.Now;

                // Cập nhật trạng thái giao dịch thanh toán
                if (trang_thai == "confirmed" || trang_thai == "delivered")
                {
                    var giaoDich = await _context.GiaoDichThanhToans.FirstOrDefaultAsync(g => g.DonHangId == donHang.Id);
                    if (giaoDich != null)
                    {
                        giaoDich.TrangThai = "success";
                        giaoDich.ThoiGianThanhToan = DateTime.Now;
                    }
                }

                // Tự động tạo log lịch sử giao hàng
                var statusLogs = new Dictionary<string, (string TieuDe, string MoTa)>
                {
                    { "confirmed", ("Đã Xác Nhận Đơn Hàng", "Người bán đã xác nhận và đang chuẩn bị hàng") },
                    { "shipping", ("Đã Giao Cho ĐVVC", "Đơn hàng đã được bàn giao cho đơn vị vận chuyển") },
                    { "delivered", ("Giao Hàng Thành Công", "Khách hàng đã nhận được hàng") },
                    { "cancelled", ("Đơn Hàng Đã Hủy", "Đơn hàng đã bị hủy") },
                    { "refunded", ("Hoàn Tiền Đã Xử Lý", "Tiền đã được hoàn lại cho khách hàng") }
                };

                if (statusLogs.TryGetValue(trang_thai, out var logInfo))
                {
                    var newLog = new LichSuGiaoHang
                    {
                        DonHangId = donHang.Id,
                        TieuDe = logInfo.TieuDe,
                        MoTa = logInfo.MoTa,
                        ThoiGian = DateTimeOffset.UtcNow
                    };
                    _context.LichSuGiaoHangs.Add(newLog);
                }

                if (trang_thai == "delivered")
                {
                    var orderInfo = await _context.DonHangs
                        .Include(o => o.TaiKhoan)
                            .ThenInclude(t => t.TheThanhVien)
                        .FirstOrDefaultAsync(o => o.Id == donHang.Id);

                    if (orderInfo != null && orderInfo.TaiKhoan != null)
                    {
                        var basePoints = (int)Math.Floor(orderInfo.TongThanhToan / 1000m);
                        var bonusRate = orderInfo.TaiKhoan.TheThanhVien?.DiemThuongThem ?? 0;
                        var totalBonusPoints = (int)Math.Round(basePoints * (1.0 + bonusRate / 100.0));

                        orderInfo.TaiKhoan.DiemTichLuy = (orderInfo.TaiKhoan.DiemTichLuy ?? 0) + totalBonusPoints;
                        Console.WriteLine($"Đã cộng {totalBonusPoints} điểm cho khách hàng {orderInfo.TaiKhoan.Id}");
                    }

                    // Tăng lượt mua cho từng sản phẩm trong đơn hàng
                    try
                    {
                        var chiTietDonHang = await _context.ChiTietDonHangs
                            .Where(ct => ct.DonHangId == donHang.Id)
                            .Include(ct => ct.BienThe)
                            .ToListAsync();

                        var luotMuaMap = new Dictionary<long, int>();
                        foreach (var ct in chiTietDonHang)
                        {
                            if (ct.BienThe != null)
                            {
                                long sanPhamId = ct.BienThe.SanPhamId;
                                if (luotMuaMap.ContainsKey(sanPhamId))
                                {
                                    luotMuaMap[sanPhamId] += ct.SoLuong;
                                }
                                else
                                {
                                    luotMuaMap[sanPhamId] = ct.SoLuong;
                                }
                            }
                        }

                        foreach (var pair in luotMuaMap)
                        {
                            var sp = await _context.SanPhams.FindAsync(pair.Key);
                            if (sp != null)
                            {
                                sp.LuotMua += pair.Value;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Lỗi cập nhật lượt mua: {ex.Message}");
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật trạng thái thành công!",
                    data = donHang
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi cập nhật trạng thái: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật trạng thái!" });
            }
        }

        // 5. ADMIN: THÊM HÀNH TRÌNH VẬN CHUYỂN
        // POST: api/donHang/{id}/tracking
        [HttpPost("{id}/tracking")]
        [Authorize]
        public async Task<IActionResult> AddTrackingLog(string id, [FromBody] JsonElement body)
        {
            try
            {
                var userRole = User.FindFirst("vai_tro")?.Value;
                if (userRole != "admin")
                {
                    return StatusCode(403, new { message = "Quyền truy cập bị từ chối!" });
                }

                var donHang = await _context.DonHangs.FirstOrDefaultAsync(o => o.MaDonHang == id);
                if (donHang == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng!" });
                }

                string? tieu_de = body.TryGetProperty("tieu_de", out var tProp) ? tProp.GetString() : null;
                string? mo_ta = body.TryGetProperty("mo_ta", out var mProp) ? mProp.GetString() : null;

                decimal? lat = null;
                if (body.TryGetProperty("lat", out var latProp))
                {
                    if (latProp.ValueKind == JsonValueKind.Number)
                    {
                        lat = latProp.GetDecimal();
                    }
                    else if (latProp.ValueKind == JsonValueKind.String && decimal.TryParse(latProp.GetString(), out var latVal))
                    {
                        lat = latVal;
                    }
                }

                decimal? lng = null;
                if (body.TryGetProperty("lng", out var lngProp))
                {
                    if (lngProp.ValueKind == JsonValueKind.Number)
                    {
                        lng = lngProp.GetDecimal();
                    }
                    else if (lngProp.ValueKind == JsonValueKind.String && decimal.TryParse(lngProp.GetString(), out var lngVal))
                    {
                        lng = lngVal;
                    }
                }

                var log = new LichSuGiaoHang
                {
                    DonHangId = donHang.Id,
                    TieuDe = tieu_de,
                    MoTa = mo_ta,
                    Lat = lat,
                    Lng = lng,
                    ThoiGian = DateTimeOffset.UtcNow
                };

                _context.LichSuGiaoHangs.Add(log);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Thêm tracking thành công!", data = log });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi thêm tracking log: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server!" });
            }
        }
    }
}
