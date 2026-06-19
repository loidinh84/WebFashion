const express = require("express");
const router = express.Router();
const taiKhoanController = require("../controllers/taiKhoanController");
const DiaChiGiaoHang = require("../models/DiaChiGiaoHang");
const upload = require("../config/upload");

router.get("/", taiKhoanController.getAllRTaiKhoan);
router.post("/", taiKhoanController.createTaiKhoan);
router.post("/login", taiKhoanController.loginTaiKhoan);
router.get("/dashboard/:id", taiKhoanController.getUserFullDashboard);
router.get("/diachi/:id", taiKhoanController.getDiaChiByUser);
router.get("/:id", taiKhoanController.getProfile);
router.get("/order-detail/:id", taiKhoanController.getOrderDetail);
router.post("/google", taiKhoanController.loginWithGoogle);
router.put("/updateProfile/:id", upload.single("anh_dai_dien"), taiKhoanController.updateProfile);
router.post("/addAddress", taiKhoanController.addAddress);
router.put("/change-password/:id", taiKhoanController.changePassword);
router.put("/cancel-account/:id", taiKhoanController.cancelAccount);
router.put("/diachi/:addressId", taiKhoanController.updateAddress);
router.delete("/diachi/:addressId", taiKhoanController.deleteAddress);

router.post("/forgot-password", taiKhoanController.forgotPassword);
router.post("/reset-password", taiKhoanController.resetPassword);

module.exports = router;
