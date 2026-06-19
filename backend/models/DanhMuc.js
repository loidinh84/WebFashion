const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DanhMuc = sequelize.define(
  "DanhMuc",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ten_danh_muc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    danh_muc_cha_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    thu_tu: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    hinh_anh: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mo_ta: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
    hien_thi_sidebar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "DanhMuc",
    timestamps: false,
  },
);

module.exports = DanhMuc;
