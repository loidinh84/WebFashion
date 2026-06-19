
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'WebEcommerce')
    CREATE DATABASE WebEcommerce;
GO

USE WebEcommerce;
GO


IF OBJECT_ID('dbo.ThongBao',            'U') IS NOT NULL DROP TABLE dbo.ThongBao;
IF OBJECT_ID('dbo.DanhGiaCuaHang',      'U') IS NOT NULL DROP TABLE dbo.DanhGiaCuaHang;
IF OBJECT_ID('dbo.BaoHiem',             'U') IS NOT NULL DROP TABLE dbo.BaoHiem;
IF OBJECT_ID('dbo.BaoHanh',             'U') IS NOT NULL DROP TABLE dbo.BaoHanh;
IF OBJECT_ID('dbo.Banner',              'U') IS NOT NULL DROP TABLE dbo.Banner;
IF OBJECT_ID('dbo.ThietLapCuaHang',     'U') IS NOT NULL DROP TABLE dbo.ThietLapCuaHang;
IF OBJECT_ID('dbo.LichSuThaoTac',       'U') IS NOT NULL DROP TABLE dbo.LichSuThaoTac;
IF OBJECT_ID('dbo.MauIn',               'U') IS NOT NULL DROP TABLE dbo.MauIn;
IF OBJECT_ID('dbo.Kho',                 'U') IS NOT NULL DROP TABLE dbo.Kho;
IF OBJECT_ID('dbo.GiaoDichThanhToan',   'U') IS NOT NULL DROP TABLE dbo.GiaoDichThanhToan;
IF OBJECT_ID('dbo.PhuongThucThanhToan', 'U') IS NOT NULL DROP TABLE dbo.PhuongThucThanhToan;
IF OBJECT_ID('dbo.DanhGiaDonHang',      'U') IS NOT NULL DROP TABLE dbo.DanhGiaDonHang;
IF OBJECT_ID('dbo.TraHangHoanTien',     'U') IS NOT NULL DROP TABLE dbo.TraHangHoanTien;
IF OBJECT_ID('dbo.HoaDonDienTu',        'U') IS NOT NULL DROP TABLE dbo.HoaDonDienTu;
IF OBJECT_ID('dbo.DanhGiaSanPham',      'U') IS NOT NULL DROP TABLE dbo.DanhGiaSanPham;
IF OBJECT_ID('dbo.GioHang',             'U') IS NOT NULL DROP TABLE dbo.GioHang;
IF OBJECT_ID('dbo.ChiTietDonHang',      'U') IS NOT NULL DROP TABLE dbo.ChiTietDonHang;
IF OBJECT_ID('dbo.DonHang',             'U') IS NOT NULL DROP TABLE dbo.DonHang;
IF OBJECT_ID('dbo.DonViVanChuyen',      'U') IS NOT NULL DROP TABLE dbo.DonViVanChuyen;
IF OBJECT_ID('dbo.KhuyenMai',           'U') IS NOT NULL DROP TABLE dbo.KhuyenMai;
IF OBJECT_ID('dbo.YeuThich',            'U') IS NOT NULL DROP TABLE dbo.YeuThich;
IF OBJECT_ID('dbo.HinhAnhSanPham',      'U') IS NOT NULL DROP TABLE dbo.HinhAnhSanPham;
IF OBJECT_ID('dbo.ThuocTinhSanPham',    'U') IS NOT NULL DROP TABLE dbo.ThuocTinhSanPham;
IF OBJECT_ID('dbo.BienTheSanPham',      'U') IS NOT NULL DROP TABLE dbo.BienTheSanPham;
IF OBJECT_ID('dbo.SanPham',             'U') IS NOT NULL DROP TABLE dbo.SanPham;
IF OBJECT_ID('dbo.DanhMuc',             'U') IS NOT NULL DROP TABLE dbo.DanhMuc;
IF OBJECT_ID('dbo.NhaCungCap',          'U') IS NOT NULL DROP TABLE dbo.NhaCungCap;
IF OBJECT_ID('dbo.DiaChiGiaoHang',      'U') IS NOT NULL DROP TABLE dbo.DiaChiGiaoHang;
IF OBJECT_ID('dbo.TheThanhVien',        'U') IS NOT NULL DROP TABLE dbo.TheThanhVien;
IF OBJECT_ID('dbo.QuanLyNguoiDung',     'U') IS NOT NULL DROP TABLE dbo.QuanLyNguoiDung;
IF OBJECT_ID('dbo.TaiKhoan',            'U') IS NOT NULL DROP TABLE dbo.TaiKhoan;
GO

