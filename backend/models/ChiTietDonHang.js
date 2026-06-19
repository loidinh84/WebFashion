const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChiTietDonHang = sequelize.define(
  "ChiTietDonHang",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    don_hang_id: { type: DataTypes.BIGINT, allowNull: false },
    bien_the_id: { type: DataTypes.BIGINT, allowNull: false },
    ten_sp_luc_mua: { type: DataTypes.STRING(255) },
    sku_luc_mua: { type: DataTypes.STRING(100) },
    so_luong: { type: DataTypes.INTEGER, allowNull: false },
    don_gia: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    thanh_tien: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  },
  {
    tableName: "ChiTietDonHang",
    timestamps: false,
  },
);

module.exports = ChiTietDonHang;
