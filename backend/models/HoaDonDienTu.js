const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const HoaDonDienTu = sequelize.define(
  "HoaDonDienTu",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    don_hang_id: { type: DataTypes.BIGINT, allowNull: false },
    ma_hoa_don: { type: DataTypes.STRING(50) },
    ngay_xuat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ten_nguoi_mua: { type: DataTypes.STRING(255) },
    ma_so_thue: { type: DataTypes.STRING(20) },
    dia_chi_nguoi_mua: { type: DataTypes.STRING(255) },
    tong_tien_chua_vat: { type: DataTypes.DECIMAL(15, 2) },
    tien_vat: { type: DataTypes.DECIMAL(15, 2) },
    tong_tien_vat: { type: DataTypes.DECIMAL(15, 2) },
    url_pdf: { type: DataTypes.STRING(255) },
  },
  {
    tableName: "HoaDonDienTu",
    timestamps: false,
  },
);

module.exports = HoaDonDienTu;