GO

-- ============================================================
--  NHÓM 1: NGƯỜI DÙNG
-- ============================================================

CREATE TABLE TaiKhoan (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ho_ten          NVARCHAR(100)           NOT NULL,
    email           NVARCHAR(150)           NOT NULL,
    so_dien_thoai   NVARCHAR(15)            NULL,
    mat_khau        NVARCHAR(255)           NOT NULL,
    anh_dai_dien    NVARCHAR(255)           NULL,
    vai_tro         NVARCHAR(20)            NOT NULL DEFAULT 'customer'
                        CONSTRAINT CHK_TaiKhoan_VaiTro
                        CHECK (vai_tro IN ('admin', 'customer')),
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_TaiKhoan_TrangThai
                        CHECK (trang_thai IN ('active', 'banned', 'inactive')),
    ngay_sinh       DATE                    NULL,
    gioi_tinh       NVARCHAR(10)            NULL
                        CONSTRAINT CHK_TaiKhoan_GioiTinh
                        CHECK (gioi_tinh IN ('male', 'female', 'other')),
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TaiKhoan PRIMARY KEY (id),
    CONSTRAINT UQ_TaiKhoan_Email UNIQUE (email),
    CONSTRAINT UQ_TaiKhoan_SoDienThoai UNIQUE (so_dien_thoai)
);
GO

CREATE TABLE QuanLyNguoiDung (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id        BIGINT                  NOT NULL,
    diem_tich_luy       INT                     NOT NULL DEFAULT 0,
    tong_don_hang       INT                     NOT NULL DEFAULT 0,
    tong_chi_tieu       DECIMAL(15,2)           NOT NULL DEFAULT 0,
    lan_dang_nhap_cuoi  DATETIME2               NULL,
    ghi_chu_noi_bo      NVARCHAR(MAX)           NULL,
    CONSTRAINT PK_QuanLyNguoiDung PRIMARY KEY (id),
    CONSTRAINT FK_QuanLyNguoiDung_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id) ON DELETE CASCADE
);
GO

CREATE TABLE TheThanhVien (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    ten_hang            NVARCHAR(50)            NOT NULL,   -- VD: Bạc, Vàng, Kim cương
    muc_chi_tieu_tu     DECIMAL(15,2)           NOT NULL DEFAULT 0,
    muc_chi_tieu_den    DECIMAL(15,2)           NULL,       -- NULL = không giới hạn trên
    ty_le_giam_gia      DECIMAL(5,2)            NOT NULL DEFAULT 0,
    diem_thuong_them    INT                     NOT NULL DEFAULT 0,
    mau_the             NVARCHAR(20)            NULL,
    mo_ta_quyen_loi     NVARCHAR(MAX)           NULL,
    CONSTRAINT PK_TheThanhVien PRIMARY KEY (id)
);
GO

CREATE TABLE DiaChiGiaoHang (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id        BIGINT                  NOT NULL,
    ho_ten_nguoi_nhan   NVARCHAR(100)           NOT NULL,
    so_dien_thoai       NVARCHAR(15)            NOT NULL,
    dia_chi_cu_the      NVARCHAR(255)           NOT NULL,
    phuong_xa           NVARCHAR(100)           NULL,
    quan_huyen          NVARCHAR(100)           NULL,
    tinh_thanh          NVARCHAR(100)           NOT NULL,
    la_mac_dinh         BIT                     NOT NULL DEFAULT 0,
    CONSTRAINT PK_DiaChiGiaoHang PRIMARY KEY (id),
    CONSTRAINT FK_DiaChiGiaoHang_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id) ON DELETE CASCADE
);
GO

-- ============================================================
--  NHÓM 2: SẢN PHẨM
-- ============================================================

CREATE TABLE DanhMuc (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_danh_muc    NVARCHAR(100)           NOT NULL,
    slug            NVARCHAR(100)           NOT NULL,
    danh_muc_cha_id BIGINT                  NULL,   -- NULL = danh mục gốc, có giá trị = danh mục con
    hinh_anh        NVARCHAR(255)           NULL,
    mo_ta           NVARCHAR(MAX)           NULL,
    thu_tu          INT                     NOT NULL DEFAULT 0,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_DanhMuc_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_DanhMuc PRIMARY KEY (id),
    CONSTRAINT UQ_DanhMuc_Slug UNIQUE (slug),
    CONSTRAINT FK_DanhMuc_Cha FOREIGN KEY (danh_muc_cha_id)
        REFERENCES DanhMuc(id) ON DELETE NO ACTION
);
GO

