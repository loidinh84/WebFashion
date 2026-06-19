const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TaiKhoan = sequelize.define(
  "TaiKhoan",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    ho_ten: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    so_dien_thoai: {
      type: DataTypes.STRING(15),
      unique: true,
    },
    mat_khau: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    anh_dai_dien: {
      type: DataTypes.STRING(255),
    },
    vai_tro: {
      type: DataTypes.STRING(20),
      defaultValue: "customer",
    },
    trang_thai: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
    },
    ngay_sinh: {
      type: DataTypes.DATEONLY,
    },
    gioi_tinh: {
      type: DataTypes.STRING(10),
    },
    the_thanh_vien_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "TheThanhVien",
        key: "id",
      },
    },
    diem_tich_luy: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
    tong_chi_tieu: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  },
  {
    tableName: "TaiKhoan",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = TaiKhoan;
