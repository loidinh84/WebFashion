const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Banner = db.define(
  "Banner",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tieu_de: { type: DataTypes.STRING },
    hinh_anh_url: { type: DataTypes.STRING },
    duong_dan: { type: DataTypes.STRING },
    vi_tri: { type: DataTypes.STRING },
    thu_tu: { type: DataTypes.INTEGER, defaultValue: 0 },
    ngay_bat_dau: { type: DataTypes.DATE },
    ngay_ket_thuc: { type: DataTypes.DATE },
    trang_thai: { type: DataTypes.STRING, defaultValue: "active" },
  },
  {
    tableName: "Banner",
    timestamps: false,
  },
);

module.exports = Banner;
