const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const HinhAnhSanPham = sequelize.define(
  "HinhAnhSanPham",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    san_pham_id: { type: DataTypes.INTEGER, allowNull: false },
    bien_the_id: { type: DataTypes.INTEGER, allowNull: true },
    url_anh: { type: DataTypes.STRING(255), allowNull: false },
    alt_text: { type: DataTypes.STRING(255) },
    la_anh_chinh: { type: DataTypes.BOOLEAN, defaultValue: false },
    thu_tu: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "HinhAnhSanPham",
    timestamps: false,
  },
);

module.exports = HinhAnhSanPham;