CREATE TABLE NhaCungCap (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_nha_cc      NVARCHAR(150)           NOT NULL,
    ma_so_thue      NVARCHAR(20)            NULL,
    email           NVARCHAR(150)           NULL,
    so_dien_thoai   NVARCHAR(15)            NULL,
    dia_chi         NVARCHAR(255)           NULL,
    quoc_gia        NVARCHAR(50)            NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_NhaCungCap_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    ghi_chu         NVARCHAR(MAX)           NULL,
    CONSTRAINT PK_NhaCungCap PRIMARY KEY (id),
    CONSTRAINT UQ_NhaCungCap_MaSoThue UNIQUE (ma_so_thue)
);
GO

CREATE TABLE SanPham (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_san_pham    NVARCHAR(255)           NOT NULL,
    slug            NVARCHAR(255)           NOT NULL,
    danh_muc_id     BIGINT                  NOT NULL,
    nha_cung_cap_id BIGINT                  NOT NULL,
    mo_ta_ngan      NVARCHAR(500)           NULL,
    mo_ta_day_du    NVARCHAR(MAX)           NULL,
    thuong_hieu     NVARCHAR(100)           NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'draft'
                        CONSTRAINT CHK_SanPham_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive', 'draft')),
    noi_bat         BIT                     NOT NULL DEFAULT 0,
    luot_xem        INT                     NOT NULL DEFAULT 0,
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SanPham PRIMARY KEY (id),
    CONSTRAINT UQ_SanPham_Slug UNIQUE (slug),
    CONSTRAINT FK_SanPham_DanhMuc FOREIGN KEY (danh_muc_id)
        REFERENCES DanhMuc(id),
    CONSTRAINT FK_SanPham_NhaCungCap FOREIGN KEY (nha_cung_cap_id)
        REFERENCES NhaCungCap(id)
);
GO

CREATE TABLE BienTheSanPham (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    san_pham_id     BIGINT                  NOT NULL,
    sku             NVARCHAR(100)           NOT NULL,
    mau_sac         NVARCHAR(50)            NULL,
    dung_luong      NVARCHAR(50)            NULL,
    ram             NVARCHAR(50)            NULL,
    gia_goc         DECIMAL(15,2)           NOT NULL DEFAULT 0,
    gia_ban         DECIMAL(15,2)           NOT NULL DEFAULT 0,
    ton_kho         INT                     NOT NULL DEFAULT 0,
    ma_mau_hex      NVARCHAR(10)            NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_BienThe_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_BienTheSanPham PRIMARY KEY (id),
    CONSTRAINT UQ_BienTheSanPham_SKU UNIQUE (sku),
    CONSTRAINT FK_BienTheSanPham_SanPham FOREIGN KEY (san_pham_id)
        REFERENCES SanPham(id) ON DELETE CASCADE
);
GO

CREATE TABLE ThuocTinhSanPham (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    san_pham_id     BIGINT                  NOT NULL,
    ten_thuoc_tinh  NVARCHAR(100)           NOT NULL,   -- VD: Chip, Màn hình, Pin
    gia_tri         NVARCHAR(255)           NOT NULL,   -- VD: A18 Pro, 6.9 inch, 4685 mAh
    nhom            NVARCHAR(50)            NULL,       -- VD: Cấu hình, Màn hình, Camera
    thu_tu          INT                     NOT NULL DEFAULT 0,
    CONSTRAINT PK_ThuocTinhSanPham PRIMARY KEY (id),
    CONSTRAINT FK_ThuocTinh_SanPham FOREIGN KEY (san_pham_id)
        REFERENCES SanPham(id) ON DELETE CASCADE
);
GO

CREATE TABLE HinhAnhSanPham (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    san_pham_id     BIGINT                  NOT NULL,
    bien_the_id     BIGINT                  NULL,   -- NULL = ảnh chung, có giá trị = ảnh riêng theo biến thể
    url_anh         NVARCHAR(255)           NOT NULL,
    alt_text        NVARCHAR(255)           NULL,
    la_anh_chinh    BIT                     NOT NULL DEFAULT 0,
    thu_tu          INT                     NOT NULL DEFAULT 0,
    CONSTRAINT PK_HinhAnhSanPham PRIMARY KEY (id),
    CONSTRAINT FK_HinhAnh_SanPham FOREIGN KEY (san_pham_id)
        REFERENCES SanPham(id) ON DELETE CASCADE,
    CONSTRAINT FK_HinhAnh_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id) ON DELETE NO ACTION
);
GO

