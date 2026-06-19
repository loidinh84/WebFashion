const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BienTheSanPham = sequelize.define(
  "BienTheSanPham",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    san_pham_id: { type: DataTypes.INTEGER, allowNull: false },
    sku: { type: DataTypes.STRING(50) },
    mau_sac: { type: DataTypes.STRING(50) },
    dung_luong: { type: DataTypes.STRING(50) },
    ram: { type: DataTypes.STRING(50) },
    gia_goc: { type: DataTypes.DECIMAL(18, 0) },
    gia_ban: { type: DataTypes.DECIMAL(18, 0) },
    ton_kho: { type: DataTypes.INTEGER, defaultValue: 0 },
    ma_mau_hex: { type: DataTypes.STRING(20) },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "active" },
  },
  {
    tableName: "BienTheSanPham",
    timestamps: false,
  },
);

module.exports = BienTheSanPham;
