const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const YeuThich = sequelize.define(
  "YeuThich",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tai_khoan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    san_pham_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "YeuThich",
    timestamps: false,
  },
);

module.exports = YeuThich;
