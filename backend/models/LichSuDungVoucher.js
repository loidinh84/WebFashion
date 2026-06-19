const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LichSuDungVoucher = sequelize.define(
  "LichSuDungVoucher",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    tai_khoan_id: { type: DataTypes.BIGINT, allowNull: false },
    khuyen_mai_id: { type: DataTypes.BIGINT, allowNull: false },
    don_hang_id: { type: DataTypes.BIGINT, allowNull: false },
    ngay_su_dung: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "LichSuDungVoucher", timestamps: false },
);

module.exports = LichSuDungVoucher;
