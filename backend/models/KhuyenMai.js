const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const KhuyenMai = sequelize.define(
  "KhuyenMai",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ma_khuyen_mai: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    ten_chuong_trinh: { type: DataTypes.STRING(150) },
    loai: { type: DataTypes.STRING(20) },
    gia_tri: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    gia_tri_toi_da: { type: DataTypes.DECIMAL(15, 2) },
    don_hang_toi_thieu: { type: DataTypes.DECIMAL(15, 2) },
    so_luong_ma: { type: DataTypes.INTEGER },
    da_su_dung: { type: DataTypes.INTEGER, defaultValue: 0 },
    ngay_bat_dau: { type: DataTypes.DATE },
    ngay_ket_thuc: { type: DataTypes.DATE },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "active" },
  },
  { tableName: "KhuyenMai", timestamps: false },
);

module.exports = KhuyenMai;
