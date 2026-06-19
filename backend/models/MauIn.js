const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MauIn = sequelize.define(
  "MauIn",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ten_mau: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    loai: { 
      type: DataTypes.STRING(50), 
      allowNull: false 
    },
    noi_dung_html: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    la_mac_dinh: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    trang_thai: { 
      type: DataTypes.STRING(40), 
      defaultValue: "active" 
    }
  },
  {
    tableName: "MauIn",
    timestamps: false,
  }
);

module.exports = MauIn;
