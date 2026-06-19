require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/db");
require("./models/index");

const { syncDataToMeilisearch } = require("./services/searchService");
const sanPhamRoutes = require("./routers/sanPhamRoutes");
const TaiKhoanRoutes = require("./routers/taiKhoanRoutes");
const aiRoutes = require("./routers/aiRoutes");
const DonHangRoutes = require("./routers/donHangRoutes");
const DashBoardRoutes = require("./routers/dashBoardRoutes");
const KhachHangRoutes = require("./routers/khachHangRoutes");
const ThietLapRoutes = require("./routers/thietLapRoutes");
const BannerRoutes = require("./routers/bannerRoutes");
const DonViVanChuyenRoutes = require("./routers/donViVanChuyenRoutes");
const MethodPayRoutes = require("./routers/methodPayRoutes");
const TheThanhVienRoutes = require("./routers/theThanhVienRoutes");
const yeuThichRoutes = require("./routers/yeuThichRoutes");
const cauHinhRoutes = require("./routers/cauHinhRoutes");
const danhGiaCuaHangRoutes = require("./routers/danhGiaCuaHangRoutes");
const KhuyenMaiRoutes = require("./routers/KhuyenMaiRoutes");
const PhieuNhapRoutes = require("./routers/phieuNhapRoutes");
const PhieuKiemKhoRoutes = require("./routers/phieuKiemKhoRoutes");
const MauInRoutes = require("./routers/mauInRoutes");
const gioHangRoutes = require("./routers/gioHangRoutes");
const maintenanceMiddleware = require("./middlewares/maintenanceMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use(maintenanceMiddleware);
app.use("/api/taiKhoan", TaiKhoanRoutes);
app.use("/api/sanPham", sanPhamRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/donHang", DonHangRoutes);
app.use("/api/dashboard", DashBoardRoutes);
app.use("/api/customers", KhachHangRoutes);
app.use("/api/store-settings", ThietLapRoutes);
app.use("/api/banners", BannerRoutes);
app.use("/api/logistics", DonViVanChuyenRoutes);
app.use("/api/payments", MethodPayRoutes);
app.use("/api/memberships", TheThanhVienRoutes);
app.use("/api/wishlist", yeuThichRoutes);
app.use("/api/cau-hinh", cauHinhRoutes);
app.use("/api/danh-gia-shop", danhGiaCuaHangRoutes);
app.use("/api/khuyenMai", KhuyenMaiRoutes);
app.use("/api/phieu-nhap", PhieuNhapRoutes);
app.use("/api/kiem-kho", PhieuKiemKhoRoutes);
app.use("/api/mau-in", MauInRoutes);
app.use("/api/cart", gioHangRoutes);

const PORT = process.env.PORT || 5000;
sequelize
  .authenticate()
  .then(() => {
    console.log("Đã kết nối thành công với SQL Server");
    syncDataToMeilisearch().catch((err) =>
      console.warn("Meili sync thất bại (server vẫn chạy):", err.message),
    );
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
  })
  .catch((error) => {
    console.error("Lỗi khởi động hệ thống:", error);
  });
