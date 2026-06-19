const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TheThanhVien = sequelize.define(
  "TheThanhVien",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    ten_hang: { type: DataTypes.STRING(50), allowNull: false },
    muc_chi_tieu_tu: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    muc_chi_tieu_den: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    ty_le_giam_gia: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    diem_thuong_them: { type: DataTypes.INTEGER, allowNull: false },
    mau_the: { type: DataTypes.STRING(20), allowNull: true },
    mo_ta_quyen_loi: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "TheThanhVien",
    timestamps: false,
  },
);

module.exports = TheThanhVien;
