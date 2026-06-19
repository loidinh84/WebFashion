const TheThanhVien = require("../models/TheThanhVien");
const TaiKhoan = require("../models/TaiKhoan");
const { Op } = require("sequelize");

const validateForm = ({
  ten_hang,
  ty_le_giam_gia,
  muc_chi_tieu_tu,
  diem_thuong_them,
}) => {
  if (!ten_hang?.trim()) return "Tên hạng thẻ không được để trống!";
  if (muc_chi_tieu_tu < 0) return "Mức chi tiêu không được là số âm!";
  if (ty_le_giam_gia < 0 || ty_le_giam_gia > 100)
    return "Tỷ lệ giảm giá phải từ 0 đến 100%!";
  if (diem_thuong_them < 0) return "Điểm thưởng thêm không được là số âm!";
  return null;
};

exports.getAllTheThanhVien = async (req, res) => {
  try {
    const theThanhVien = await TheThanhVien.findAll({
      order: [["muc_chi_tieu_tu", "ASC"]],
    });
    res.status(200).json(theThanhVien);
  } catch (error) {
    console.error("Lỗi lấy danh sách thẻ thành viên:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.createTheThanhVien = async (req, res) => {
  try {
    const {
      ten_hang,
      muc_chi_tieu_tu = 0,
      ty_le_giam_gia = 0,
      diem_thuong_them = 0,
      mau_the = "#2563eb",
      mo_ta_quyen_loi = "",
    } = req.body || {};

    const validErr = validateForm({
      ten_hang,
      ty_le_giam_gia,
      muc_chi_tieu_tu,
      diem_thuong_them,
    });
    if (validErr) return res.status(400).json({ message: validErr });

    const existing = await TheThanhVien.findOne({
      where: { ten_hang: ten_hang.trim() },
    });
    if (existing)
      return res
        .status(400)
        .json({ message: `Hạng thẻ "${ten_hang}" đã tồn tại!` });

    const newThe = await TheThanhVien.create({
      ten_hang: ten_hang.trim(),
      muc_chi_tieu_tu: Number(muc_chi_tieu_tu),
      ty_le_giam_gia: Number(ty_le_giam_gia),
      diem_thuong_them: Number(diem_thuong_them),
      mau_the,
      mo_ta_quyen_loi,
    });

    res
      .status(201)
      .json({ message: "Thêm hạng thẻ thành công!", data: newThe });
  } catch (error) {
    console.error("Lỗi thêm thẻ:", error);
    res.status(500).json({ message: "Lỗi khi thêm hạng thẻ" });
  }
};

exports.updateTheThanhVien = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ten_hang,
      muc_chi_tieu_tu,
      ty_le_giam_gia,
      diem_thuong_them,
      mau_the,
      mo_ta_quyen_loi,
    } = req.body || {};

    const the = await TheThanhVien.findByPk(id);
    if (!the)
      return res.status(404).json({ message: "Không tìm thấy hạng thẻ!" });

    const toValidate = {
      ten_hang: ten_hang ?? the.ten_hang,
      ty_le_giam_gia: ty_le_giam_gia ?? the.ty_le_giam_gia,
      muc_chi_tieu_tu: muc_chi_tieu_tu ?? the.muc_chi_tieu_tu,
      diem_thuong_them: diem_thuong_them ?? the.diem_thuong_them,
    };
    const validErr = validateForm(toValidate);
    if (validErr) return res.status(400).json({ message: validErr });

    if (ten_hang && ten_hang.trim() !== the.ten_hang) {
      const duplicate = await TheThanhVien.findOne({
        where: {
          ten_hang: ten_hang.trim(),
          id: { [Op.ne]: id },
        },
      });
      if (duplicate)
        return res
          .status(400)
          .json({ message: `Hạng thẻ "${ten_hang}" đã tồn tại!` });
    }

    await the.update({
      ten_hang: ten_hang !== undefined ? ten_hang.trim() : the.ten_hang,
      muc_chi_tieu_tu:
        muc_chi_tieu_tu !== undefined
          ? Number(muc_chi_tieu_tu)
          : the.muc_chi_tieu_tu,
      ty_le_giam_gia:
        ty_le_giam_gia !== undefined
          ? Number(ty_le_giam_gia)
          : the.ty_le_giam_gia,
      diem_thuong_them:
        diem_thuong_them !== undefined
          ? Number(diem_thuong_them)
          : the.diem_thuong_them,
      mau_the: mau_the !== undefined ? mau_the : the.mau_the,
      mo_ta_quyen_loi:
        mo_ta_quyen_loi !== undefined ? mo_ta_quyen_loi : the.mo_ta_quyen_loi,
    });

    res.status(200).json({ message: "Cập nhật thành công!", data: the });
  } catch (error) {
    console.error("Lỗi cập nhật thẻ:", error);
    res.status(500).json({ message: "Lỗi cập nhật hạng thẻ" });
  }
};

exports.deleteTheThanhVien = async (req, res) => {
  try {
    const the = await TheThanhVien.findByPk(req.params.id);
    if (!the)
      return res.status(404).json({ message: "Không tìm thấy hạng thẻ!" });

    // Kiểm tra có user nào đang ở hạng này không
    const soLuongUser = await TaiKhoan.count({
      where: { the_thanh_vien_id: req.params.id },
    });
    if (soLuongUser > 0) {
      return res.status(400).json({
        message: `Không thể xóa! Hiện có ${soLuongUser} khách hàng đang ở hạng "${the.ten_hang}". Vui lòng chuyển họ sang hạng khác trước.`,
      });
    }

    await the.destroy();
    res.status(200).json({ message: "Xóa hạng thẻ thành công!" });
  } catch (error) {
    console.error("Lỗi xóa thẻ:", error);
    res.status(500).json({ message: "Lỗi xóa hạng thẻ" });
  }
};
