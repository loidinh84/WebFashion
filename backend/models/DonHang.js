const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DonHang = sequelize.define(
  "DonHang",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ma_don_hang: { type: DataTypes.STRING(30), allowNull: false },
    tai_khoan_id: { type: DataTypes.BIGINT, allowNull: false },
    dia_chi_id: { type: DataTypes.BIGINT, allowNull: true },
    don_vi_vc_id: { type: DataTypes.BIGINT, allowNull: true },
    khuyen_mai_id: { type: DataTypes.BIGINT, allowNull: true },
    tong_tien_hang: { type: DataTypes.DECIMAL(15, 2) },
    phi_van_chuyen: { type: DataTypes.DECIMAL(15, 2) },
    tien_giam_gia: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    tong_thanh_toan: { type: DataTypes.DECIMAL(15, 2) },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "pending" },
    ghi_chu: { type: DataTypes.STRING(255) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // Snapshot address info
    ho_ten_nguoi_nhan: { type: DataTypes.STRING(255), allowNull: true },
    so_dien_thoai: { type: DataTypes.STRING(50), allowNull: true },
    dia_chi_cu_the: { type: DataTypes.STRING(500), allowNull: true },
    tinh_thanh: { type: DataTypes.STRING(255), allowNull: true },
    quan_huyen: { type: DataTypes.STRING(255), allowNull: true },
    phuong_xa: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "DonHang",
    timestamps: false,
  },
);

module.exports = DonHang;
