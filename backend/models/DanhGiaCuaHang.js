const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DanhGiaCuaHang = sequelize.define(
  "DanhGiaCuaHang",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tai_khoan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    so_sao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    noi_dung: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.STRING(20),
      defaultValue: "pending", // pending, approved, hidden
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "DanhGiaCuaHang",
    timestamps: false,
  }
);

module.exports = DanhGiaCuaHang;
