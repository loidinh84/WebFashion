const { GoogleGenerativeAI } = require("@google/generative-ai");
const SanPham = require("../models/SanPham");
const BienTheSanPham = require("../models/BienTheSanPham");
const HinhAnhSanPham = require("../models/HinhAnhSanPham");
const ChatHistory = require("../models/ChatHistory");

async function callGeminiWithRetry(fn, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const errorStr = String(error.message || error);
      const isRateLimitOrOverload = 
        error.status === 429 || 
        error.status === 503 || 
        errorStr.includes("503") || 
        errorStr.includes("429") ||
        errorStr.includes("high demand") ||
        errorStr.includes("Service Unavailable");

      if (isRateLimitOrOverload && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
}

async function callGeminiWithFallbackAndRetry(genAI, modelName, systemInstruction, history, message, isChat = true, prompt = "") {
  const modelsToTry = [modelName, "gemini-2.0-flash"];
  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      const modelConfig = { model: modelId };
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }
      const modelObj = genAI.getGenerativeModel(modelConfig);

      return await callGeminiWithRetry(async () => {
        if (isChat) {
          const chatSession = modelObj.startChat({ history: history || [] });
          return await chatSession.sendMessage(message);
        } else {
          return await modelObj.generateContent(prompt);
        }
      }, 3, 1500);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

exports.getChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.findAll({
      order: [["createdAt", "ASC"]],
      limit: 50,
    });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.chatWithAI = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const { message } = req.body;

    // Lấy thông tin cửa hàng từ DB
    const ThietLapCuaHang = require("../models/ThietLapCuaHang");
    const config = await ThietLapCuaHang.findOne();
    const tenCuaHang = config?.ten_cua_hang || "LTLShop";
    const hotline = config?.so_dien_thoai || "Liên hệ website";
    const diaChi = config?.dia_chi || "";
    const email = config?.email || "";
    const chinhSachDoiTra = config?.chinh_sach_doi_tra || "Đổi trả trong 7 ngày nếu sản phẩm lỗi nhà sản xuất, còn nguyên hộp, đầy đủ phụ kiện.";

    const listSP = await SanPham.findAll({
      where: { trang_thai: "active" },
      attributes: ["ten_san_pham", "thuong_hieu", "slug"],
      include: [{ model: BienTheSanPham, as: "bien_the", attributes: ["gia_ban", "ram", "dung_luong", "mau_sac"] }],
      limit: 100,
    });

    const danhSachSP = listSP.map((sp) => {
      const giaMoi = sp.bien_the?.[0]?.gia_ban ? Number(sp.bien_the[0].gia_ban).toLocaleString("vi-VN") + "đ" : "Liên hệ";
      const specs = [sp.bien_the?.[0]?.ram, sp.bien_the?.[0]?.dung_luong].filter(Boolean).join(", ");
      return `- ${sp.ten_san_pham}${specs ? ` (${specs})` : ""}: ${giaMoi}`;
    }).join("\n");

    const ngayHienTai = new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const systemInstruction = `
Bạn là trợ lý chăm sóc khách hàng của ${tenCuaHang} — một cửa hàng thương mại điện tử chuyên về điện thoại, laptop, máy tính bảng, linh kiện PC, phụ kiện và gaming gear.
Hôm nay là ${ngayHienTai}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN CỬA HÀNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tên cửa hàng: ${tenCuaHang}
- Hotline hỗ trợ: ${hotline}${diaChi ? `\n- Địa chỉ: ${diaChi}` : ""}${email ? `\n- Email: ${email}` : ""}
- Chính sách bảo hành: 12–24 tháng tùy sản phẩm, bảo hành tại cửa hàng hoặc hãng.
- Chính sách đổi trả: ${chinhSachDoiTra}
- Giao hàng: Toàn quốc, giao nhanh trong 2–4h nội thành, 1–3 ngày tỉnh thành khác. Miễn phí vận chuyển đơn hàng từ 500.000đ.
- Thanh toán: COD (thanh toán khi nhận hàng), chuyển khoản ngân hàng, thẻ Visa/Mastercard, ví MoMo, ZaloPay, trả góp 0%.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
DANH SÁCH SẢN PHẨM ĐANG BÁN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${danhSachSP || "Đang cập nhật..."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHONG CÁCH & QUY TẮC TRẢ LỜI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GIỌNG ĐIỆU: Thân thiện, nhiệt tình, tôn trọng khách hàng. Xưng "mình" với khách hàng (không dùng "tôi" lạnh lùng). Gọi khách là "bạn".
2. NGẮN GỌN & DỄ HIỂU: Trả lời đủ ý, không dài dòng. Dùng gạch đầu dòng khi liệt kê nhiều thông tin.
3. CHỦ ĐỘNG ĐỀ XUẤT: Nếu khách hỏi chung chung, hãy hỏi lại nhu cầu (ngân sách, mục đích sử dụng) để tư vấn chính xác hơn.
4. TRUNG THỰC: Chỉ tư vấn sản phẩm có trong danh sách kho hàng ở trên. Nếu không có sản phẩm phù hợp, thành thật nói và mời khách liên hệ hotline.
5. KHÔNG PHÁN XÉT: Không chê sản phẩm của đối thủ, không ép khách mua đồ đắt tiền hơn nhu cầu thực sự.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÁC TÌNH HUỐNG THƯỜNG GẶP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TƯ VẤN SẢN PHẨM]
- Hỏi rõ nhu cầu: dùng làm gì, ngân sách bao nhiêu, thích thương hiệu nào.
- Đề xuất 2–3 lựa chọn phù hợp từ danh sách kho hàng với giá cụ thể.
- Nêu ngắn gọn điểm nổi bật của từng lựa chọn.

[HỎI GIÁ & KHUYẾN MÃI]
- Cung cấp giá chính xác từ danh sách kho hàng.
- Thông báo nếu đang có chương trình giảm giá (ví dụ: "Sản phẩm này đang được giảm X%, giá còn Y").
- Mời khách đến cửa hàng hoặc hotline để nhận báo giá tốt nhất khi mua số lượng lớn.

[THEO DÕI ĐƠN HÀNG]
- Hướng dẫn khách vào mục "Đơn hàng của tôi" trong trang cá nhân để theo dõi trạng thái.
- Nếu có vấn đề, mời khách cung cấp mã đơn hàng và liên hệ hotline để được hỗ trợ nhanh nhất.

[BẢO HÀNH & ĐỔI TRẢ]
- Áp dụng chính sách đổi trả của cửa hàng như trên.
- Bảo hành 12–24 tháng tùy sản phẩm. Mang sản phẩm và hóa đơn đến cửa hàng hoặc trung tâm bảo hành hãng.
- Nếu sản phẩm bị lỗi do người dùng (rơi vỡ, vô nước), hướng dẫn đến cửa hàng để kiểm tra và báo giá sửa chữa.

[VẬN CHUYỂN & GIAO HÀNG]
- Nội thành: 2–4 giờ. Tỉnh thành: 1–3 ngày làm việc.
- Miễn phí vận chuyển cho đơn từ 500.000đ.
- Cho phép kiểm tra hàng trước khi nhận (COD).

[THANH TOÁN & TRẢ GÓP]
- Hỗ trợ COD, chuyển khoản, Visa/Mastercard, MoMo, ZaloPay.
- Trả góp 0% qua thẻ tín dụng hoặc công ty tài chính (FE Credit, Home Credit...).
- Hướng dẫn khách liên hệ hotline để được hỗ trợ hồ sơ trả góp.

[KHIẾU NẠI & PHÀN NÀN]
- Luôn xin lỗi khách trước, thể hiện sự thấu hiểu.
- Hỏi rõ vấn đề và mã đơn hàng, sau đó hướng dẫn xử lý hoặc chuyển lên hotline.
- Cam kết xử lý trong 24 giờ làm việc.

[CÂU HỎI NGOÀI PHẠM VI]
- Nếu khách hỏi điều không liên quan đến mua sắm/cửa hàng, lịch sự từ chối và chuyển hướng: "Mình chỉ có thể hỗ trợ các vấn đề liên quan đến sản phẩm và dịch vụ tại ${tenCuaHang}. Bạn cần mình hỗ trợ gì về cửa hàng không?"
    `;

    // Dùng lịch sử do client gửi lên (localStorage), không cần đọc DB
    const clientHistory = Array.isArray(req.body.history) ? req.body.history : [];
    let historyForGemini = clientHistory.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Thuật toán lọc lịch sử hội thoại chuẩn chỉ cho Gemini API:
    // 1. Phải bắt đầu bằng tin nhắn của 'user'.
    // 2. Các tin nhắn tiếp theo phải xen kẽ nhau (user -> model -> user -> model...).
    // 3. Tin nhắn cuối cùng của mảng history phải là 'model' (vì tin nhắn mới gửi tiếp theo là 'user').
    let cleanHistory = [];
    let expectedRole = "user"; // Cần tin nhắn đầu tiên bắt đầu bằng 'user'

    for (const msg of historyForGemini) {
      if (msg.role === expectedRole) {
        cleanHistory.push(msg);
        // Xen kẽ vai trò tiếp theo
        expectedRole = expectedRole === "user" ? "model" : "user";
      }
    }

    // Nếu tin nhắn cuối cùng của lịch sử là 'user', ta cắt bỏ nó đi
    // để tránh trùng lặp 2 tin nhắn 'user' liên tiếp khi sendMessage gửi lên.
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
      cleanHistory.pop();
    }

    const result = await callGeminiWithFallbackAndRetry(
      genAI,
      "gemini-2.5-flash",
      systemInstruction,
      cleanHistory,
      message,
      true
    );
    const botReply = result.response.text();

    res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error("Lỗi Gemini Chat:", error);
    const errorMsg =
      error.status === 503
        ? "Hệ thống AI đang quá tải, bạn vui lòng đợi 1 phút rồi thử lại nhé!"
        : "Rất tiếc, AI đang gặp chút sự cố kỹ thuật. Bạn có thể liên hệ hotline để được hỗ trợ ngay!";
    res.status(200).json({ reply: errorMsg });
  }
};

