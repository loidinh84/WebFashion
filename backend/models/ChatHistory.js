const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChatHistory = sequelize.define(
  "ChatHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "ChatHistory",
    timestamps: true, // Bắt buộc để true để dùng createdAt/updatedAt
  },
);

module.exports = ChatHistory;
