using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using WebFashion.Api.Models;
using WebFashion.Api.Services;

namespace WebFashion.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaiKhoanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public TaiKhoanController(AppDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        private string GenerateJwtToken(Models.TaiKhoan user, bool rememberMe, string purpose = "auth")
        {
            var jwtSecret = _configuration["Jwt:Secret"] ?? "ma_bao_mat";
            var key = Encoding.UTF8.GetBytes(jwtSecret);
            var tokenHandler = new JwtSecurityTokenHandler();

            var claimsList = new List<Claim>
            {
                new Claim("id", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("vai_tro", user.VaiTro)
            };

            if (purpose == "reset-password")
            {
                claimsList.Add(new Claim("purpose", "reset-password"));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claimsList),
                Expires = DateTime.UtcNow.Add(purpose == "reset-password" ? TimeSpan.FromMinutes(15) : (rememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromDays(1))),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // GET: api/taiKhoan
        [HttpGet]
        public async Task<IActionResult> GetAllTaiKhoan()
        {
            try
            {
                var list = await _context.TaiKhoans.ToListAsync();
                return Ok(list);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi lấy danh sách" });
            }
        }

        // GET: api/taiKhoan/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(long id)
        {
            try
            {
                var user = await _context.TaiKhoans
                    .Select(u => new
                    {
                        id = u.Id,
                        ho_ten = u.HoTen,
                        email = u.Email,
                        so_dien_thoai = u.SoDienThoai,
                        anh_dai_dien = u.AnhDaiDien,
                        vai_tro = u.VaiTro,
                        trang_thai = u.TrangThai,
                        ngay_sinh = u.NgaySinh,
                        gioi_tinh = u.GioiTinh,
                        created_at = u.CreatedAt,
                        updated_at = u.UpdatedAt,
                        the_thanh_vien_id = u.TheThanhVienId,
                        tong_chi_tieu = u.TongChiTieu,
                        diem_tich_luy = u.DiemTichLuy
                    })
                    .FirstOrDefaultAsync(u => u.id == id);

                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy!" });
                }

                return Ok(user);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        // GET: api/taiKhoan/dashboard/{id}
        [HttpGet("dashboard/{id}")]
        public async Task<IActionResult> GetUserFullDashboard(long id)
        {
            try
            {
                var user = await _context.TaiKhoans
                    .Include(u => u.TheThanhVien)
                    .Select(u => new
                    {
                        id = u.Id,
                        ho_ten = u.HoTen,
                        email = u.Email,
                        so_dien_thoai = u.SoDienThoai,
                        anh_dai_dien = u.AnhDaiDien,
                        vai_tro = u.VaiTro,
                        trang_thai = u.TrangThai,
                        ngay_sinh = u.NgaySinh,
                        gioi_tinh = u.GioiTinh,
                        created_at = u.CreatedAt,
                        updated_at = u.UpdatedAt,
                        the_thanh_vien_id = u.TheThanhVienId,
                        tong_chi_tieu = u.TongChiTieu,
                        diem_tich_luy = u.DiemTichLuy,
                        hang_thanh_vien = u.TheThanhVien != null ? new
                        {
                            id = u.TheThanhVien.Id,
                            ten_hang = u.TheThanhVien.TenHang,
                            muc_chi_tieu_tu = u.TheThanhVien.MucChiTieuTu,
                            muc_chi_tieu_den = u.TheThanhVien.MucChiTieuDen,
                            ty_le_giam_gia = u.TheThanhVien.TyLeGiamGia,
                            diem_thuong_them = u.TheThanhVien.DiemThuongThem,
                            mau_the = u.TheThanhVien.MauThe,
                            mo_ta_quyen_loi = u.TheThanhVien.MoTaQuyenLoi
                        } : null
                    })
                    .FirstOrDefaultAsync(u => u.id == id);

                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng!" });
                }

                var allOrders = await _context.DonHangs
                    .Where(o => o.TaiKhoanId == id)
                    .Include(o => o.ChiTietDonHangs)
                        .ThenInclude(ct => ct.BienThe)
                            .ThenInclude(bt => bt.SanPham)
                                .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .Include(o => o.DanhGiaSanPhams)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();

                var allMemberships = await _context.TheThanhViens
                    .OrderBy(m => m.MucChiTieuTu)
                    .Select(m => new
                    {
                        id = m.Id,
                        ten_hang = m.TenHang,
                        muc_chi_tieu_tu = m.MucChiTieuTu,
                        muc_chi_tieu_den = m.MucChiTieuDen,
                        ty_le_giam_gia = m.TyLeGiamGia,
                        diem_thuong_them = m.DiemThuongThem,
                        mau_the = m.MauThe,
                        mo_ta_quyen_loi = m.MoTaQuyenLoi
                    })
                    .ToListAsync();

                var mappedOrders = allOrders.Select(o => new
                {
                    id = o.Id,
                    ma_don_hang = o.MaDonHang,
                    tai_khoan_id = o.TaiKhoanId,
                    dia_chi_id = o.DiaChiId,
                    don_vi_vc_id = o.DonViVcId,
                    phi_van_chuyen = o.PhiVanChuyen,
                    tien_giam_gia = o.TienGiamGia,
                    tong_tien_hang = o.TongTienHang,
                    tong_thanh_toan = o.TongThanhToan,
                    trang_thai = o.TrangThai,
                    ghi_chu = o.GhiChu,
                    created_at = o.CreatedAt,
                    updated_at = o.UpdatedAt,
                    chi_tiet = o.ChiTietDonHangs.Select(ct => new
                    {
                        id = ct.Id,
                        don_hang_id = ct.DonHangId,
                        bien_the_id = ct.BienTheId,
                        ten_sp_luc_mua = ct.TenSpLucMua,
                        sku_luc_mua = ct.SkuLucMua,
                        so_luong = ct.SoLuong,
                        don_gia = ct.DonGia,
                        thanh_tien = ct.ThanhTien,
                        bien_the = ct.BienThe != null ? new
                        {
                            id = ct.BienThe.Id,
                            mau_sac = ct.BienThe.MauSac,
                            dung_luong = ct.BienThe.DungLuong,
                            ram = ct.BienThe.Ram,
                            gia_ban = ct.BienThe.GiaBan,
                            san_pham_id = ct.BienThe.SanPhamId,
                            san_pham = ct.BienThe.SanPham != null ? new
                            {
                                id = ct.BienThe.SanPham.Id,
                                ten_san_pham = ct.BienThe.SanPham.TenSanPham,
                                hinh_anh = ct.BienThe.SanPham.HinhAnhSanPhams.Select(img => new
                                {
                                    id = img.Id,
                                    url_anh = img.UrlAnh,
                                    la_anh_chinh = img.LaAnhChinh
                                }).ToList()
                            } : null
                        } : null
                    }).ToList(),
                    danh_gia = o.DanhGiaSanPhams.Select(dg => new
                    {
                        id = dg.Id,
                        so_sao = dg.SoSao,
                        noi_dung = dg.NoiDung
                    }).ToList()
                }).ToList();

                return Ok(new
                {
                    userInfo = user,
                    orderCount = mappedOrders.Count,
                    allOrders = mappedOrders,
                    allMemberships = allMemberships
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi lấy dữ liệu dashboard" });
            }
        }

        // POST: api/taiKhoan
        [HttpPost]
        public async Task<IActionResult> CreateTaiKhoan([FromBody] Models.TaiKhoan registerDto)
        {
            try
            {
                if (string.IsNullOrEmpty(registerDto.Email) || string.IsNullOrEmpty(registerDto.MatKhau))
                {
                    return BadRequest(new { message = "Thiếu thông tin đăng ký!" });
                }

                // Check unique email
                var emailExists = await _context.TaiKhoans.AnyAsync(u => u.Email == registerDto.Email);
                if (emailExists)
                {
                    return BadRequest(new { message = "Email này đã được sử dụng!" });
                }

                // Check unique phone
                if (!string.IsNullOrEmpty(registerDto.SoDienThoai))
                {
                    var phoneExists = await _context.TaiKhoans.AnyAsync(u => u.SoDienThoai == registerDto.SoDienThoai);
                    if (phoneExists)
                    {
                        return BadRequest(new { message = "Số điện thoại này đã được sử dụng!" });
                    }
                }

                // Hash password
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.MatKhau, 10);

                // Find default membership
                var defaultTier = await _context.TheThanhViens
                    .OrderBy(m => m.MucChiTieuTu)
                    .FirstOrDefaultAsync();

                if (defaultTier == null)
                {
                    return StatusCode(500, new { message = "Hệ thống chưa thiết lập hạng thẻ thành viên!" });
                }

                var newAccount = new Models.TaiKhoan
                {
                    HoTen = registerDto.HoTen,
                    Email = registerDto.Email,
                    MatKhau = hashedPassword,
                    SoDienThoai = registerDto.SoDienThoai,
                    TheThanhVienId = defaultTier.Id,
                    TongChiTieu = 0m,
                    DiemTichLuy = 0,
                    VaiTro = "customer",
                    TrangThai = "active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.TaiKhoans.Add(newAccount);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProfile), new { id = newAccount.Id }, new { message = "Tạo tài khoản thành công!", data = newAccount });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi khi tạo tài khoản!" });
            }
        }

        // POST: api/taiKhoan/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] JsonElement body)
        {
            try
            {
                string? email = body.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                string? matKhau = body.TryGetProperty("mat_khau", out var pwdProp) ? pwdProp.GetString() : null;
                bool rememberMe = body.TryGetProperty("rememberMe", out var rmProp) && rmProp.GetBoolean();

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(matKhau))
                {
                    return BadRequest(new { message = "Vui lòng cung cấp email/sđt và mật khẩu!" });
                }

                var user = await _context.TaiKhoans
                    .Include(u => u.TheThanhVien)
                    .FirstOrDefaultAsync(u => u.Email == email || u.SoDienThoai == email);

                if (user == null)
                {
                    return NotFound(new { message = "Email hoặc số điện thoại không tồn tại!" });
                }

                if (user.TrangThai == "banned")
                {
                    return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý để biết thêm chi tiết!" });
                }

                bool isMatch = BCrypt.Net.BCrypt.Verify(matKhau, user.MatKhau);
                if (!isMatch)
                {
                    return BadRequest(new { message = "Mật khẩu không chính xác!" });
                }

                var token = GenerateJwtToken(user, rememberMe);

                return Ok(new
                {
                    message = "Đăng nhập thành công!",
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        ho_ten = user.HoTen,
                        email = user.Email,
                        vai_tro = user.VaiTro,
                        so_dien_thoai = user.SoDienThoai,
                        anh_dai_dien = user.AnhDaiDien,
                        diem_tich_luy = user.DiemTichLuy ?? 0,
                        mau_the = user.TheThanhVien?.MauThe ?? "#9ca3af",
                        ty_le_giam_gia = user.TheThanhVien?.TyLeGiamGia ?? 0m,
                        ten_hang = user.TheThanhVien?.TenHang
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server khi đăng nhập!" });
            }
        }

        // POST: api/taiKhoan/google
        [HttpPost("google")]
        public async Task<IActionResult> LoginWithGoogle([FromBody] JsonElement body)
        {
            try
            {
                string? email = body.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                string? hoTen = body.TryGetProperty("ho_ten", out var nameProp) ? nameProp.GetString() : null;
                string? anhDaiDien = body.TryGetProperty("anh_dai_dien", out var imgProp) ? imgProp.GetString() : null;
                bool rememberMe = body.TryGetProperty("rememberMe", out var rmProp) && rmProp.GetBoolean();

                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Email Google không hợp lệ!" });
                }

                var user = await _context.TaiKhoans
                    .Include(u => u.TheThanhVien)
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    var defaultTier = await _context.TheThanhViens
                        .OrderBy(m => m.MucChiTieuTu)
                        .FirstOrDefaultAsync();

                    user = new Models.TaiKhoan
                    {
                        HoTen = hoTen ?? "Google User",
                        Email = email,
                        MatKhau = "GOOGLE_AUTH_NO_PASSWORD",
                        AnhDaiDien = anhDaiDien,
                        VaiTro = "customer",
                        TrangThai = "active",
                        TheThanhVienId = defaultTier?.Id,
                        TongChiTieu = 0m,
                        DiemTichLuy = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.TaiKhoans.Add(user);
                    await _context.SaveChangesAsync();
                }

                if (user.TrangThai == "banned")
                {
                    return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa!" });
                }

                var token = GenerateJwtToken(user, rememberMe);

                return Ok(new
                {
                    message = "Đăng nhập Google thành công!",
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        ho_ten = user.HoTen,
                        email = user.Email,
                        vai_tro = user.VaiTro,
                        anh_dai_dien = user.AnhDaiDien,
                        so_dien_thoai = user.SoDienThoai,
                        diem_tich_luy = user.DiemTichLuy ?? 0,
                        mau_the = user.TheThanhVien?.MauThe ?? "#9ca3af",
                        ty_le_giam_gia = user.TheThanhVien?.TyLeGiamGia ?? 0m,
                        ten_hang = user.TheThanhVien?.TenHang
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi đăng nhập Google!" });
            }
        }

        // POST: api/taiKhoan/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] JsonElement body)
        {
            try
            {
                string? email = body.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Vui lòng nhập địa chỉ email!" });
                }

                var user = await _context.TaiKhoans.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    return NotFound(new { message = "Email này chưa được đăng ký trong hệ thống!" });
                }

                if (user.TrangThai == "banned" || user.TrangThai == "deleted")
                {
                    return StatusCode(403, new { message = "Tài khoản này đã bị khóa hoặc bị hủy!" });
                }

                var resetToken = GenerateJwtToken(user, false, "reset-password");
                var origin = Request.Headers.Origin.FirstOrDefault() ?? "http://localhost:5173";
                var resetLink = $"{origin}/reset-password?token={resetToken}";

                var thietLap = await _context.ThietLapCuaHangs.FirstOrDefaultAsync();
                var tenCuaHang = thietLap?.TenCuaHang ?? "WebFashion";

                var subject = $"Khôi phục mật khẩu tài khoản của bạn — {tenCuaHang}";
                var htmlMessage = $@"
                  <div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);"">
                    <div style=""height: 4px; background-color: #dc2626;""></div>
                    <div style=""padding: 40px 35px;"">
                      <div style=""margin-bottom: 30px; text-align: center;"">
                        <h2 style=""color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;"">
                          {tenCuaHang}
                        </h2>
                      </div>

                      <h3 style=""color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; text-align: center;"">
                        Yêu cầu Đặt lại Mật khẩu
                      </h3>

                      <p style=""color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;"">
                        Xin chào <b>{user.HoTen}</b>,
                      </p>
                      <p style=""color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;"">
                        Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới.
                      </p>
                      
                      <div style=""text-align: center; margin: 30px 0;"">
                        <a href=""{resetLink}"" style=""background-color: #1446bdff; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px; display: inline-block;"">
                          Đặt lại mật khẩu
                        </a>
                      </div>

                      <div style=""color: #475569; font-size: 13px; line-height: 1.5; padding: 15px; background-color: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px; margin-top: 30px;"">
                        <b>Lưu ý bảo mật:</b> Liên kết này chỉ có hiệu lực trong vòng <b>15 phút</b>. Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email này, mật khẩu của bạn sẽ được giữ nguyên an toàn.
                      </div>

                      <div style=""color: #94a3b8; font-size: 13px; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; line-height: 1.5;"">
                        Trân trọng,<br>
                        <span style=""color: #64748b; font-weight: 600;"">Đội ngũ hỗ trợ {tenCuaHang}</span>
                      </div>
                    </div>
                  </div>
                ";

                await _emailService.SendCustomEmailAsync(user.Email, subject, htmlMessage);

                return Ok(new { success = true, message = "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi hệ thống khi gửi email khôi phục!" });
            }
        }

        // POST: api/taiKhoan/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] JsonElement body)
        {
            try
            {
                string? token = body.TryGetProperty("token", out var tokProp) ? tokProp.GetString() : null;
                string? newPassword = body.TryGetProperty("newPassword", out var pwdProp) ? pwdProp.GetString() : null;

                if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(newPassword))
                {
                    return BadRequest(new { message = "Thiếu thông tin yêu cầu!" });
                }

                if (newPassword.Length < 6)
                {
                    return BadRequest(new { message = "Mật khẩu mới phải chứa ít nhất 6 ký tự!" });
                }

                ClaimsPrincipal principal;
                try
                {
                    var jwtSecret = _configuration["Jwt:Secret"] ?? "ma_bao_mat";
                    var key = Encoding.UTF8.GetBytes(jwtSecret);
                    var tokenHandler = new JwtSecurityTokenHandler();
                    
                    principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ClockSkew = TimeSpan.Zero
                    }, out SecurityToken validatedToken);
                }
                catch (Exception)
                {
                    return BadRequest(new { message = "Liên kết khôi phục đã hết hạn hoặc không hợp lệ!" });
                }

                var purposeClaim = principal.FindFirst("purpose")?.Value;
                if (purposeClaim != "reset-password")
                {
                    return BadRequest(new { message = "Token không đúng mục đích khôi phục!" });
                }

                var userIdStr = principal.FindFirst("id")?.Value;
                if (!long.TryParse(userIdStr, out long userId))
                {
                    return BadRequest(new { message = "Token không chứa ID người dùng hợp lệ!" });
                }

                var user = await _context.TaiKhoans.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "Tài khoản không tồn tại!" });
                }

                if (user.TrangThai == "banned" || user.TrangThai == "deleted")
                {
                    return StatusCode(403, new { message = "Tài khoản này đã bị khóa hoặc bị hủy!" });
                }

                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword, 10);
                user.MatKhau = hashedPassword;
                user.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới." });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi hệ thống khi cập nhật mật khẩu!" });
            }
        }

        // GET: api/taiKhoan/diachi/{id}
        [HttpGet("diachi/{id}")]
        public async Task<IActionResult> GetDiaChiByUser(long id)
        {
            try
            {
                var diaChiList = await _context.DiaChiGiaoHangs
                    .Where(d => d.TaiKhoanId == id)
                    .OrderByDescending(d => d.LaMacDinh)
                    .ToListAsync();

                var mappedList = diaChiList.Select(d => new
                {
                    id = d.Id,
                    tai_khoan_id = d.TaiKhoanId,
                    ho_ten_nguoi_nhan = d.HoTenNguoiNhan,
                    so_dien_thoai = d.SoDienThoai,
                    dia_chi_cu_the = d.DiaChiCuThe,
                    phuong_xa = d.PhuongXa,
                    quan_huyen = d.QuanHuyen,
                    tinh_thanh = d.TinhThanh,
                    la_mac_dinh = d.LaMacDinh
                }).ToList();
                
                return Ok(mappedList);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi lấy danh sách địa chỉ!" });
            }
        }

        // POST: api/taiKhoan/addAddress
        [HttpPost("addAddress")]
        public async Task<IActionResult> AddAddress([FromBody] System.Text.Json.JsonElement body)
        {
            try
            {
                long taiKhoanId = body.GetProperty("tai_khoan_id").GetInt64();
                string hoTenNguoiNhan = body.GetProperty("ho_ten_nguoi_nhan").GetString() ?? "";
                string soDienThoai = body.GetProperty("so_dien_thoai").GetString() ?? "";
                string tinhThanh = body.GetProperty("tinh_thanh").GetString() ?? "";
                string quanHuyen = body.TryGetProperty("quan_huyen", out var qh) ? (qh.GetString() ?? "") : "";
                string phuongXa = body.TryGetProperty("phuong_xa", out var px) ? (px.GetString() ?? "") : "";
                string diaChiCuThe = body.GetProperty("dia_chi_cu_the").GetString() ?? "";
                bool laMacDinh = body.TryGetProperty("la_mac_dinh", out var lmd) && lmd.GetBoolean();

                if (laMacDinh)
                {
                    // Reset all other addresses of this user to not default
                    var otherAddresses = await _context.DiaChiGiaoHangs
                        .Where(d => d.TaiKhoanId == taiKhoanId)
                        .ToListAsync();
                    
                    foreach (var addr in otherAddresses)
                    {
                        addr.LaMacDinh = false;
                    }
                }

                var addressDto = new DiaChiGiaoHang
                {
                    TaiKhoanId = taiKhoanId,
                    HoTenNguoiNhan = hoTenNguoiNhan,
                    SoDienThoai = soDienThoai,
                    TinhThanh = tinhThanh,
                    QuanHuyen = quanHuyen,
                    PhuongXa = phuongXa,
                    DiaChiCuThe = diaChiCuThe,
                    LaMacDinh = laMacDinh
                };

                _context.DiaChiGiaoHangs.Add(addressDto);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { message = "Đã thêm địa chỉ!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error AddAddress: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi thêm địa chỉ!" });
            }
        }

        // PUT: api/taiKhoan/diachi/{addressId}
        [HttpPut("diachi/{addressId}")]
        public async Task<IActionResult> UpdateAddress(long addressId, [FromBody] System.Text.Json.JsonElement body)
        {
            try
            {
                var address = await _context.DiaChiGiaoHangs.FindAsync(addressId);
                if (address == null)
                {
                    return NotFound(new { message = "Không tìm thấy địa chỉ!" });
                }

                string hoTenNguoiNhan = body.GetProperty("ho_ten_nguoi_nhan").GetString() ?? "";
                string soDienThoai = body.GetProperty("so_dien_thoai").GetString() ?? "";
                string tinhThanh = body.GetProperty("tinh_thanh").GetString() ?? "";
                string quanHuyen = body.TryGetProperty("quan_huyen", out var qh) ? (qh.GetString() ?? "") : "";
                string phuongXa = body.TryGetProperty("phuong_xa", out var px) ? (px.GetString() ?? "") : "";
                string diaChiCuThe = body.GetProperty("dia_chi_cu_the").GetString() ?? "";
                bool laMacDinh = body.TryGetProperty("la_mac_dinh", out var lmd) && lmd.GetBoolean();

                if (laMacDinh)
                {
                    var otherAddresses = await _context.DiaChiGiaoHangs
                        .Where(d => d.TaiKhoanId == address.TaiKhoanId && d.Id != addressId)
                        .ToListAsync();
                    
                    foreach (var addr in otherAddresses)
                    {
                        addr.LaMacDinh = false;
                    }
                }

                address.HoTenNguoiNhan = hoTenNguoiNhan;
                address.SoDienThoai = soDienThoai;
                address.DiaChiCuThe = diaChiCuThe;
                address.TinhThanh = tinhThanh;
                address.QuanHuyen = quanHuyen;
                address.PhuongXa = phuongXa;
                address.LaMacDinh = laMacDinh;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật địa chỉ thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error UpdateAddress: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi cập nhật địa chỉ!" });
            }
        }

        // DELETE: api/taiKhoan/diachi/{addressId}
        [HttpDelete("diachi/{addressId}")]
        public async Task<IActionResult> DeleteAddress(long addressId)
        {
            try
            {
                var address = await _context.DiaChiGiaoHangs.FindAsync(addressId);
                if (address == null)
                {
                    return NotFound(new { message = "Không tìm thấy địa chỉ!" });
                }

                _context.DiaChiGiaoHangs.Remove(address);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa địa chỉ!" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi xóa địa chỉ!" });
            }
        }

        // PUT: api/taiKhoan/change-password/{id}
        [HttpPut("change-password/{id}")]
        public async Task<IActionResult> ChangePassword(long id, [FromBody] JsonElement body)
        {
            try
            {
                string? oldPassword = body.TryGetProperty("oldPassword", out var oldProp) ? oldProp.GetString() : null;
                string? newPassword = body.TryGetProperty("newPassword", out var newProp) ? newProp.GetString() : null;

                if (string.IsNullOrEmpty(oldPassword) || string.IsNullOrEmpty(newPassword))
                {
                    return BadRequest(new { message = "Thiếu thông tin đổi mật khẩu!" });
                }

                var user = await _context.TaiKhoans.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng!" });
                }

                bool isMatch = BCrypt.Net.BCrypt.Verify(oldPassword, user.MatKhau);
                if (!isMatch)
                {
                    return BadRequest(new { message = "Mật khẩu hiện tại không chính xác!" });
                }

                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword, 10);
                user.MatKhau = hashedPassword;
                user.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đổi mật khẩu thành công!" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Lỗi server khi đổi mật khẩu!" });
            }
        }

        // PUT: api/taiKhoan/updateProfile/{id} (Accepts FromForm file upload)
        [HttpPut("updateProfile/{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfile(long id, [FromForm] string ho_ten, [FromForm] string? so_dien_thoai, [FromForm] string? gioi_tinh, [FromForm] string? ngay_sinh, IFormFile? anh_dai_dien)
        {
            try
            {
                var user = await _context.TaiKhoans.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng!" });
                }

                user.HoTen = ho_ten;
                user.SoDienThoai = string.IsNullOrEmpty(so_dien_thoai) ? null : so_dien_thoai;
                user.GioiTinh = string.IsNullOrEmpty(gioi_tinh) ? null : gioi_tinh;
                
                if (DateOnly.TryParse(ngay_sinh, out var birthDate))
                {
                    user.NgaySinh = birthDate;
                }
                else
                {
                    user.NgaySinh = null;
                }

                // Handle file upload
                if (anh_dai_dien != null && anh_dai_dien.Length > 0)
                {
                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(anh_dai_dien.FileName)}";
                    var filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await anh_dai_dien.CopyToAsync(stream);
                    }

                    user.AnhDaiDien = $"/uploads/{uniqueFileName}";
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi server khi cập nhật!" });
            }
        }

        // PUT: api/taiKhoan/cancel-account/{id}
        [HttpPut("cancel-account/{id}")]
        public async Task<IActionResult> CancelAccount(long id)
        {
            try
            {
                var user = await _context.TaiKhoans.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "Tài khoản không tồn tại!" });
                }

                // Check dependencies: DonHang, PhieuNhapHang, PhieuKiemKho
                bool hasOrders = await _context.DonHangs.AnyAsync(o => o.TaiKhoanId == id);
                bool hasPurchaseInvoices = await _context.PhieuNhapHangs.AnyAsync(p => p.NguoiTao == id);
                bool hasInventoryAudits = await _context.PhieuKiemKhos.AnyAsync(p => p.NguoiTao == id);

                if (hasOrders || hasPurchaseInvoices || hasInventoryAudits)
                {
                    user.TrangThai = "deleted";
                    user.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        type = "soft",
                        message = "Hủy tài khoản thành công!"
                    });
                }
                else
                {
                    // Hard delete child records first
                    var addresses = await _context.DiaChiGiaoHangs.Where(d => d.TaiKhoanId == id).ToListAsync();
                    _context.DiaChiGiaoHangs.RemoveRange(addresses);

                    var wishlists = await _context.YeuThiches.Where(y => y.TaiKhoanId == id).ToListAsync();
                    _context.YeuThiches.RemoveRange(wishlists);

                    var reviews = await _context.DanhGiaCuaHangs.Where(d => d.TaiKhoanId == id).ToListAsync();
                    _context.DanhGiaCuaHangs.RemoveRange(reviews);

                    var likes = await _context.ThichDanhGia.Where(l => l.TaiKhoanId == id).ToListAsync();
                    _context.ThichDanhGia.RemoveRange(likes);

                    _context.TaiKhoans.Remove(user);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        type = "hard",
                        message = "Hủy tài khoản thành công!"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { success = false, message = "Lỗi server khi hủy tài khoản!" });
            }
        }

        // GET: api/taiKhoan/order-detail/{id} (Complex Order Detail)
        [HttpGet("order-detail/{id}")]
        public async Task<IActionResult> GetOrderDetail(long id)
        {
            try
            {
                var order = await _context.DonHangs
                    .Include(o => o.DiaChi)
                    .Include(o => o.DonViVc)
                    .Include(o => o.LichSuGiaoHangs)
                    .Include(o => o.ChiTietDonHangs)
                        .ThenInclude(ct => ct.BienThe)
                            .ThenInclude(bt => bt.SanPham)
                                .ThenInclude(sp => sp.HinhAnhSanPhams)
                    .Include(o => o.GiaoDichThanhToans)
                        .ThenInclude(gd => gd.PhuongThuc)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin đơn hàng!" });
                }

                var thietLap = await _context.ThietLapCuaHangs.FirstOrDefaultAsync();

                // Sort tracking logs descending
                var trackingLogs = order.LichSuGiaoHangs
                    .OrderByDescending(l => l.ThoiGian)
                    .Select(l => new
                    {
                        l.Id,
                        l.TieuDe,
                        l.MoTa,
                        l.ThoiGian,
                        l.Lat,
                        l.Lng
                    })
                    .ToList();

                var orderDetailsList = order.ChiTietDonHangs.Select(ct => new
                {
                    id = ct.Id,
                    ten_sp_luc_mua = ct.TenSpLucMua,
                    sku_luc_mua = ct.SkuLucMua,
                    so_luong = ct.SoLuong,
                    don_gia = ct.DonGia,
                    thanh_tien = ct.ThanhTien,
                    bien_the = ct.BienThe != null ? new
                    {
                        id = ct.BienThe.Id,
                        mau_sac = ct.BienThe.MauSac,
                        dung_luong = ct.BienThe.DungLuong,
                        ram = ct.BienThe.Ram,
                        gia_ban = ct.BienThe.GiaBan,
                        san_pham = ct.BienThe.SanPham != null ? new
                        {
                            id = ct.BienThe.SanPham.Id,
                            ten_san_pham = ct.BienThe.SanPham.TenSanPham,
                            slug = ct.BienThe.SanPham.Slug,
                            hinh_anh = ct.BienThe.SanPham.HinhAnhSanPhams.Select(img => new
                            {
                                id = img.Id,
                                url_anh = img.UrlAnh,
                                la_anh_chinh = img.LaAnhChinh
                            }).ToList()
                        } : null
                    } : null
                }).ToList();

                var transaction = order.GiaoDichThanhToans.FirstOrDefault();
                var paymentMethod = transaction?.PhuongThuc?.TenPhuongThuc ?? "COD";

                // Build custom responsive structure matching original JSON shape
                var orderData = new Dictionary<string, object>
                {
                    { "id", order.Id },
                    { "ma_don_hang", order.MaDonHang },
                    { "tai_khoan_id", order.TaiKhoanId },
                    { "tong_tien_hang", order.TongTienHang },
                    { "phi_van_chuyen", order.PhiVanChuyen },
                    { "tien_giam_gia", order.TienGiamGia },
                    { "tong_thanh_toan", order.TongThanhToan },
                    { "trang_thai", order.TrangThai },
                    { "ghi_chu", order.GhiChu ?? "" },
                    { "ma_van_don", order.MaVanDon ?? "" },
                    { "created_at", order.CreatedAt },
                    { "updated_at", order.UpdatedAt },
                    { "cua_hang", thietLap != null ? (object)thietLap : DBNull.Value },
                    { "lich_su_giao_hang", trackingLogs },
                    { "chi_tiet", orderDetailsList },
                    { "giao_dich", transaction != null ? new {
                        id = transaction.Id,
                        ma_giao_dich = transaction.MaGiaoDich,
                        ma_giao_dich_doi_tac = transaction.MaGiaoDichDoiTac,
                        so_tien = transaction.SoTien,
                        trang_thai = transaction.TrangThai,
                        thoi_gian_thanh_toan = transaction.ThoiGianThanhToan,
                        phuong_thuc = transaction.PhuongThuc != null ? new {
                            id = transaction.PhuongThuc.Id,
                            ten_phuong_thuc = transaction.PhuongThuc.TenPhuongThuc,
                            loai = transaction.PhuongThuc.Loai
                        } : null
                    } : null }
                };

                // Apply Address Snapshot
                object addressData;
                if (!string.IsNullOrEmpty(order.HoTenNguoiNhan))
                {
                    addressData = new
                    {
                        ho_ten_nguoi_nhan = order.HoTenNguoiNhan,
                        so_dien_thoai = order.SoDienThoai,
                        dia_chi_cu_the = order.DiaChiCuThe,
                        tinh_thanh = order.TinhThanh,
                        quan_huyen = order.QuanHuyen,
                        phuong_xa = order.PhuongXa
                    };
                }
                else if (order.DiaChi != null)
                {
                    addressData = new
                    {
                        ho_ten_nguoi_nhan = order.DiaChi.HoTenNguoiNhan,
                        so_dien_thoai = order.DiaChi.SoDienThoai,
                        dia_chi_cu_the = order.DiaChi.DiaChiCuThe,
                        tinh_thanh = order.DiaChi.TinhThanh,
                        quan_huyen = order.DiaChi.QuanHuyen,
                        phuong_xa = order.DiaChi.PhuongXa
                    };
                }
                else
                {
                    // Fallback to default user address
                    var defaultAddr = await _context.DiaChiGiaoHangs
                        .Where(d => d.TaiKhoanId == order.TaiKhoanId)
                        .OrderByDescending(d => d.LaMacDinh)
                        .FirstOrDefaultAsync();

                    addressData = defaultAddr != null ? new
                    {
                        ho_ten_nguoi_nhan = defaultAddr.HoTenNguoiNhan,
                        so_dien_thoai = defaultAddr.SoDienThoai,
                        dia_chi_cu_the = defaultAddr.DiaChiCuThe,
                        tinh_thanh = defaultAddr.TinhThanh,
                        quan_huyen = defaultAddr.QuanHuyen,
                        phuong_xa = defaultAddr.PhuongXa
                    } : (object)DBNull.Value;
                }

                orderData.Add("dia_chi", addressData);

                return Ok(orderData);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Lỗi Server khi lấy chi tiết đơn hàng" });
            }
        }
    }
}
