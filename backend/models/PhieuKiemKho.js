const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PhieuKiemKho = sequelize.define(
  "PhieuKiemKho",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ma_phieu: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nguoi_tao: { type: DataTypes.BIGINT, allowNull: true },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "balanced" }, // balanced | cancelled
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    tong_chenh_lech: { type: DataTypes.INTEGER, defaultValue: 0 },
    lenh_tang: { type: DataTypes.INTEGER, defaultValue: 0 },
    lenh_giam: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "PhieuKiemKho",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = PhieuKiemKho;
