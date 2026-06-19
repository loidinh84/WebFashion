const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const DiaChiGiaoHang = sequelize.define(
  "DiaChiGiaoHang",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    tai_khoan_id: { type: DataTypes.BIGINT, allowNull: false },
    ho_ten_nguoi_nhan: { type: DataTypes.STRING(255) },
    so_dien_thoai: { type: DataTypes.STRING(20) },
    dia_chi_cu_the: { type: DataTypes.STRING(255) },
    phuong_xa: { type: DataTypes.STRING(100) },
    quan_huyen: { type: DataTypes.STRING(100) },
    tinh_thanh: { type: DataTypes.STRING(100) },
    la_mac_dinh: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "DiaChiGiaoHang", timestamps: false },
);
module.exports = DiaChiGiaoHang;
