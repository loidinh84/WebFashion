const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LichSuGiaoHang = sequelize.define(
  "LichSuGiaoHang",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    don_hang_id: { type: DataTypes.BIGINT, allowNull: false },
    tieu_de: { type: DataTypes.STRING(255) },
    mo_ta: { type: DataTypes.STRING(1000) },
    thoi_gian: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  },
  {
    tableName: "LichSuGiaoHang",
    timestamps: false,
  }
);

module.exports = LichSuGiaoHang;
