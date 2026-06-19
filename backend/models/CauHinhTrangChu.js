const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CauHinhTrangChu = sequelize.define(
  "CauHinhTrangChu",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ten_phan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    danh_muc_id_1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ten_tab_1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    danh_muc_id_2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ten_tab_2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loai_hien_thi: {
      type: DataTypes.STRING(50),
      defaultValue: "ProductSection",
    },
    thu_tu: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    du_lieu_json: {
      type: DataTypes.TEXT, 
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
    },
  },
  {
    tableName: "CauHinhTrangChu",
    timestamps: false,
  }
);

module.exports = CauHinhTrangChu;
