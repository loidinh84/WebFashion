const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DonViVanChuyen = sequelize.define(
  "DonViVanChuyen",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ten_don_vi: { type: DataTypes.STRING(100) },
    ma: { type: DataTypes.STRING(20) },
    logo_url: { type: DataTypes.STRING(255) },
    api_key: { type: DataTypes.STRING(255) },
    api_endpoint: { type: DataTypes.STRING(255) },
    phi_co_ban: { type: DataTypes.DECIMAL(15, 2) },
    thoi_gian_du_kien: { type: DataTypes.STRING(50) },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "active" },
  },
  { tableName: "DonViVanChuyen", timestamps: false },
);

module.exports = DonViVanChuyen;
