const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ThuocTinhSanPham = sequelize.define(
  "ThuocTinhSanPham",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    san_pham_id: { type: DataTypes.INTEGER, allowNull: false },
    ten_thuoc_tinh: { type: DataTypes.STRING(100) },
    gia_tri: { type: DataTypes.STRING(255) },
    nhom: { type: DataTypes.STRING(50) },
    thu_tu: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "ThuocTinhSanPham",
    timestamps: false,
  },
);

module.exports = ThuocTinhSanPham;
