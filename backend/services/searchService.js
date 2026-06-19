const SanPham = require("../models/SanPham");
const BienTheSanPham = require("../models/BienTheSanPham");
const { Op } = require("sequelize");

const MEILI_HOST = process.env.MEILI_HOST;
const MEILI_KEY = process.env.MEILI_API_KEY;

const meiliRequest = async (method, path, body = null) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEILI_KEY}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${MEILI_HOST}${path}`, options);
  return res.json();
};

const syncDataToMeilisearch = async () => {
  try {
    console.log("Đang lấy dữ liệu từ SQL Server...");
    const products = await SanPham.findAll({
      where: { trang_thai: "active" },
      include: [{ model: BienTheSanPham, as: "bien_the" }],
    });

    if (products.length === 0) {
      console.log("Không có sản phẩm nào để đồng bộ.");
      return;
    }

    const dataToSync = products.map(sp => {
      const plain = sp.get({ plain: true });
      return {
        ...plain,
        gia_ban: sp.bien_the?.[0]?.gia_ban || 0,
        ton_kho: sp.bien_the?.[0]?.ton_kho || 0,
      };
    });

    const result = await meiliRequest(
      "POST",
      "/indexes/san_pham/documents?primaryKey=id",
      dataToSync,
    );
    console.log(`Đã đẩy ${dataToSync.length} sản phẩm!`, result);

    await meiliRequest("PATCH", "/indexes/san_pham/settings", {
      searchableAttributes: ["ten_san_pham", "mo_ta_ngan", "thuong_hieu"],
      filterableAttributes: ["danh_muc_id", "trang_thai", "thuong_hieu"],
    });
    console.log("Cấu hình Meilisearch hoàn tất.");
  } catch (error) {
    console.warn("Meili sync lỗi (server vẫn chạy):", error.message);
  }
};

const searchSanPham = async (query, { limit = 10, filter = null } = {}) => {
  try {
    const body = {
      q: query,
      limit,
      attributesToRetrieve: [
        "id",
        "ten_san_pham",
        "mo_ta_ngan",
        "thuong_hieu",
        "slug",
        "gia_ban",
        "ton_kho",
      ],
    };
    if (filter) body.filter = filter;
    const result = await meiliRequest("POST", "/indexes/san_pham/search", body);

    // Nếu Meilisearch lỗi mạng và trả về undefined hoặc không có hits
    if (!result || !result.hits) {
      throw new Error("Meilisearch không phản hồi hợp lệ");
    }

    return result;
  } catch (error) {
    try {
      const whereCondition = { trang_thai: "active" };

      // Áp dụng từ khóa tìm kiếm
      if (query && query.trim() !== "") {
        whereCondition.ten_san_pham = { [Op.like]: `%${query}%` };
      }

      if (filter) {
        const match = filter.match(/danh_muc_id\s*(?:IN\s*\(([^)]+)\)|=\s*(\d+))/i);
        if (match) {
          const idsStr = match[1] || match[2];
          whereCondition.danh_muc_id = {
            [Op.in]: idsStr.split(",").map((id) => Number(id.trim())),
          };
        }
      }

      const sqlResults = await SanPham.findAll({
        where: whereCondition,
        attributes: ["id", "ten_san_pham", "mo_ta_ngan", "thuong_hieu", "slug"],
        include: [
          {
            model: require("../models/BienTheSanPham"),
            as: "bien_the",
            attributes: ["gia_ban", "ton_kho"],
          },
          {
            model: require("../models/HinhAnhSanPham"),
            as: "hinh_anh",
          },
        ],
        limit: limit,
      });

      const hits = sqlResults.map((sp) => {
        const item = sp.get({ plain: true });
        return {
          ...item,
          gia_ban: item.bien_the && item.bien_the.length > 0 ? Number(item.bien_the[0].gia_ban) : 0,
          ton_kho: item.bien_the && item.bien_the.length > 0 ? Number(item.bien_the[0].ton_kho) : 0,
        };
      });

      return { hits, estimatedTotalHits: hits.length };
    } catch (sqlError) {
      console.error("Lỗi SQL fallback:", sqlError.message);
      return { hits: [] };
    }
  }
};

module.exports = { syncDataToMeilisearch, searchSanPham };
