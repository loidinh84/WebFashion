const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChiTietKiemKho = sequelize.define(
  "ChiTietKiemKho",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    phieu_kiem_id: { type: DataTypes.BIGINT, allowNull: false },
    bien_the_id: { type: DataTypes.BIGINT, allowNull: false },
    so_luong_he_thong: { type: DataTypes.INTEGER, defaultValue: 0 },
    so_luong_thuc_te: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "ChiTietKiemKho",
    timestamps: false,
  }
);

module.exports = ChiTietKiemKho;
