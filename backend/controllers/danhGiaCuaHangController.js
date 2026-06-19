const { DanhGiaCuaHang, TaiKhoan } = require("../models");

// Lấy danh sách đánh giá cửa hàng (đã được duyệt) cho trang chủ
exports.getTopReviews = async (req, res) => {
  try {
    const reviews = await DanhGiaCuaHang.findAll({
      where: { trang_thai: "approved" },
      include: [
        {
          model: TaiKhoan,
          as: "nguoi_dung",
          attributes: ["ho_ten", "anh_dai_dien"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 10, // Tăng lên 10 để slider có nhiều cái để trượt
    });

    // Đếm tổng số tài khoản thực tế
    const totalUsers = await TaiKhoan.count({
      where: { trang_thai: "active" }
    });

    res.status(200).json({
      reviews,
      totalUsers
    });
  } catch (error) {
    console.error("Lỗi lấy đánh giá cửa hàng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Khách hàng gửi đánh giá cửa hàng
exports.createReview = async (req, res) => {
  try {
    const { so_sao, noi_dung } = req.body;
    const tai_khoan_id = req.user.id;

    if (!so_sao) {
      return res.status(400).json({ message: "Vui lòng chọn số sao!" });
    }

    const review = await DanhGiaCuaHang.create({
      tai_khoan_id,
      so_sao,
      noi_dung,
      trang_thai: "approved", // Tạm thời để auto-approve hoặc chuyển thành 'pending' nếu muốn duyệt
    });

    res.status(201).json({ message: "Cảm ơn bạn đã đánh giá!", data: review });
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Lấy danh sách đánh giá của chính người dùng đăng nhập
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await DanhGiaCuaHang.findAll({
      where: { tai_khoan_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Lỗi lấy đánh giá của user:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Cập nhật đánh giá của chính người dùng
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { so_sao, noi_dung } = req.body;
    const tai_khoan_id = req.user.id;

    if (!so_sao) {
      return res.status(400).json({ message: "Vui lòng chọn số sao!" });
    }

    const review = await DanhGiaCuaHang.findOne({
      where: { id, tai_khoan_id },
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá này!" });
    }

    review.so_sao = so_sao;
    review.noi_dung = noi_dung;
    // Cập nhật trạng thái thành approved để hiển thị ngay, hoặc giữ nguyên
    review.trang_thai = "approved";
    await review.save();

    res.status(200).json({ message: "Cập nhật đánh giá thành công!", data: review });
  } catch (error) {
    console.error("Lỗi cập nhật đánh giá:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// Xóa đánh giá của chính người dùng
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const tai_khoan_id = req.user.id;

    const review = await DanhGiaCuaHang.findOne({
      where: { id, tai_khoan_id },
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá này!" });
    }

    await review.destroy();
    res.status(200).json({ message: "Xóa đánh giá thành công!" });
  } catch (error) {
    console.error("Lỗi xóa đánh giá:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