CREATE TABLE YeuThich (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    san_pham_id     BIGINT                  NOT NULL,
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_YeuThich PRIMARY KEY (id),
    CONSTRAINT UQ_YeuThich UNIQUE (tai_khoan_id, san_pham_id),
    CONSTRAINT FK_YeuThich_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id) ON DELETE CASCADE,
    CONSTRAINT FK_YeuThich_SanPham FOREIGN KEY (san_pham_id)
        REFERENCES SanPham(id) ON DELETE CASCADE
);
GO

-- ============================================================
--  NHÓM 3: ĐƠN HÀNG
-- ============================================================

CREATE TABLE KhuyenMai (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    ma_khuyen_mai       NVARCHAR(50)            NOT NULL,
    ten_chuong_trinh    NVARCHAR(150)           NOT NULL,
    loai                NVARCHAR(20)            NOT NULL
                            CONSTRAINT CHK_KhuyenMai_Loai
                            CHECK (loai IN ('percent', 'fixed', 'freeship')),
    gia_tri             DECIMAL(15,2)           NOT NULL DEFAULT 0,
    gia_tri_toi_da      DECIMAL(15,2)           NULL,       -- NULL = không giới hạn mức giảm
    don_hang_toi_thieu  DECIMAL(15,2)           NOT NULL DEFAULT 0,
    so_luong_ma         INT                     NULL,       -- NULL = không giới hạn số lần dùng
    da_su_dung          INT                     NOT NULL DEFAULT 0,
    ngay_bat_dau        DATETIME2               NOT NULL,
    ngay_ket_thuc       DATETIME2               NOT NULL,
    trang_thai          NVARCHAR(20)            NOT NULL DEFAULT 'active'
                            CONSTRAINT CHK_KhuyenMai_TrangThai
                            CHECK (trang_thai IN ('active', 'inactive', 'expired')),
    CONSTRAINT PK_KhuyenMai PRIMARY KEY (id),
    CONSTRAINT UQ_KhuyenMai_Ma UNIQUE (ma_khuyen_mai)
);
GO

CREATE TABLE DonViVanChuyen (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    ten_don_vi          NVARCHAR(100)           NOT NULL,   -- VD: GHN, GHTK, VNPost
    ma                  NVARCHAR(30)            NOT NULL,
    logo_url            NVARCHAR(255)           NULL,
    api_key             NVARCHAR(255)           NULL,
    api_endpoint        NVARCHAR(255)           NULL,
    phi_co_ban          DECIMAL(15,2)           NOT NULL DEFAULT 0,
    thoi_gian_du_kien   NVARCHAR(50)            NULL,       -- VD: 2-3 ngày
    trang_thai          NVARCHAR(20)            NOT NULL DEFAULT 'active'
                            CONSTRAINT CHK_DonViVC_TrangThai
                            CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_DonViVanChuyen PRIMARY KEY (id),
    CONSTRAINT UQ_DonViVC_Ma UNIQUE (ma)
);
GO

CREATE TABLE DonHang (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    ma_don_hang         NVARCHAR(30)            NOT NULL,
    tai_khoan_id        BIGINT                  NOT NULL,
    dia_chi_id          BIGINT                  NOT NULL,
    don_vi_vc_id        BIGINT                  NULL,
    khuyen_mai_id       BIGINT                  NULL,
    tong_tien_hang      DECIMAL(15,2)           NOT NULL DEFAULT 0,
    phi_van_chuyen      DECIMAL(15,2)           NOT NULL DEFAULT 0,
    tien_giam_gia       DECIMAL(15,2)           NOT NULL DEFAULT 0,
    tong_thanh_toan     DECIMAL(15,2)           NOT NULL DEFAULT 0,
    trang_thai          NVARCHAR(20)            NOT NULL DEFAULT 'pending'
                            CONSTRAINT CHK_DonHang_TrangThai
                            CHECK (trang_thai IN ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
    ghi_chu             NVARCHAR(MAX)           NULL,
    ma_van_don          NVARCHAR(100)           NULL,
    created_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DonHang PRIMARY KEY (id),
    CONSTRAINT UQ_DonHang_Ma UNIQUE (ma_don_hang),
    CONSTRAINT FK_DonHang_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id),
    CONSTRAINT FK_DonHang_DiaChiGiaoHang FOREIGN KEY (dia_chi_id)
        REFERENCES DiaChiGiaoHang(id),
    CONSTRAINT FK_DonHang_DonViVC FOREIGN KEY (don_vi_vc_id)
        REFERENCES DonViVanChuyen(id),
    CONSTRAINT FK_DonHang_KhuyenMai FOREIGN KEY (khuyen_mai_id)
        REFERENCES KhuyenMai(id)
);
GO

