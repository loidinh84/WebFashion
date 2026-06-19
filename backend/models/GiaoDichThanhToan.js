const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GiaoDichThanhToan = sequelize.define(
  "GiaoDichThanhToan",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    don_hang_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    phuong_thuc_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ma_giao_dich: {
      type: DataTypes.STRING(255),
    },
    ma_giao_dich_doi_tac: {
      type: DataTypes.STRING(255),
    },
    so_tien: {
      type: DataTypes.DECIMAL(18, 2),
    },
    trang_thai: {
      type: DataTypes.STRING(50),
    },
    thoi_gian_thanh_toan: {
      type: DataTypes.DATE,
    },
    response_data: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "GiaoDichThanhToan",
    timestamps: false,
  },
);

module.exports = GiaoDichThanhToan;
