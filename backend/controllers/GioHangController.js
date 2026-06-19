const { GioHang, BienTheSanPham, SanPham, HinhAnhSanPham } = require("../models");

// 1. Lấy giỏ hàng của người dùng đã đăng nhập
exports.getCart = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const items = await GioHang.findAll({
      where: { tai_khoan_id },
      include: [
        {
          model: BienTheSanPham,
          as: "bien_the",
          include: [
            {
              model: SanPham,
              as: "san_pham",
              include: [
                {
                  model: HinhAnhSanPham,
                  as: "hinh_anh",
                },
              ],
            },
          ],
        },
      ],
    });

    const formattedCart = items
      .map((item) => {
        const bt = item.bien_the;
        if (!bt) return null;
        const sp = bt.san_pham;
        if (!sp) return null;

        // Xác định ảnh phù hợp: ảnh cụ thể của biến thể hoặc ảnh chính của sản phẩm
        let hinhAnh = null;
        if (sp.hinh_anh && sp.hinh_anh.length > 0) {
          const variantImg = sp.hinh_anh.find((img) => img.bien_the_id === bt.id);
          if (variantImg) {
            hinhAnh = variantImg.url_anh;
          } else {
            const mainImg =
              sp.hinh_anh.find((img) => img.la_anh_chinh) || sp.hinh_anh[0];
            hinhAnh = mainImg?.url_anh;
          }
        }

        return {
          id: sp.id,
          variantId: bt.id,
          ten_san_pham: sp.ten_san_pham,
          hinh_anh: hinhAnh || "",
          gia_ban: Number(bt.gia_ban || bt.gia_goc || 0),
          dung_luong: bt.dung_luong || "",
          mau_sac: bt.mau_sac || "",
          ram: bt.ram || "",
          sku: bt.sku || "",
          so_luong: item.so_luong,
          selected: true, // mặc định được chọn trong trang giỏ hàng
        };
      })
      .filter(Boolean);

    res.json(formattedCart);
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server khi lấy giỏ hàng" });
  }
};

// 2. Thêm mặt hàng vào giỏ hàng DB
exports.addToCart = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const { bien_the_id, so_luong } = req.body;

    if (!bien_the_id || !so_luong) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin biến thể hoặc số lượng!" });
    }

    const bt = await BienTheSanPham.findByPk(bien_the_id);
    if (!bt) {
      return res.status(404).json({ message: "Biến thể sản phẩm không tồn tại!" });
    }

    // Kiểm tra đã có trong giỏ chưa
    const existing = await GioHang.findOne({
      where: { tai_khoan_id, bien_the_id },
    });

    const newQty = existing
      ? existing.so_luong + Number(so_luong)
      : Number(so_luong);

    if (newQty > bt.ton_kho) {
      return res.status(400).json({
        message: `Không thể thêm! Bạn đã có ${
          existing ? existing.so_luong : 0
        } sản phẩm trong giỏ hàng. Tồn kho khả dụng là ${bt.ton_kho}.`,
      });
    }

    if (existing) {
      existing.so_luong = newQty;
      await existing.save();
    } else {
      await GioHang.create({
        tai_khoan_id,
        bien_the_id,
        so_luong: newQty,
      });
    }

    res.json({ success: true, message: "Đã thêm vào giỏ hàng thành công!" });
  } catch (error) {
    console.error("Lỗi thêm vào giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server khi thêm vào giỏ hàng" });
  }
};

// 3. Cập nhật số lượng của một sản phẩm trong giỏ hàng DB
exports.updateQuantity = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const { bien_the_id, so_luong } = req.body;

    if (!bien_the_id || so_luong === undefined) {
      return res.status(400).json({ message: "Thiếu thông tin!" });
    }

    const targetQty = Number(so_luong);
    if (targetQty <= 0) {
      await GioHang.destroy({ where: { tai_khoan_id, bien_the_id } });
      return res.json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng!" });
    }

    const bt = await BienTheSanPham.findByPk(bien_the_id);
    if (!bt) {
      return res.status(404).json({ message: "Biến thể không tồn tại!" });
    }

    if (targetQty > bt.ton_kho) {
      return res
        .status(400)
        .json({ message: `Chỉ còn ${bt.ton_kho} sản phẩm khả dụng!` });
    }

    const [item, created] = await GioHang.findOrCreate({
      where: { tai_khoan_id, bien_the_id },
      defaults: { so_luong: targetQty },
    });

    if (!created) {
      item.so_luong = targetQty;
      await item.save();
    }

    res.json({ success: true, message: "Đã cập nhật số lượng!" });
  } catch (error) {
    console.error("Lỗi cập nhật số lượng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật số lượng" });
  }
};

// 4. Xóa sản phẩm khỏi giỏ hàng DB
exports.removeFromCart = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const { bien_the_id } = req.params;

    await GioHang.destroy({ where: { tai_khoan_id, bien_the_id } });
    res.json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng!" });
  } catch (error) {
    console.error("Lỗi xóa giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" });
  }
};

// 5. Đồng bộ gộp giỏ hàng từ Local vào Database khi đăng nhập
exports.syncCart = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const { items } = req.body;

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const { variantId, so_luong } = item;
        if (!variantId || !so_luong) continue;

        const bt = await BienTheSanPham.findByPk(variantId);
        if (!bt) continue;

        const existing = await GioHang.findOne({
          where: { tai_khoan_id, bien_the_id: variantId },
        });

        // Gộp số lượng
        let mergedQty = existing
          ? existing.so_luong + Number(so_luong)
          : Number(so_luong);

        // Giới hạn trong số lượng tồn kho khả dụng
        if (mergedQty > bt.ton_kho) {
          mergedQty = bt.ton_kho;
        }

        if (mergedQty > 0) {
          if (existing) {
            existing.so_luong = mergedQty;
            await existing.save();
          } else {
            await GioHang.create({
              tai_khoan_id,
              bien_the_id: variantId,
              so_luong: mergedQty,
            });
          }
        }
      }
    }

    // Trả về giỏ hàng sau khi gộp đồng bộ xong
    return exports.getCart(req, res);
  } catch (error) {
    console.error("Lỗi đồng bộ giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server khi đồng bộ giỏ hàng" });
  }
};

// 6. Xóa các sản phẩm được chọn khỏi giỏ hàng DB sau khi thanh toán thành công
exports.clearSelected = async (req, res) => {
  try {
    const tai_khoan_id = req.user.id;
    const { variantIds } = req.body;

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu danh sách mặt hàng cần xóa!" });
    }

    await GioHang.destroy({
      where: {
        tai_khoan_id,
        bien_the_id: variantIds,
      },
    });

    res.json({ success: true, message: "Đã dọn dẹp các sản phẩm đã thanh toán!" });
  } catch (error) {
    console.error("Lỗi dọn dẹp giỏ hàng sau thanh toán:", error);
    res.status(500).json({ message: "Lỗi server khi dọn dẹp giỏ hàng" });
  }
};