CREATE TABLE ChiTietDonHang (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id     BIGINT                  NOT NULL,
    bien_the_id     BIGINT                  NOT NULL,
    ten_sp_luc_mua  NVARCHAR(255)           NOT NULL,   -- Snapshot: lưu tên lúc mua phòng trường hợp sau đổi tên
    sku_luc_mua     NVARCHAR(100)           NOT NULL,   -- Snapshot: lưu SKU lúc mua
    so_luong        INT                     NOT NULL DEFAULT 1,
    don_gia         DECIMAL(15,2)           NOT NULL,
    thanh_tien      DECIMAL(15,2)           NOT NULL,
    CONSTRAINT PK_ChiTietDonHang PRIMARY KEY (id),
    CONSTRAINT FK_ChiTiet_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id) ON DELETE CASCADE,
    CONSTRAINT FK_ChiTiet_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id)
);
GO

CREATE TABLE GioHang (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    bien_the_id     BIGINT                  NOT NULL,
    so_luong        INT                     NOT NULL DEFAULT 1,
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_GioHang PRIMARY KEY (id),
    CONSTRAINT UQ_GioHang UNIQUE (tai_khoan_id, bien_the_id),
    CONSTRAINT FK_GioHang_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id) ON DELETE CASCADE,
    CONSTRAINT FK_GioHang_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id)
);
GO

-- *** FIX: DanhGiaSanPham đặt SAU DonHang vì có FK tham chiếu đến DonHang ***
CREATE TABLE DanhGiaSanPham (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    san_pham_id     BIGINT                  NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    don_hang_id     BIGINT                  NOT NULL,   -- Đảm bảo chỉ khách đã mua mới được đánh giá
    so_sao          TINYINT                 NOT NULL
                        CONSTRAINT CHK_DanhGiaSP_SoSao
                        CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung        NVARCHAR(MAX)           NULL,
    hinh_anh        NVARCHAR(MAX)           NULL,       -- Lưu JSON array URL ảnh
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'pending'
                        CONSTRAINT CHK_DanhGiaSP_TrangThai
                        CHECK (trang_thai IN ('pending', 'approved', 'rejected')),
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DanhGiaSanPham PRIMARY KEY (id),
    CONSTRAINT FK_DanhGiaSP_SanPham FOREIGN KEY (san_pham_id)
        REFERENCES SanPham(id),
    CONSTRAINT FK_DanhGiaSP_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id),
    CONSTRAINT FK_DanhGiaSP_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id)
);
GO

CREATE TABLE HoaDonDienTu (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id         BIGINT                  NOT NULL,
    ma_hoa_don          NVARCHAR(50)            NOT NULL,
    ngay_xuat           DATETIME2               NOT NULL DEFAULT GETDATE(),
    ten_nguoi_mua       NVARCHAR(100)           NULL,
    ma_so_thue          NVARCHAR(20)            NULL,
    dia_chi_nguoi_mua   NVARCHAR(255)           NULL,
    tong_tien_chua_vat  DECIMAL(15,2)           NOT NULL DEFAULT 0,
    tien_vat            DECIMAL(15,2)           NOT NULL DEFAULT 0,
    tong_tien_vat       DECIMAL(15,2)           NOT NULL DEFAULT 0,
    url_pdf             NVARCHAR(255)           NULL,
    CONSTRAINT PK_HoaDonDienTu PRIMARY KEY (id),
    CONSTRAINT UQ_HoaDon_Ma UNIQUE (ma_hoa_don),
    CONSTRAINT FK_HoaDon_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id)
);
GO

