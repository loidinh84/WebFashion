const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ThichDanhGia = sequelize.define(
  "ThichDanhGia",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    danh_gia_id: { type: DataTypes.BIGINT, allowNull: false },
    tai_khoan_id: { type: DataTypes.BIGINT, allowNull: false },
    loai: { 
      type: DataTypes.STRING(20), 
      allowNull: false,
      validate: {
        isIn: [['like', 'dislike']]
      }
    },
  },
  {
    tableName: "ThichDanhGia",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = ThichDanhGia;
