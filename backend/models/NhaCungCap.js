const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NhaCungCap = sequelize.define(
  "NhaCungCap",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ten_nha_cc: { type: DataTypes.STRING(255), allowNull: false },
    ma_so_thue: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(255) },
    so_dien_thoai: { type: DataTypes.STRING(20) },
    dia_chi: { type: DataTypes.STRING(255) },
    quoc_gia: { type: DataTypes.STRING(100) },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "active" },
    ghi_chu: { type: DataTypes.TEXT },
  },
  {
    tableName: "NhaCungCap",
    timestamps: false,
  },
);

module.exports = NhaCungCap;
