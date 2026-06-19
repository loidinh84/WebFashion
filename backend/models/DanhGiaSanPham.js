const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DanhGiaSanPham = sequelize.define(
  "DanhGiaSanPham",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    san_pham_id: { type: DataTypes.BIGINT, allowNull: false },
    tai_khoan_id: { type: DataTypes.BIGINT, allowNull: false },
    don_hang_id: { type: DataTypes.BIGINT, allowNull: true },
    so_sao: { type: DataTypes.INTEGER, allowNull: true },
    noi_dung: { type: DataTypes.TEXT, allowNull: false },
    hinh_anh: { type: DataTypes.STRING(255), allowNull: true },
    trang_thai: { type: DataTypes.STRING(20), defaultValue: "pending" },
    parent_id: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    tableName: "DanhGiaSanPham",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Bảng của bạn chỉ có created_at
  },
);

// Khai báo quan hệ với Tài Khoản (để lấy tên người đánh giá)
const TaiKhoan = require("./TaiKhoan");
DanhGiaSanPham.belongsTo(TaiKhoan, {
  foreignKey: "tai_khoan_id",
  as: "nguoi_dung",
});

module.exports = DanhGiaSanPham;