CREATE TABLE TraHangHoanTien (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id         BIGINT                  NOT NULL,
    tai_khoan_id        BIGINT                  NOT NULL,
    ly_do               NVARCHAR(MAX)           NOT NULL,
    hinh_anh_chung_minh NVARCHAR(MAX)           NULL,   -- Lưu JSON array URL ảnh
    so_tien_hoan        DECIMAL(15,2)           NOT NULL DEFAULT 0,
    hinh_thuc_hoan      NVARCHAR(20)            NOT NULL
                            CONSTRAINT CHK_TraHang_HinhThuc
                            CHECK (hinh_thuc_hoan IN ('tien_mat', 'chuyen_khoan', 'vi_dien_tu')),
    trang_thai          NVARCHAR(20)            NOT NULL DEFAULT 'pending'
                            CONSTRAINT CHK_TraHang_TrangThai
                            CHECK (trang_thai IN ('pending', 'approved', 'rejected', 'completed')),
    ghi_chu_xu_ly       NVARCHAR(MAX)           NULL,
    created_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TraHangHoanTien PRIMARY KEY (id),
    CONSTRAINT FK_TraHang_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id),
    CONSTRAINT FK_TraHang_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

CREATE TABLE DanhGiaDonHang (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id         BIGINT                  NOT NULL,
    tai_khoan_id        BIGINT                  NOT NULL,
    so_sao_giao_hang    TINYINT                 NOT NULL
                            CONSTRAINT CHK_DanhGiaDH_GiaoHang
                            CHECK (so_sao_giao_hang BETWEEN 1 AND 5),
    so_sao_dong_goi     TINYINT                 NOT NULL
                            CONSTRAINT CHK_DanhGiaDH_DongGoi
                            CHECK (so_sao_dong_goi BETWEEN 1 AND 5),
    noi_dung            NVARCHAR(MAX)           NULL,
    created_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DanhGiaDonHang PRIMARY KEY (id),
    CONSTRAINT FK_DanhGiaDH_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id),
    CONSTRAINT FK_DanhGiaDH_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

-- ============================================================
--  NHÓM 4: THANH TOÁN & VẬN CHUYỂN
-- ============================================================

CREATE TABLE PhuongThucThanhToan (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_phuong_thuc NVARCHAR(100)           NOT NULL,   -- VD: COD, VNPay, MoMo
    ma              NVARCHAR(50)            NOT NULL,
    loai            NVARCHAR(20)            NOT NULL
                        CONSTRAINT CHK_PTTT_Loai
                        CHECK (loai IN ('cod', 'bank_transfer', 'e_wallet', 'card')),
    logo_url        NVARCHAR(255)           NULL,
    cau_hinh        NVARCHAR(MAX)           NULL,   -- Lưu JSON cấu hình API của từng cổng
    phi_thanh_toan  DECIMAL(5,2)            NOT NULL DEFAULT 0,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_PTTT_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_PhuongThucThanhToan PRIMARY KEY (id),
    CONSTRAINT UQ_PTTT_Ma UNIQUE (ma)
);
GO

CREATE TABLE GiaoDichThanhToan (
    id                      BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id             BIGINT                  NOT NULL,
    phuong_thuc_id          BIGINT                  NOT NULL,
    ma_giao_dich            NVARCHAR(100)           NOT NULL,
    ma_giao_dich_doi_tac    NVARCHAR(100)           NULL,   -- Mã VNPay/MoMo trả về
    so_tien                 DECIMAL(15,2)           NOT NULL,
    trang_thai              NVARCHAR(20)            NOT NULL DEFAULT 'pending'
                                CONSTRAINT CHK_GiaoDich_TrangThai
                                CHECK (trang_thai IN ('pending', 'success', 'failed', 'refunded')),
    thoi_gian_thanh_toan    DATETIME2               NULL,
    response_data           NVARCHAR(MAX)           NULL,   -- Lưu JSON toàn bộ phản hồi từ cổng thanh toán
    CONSTRAINT PK_GiaoDichThanhToan PRIMARY KEY (id),
    CONSTRAINT UQ_GiaoDich_Ma UNIQUE (ma_giao_dich),
    CONSTRAINT FK_GiaoDich_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id),
    CONSTRAINT FK_GiaoDich_PhuongThuc FOREIGN KEY (phuong_thuc_id)
        REFERENCES PhuongThucThanhToan(id)
);
GO

-- ============================================================
--  NHÓM 5: KHO & VẬN HÀNH
-- ============================================================

