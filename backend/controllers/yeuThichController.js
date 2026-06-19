const YeuThich = require("../models/YeuThich");
const SanPham = require("../models/SanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const BienTheSanPham = require("../models/BienTheSanPham");

exports.getWishlistByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await YeuThich.findAll({
      where: { tai_khoan_id: userId },
      include: [
        {
          model: SanPham,
          as: "san_pham",
          include: [
            {
              model: HinhAnhSanPham,
              as: "hinh_anh",
            },
            {
              model: BienTheSanPham,
              as: "bien_the",
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Lỗi lấy danh sách yêu thích:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách yêu thích" });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { tai_khoan_id, san_pham_id } = req.body;

    if (!tai_khoan_id || !san_pham_id) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin người dùng hoặc sản phẩm" });
    }
    const existingLike = await YeuThich.findOne({
      where: { tai_khoan_id, san_pham_id },
    });

    if (existingLike) {
      await existingLike.destroy();
      return res.status(200).json({
        message: "Đã bỏ sản phẩm khỏi danh sách yêu thích",
        isLiked: false,
      });
    } else {
      const newLike = await YeuThich.create({
        tai_khoan_id,
        san_pham_id,
      });
      return res.status(201).json({
        message: "Đã thêm vào danh sách yêu thích",
        isLiked: true,
        data: newLike,
      });
    }
  } catch (error) {
    console.error("Lỗi toggle yêu thích:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý yêu thích" });
  }
};

exports.checkIsLiked = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const existingLike = await YeuThich.findOne({
      where: { tai_khoan_id: userId, san_pham_id: productId },
    });

    res.status(200).json({ isLiked: !!existingLike });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
