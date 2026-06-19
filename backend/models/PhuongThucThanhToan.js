const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PhuongThucThanhToan = sequelize.define(
  "PhuongThucThanhToan",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ten_phuong_thuc: { type: DataTypes.STRING(100), allowNull: false },
    ma: { type: DataTypes.STRING(50), allowNull: false },
    loai: { type: DataTypes.STRING(20) },
    logo_url: { type: DataTypes.STRING(255) },
    cau_hinh: { type: DataTypes.TEXT },
    phi_thanh_toan: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "active" },
  },
  {
    tableName: "PhuongThucThanhToan",
    timestamps: false,
  },
);

module.exports = PhuongThucThanhToan;