exports.buildPcWithAI = async (req, res) => {

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const { message, currentBuild } = req.body;
    
    // Chuyển build hiện tại sang text để AI đọc
    const buildText = currentBuild ? Object.entries(currentBuild)
      .filter(([_, val]) => val !== null)
      .map(([key, val]) => `- ${key.toUpperCase()}: ${val.name} (${val.price}đ)`)
      .join("\n") : "Chưa chọn gì";

    // 1. CHỈ LẤY SẢN PHẨM ĐANG BÁN (Kèm theo Biến thể và Hình ảnh)
    const listSP = await SanPham.findAll({
      where: { trang_thai: "active" },
      include: [
        { model: require("../models/BienTheSanPham"), as: "bien_the" },
        { model: require("../models/HinhAnhSanPham"), as: "hinh_anh" }
      ],
      limit: 1000, // Tăng lên 1000 để AI có đủ data tư vấn
    });

    const khoHang = listSP.map((sp) => {
      // Ưu tiên lấy giá bán của biến thể đầu tiên
      const price = sp.bien_the && sp.bien_the.length > 0 
        ? Number(sp.bien_the[0].gia_ban) 
        : 0;
      
      // Tối ưu hóa: Không truyền url_anh vào Prompt để giảm cực lớn số lượng tokens gửi đi, tránh lỗi 503 quá tải từ Google.
      // Backend sẽ tự động map lại ảnh từ listSP dựa trên tên sản phẩm khi AI trả về kết quả.
      return {
        name: sp.ten_san_pham,
        price: price,
      };
    });

    // 2. PROMPT CHUYÊN BIỆT: ÉP CHIA NGÂN SÁCH VÀ NHIỀU LỰA CHỌN
    const systemInstruction = `
      Bạn là Chuyên gia Build PC & Gaming Setup chuyên nghiệp. Nhiệm vụ của bạn là giúp khách hàng sở hữu dàn máy mơ ước.
      
      QUY TẮC TƯ VẤN CAO CẤP:
      1. CẤU HÌNH HIỆN TẠI:
      ${buildText}
      => Hãy phân tích cấu hình này, khen ngợi nếu nó hợp lý hoặc cảnh báo nếu có sự mất cân đối. Đừng hỏi lại những gì khách đã chọn.

      2. PHẠM VI TƯ VẤN RỘNG: Bạn hỗ trợ trọn gói 21 món linh kiện. TUYỆT ĐỐI KHÔNG ĐƯỢC TỪ CHỐI tư vấn bất kỳ món nào trong danh sách 21 món (đặc biệt là Chuột, Bàn phím, Màn hình, Ghế). Nếu khách hỏi, bạn BẮT BUỘC phải đưa ra gợi ý từ kho hàng.
      3. TƯ DUY TỐI ƯU: Nếu khách có ngân sách cụ thể, hãy phân bổ tiền cực kỳ thông minh giữa hiệu năng (CPU/VGA) và thẩm mỹ (Case/Fan/Gear).
      4. ĐA DẠNG LỰA CHỌN: Mỗi món cần đề xuất 3-4 phương án (Giá rẻ - Hiệu năng - Cao cấp) để khách dễ chọn.

      KHO HÀNG HIỆN CÓ: ${JSON.stringify(khoHang)}.
      
      BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI JSON:
      {
        "text": "Lời tư vấn ráp máy (Ngắn gọn, chuyên nghiệp, nhiệt tình)",
        "options": [
          {
            "type": "MÃ LOẠI LINH KIỆN", // CHỈ ĐƯỢC DÙNG 1 TRONG CÁC MÃ SAU: cpu, mainboard, ram, ssd1, ssd2, hdd, vga, psu, case, cooler_air, cooler_aio, cooler_custom, fan, monitor1, monitor2, keyboard, mouse, pad, headphone, speaker, chair
            "name": "Tên linh kiện LẤY TỪ KHO HÀNG",
            "price": 1000000, // Số nguyên
            "image": "", // Bạn hãy để trống trường này, hệ thống backend của cửa hàng sẽ tự bổ sung
            "desc": "Ưu điểm ngắn gọn"
          }
        ]
      }
      
      LƯU Ý: Nếu khách hàng chưa chọn xong các linh kiện trước đó (CPU, Mainboard...), hãy nhắc nhở họ chọn các bước quan trọng đó trước để có thể tư vấn PSU/VGA chính xác nhất.
    `;

    const result = await callGeminiWithFallbackAndRetry(
      genAI,
      "gemini-2.5-flash",
      systemInstruction,
      [],
      message,
      true
    );
    const rawReply = result.response.text();

    // console.log("AI Raw Reply:", rawReply); // LOG ĐỂ KIỂM TRA DỮ LIỆU THỰC TẾ

    let botResponseData;
    try {
      // Sử dụng regex tham lam để lấy trọn vẹn khối JSON
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/); 
      let cleanJson = jsonMatch ? jsonMatch[0] : rawReply;
      
      botResponseData = JSON.parse(cleanJson);
      
      // Ép kiểu giá tiền về Number và tự động điền lại url_anh cho tất cả options
      if (botResponseData.options) {
        botResponseData.options = botResponseData.options.map(opt => {
          const matchedProd = listSP.find(sp => sp.ten_san_pham === opt.name);
          let imageUrl = opt.image || "";
          if (matchedProd) {
            const mainImage = matchedProd.hinh_anh?.find(img => img.la_anh_chinh) || matchedProd.hinh_anh?.[0];
            imageUrl = mainImage ? mainImage.url_anh : "https://placehold.co/150";
          }
          return {
            ...opt,
            price: Number(opt.price) || 0,
            image: imageUrl
          };
        });
      }
    } catch (e) {
      console.error("Lỗi parse JSON AI:", e.message);
      
      // Cải tiến lọc văn bản: Xóa khối JSON và các thẻ markdown thừa
      let textOnly = rawReply
        .replace(/\{[\s\S]*\}/g, "") // Xóa khối JSON
        .replace(/```json|```/g, "") // Xóa thẻ markdown
        .replace(/`|json/gi, "")     // Xóa ký tự thừa
        .trim();

      botResponseData = { 
        text: textOnly || "Mình đã tìm được những linh kiện tuyệt vời nhất cho bạn!", 
        options: [] 
      };
    }

    res.status(200).json(botResponseData);
  } catch (error) {
    console.error("Lỗi Gemini Build PC:", error.message);
    res.status(200).json({ 
      text: "AI đang bận một chút, bạn nhấn gửi lại để mình tư vấn tiếp nhé!", 
      options: [] 
    });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    // Xóa sạch toàn bộ dữ liệu trong bảng ChatHistory
    await ChatHistory.destroy({ where: {} });
    res.status(200).json({ message: "Đã xóa sạch trí nhớ AI!" });
  } catch (error) {
    console.error("Lỗi xóa lịch sử:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.compareProductsAI = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const { product1, product2 } = req.body;

    if (!product1 || !product2) {
      return res
        .status(400)
        .json({
          message: "Vui lòng cung cấp thông tin 2 sản phẩm cần so sánh.",
        });
    }

    const systemInstruction = `
      Bạn là chuyên gia tư vấn công nghệ của Shop. 
      Nhiệm vụ của bạn là so sánh 2 sản phẩm dựa trên thông số kỹ thuật được cung cấp nếu sản phẩm không có hãy lên mạng và tìm lấy những thông tin liên quan.
      
      YÊU CẦU:
      1. Phân tích khách quan, chính xác dựa trên dữ liệu.
      2. Nêu bật điểm mạnh, điểm yếu của từng sản phẩm.
      3. Đưa ra lời khuyên chọn mua phù hợp với từng nhu cầu (ví dụ: "chọn A nếu thích chụp ảnh, chọn B nếu cần chơi game").
      4. Ngôn từ thân thiện, dễ hiểu, KHÔNG quá dài dòng.

      BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU (Không có markdown block \`\`\`json):
      {
        "summary": "Một câu tóm tắt chung về sự khác biệt chính giữa 2 sản phẩm",
        "product1": {
          "pros": ["ưu điểm 1", "ưu điểm 2"],
          "cons": ["nhược điểm 1"]
        },
        "product2": {
          "pros": ["ưu điểm 1", "ưu điểm 2"],
          "cons": ["nhược điểm 1"]
        },
        "verdict": "Kết luận chi tiết: Ai nên mua sản phẩm nào?"
      }
    `;

    const prompt = `
      Sản phẩm 1:
      - Tên: ${product1.name}
      - Giá: ${product1.price}
      - Thông số: ${JSON.stringify(product1.specs)}

      Sản phẩm 2:
      - Tên: ${product2.name}
      - Giá: ${product2.price}
      - Thông số: ${JSON.stringify(product2.specs)}
    `;

    const result = await callGeminiWithFallbackAndRetry(
      genAI,
      "gemini-2.5-flash",
      systemInstruction,
      null,
      null,
      false,
      prompt
    );
    const rawReply = result.response.text();

    let botResponseData;
    try {
      const cleanJson = rawReply
        .replace(/^[\\s\\S]*?\\{/, "{") // Remove any prefix text before first {
        .replace(/\\}[^}]*$/, "}"); // Remove any suffix text after last }
      botResponseData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Lỗi parse JSON từ Gemini:", e, rawReply);
      return res.status(500).json({ message: "Lỗi xử lý ngôn ngữ AI" });
    }

    res.status(200).json(botResponseData);
  } catch (error) {
    console.error("Lỗi Compare AI:", error);
    res.status(500).json({ message: "Lỗi kết nối AI" });
  }
};