CREATE TABLE Kho (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    bien_the_id         BIGINT                  NOT NULL,
    so_luong_ton        INT                     NOT NULL DEFAULT 0,
    so_luong_giu_cho    INT                     NOT NULL DEFAULT 0,   -- Đơn đã đặt chưa xuất kho
    nguong_canh_bao     INT                     NOT NULL DEFAULT 5,   -- Cảnh báo khi tồn kho dưới mức này
    vi_tri_kho          NVARCHAR(50)            NULL,
    updated_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Kho PRIMARY KEY (id),
    CONSTRAINT UQ_Kho_BienThe UNIQUE (bien_the_id),
    CONSTRAINT FK_Kho_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id) ON DELETE CASCADE
);
GO

CREATE TABLE MauIn (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_mau         NVARCHAR(100)           NOT NULL,
    loai            NVARCHAR(30)            NOT NULL
                        CONSTRAINT CHK_MauIn_Loai
                        CHECK (loai IN ('hoa_don', 'phieu_giao', 'bao_hanh', 'nhan_san_pham')),
    noi_dung_html   NVARCHAR(MAX)           NOT NULL,
    la_mac_dinh     BIT                     NOT NULL DEFAULT 0,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_MauIn_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_MauIn PRIMARY KEY (id)
);
GO

CREATE TABLE LichSuThaoTac (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    hanh_dong       NVARCHAR(100)           NOT NULL,   -- VD: UPDATE_PRICE, DELETE_PRODUCT
    doi_tuong       NVARCHAR(50)            NOT NULL,   -- VD: SanPham, DonHang
    doi_tuong_id    BIGINT                  NULL,
    du_lieu_cu      NVARCHAR(MAX)           NULL,       -- JSON giá trị trước khi thay đổi
    du_lieu_moi     NVARCHAR(MAX)           NULL,       -- JSON giá trị sau khi thay đổi
    dia_chi_ip      NVARCHAR(45)            NULL,
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_LichSuThaoTac PRIMARY KEY (id),
    CONSTRAINT FK_LichSu_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

CREATE TABLE ThietLapCuaHang (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    ten_cua_hang        NVARCHAR(150)           NOT NULL,
    logo_url            NVARCHAR(255)           NULL,
    favicon_url         NVARCHAR(255)           NULL,
    so_dien_thoai       NVARCHAR(15)            NULL,
    email               NVARCHAR(150)           NULL,
    dia_chi             NVARCHAR(255)           NULL,
    facebook_url        NVARCHAR(255)           NULL,
    zalo                NVARCHAR(50)            NULL,
    chinh_sach_doi_tra  NVARCHAR(MAX)           NULL,
    chinh_sach_bao_mat  NVARCHAR(MAX)           NULL,
    updated_at          DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ThietLapCuaHang PRIMARY KEY (id)
);
GO

CREATE TABLE Banner (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tieu_de         NVARCHAR(150)           NULL,
    hinh_anh_url    NVARCHAR(255)           NOT NULL,
    duong_dan       NVARCHAR(255)           NULL,
    vi_tri          NVARCHAR(20)            NOT NULL DEFAULT 'homepage'
                        CONSTRAINT CHK_Banner_ViTri
                        CHECK (vi_tri IN ('homepage', 'category', 'popup')),
    thu_tu          INT                     NOT NULL DEFAULT 0,
    ngay_bat_dau    DATETIME2               NULL,
    ngay_ket_thuc   DATETIME2               NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_Banner_TrangThai
                        CHECK (trang_thai IN ('active', 'inactive')),
    CONSTRAINT PK_Banner PRIMARY KEY (id)
);
GO

-- ============================================================
--  NHÓM 6: HẬU MÃI
-- ============================================================

CREATE TABLE BaoHanh (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    don_hang_id     BIGINT                  NOT NULL,
    bien_the_id     BIGINT                  NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    so_serial       NVARCHAR(100)           NOT NULL,
    ngay_bat_dau    DATE                    NOT NULL,
    ngay_ket_thuc   DATE                    NOT NULL,
    thoi_han_thang  INT                     NOT NULL DEFAULT 12,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_BaoHanh_TrangThai
                        CHECK (trang_thai IN ('active', 'expired', 'claimed')),
    ghi_chu         NVARCHAR(MAX)           NULL,
    CONSTRAINT PK_BaoHanh PRIMARY KEY (id),
    CONSTRAINT UQ_BaoHanh_Serial UNIQUE (so_serial),
    CONSTRAINT FK_BaoHanh_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id),
    CONSTRAINT FK_BaoHanh_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id),
    CONSTRAINT FK_BaoHanh_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

