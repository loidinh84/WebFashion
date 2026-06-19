using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace WebFashion.Api.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Banner> Banners { get; set; }

    public virtual DbSet<BaoHanh> BaoHanhs { get; set; }

    public virtual DbSet<BaoHiem> BaoHiems { get; set; }

    public virtual DbSet<BienTheSanPham> BienTheSanPhams { get; set; }

    public virtual DbSet<CauHinhTrangChu> CauHinhTrangChus { get; set; }

    public virtual DbSet<ChatHistory> ChatHistories { get; set; }

    public virtual DbSet<ChiTietDonHang> ChiTietDonHangs { get; set; }

    public virtual DbSet<ChiTietKiemKho> ChiTietKiemKhos { get; set; }

    public virtual DbSet<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; }

    public virtual DbSet<DanhGiaCuaHang> DanhGiaCuaHangs { get; set; }

    public virtual DbSet<DanhGiaDonHang> DanhGiaDonHangs { get; set; }

    public virtual DbSet<DanhGiaSanPham> DanhGiaSanPhams { get; set; }

    public virtual DbSet<DanhMuc> DanhMucs { get; set; }

    public virtual DbSet<DiaChiGiaoHang> DiaChiGiaoHangs { get; set; }

    public virtual DbSet<DonHang> DonHangs { get; set; }

    public virtual DbSet<DonViVanChuyen> DonViVanChuyens { get; set; }

    public virtual DbSet<GiaoDichThanhToan> GiaoDichThanhToans { get; set; }

    public virtual DbSet<GioHang> GioHangs { get; set; }

    public virtual DbSet<HinhAnhSanPham> HinhAnhSanPhams { get; set; }

    public virtual DbSet<HoaDonDienTu> HoaDonDienTus { get; set; }

    public virtual DbSet<Kho> Khos { get; set; }

    public virtual DbSet<KhuyenMai> KhuyenMais { get; set; }

    public virtual DbSet<LichSuDungVoucher> LichSuDungVouchers { get; set; }

    public virtual DbSet<LichSuGiaoHang> LichSuGiaoHangs { get; set; }

    public virtual DbSet<MauIn> MauIns { get; set; }

    public virtual DbSet<NhaCungCap> NhaCungCaps { get; set; }

    public virtual DbSet<PhieuKiemKho> PhieuKiemKhos { get; set; }

    public virtual DbSet<PhieuNhapHang> PhieuNhapHangs { get; set; }

    public virtual DbSet<PhuongThucThanhToan> PhuongThucThanhToans { get; set; }

    public virtual DbSet<QuanLyNguoiDung> QuanLyNguoiDungs { get; set; }

    public virtual DbSet<SanPham> SanPhams { get; set; }

    public virtual DbSet<TaiKhoan> TaiKhoans { get; set; }

    public virtual DbSet<TheThanhVien> TheThanhViens { get; set; }

    public virtual DbSet<ThichDanhGium> ThichDanhGia { get; set; }

    public virtual DbSet<ThietLapCuaHang> ThietLapCuaHangs { get; set; }

    public virtual DbSet<ThongBao> ThongBaos { get; set; }

    public virtual DbSet<ThuocTinhSanPham> ThuocTinhSanPhams { get; set; }

    public virtual DbSet<TraHangHoanTien> TraHangHoanTiens { get; set; }

    public virtual DbSet<YeuThich> YeuThiches { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Banner>(entity =>
        {
            entity.ToTable("Banner");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DuongDan)
                .HasMaxLength(255)
                .HasColumnName("duong_dan");
            entity.Property(e => e.HinhAnhUrl)
                .HasMaxLength(255)
                .HasColumnName("hinh_anh_url");
            entity.Property(e => e.NgayBatDau).HasColumnName("ngay_bat_dau");
            entity.Property(e => e.NgayKetThuc).HasColumnName("ngay_ket_thuc");
            entity.Property(e => e.ThuTu).HasColumnName("thu_tu");
            entity.Property(e => e.TieuDe)
                .HasMaxLength(150)
                .HasColumnName("tieu_de");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
            entity.Property(e => e.ViTri)
                .HasMaxLength(20)
                .HasDefaultValue("homepage")
                .HasColumnName("vi_tri");
        });

        modelBuilder.Entity<BaoHanh>(entity =>
        {
            entity.ToTable("BaoHanh");

            entity.HasIndex(e => e.SoSerial, "UQ_BaoHanh_Serial").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.GhiChu).HasColumnName("ghi_chu");
            entity.Property(e => e.NgayBatDau).HasColumnName("ngay_bat_dau");
            entity.Property(e => e.NgayKetThuc).HasColumnName("ngay_ket_thuc");
            entity.Property(e => e.SoSerial)
                .HasMaxLength(100)
                .HasColumnName("so_serial");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.ThoiHanThang)
                .HasDefaultValue(12)
                .HasColumnName("thoi_han_thang");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.BienThe).WithMany(p => p.BaoHanhs)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHanh_BienThe");

            entity.HasOne(d => d.DonHang).WithMany(p => p.BaoHanhs)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHanh_DonHang");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.BaoHanhs)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHanh_TaiKhoan");
        });

        modelBuilder.Entity<BaoHiem>(entity =>
        {
            entity.ToTable("BaoHiem");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.NgayBatDau).HasColumnName("ngay_bat_dau");
            entity.Property(e => e.NgayKetThuc).HasColumnName("ngay_ket_thuc");
            entity.Property(e => e.PhiBaoHiem)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("phi_bao_hiem");
            entity.Property(e => e.SoTienBh)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("so_tien_bh");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TenGoi)
                .HasMaxLength(100)
                .HasColumnName("ten_goi");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.BienThe).WithMany(p => p.BaoHiems)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHiem_BienThe");

            entity.HasOne(d => d.DonHang).WithMany(p => p.BaoHiems)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHiem_DonHang");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.BaoHiems)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BaoHiem_TaiKhoan");
        });

        modelBuilder.Entity<BienTheSanPham>(entity =>
        {
            entity.ToTable("BienTheSanPham");

            entity.HasIndex(e => e.SanPhamId, "IX_BienThe_SanPhamId");

            entity.HasIndex(e => e.Sku, "UQ_BienTheSanPham_SKU").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DungLuong)
                .HasMaxLength(50)
                .HasColumnName("dung_luong");
            entity.Property(e => e.GiaBan)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("gia_ban");
            entity.Property(e => e.GiaGoc)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("gia_goc");
            entity.Property(e => e.MaMauHex)
                .HasMaxLength(10)
                .HasColumnName("ma_mau_hex");
            entity.Property(e => e.MauSac)
                .HasMaxLength(50)
                .HasColumnName("mau_sac");
            entity.Property(e => e.Ram)
                .HasMaxLength(50)
                .HasColumnName("ram");
            entity.Property(e => e.SanPhamId).HasColumnName("san_pham_id");
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .HasColumnName("sku");
            entity.Property(e => e.TonKho).HasColumnName("ton_kho");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.SanPham).WithMany(p => p.BienTheSanPhams)
                .HasForeignKey(d => d.SanPhamId)
                .HasConstraintName("FK_BienTheSanPham_SanPham");
        });

        modelBuilder.Entity<CauHinhTrangChu>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CauHinhT__3213E83FFA0FCE99");

            entity.ToTable("CauHinhTrangChu");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DanhMucId1).HasColumnName("danh_muc_id_1");
            entity.Property(e => e.DanhMucId2).HasColumnName("danh_muc_id_2");
            entity.Property(e => e.DuLieuJson).HasColumnName("du_lieu_json");
            entity.Property(e => e.LoaiHienThi)
                .HasMaxLength(50)
                .HasDefaultValue("ProductSection")
                .HasColumnName("loai_hien_thi");
            entity.Property(e => e.TenPhan)
                .HasMaxLength(255)
                .HasColumnName("ten_phan");
            entity.Property(e => e.TenTab1)
                .HasMaxLength(255)
                .HasColumnName("ten_tab_1");
            entity.Property(e => e.TenTab2)
                .HasMaxLength(255)
                .HasColumnName("ten_tab_2");
            entity.Property(e => e.ThuTu)
                .HasDefaultValue(0)
                .HasColumnName("thu_tu");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<ChatHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChatHist__3213E83F6D9727CC");

            entity.ToTable("ChatHistory");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysdatetimeoffset())", "DF_ChatHistory_createdAt")
                .HasColumnName("createdAt");
            entity.Property(e => e.Role)
                .HasMaxLength(10)
                .HasColumnName("role");
            entity.Property(e => e.Text).HasColumnName("text");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysdatetimeoffset())", "DF_ChatHistory_updatedAt")
                .HasColumnName("updatedAt");
        });

        modelBuilder.Entity<ChiTietDonHang>(entity =>
        {
            entity.ToTable("ChiTietDonHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.DonGia)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("don_gia");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.SkuLucMua)
                .HasMaxLength(100)
                .HasColumnName("sku_luc_mua");
            entity.Property(e => e.SoLuong).HasColumnName("so_luong");
            entity.Property(e => e.TenSpLucMua)
                .HasMaxLength(255)
                .HasColumnName("ten_sp_luc_mua");
            entity.Property(e => e.ThanhTien)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("thanh_tien");

            entity.HasOne(d => d.BienThe).WithMany(p => p.ChiTietDonHangs)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChiTiet_BienThe");

            entity.HasOne(d => d.DonHang).WithMany(p => p.ChiTietDonHangs)
                .HasForeignKey(d => d.DonHangId)
                .HasConstraintName("FK_ChiTiet_DonHang");
        });

        modelBuilder.Entity<ChiTietKiemKho>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChiTietK__3213E83F71C3BDDE");

            entity.ToTable("ChiTietKiemKho");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.PhieuKiemId).HasColumnName("phieu_kiem_id");
            entity.Property(e => e.SoLuongHeThong)
                .HasDefaultValue(0)
                .HasColumnName("so_luong_he_thong");
            entity.Property(e => e.SoLuongThucTe)
                .HasDefaultValue(0)
                .HasColumnName("so_luong_thuc_te");

            entity.HasOne(d => d.BienThe).WithMany(p => p.ChiTietKiemKhos)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ChiTietKi__bien___77DFC722");

            entity.HasOne(d => d.PhieuKiem).WithMany(p => p.ChiTietKiemKhos)
                .HasForeignKey(d => d.PhieuKiemId)
                .HasConstraintName("FK__ChiTietKi__phieu__76EBA2E9");
        });

        modelBuilder.Entity<ChiTietPhieuNhap>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChiTietP__3213E83F88B66B11");

            entity.ToTable("ChiTietPhieuNhap");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.DonGiaNhap)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("don_gia_nhap");
            entity.Property(e => e.GiamGia)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("giam_gia");
            entity.Property(e => e.PhieuNhapId).HasColumnName("phieu_nhap_id");
            entity.Property(e => e.SoLuong)
                .HasDefaultValue(1)
                .HasColumnName("so_luong");

            entity.HasOne(d => d.BienThe).WithMany(p => p.ChiTietPhieuNhaps)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ChiTietPh__bien___65C116E7");

            entity.HasOne(d => d.PhieuNhap).WithMany(p => p.ChiTietPhieuNhaps)
                .HasForeignKey(d => d.PhieuNhapId)
                .HasConstraintName("FK__ChiTietPh__phieu__64CCF2AE");
        });

        modelBuilder.Entity<DanhGiaCuaHang>(entity =>
        {
            entity.ToTable("DanhGiaCuaHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.NoiDung).HasColumnName("noi_dung");
            entity.Property(e => e.SoSao).HasColumnName("so_sao");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.DanhGiaCuaHangs)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaCS_TaiKhoan");
        });

        modelBuilder.Entity<DanhGiaDonHang>(entity =>
        {
            entity.ToTable("DanhGiaDonHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.NoiDung).HasColumnName("noi_dung");
            entity.Property(e => e.SoSaoDongGoi).HasColumnName("so_sao_dong_goi");
            entity.Property(e => e.SoSaoGiaoHang).HasColumnName("so_sao_giao_hang");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");

            entity.HasOne(d => d.DonHang).WithMany(p => p.DanhGiaDonHangs)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaDH_DonHang");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.DanhGiaDonHangs)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaDH_TaiKhoan");
        });

        modelBuilder.Entity<DanhGiaSanPham>(entity =>
        {
            entity.ToTable("DanhGiaSanPham");

            entity.HasIndex(e => e.SanPhamId, "IX_DanhGiaSP_SanPhamId");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.HinhAnh).HasColumnName("hinh_anh");
            entity.Property(e => e.NoiDung).HasColumnName("noi_dung");
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.SanPhamId).HasColumnName("san_pham_id");
            entity.Property(e => e.SoSao).HasColumnName("so_sao");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.DonHang).WithMany(p => p.DanhGiaSanPhams)
                .HasForeignKey(d => d.DonHangId)
                .HasConstraintName("FK_DanhGiaSP_DonHang");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_DanhGiaSanPham_Parent");

            entity.HasOne(d => d.SanPham).WithMany(p => p.DanhGiaSanPhams)
                .HasForeignKey(d => d.SanPhamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaSP_SanPham");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.DanhGiaSanPhams)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DanhGiaSP_TaiKhoan");
        });

        modelBuilder.Entity<DanhMuc>(entity =>
        {
            entity.ToTable("DanhMuc");

            entity.HasIndex(e => e.Slug, "UQ_DanhMuc_Slug").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DanhMucChaId).HasColumnName("danh_muc_cha_id");
            entity.Property(e => e.HienThiSidebar)
                .HasDefaultValue(true)
                .HasColumnName("hien_thi_sidebar");
            entity.Property(e => e.HinhAnh)
                .HasMaxLength(255)
                .HasColumnName("hinh_anh");
            entity.Property(e => e.MoTa).HasColumnName("mo_ta");
            entity.Property(e => e.Slug)
                .HasMaxLength(100)
                .HasColumnName("slug");
            entity.Property(e => e.TenDanhMuc)
                .HasMaxLength(100)
                .HasColumnName("ten_danh_muc");
            entity.Property(e => e.ThuTu).HasColumnName("thu_tu");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.DanhMucCha).WithMany(p => p.InverseDanhMucCha)
                .HasForeignKey(d => d.DanhMucChaId)
                .HasConstraintName("FK_DanhMuc_ChaId");
        });

        modelBuilder.Entity<DiaChiGiaoHang>(entity =>
        {
            entity.ToTable("DiaChiGiaoHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiaChiCuThe)
                .HasMaxLength(255)
                .HasColumnName("dia_chi_cu_the");
            entity.Property(e => e.HoTenNguoiNhan)
                .HasMaxLength(100)
                .HasColumnName("ho_ten_nguoi_nhan");
            entity.Property(e => e.LaMacDinh).HasColumnName("la_mac_dinh");
            entity.Property(e => e.PhuongXa)
                .HasMaxLength(100)
                .HasColumnName("phuong_xa");
            entity.Property(e => e.QuanHuyen)
                .HasMaxLength(100)
                .HasColumnName("quan_huyen");
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .HasColumnName("so_dien_thoai");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TinhThanh)
                .HasMaxLength(100)
                .HasColumnName("tinh_thanh");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.DiaChiGiaoHangs)
                .HasForeignKey(d => d.TaiKhoanId)
                .HasConstraintName("FK_DiaChiGiaoHang_TaiKhoan");
        });

        modelBuilder.Entity<DonHang>(entity =>
        {
            entity.ToTable("DonHang");

            entity.HasIndex(e => e.TaiKhoanId, "IX_DonHang_TaiKhoanId");

            entity.HasIndex(e => e.TrangThai, "IX_DonHang_TrangThai");

            entity.HasIndex(e => e.MaDonHang, "UQ_DonHang_MaDonHang").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DiaChiCuThe)
                .HasMaxLength(500)
                .HasColumnName("dia_chi_cu_the");
            entity.Property(e => e.DiaChiId).HasColumnName("dia_chi_id");
            entity.Property(e => e.DonViVcId).HasColumnName("don_vi_vc_id");
            entity.Property(e => e.GhiChu).HasColumnName("ghi_chu");
            entity.Property(e => e.HoTenNguoiNhan)
                .HasMaxLength(255)
                .HasColumnName("ho_ten_nguoi_nhan");
            entity.Property(e => e.KhuyenMaiId).HasColumnName("khuyen_mai_id");
            entity.Property(e => e.MaDonHang)
                .HasMaxLength(30)
                .HasColumnName("ma_don_hang");
            entity.Property(e => e.MaVanDon)
                .HasMaxLength(100)
                .HasColumnName("ma_van_don");
            entity.Property(e => e.PhiVanChuyen)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("phi_van_chuyen");
            entity.Property(e => e.PhuongXa)
                .HasMaxLength(255)
                .HasColumnName("phuong_xa");
            entity.Property(e => e.QuanHuyen)
                .HasMaxLength(255)
                .HasColumnName("quan_huyen");
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(50)
                .HasColumnName("so_dien_thoai");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TienGiamGia)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tien_giam_gia");
            entity.Property(e => e.TinhThanh)
                .HasMaxLength(255)
                .HasColumnName("tinh_thanh");
            entity.Property(e => e.TongThanhToan)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_thanh_toan");
            entity.Property(e => e.TongTienHang)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_tien_hang");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.DiaChi).WithMany(p => p.DonHangs)
                .HasForeignKey(d => d.DiaChiId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_DonHang_DiaChiGiaoHang");

            entity.HasOne(d => d.DonViVc).WithMany(p => p.DonHangs)
                .HasForeignKey(d => d.DonViVcId)
                .HasConstraintName("FK_DonHang_DonViVC");

            entity.HasOne(d => d.KhuyenMai).WithMany(p => p.DonHangs)
                .HasForeignKey(d => d.KhuyenMaiId)
                .HasConstraintName("FK_DonHang_KhuyenMai");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.DonHangs)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonHang_TaiKhoan");
        });

        modelBuilder.Entity<DonViVanChuyen>(entity =>
        {
            entity.ToTable("DonViVanChuyen");

            entity.HasIndex(e => e.Ma, "UQ_DonViVC_Ma").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApiEndpoint)
                .HasMaxLength(255)
                .HasColumnName("api_endpoint");
            entity.Property(e => e.ApiKey)
                .HasMaxLength(255)
                .HasColumnName("api_key");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(255)
                .HasColumnName("logo_url");
            entity.Property(e => e.Ma)
                .HasMaxLength(30)
                .HasColumnName("ma");
            entity.Property(e => e.PhiCoBan)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("phi_co_ban");
            entity.Property(e => e.TenDonVi)
                .HasMaxLength(100)
                .HasColumnName("ten_don_vi");
            entity.Property(e => e.ThoiGianDuKien)
                .HasMaxLength(50)
                .HasColumnName("thoi_gian_du_kien");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<GiaoDichThanhToan>(entity =>
        {
            entity.ToTable("GiaoDichThanhToan");

            entity.HasIndex(e => e.DonHangId, "IX_GiaoDich_DonHangId");

            entity.HasIndex(e => e.MaGiaoDich, "UQ_GiaoDich_Ma").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.MaGiaoDich)
                .HasMaxLength(255)
                .HasColumnName("ma_giao_dich");
            entity.Property(e => e.MaGiaoDichDoiTac)
                .HasMaxLength(100)
                .HasColumnName("ma_giao_dich_doi_tac");
            entity.Property(e => e.PhuongThucId).HasColumnName("phuong_thuc_id");
            entity.Property(e => e.ResponseData).HasColumnName("response_data");
            entity.Property(e => e.SoTien)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("so_tien");
            entity.Property(e => e.ThoiGianThanhToan).HasColumnName("thoi_gian_thanh_toan");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("trang_thai");

            entity.HasOne(d => d.DonHang).WithMany(p => p.GiaoDichThanhToans)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GiaoDich_DonHang");

            entity.HasOne(d => d.PhuongThuc).WithMany(p => p.GiaoDichThanhToans)
                .HasForeignKey(d => d.PhuongThucId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GiaoDich_PhuongThuc");
        });

        modelBuilder.Entity<GioHang>(entity =>
        {
            entity.ToTable("GioHang");

            entity.HasIndex(e => new { e.TaiKhoanId, e.BienTheId }, "UQ_GioHang").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.SoLuong)
                .HasDefaultValue(1)
                .HasColumnName("so_luong");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.BienThe).WithMany(p => p.GioHangs)
                .HasForeignKey(d => d.BienTheId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GioHang_BienThe");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.GioHangs)
                .HasForeignKey(d => d.TaiKhoanId)
                .HasConstraintName("FK_GioHang_TaiKhoan");
        });

        modelBuilder.Entity<HinhAnhSanPham>(entity =>
        {
            entity.ToTable("HinhAnhSanPham");

            entity.HasIndex(e => new { e.SanPhamId, e.BienTheId }, "IX_HinhAnh_SanPhamId_BienTheId");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AltText)
                .HasMaxLength(255)
                .HasColumnName("alt_text");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.LaAnhChinh).HasColumnName("la_anh_chinh");
            entity.Property(e => e.SanPhamId).HasColumnName("san_pham_id");
            entity.Property(e => e.ThuTu).HasColumnName("thu_tu");
            entity.Property(e => e.UrlAnh)
                .HasMaxLength(255)
                .HasColumnName("url_anh");

            entity.HasOne(d => d.BienThe).WithMany(p => p.HinhAnhSanPhams)
                .HasForeignKey(d => d.BienTheId)
                .HasConstraintName("FK_HinhAnhSanPham_BienThe");

            entity.HasOne(d => d.SanPham).WithMany(p => p.HinhAnhSanPhams)
                .HasForeignKey(d => d.SanPhamId)
                .HasConstraintName("FK_HinhAnhSanPham_SanPham");
        });

        modelBuilder.Entity<HoaDonDienTu>(entity =>
        {
            entity.ToTable("HoaDonDienTu");

            entity.HasIndex(e => e.MaHoaDon, "UQ_HoaDon_Ma").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiaChiNguoiMua)
                .HasMaxLength(255)
                .HasColumnName("dia_chi_nguoi_mua");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.MaHoaDon)
                .HasMaxLength(50)
                .HasColumnName("ma_hoa_don");
            entity.Property(e => e.MaSoThue)
                .HasMaxLength(20)
                .HasColumnName("ma_so_thue");
            entity.Property(e => e.NgayXuat)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("ngay_xuat");
            entity.Property(e => e.TenNguoiMua)
                .HasMaxLength(100)
                .HasColumnName("ten_nguoi_mua");
            entity.Property(e => e.TienVat)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tien_vat");
            entity.Property(e => e.TongTienChuaVat)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_tien_chua_vat");
            entity.Property(e => e.TongTienVat)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_tien_vat");
            entity.Property(e => e.UrlPdf)
                .HasMaxLength(255)
                .HasColumnName("url_pdf");

            entity.HasOne(d => d.DonHang).WithMany(p => p.HoaDonDienTus)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HoaDon_DonHang");
        });

        modelBuilder.Entity<Kho>(entity =>
        {
            entity.ToTable("Kho");

            entity.HasIndex(e => e.BienTheId, "UQ_Kho_BienThe").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BienTheId).HasColumnName("bien_the_id");
            entity.Property(e => e.NguongCanhBao)
                .HasDefaultValue(5)
                .HasColumnName("nguong_canh_bao");
            entity.Property(e => e.SoLuongGiuCho).HasColumnName("so_luong_giu_cho");
            entity.Property(e => e.SoLuongTon).HasColumnName("so_luong_ton");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.ViTriKho)
                .HasMaxLength(50)
                .HasColumnName("vi_tri_kho");

            entity.HasOne(d => d.BienThe).WithOne(p => p.Kho)
                .HasForeignKey<Kho>(d => d.BienTheId)
                .HasConstraintName("FK_Kho_BienThe");
        });

        modelBuilder.Entity<KhuyenMai>(entity =>
        {
            entity.ToTable("KhuyenMai");

            entity.HasIndex(e => e.MaKhuyenMai, "UQ_KhuyenMai_Ma").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DaSuDung).HasColumnName("da_su_dung");
            entity.Property(e => e.DonHangToiThieu)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("don_hang_toi_thieu");
            entity.Property(e => e.GiaTri)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("gia_tri");
            entity.Property(e => e.GiaTriToiDa)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("gia_tri_toi_da");
            entity.Property(e => e.Loai)
                .HasMaxLength(20)
                .HasColumnName("loai");
            entity.Property(e => e.MaKhuyenMai)
                .HasMaxLength(50)
                .HasColumnName("ma_khuyen_mai");
            entity.Property(e => e.NgayBatDau).HasColumnName("ngay_bat_dau");
            entity.Property(e => e.NgayKetThuc).HasColumnName("ngay_ket_thuc");
            entity.Property(e => e.SoLuongMa).HasColumnName("so_luong_ma");
            entity.Property(e => e.TenChuongTrinh)
                .HasMaxLength(150)
                .HasColumnName("ten_chuong_trinh");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<LichSuDungVoucher>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LichSuDu__3213E83FFB2D0DB1");

            entity.ToTable("LichSuDungVoucher");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.KhuyenMaiId).HasColumnName("khuyen_mai_id");
            entity.Property(e => e.NgaySuDung)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("ngay_su_dung");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");

            entity.HasOne(d => d.DonHang).WithMany(p => p.LichSuDungVouchers)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSuVoucher_DonHang");

            entity.HasOne(d => d.KhuyenMai).WithMany(p => p.LichSuDungVouchers)
                .HasForeignKey(d => d.KhuyenMaiId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSuVoucher_KhuyenMai");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.LichSuDungVouchers)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LichSuVoucher_TaiKhoan");
        });

        modelBuilder.Entity<LichSuGiaoHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LichSuGi__3213E83FF628C2D1");

            entity.ToTable("LichSuGiaoHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.Lat)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("lat");
            entity.Property(e => e.Lng)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("lng");
            entity.Property(e => e.MoTa)
                .HasMaxLength(1000)
                .HasColumnName("mo_ta");
            entity.Property(e => e.ThoiGian).HasColumnName("thoi_gian");
            entity.Property(e => e.TieuDe)
                .HasMaxLength(255)
                .HasColumnName("tieu_de");

            entity.HasOne(d => d.DonHang).WithMany(p => p.LichSuGiaoHangs)
                .HasForeignKey(d => d.DonHangId)
                .HasConstraintName("FK__LichSuGia__don_h__23F3538A");
        });

        modelBuilder.Entity<MauIn>(entity =>
        {
            entity.ToTable("MauIn");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.LaMacDinh).HasColumnName("la_mac_dinh");
            entity.Property(e => e.Loai)
                .HasMaxLength(30)
                .HasColumnName("loai");
            entity.Property(e => e.NoiDungHtml).HasColumnName("noi_dung_html");
            entity.Property(e => e.TenMau)
                .HasMaxLength(100)
                .HasColumnName("ten_mau");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<NhaCungCap>(entity =>
        {
            entity.ToTable("NhaCungCap");

            entity.HasIndex(e => e.MaSoThue, "UQ_NhaCungCap_MaSoThue")
                .IsUnique()
                .HasFilter("([ma_so_thue] IS NOT NULL)");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiaChi)
                .HasMaxLength(255)
                .HasColumnName("dia_chi");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.GhiChu).HasColumnName("ghi_chu");
            entity.Property(e => e.MaSoThue)
                .HasMaxLength(20)
                .HasColumnName("ma_so_thue");
            entity.Property(e => e.QuocGia)
                .HasMaxLength(50)
                .HasColumnName("quoc_gia");
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .HasColumnName("so_dien_thoai");
            entity.Property(e => e.TenNhaCc)
                .HasMaxLength(150)
                .HasColumnName("ten_nha_cc");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<PhieuKiemKho>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PhieuKie__3213E83FE875517B");

            entity.ToTable("PhieuKiemKho");

            entity.HasIndex(e => e.MaPhieu, "UQ__PhieuKie__11D0F07B6633C758").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.GhiChu).HasColumnName("ghi_chu");
            entity.Property(e => e.LenhGiam)
                .HasDefaultValue(0)
                .HasColumnName("lenh_giam");
            entity.Property(e => e.LenhTang)
                .HasDefaultValue(0)
                .HasColumnName("lenh_tang");
            entity.Property(e => e.MaPhieu)
                .HasMaxLength(20)
                .HasColumnName("ma_phieu");
            entity.Property(e => e.NguoiTao).HasColumnName("nguoi_tao");
            entity.Property(e => e.TongChenhLech)
                .HasDefaultValue(0)
                .HasColumnName("tong_chenh_lech");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("balanced")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(d => d.NguoiTaoNavigation).WithMany(p => p.PhieuKiemKhos)
                .HasForeignKey(d => d.NguoiTao)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__PhieuKiem__nguoi__7226EDCC");
        });

        modelBuilder.Entity<PhieuNhapHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PhieuNha__3213E83F40C929C4");

            entity.ToTable("PhieuNhapHang");

            entity.HasIndex(e => e.MaPhieu, "UQ__PhieuNha__11D0F07BE35A6FEB").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.GhiChu).HasColumnName("ghi_chu");
            entity.Property(e => e.GiamGia)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("giam_gia");
            entity.Property(e => e.MaPhieu)
                .HasMaxLength(20)
                .HasColumnName("ma_phieu");
            entity.Property(e => e.NguoiTao).HasColumnName("nguoi_tao");
            entity.Property(e => e.NhaCcId).HasColumnName("nha_cc_id");
            entity.Property(e => e.TongTien)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_tien");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("draft")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(d => d.NguoiTaoNavigation).WithMany(p => p.PhieuNhapHangs)
                .HasForeignKey(d => d.NguoiTao)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__PhieuNhap__nguoi__5F141958");

            entity.HasOne(d => d.NhaCc).WithMany(p => p.PhieuNhapHangs)
                .HasForeignKey(d => d.NhaCcId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__PhieuNhap__nha_c__5E1FF51F");
        });

        modelBuilder.Entity<PhuongThucThanhToan>(entity =>
        {
            entity.ToTable("PhuongThucThanhToan");

            entity.HasIndex(e => e.Ma, "UQ_PTTT_Ma").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CauHinh).HasColumnName("cau_hinh");
            entity.Property(e => e.Loai)
                .HasMaxLength(20)
                .HasColumnName("loai");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(255)
                .HasColumnName("logo_url");
            entity.Property(e => e.Ma)
                .HasMaxLength(50)
                .HasColumnName("ma");
            entity.Property(e => e.PhiThanhToan)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("phi_thanh_toan");
            entity.Property(e => e.TenPhuongThuc)
                .HasMaxLength(100)
                .HasColumnName("ten_phuong_thuc");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
        });

        modelBuilder.Entity<QuanLyNguoiDung>(entity =>
        {
            entity.ToTable("QuanLyNguoiDung");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiemTichLuy).HasColumnName("diem_tich_luy");
            entity.Property(e => e.GhiChuNoiBo).HasColumnName("ghi_chu_noi_bo");
            entity.Property(e => e.LanDangNhapCuoi).HasColumnName("lan_dang_nhap_cuoi");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TongChiTieu)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_chi_tieu");
            entity.Property(e => e.TongDonHang).HasColumnName("tong_don_hang");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.QuanLyNguoiDungs)
                .HasForeignKey(d => d.TaiKhoanId)
                .HasConstraintName("FK_QuanLyNguoiDung_TaiKhoan");
        });

        modelBuilder.Entity<SanPham>(entity =>
        {
            entity.ToTable("SanPham");

            entity.HasIndex(e => e.DanhMucId, "IX_SanPham_DanhMucId");

            entity.HasIndex(e => e.Slug, "UQ_SanPham_Slug").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CanNang).HasColumnName("can_nang");
            entity.Property(e => e.ChieuCao).HasColumnName("chieu_cao");
            entity.Property(e => e.ChieuDai).HasColumnName("chieu_dai");
            entity.Property(e => e.ChieuRong).HasColumnName("chieu_rong");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DanhMucId).HasColumnName("danh_muc_id");
            entity.Property(e => e.LuotMua).HasColumnName("luot_mua");
            entity.Property(e => e.LuotXem).HasColumnName("luot_xem");
            entity.Property(e => e.MetaDescription)
                .HasMaxLength(500)
                .HasColumnName("meta_description");
            entity.Property(e => e.MetaTitle)
                .HasMaxLength(255)
                .HasColumnName("meta_title");
            entity.Property(e => e.MoTaDayDu).HasColumnName("mo_ta_day_du");
            entity.Property(e => e.MoTaNgan)
                .HasMaxLength(500)
                .HasColumnName("mo_ta_ngan");
            entity.Property(e => e.NhaCungCapId).HasColumnName("nha_cung_cap_id");
            entity.Property(e => e.NoiBat).HasColumnName("noi_bat");
            entity.Property(e => e.Slug)
                .HasMaxLength(255)
                .HasColumnName("slug");
            entity.Property(e => e.TenSanPham)
                .HasMaxLength(255)
                .HasColumnName("ten_san_pham");
            entity.Property(e => e.ThuongHieu)
                .HasMaxLength(100)
                .HasColumnName("thuong_hieu");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("draft")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.DanhMuc).WithMany(p => p.SanPhams)
                .HasForeignKey(d => d.DanhMucId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SanPham_DanhMuc");

            entity.HasOne(d => d.NhaCungCap).WithMany(p => p.SanPhams)
                .HasForeignKey(d => d.NhaCungCapId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SanPham_NhaCungCap");
        });

        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.ToTable("TaiKhoan");

            entity.HasIndex(e => e.Email, "UQ_TaiKhoan_Email").IsUnique();

            entity.HasIndex(e => e.SoDienThoai, "UQ_TaiKhoan_SoDienThoai").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AnhDaiDien)
                .HasMaxLength(255)
                .HasColumnName("anh_dai_dien");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DiemTichLuy)
                .HasDefaultValue(0)
                .HasColumnName("diem_tich_luy");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.GioiTinh)
                .HasMaxLength(10)
                .HasColumnName("gioi_tinh");
            entity.Property(e => e.HoTen)
                .HasMaxLength(100)
                .HasColumnName("ho_ten");
            entity.Property(e => e.MatKhau)
                .HasMaxLength(255)
                .HasColumnName("mat_khau");
            entity.Property(e => e.NgaySinh).HasColumnName("ngay_sinh");
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .HasColumnName("so_dien_thoai");
            entity.Property(e => e.TheThanhVienId).HasColumnName("the_thanh_vien_id");
            entity.Property(e => e.TongChiTieu)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("tong_chi_tieu");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("active")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.VaiTro)
                .HasMaxLength(20)
                .HasDefaultValue("customer")
                .HasColumnName("vai_tro");

            entity.HasOne(d => d.TheThanhVien).WithMany(p => p.TaiKhoans)
                .HasForeignKey(d => d.TheThanhVienId)
                .HasConstraintName("FK_TaiKhoan_TheThanhVien");
        });

        modelBuilder.Entity<TheThanhVien>(entity =>
        {
            entity.ToTable("TheThanhVien");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiemThuongThem).HasColumnName("diem_thuong_them");
            entity.Property(e => e.MauThe)
                .HasMaxLength(20)
                .HasColumnName("mau_the");
            entity.Property(e => e.MoTaQuyenLoi).HasColumnName("mo_ta_quyen_loi");
            entity.Property(e => e.MucChiTieuDen)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("muc_chi_tieu_den");
            entity.Property(e => e.MucChiTieuTu)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("muc_chi_tieu_tu");
            entity.Property(e => e.TenHang)
                .HasMaxLength(50)
                .HasColumnName("ten_hang");
            entity.Property(e => e.TyLeGiamGia)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("ty_le_giam_gia");
        });

        modelBuilder.Entity<ThichDanhGium>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ThichDan__3213E83F8AE680FA");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.DanhGiaId).HasColumnName("danh_gia_id");
            entity.Property(e => e.Loai)
                .HasMaxLength(20)
                .HasColumnName("loai");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(d => d.DanhGia).WithMany(p => p.ThichDanhGia)
                .HasForeignKey(d => d.DanhGiaId)
                .HasConstraintName("FK__ThichDanh__danh___7ABC33CD");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.ThichDanhGia)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ThichDanh__tai_k__7BB05806");
        });

        modelBuilder.Entity<ThietLapCuaHang>(entity =>
        {
            entity.ToTable("ThietLapCuaHang");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BaoTriHeThong)
                .HasDefaultValue(false)
                .HasColumnName("bao_tri_he_thong");
            entity.Property(e => e.ChinhSachBaoMat).HasColumnName("chinh_sach_bao_mat");
            entity.Property(e => e.ChinhSachDoiTra).HasColumnName("chinh_sach_doi_tra");
            entity.Property(e => e.ChoPhepDanhGia)
                .HasDefaultValue(true)
                .HasColumnName("cho_phep_danh_gia");
            entity.Property(e => e.DiaChi)
                .HasMaxLength(255)
                .HasColumnName("dia_chi");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.EmailNhanThongBao)
                .HasMaxLength(255)
                .HasColumnName("email_nhan_thong_bao");
            entity.Property(e => e.FacebookUrl)
                .HasMaxLength(255)
                .HasColumnName("facebook_url");
            entity.Property(e => e.FaviconUrl)
                .HasMaxLength(255)
                .HasColumnName("favicon_url");
            entity.Property(e => e.GuiEmailTuDong)
                .HasDefaultValue(true)
                .HasColumnName("gui_email_tu_dong");
            entity.Property(e => e.InstagramUrl)
                .HasMaxLength(255)
                .HasColumnName("instagram_url");
            entity.Property(e => e.LamTronTien)
                .HasDefaultValue(false)
                .HasColumnName("lam_tron_tien");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(255)
                .HasColumnName("logo_url");
            entity.Property(e => e.NguongBaoHetHang)
                .HasDefaultValue(10)
                .HasColumnName("nguong_bao_het_hang");
            entity.Property(e => e.SmtpHost)
                .HasMaxLength(255)
                .HasDefaultValue("smtp.gmail.com")
                .HasColumnName("smtp_host");
            entity.Property(e => e.SmtpPass)
                .HasMaxLength(255)
                .HasColumnName("smtp_pass");
            entity.Property(e => e.SmtpPort)
                .HasDefaultValue(587)
                .HasColumnName("smtp_port");
            entity.Property(e => e.SmtpUser)
                .HasMaxLength(255)
                .HasColumnName("smtp_user");
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .HasColumnName("so_dien_thoai");
            entity.Property(e => e.TenCuaHang)
                .HasMaxLength(150)
                .HasColumnName("ten_cua_hang");
            entity.Property(e => e.TiktokUrl)
                .HasMaxLength(255)
                .HasColumnName("tiktok_url");
            entity.Property(e => e.TuDongDuyetDon)
                .HasDefaultValue(true)
                .HasColumnName("tu_dong_duyet_don");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.VietqrAccountName)
                .HasMaxLength(100)
                .HasColumnName("vietqr_account_name");
            entity.Property(e => e.VietqrAccountNo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("vietqr_account_no");
            entity.Property(e => e.VietqrBankBin)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("vietqr_bank_bin");
            entity.Property(e => e.Zalo)
                .HasMaxLength(50)
                .HasColumnName("zalo");
        });

        modelBuilder.Entity<ThongBao>(entity =>
        {
            entity.ToTable("ThongBao");

            entity.HasIndex(e => new { e.TaiKhoanId, e.DaDoc }, "IX_ThongBao_TaiKhoanId_DaDoc");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DaDoc).HasColumnName("da_doc");
            entity.Property(e => e.DuongDan)
                .HasMaxLength(255)
                .HasColumnName("duong_dan");
            entity.Property(e => e.Loai)
                .HasMaxLength(20)
                .HasDefaultValue("system")
                .HasColumnName("loai");
            entity.Property(e => e.NoiDung).HasColumnName("noi_dung");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TieuDe)
                .HasMaxLength(150)
                .HasColumnName("tieu_de");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.ThongBaos)
                .HasForeignKey(d => d.TaiKhoanId)
                .HasConstraintName("FK_ThongBao_TaiKhoan");
        });

        modelBuilder.Entity<ThuocTinhSanPham>(entity =>
        {
            entity.ToTable("ThuocTinhSanPham");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.GiaTri)
                .HasMaxLength(255)
                .HasColumnName("gia_tri");
            entity.Property(e => e.Nhom)
                .HasMaxLength(50)
                .HasColumnName("nhom");
            entity.Property(e => e.SanPhamId).HasColumnName("san_pham_id");
            entity.Property(e => e.TenThuocTinh)
                .HasMaxLength(100)
                .HasColumnName("ten_thuoc_tinh");
            entity.Property(e => e.ThuTu).HasColumnName("thu_tu");

            entity.HasOne(d => d.SanPham).WithMany(p => p.ThuocTinhSanPhams)
                .HasForeignKey(d => d.SanPhamId)
                .HasConstraintName("FK_ThuocTinhSanPham_SanPham");
        });

        modelBuilder.Entity<TraHangHoanTien>(entity =>
        {
            entity.ToTable("TraHangHoanTien");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DonHangId).HasColumnName("don_hang_id");
            entity.Property(e => e.GhiChuXuLy).HasColumnName("ghi_chu_xu_ly");
            entity.Property(e => e.HinhAnhChungMinh).HasColumnName("hinh_anh_chung_minh");
            entity.Property(e => e.HinhThucHoan)
                .HasMaxLength(20)
                .HasColumnName("hinh_thuc_hoan");
            entity.Property(e => e.LyDo).HasColumnName("ly_do");
            entity.Property(e => e.SoTienHoan)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("so_tien_hoan");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .HasColumnName("trang_thai");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.DonHang).WithMany(p => p.TraHangHoanTiens)
                .HasForeignKey(d => d.DonHangId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TraHang_DonHang");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.TraHangHoanTiens)
                .HasForeignKey(d => d.TaiKhoanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TraHang_TaiKhoan");
        });

        modelBuilder.Entity<YeuThich>(entity =>
        {
            entity.ToTable("YeuThich");

            entity.HasIndex(e => new { e.TaiKhoanId, e.SanPhamId }, "UQ_YeuThich").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.SanPhamId).HasColumnName("san_pham_id");
            entity.Property(e => e.TaiKhoanId).HasColumnName("tai_khoan_id");

            entity.HasOne(d => d.SanPham).WithMany(p => p.YeuThiches)
                .HasForeignKey(d => d.SanPhamId)
                .HasConstraintName("FK_YeuThich_SanPham");

            entity.HasOne(d => d.TaiKhoan).WithMany(p => p.YeuThiches)
                .HasForeignKey(d => d.TaiKhoanId)
                .HasConstraintName("FK_YeuThich_TaiKhoan");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
