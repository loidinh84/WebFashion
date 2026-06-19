const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SanPham = sequelize.define(
  "SanPham",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ten_san_pham: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    danh_muc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nha_cung_cap_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mo_ta_ngan: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    mo_ta_day_du: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thuong_hieu: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    noi_bat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    luot_xem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    can_nang: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    chieu_dai: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    chieu_rong: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    chieu_cao: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "SanPham",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const BienTheSanPham = require("./BienTheSanPham");
const ThuocTinhSanPham = require("./ThuocTinhSanPham");
const HinhAnhSanPham = require("./HinhAnhSanPham");
const DanhGiaSanPham = require("./DanhGiaSanPham");

SanPham.hasMany(BienTheSanPham, { foreignKey: "san_pham_id", as: "bien_the" });
BienTheSanPham.belongsTo(SanPham, { foreignKey: "san_pham_id" });

SanPham.hasMany(ThuocTinhSanPham, {
  foreignKey: "san_pham_id",
  as: "thuoc_tinh",
});
ThuocTinhSanPham.belongsTo(SanPham, { foreignKey: "san_pham_id" });

SanPham.hasMany(HinhAnhSanPham, { foreignKey: "san_pham_id", as: "hinh_anh" });
HinhAnhSanPham.belongsTo(SanPham, { foreignKey: "san_pham_id" });

SanPham.hasMany(DanhGiaSanPham, { foreignKey: "san_pham_id", as: "danh_gia" });
DanhGiaSanPham.belongsTo(SanPham, { foreignKey: "san_pham_id" });

module.exports = SanPham;