CREATE TABLE BaoHiem (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    ten_goi         NVARCHAR(100)           NOT NULL,   -- VD: Bảo hiểm rơi vỡ 1 năm
    don_hang_id     BIGINT                  NOT NULL,
    bien_the_id     BIGINT                  NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    phi_bao_hiem    DECIMAL(15,2)           NOT NULL DEFAULT 0,
    so_tien_bh      DECIMAL(15,2)           NOT NULL DEFAULT 0,
    ngay_bat_dau    DATE                    NOT NULL,
    ngay_ket_thuc   DATE                    NOT NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'active'
                        CONSTRAINT CHK_BaoHiem_TrangThai
                        CHECK (trang_thai IN ('active', 'expired', 'claimed')),
    CONSTRAINT PK_BaoHiem PRIMARY KEY (id),
    CONSTRAINT FK_BaoHiem_DonHang FOREIGN KEY (don_hang_id)
        REFERENCES DonHang(id),
    CONSTRAINT FK_BaoHiem_BienThe FOREIGN KEY (bien_the_id)
        REFERENCES BienTheSanPham(id),
    CONSTRAINT FK_BaoHiem_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

CREATE TABLE DanhGiaCuaHang (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    so_sao          TINYINT                 NOT NULL
                        CONSTRAINT CHK_DanhGiaCS_SoSao
                        CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung        NVARCHAR(MAX)           NULL,
    trang_thai      NVARCHAR(20)            NOT NULL DEFAULT 'pending'
                        CONSTRAINT CHK_DanhGiaCS_TrangThai
                        CHECK (trang_thai IN ('pending', 'approved', 'rejected')),
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DanhGiaCuaHang PRIMARY KEY (id),
    CONSTRAINT FK_DanhGiaCS_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id)
);
GO

CREATE TABLE ThongBao (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    tai_khoan_id    BIGINT                  NOT NULL,
    tieu_de         NVARCHAR(150)           NOT NULL,
    noi_dung        NVARCHAR(MAX)           NOT NULL,
    loai            NVARCHAR(20)            NOT NULL DEFAULT 'system'
                        CONSTRAINT CHK_ThongBao_Loai
                        CHECK (loai IN ('order', 'promotion', 'warranty', 'system')),
    duong_dan       NVARCHAR(255)           NULL,
    da_doc          BIT                     NOT NULL DEFAULT 0,
    created_at      DATETIME2               NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ThongBao PRIMARY KEY (id),
    CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY (tai_khoan_id)
        REFERENCES TaiKhoan(id) ON DELETE CASCADE
);
GO

-- ============================================================
--  INDEX
-- ============================================================

CREATE INDEX IX_SanPham_DanhMucId          ON SanPham(danh_muc_id);
CREATE INDEX IX_BienThe_SanPhamId          ON BienTheSanPham(san_pham_id);
CREATE INDEX IX_HinhAnh_SanPhamBienThe     ON HinhAnhSanPham(san_pham_id, bien_the_id);
CREATE INDEX IX_DonHang_TaiKhoanId         ON DonHang(tai_khoan_id);
CREATE INDEX IX_DonHang_TrangThai          ON DonHang(trang_thai);
CREATE INDEX IX_ChiTiet_DonHangId          ON ChiTietDonHang(don_hang_id);
CREATE INDEX IX_GiaoDich_DonHangId         ON GiaoDichThanhToan(don_hang_id);
CREATE INDEX IX_DanhGiaSP_SanPhamId        ON DanhGiaSanPham(san_pham_id);
CREATE INDEX IX_ThongBao_TaiKhoanDaDoc     ON ThongBao(tai_khoan_id, da_doc);
CREATE INDEX IX_GioHang_TaiKhoanId         ON GioHang(tai_khoan_id);
CREATE INDEX IX_BaoHanh_TaiKhoanId         ON BaoHanh(tai_khoan_id);
GO

-- ============================================================
--  KIỂM TRA KẾT QUẢ
-- ============================================================

SELECT
    COUNT(*) AS tong_so_bang
FROM
    INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_TYPE = 'BASE TABLE';
GO

PRINT N'';
PRINT N'Tạo database WebEcommerce thành công!';
GO