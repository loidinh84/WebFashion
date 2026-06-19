const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ThietLapCuaHang = sequelize.define(
  "ThietLapCuaHang",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // THÔNG TIN CƠ BẢN
    ten_cua_hang: { type: DataTypes.STRING },
    logo_url: { type: DataTypes.TEXT },
    favicon_url: { type: DataTypes.TEXT },
    so_dien_thoai: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING },
    dia_chi: { type: DataTypes.TEXT },

    // MẠNG XÃ HỘI
    facebook_url: { type: DataTypes.STRING },
    zalo: { type: DataTypes.STRING },
    tiktok_url: { type: DataTypes.STRING },
    instagram_url: { type: DataTypes.STRING },

    // VIETQR
    vietqr_bank_bin: { type: DataTypes.STRING(20) },
    vietqr_account_no: { type: DataTypes.STRING(50) },
    vietqr_account_name: { type: DataTypes.STRING(100) },

    // TÍNH NĂNG HỆ THỐNG
    bao_tri_he_thong: { type: DataTypes.BOOLEAN, defaultValue: false },
    tu_dong_duyet_don: { type: DataTypes.BOOLEAN, defaultValue: true },
    cho_phep_danh_gia: { type: DataTypes.BOOLEAN, defaultValue: true },
    gui_email_tu_dong: { type: DataTypes.BOOLEAN, defaultValue: true },
    lam_tron_tien: { type: DataTypes.BOOLEAN, defaultValue: false },

    // CẤU HÌNH SMTP & THÔNG BÁO
    smtp_host: { type: DataTypes.STRING, defaultValue: "smtp.gmail.com" },
    smtp_port: { type: DataTypes.INTEGER, defaultValue: 587 },
    smtp_user: { type: DataTypes.STRING },
    smtp_pass: { type: DataTypes.STRING },
    email_nhan_thong_bao: { type: DataTypes.STRING },
    nguong_bao_het_hang: { type: DataTypes.INTEGER, defaultValue: 10 },

    // CÁC CHÍNH SÁCH VÀ THỜI GIAN
    chinh_sach_doi_tra: { type: DataTypes.TEXT },
    chinh_sach_bao_mat: { type: DataTypes.TEXT },
    updated_at: { type: DataTypes.DATE },
  },
  {
    tableName: "ThietLapCuaHang",
    timestamps: false,
  },
);

module.exports = ThietLapCuaHang;
