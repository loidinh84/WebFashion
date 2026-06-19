const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GioHang = sequelize.define(
  "GioHang",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    tai_khoan_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "TaiKhoan",
        key: "id",
      },
    },
    bien_the_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "BienTheSanPham",
        key: "id",
      },
    },
    so_luong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "GioHang",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = GioHang;
