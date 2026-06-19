const jwt = require("jsonwebtoken");
const ThietLapCuaHang = require("../models/ThietLapCuaHang");

const maintenanceMiddleware = async (req, res, next) => {
  try {
    const config = await ThietLapCuaHang.findOne({ where: { id: 1 } });

    if (config && config.bao_tri_he_thong) {
      const isGetConfig = req.path.startsWith("/api/store-settings");
      const isLogin = req.path.includes("/api/auth/login");
      const isStaticFolder = req.path.startsWith("/uploads");

      if (isGetConfig || isLogin || isStaticFolder) {
        return next();
      }

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
          );

          if (decoded.vai_tro === "admin") {
            return next(); 
          }
        } catch (err) {
        }
      }

      return res.status(503).json({
        success: false,
        message: "Hệ thống đang bảo trì, vui lòng quay lại sau.",
      });
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = maintenanceMiddleware;
