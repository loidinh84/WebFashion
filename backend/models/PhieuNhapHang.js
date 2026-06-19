const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PhieuNhapHang = sequelize.define(
  "PhieuNhapHang",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ma_phieu: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nha_cc_id: { type: DataTypes.BIGINT, allowNull: true },
    nguoi_tao: { type: DataTypes.BIGINT, allowNull: true },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "draft" }, // draft | completed | cancelled
    giam_gia: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    tong_tien: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "PhieuNhapHang",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = PhieuNhapHang;
