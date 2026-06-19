const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChiTietPhieuNhap = sequelize.define(
  "ChiTietPhieuNhap",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    phieu_nhap_id: { type: DataTypes.BIGINT, allowNull: false },
    bien_the_id: { type: DataTypes.BIGINT, allowNull: false },
    so_luong: { type: DataTypes.INTEGER, defaultValue: 1 },
    don_gia_nhap: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    giam_gia: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  },
  {
    tableName: "ChiTietPhieuNhap",
    timestamps: false,
  }
);

module.exports = ChiTietPhieuNhap;
