const jwt = require("jsonwebtoken");
const TaiKhoan = require("../models/TaiKhoan");

// 1. Kiểm tra xem user có đăng nhập chưa
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Không tìm thấy token xác thực! Vui lòng đăng nhập." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secretKey = process.env.JWT_SECRET;

    const decoded = jwt.verify(token, secretKey);

    const user = await TaiKhoan.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại!" });
    }
    if (user.trang_thai === "banned") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// 1.5. Middleware lấy thông tin user nếu có token (không bắt buộc)
exports.verifyTokenOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    // Nếu token lỗi thì cứ cho qua như khách vãng lai
    next();
  }
};

// 2. Kiểm tra xem user có phải là Admin không
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Chưa xác thực người dùng!" });
  }

  if (req.user.vai_tro !== "admin") {
    return res
      .status(403)
      .json({ message: "Bạn không có quyền Admin để thao tác chức năng này!" });
  }

  next();
};