exports.checkProductType = async (req, res) => {
  try {
    const { product1Name, product2Name } = req.body;
    if (!product1Name || !product2Name) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp tên 2 sản phẩm" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `
      Nhiệm vụ của bạn là kiểm tra xem 2 sản phẩm sau đây có cùng chủng loại (ví dụ: cùng là điện thoại, cùng là laptop, cùng là chuột, cùng là máy tính bảng, v.v) hay không.
      Đừng phân biệt "cũ" và "mới" (ví dụ "Điện thoại cũ iPhone 13" và "Điện thoại iPhone 15" vẫn là cùng chủng loại).
      Sản phẩm 1: "${product1Name}"
      Sản phẩm 2: "${product2Name}"
      
      BẮT BUỘC trả về ĐÚNG định dạng JSON như sau, không kèm bất kỳ text nào khác (không có markdown block \`\`\`json):
      {
        "isSameType": true hoặc false,
        "reason": "Giải thích ngắn gọn"
      }
    `;

    const result = await callGeminiWithFallbackAndRetry(
      genAI,
      "gemini-2.5-flash",
      null,
      null,
      null,
      false,
      prompt
    );
    const rawReply = result.response.text();
    let cleanJson = rawReply
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    // Xử lý loại bỏ text thừa xung quanh
    cleanJson = cleanJson.replace(/^[\s\S]*?\{/, "{").replace(/\}[^}]*$/, "}");
    const botResponseData = JSON.parse(cleanJson);

    res.json(botResponseData);
  } catch (error) {
    console.error("Lỗi check type AI:", error);
    // Fallback to true if AI fails, so we don't block the user unnecessarily
    res.json({ isSameType: true, reason: "Bỏ qua kiểm tra do lỗi AI" });
  }
};
