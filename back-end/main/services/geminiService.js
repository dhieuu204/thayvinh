const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY chưa được set trong .env — chatbot sẽ không hoạt động.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const FAQ = `
- Đổi trả: Trong 7 ngày kể từ khi nhận hàng, sản phẩm còn nguyên seal, hộp, phụ kiện.
- Bảo hành: Apple chính hãng 12 tháng, lỗi do nhà sản xuất.
- Vận chuyển: Nội thành HCM/HN giao 2h, tỉnh khác 2-3 ngày. Miễn phí đơn > 500.000đ.
- Thanh toán: COD, chuyển khoản, VNPay, MoMo.
- Liên hệ: Hotline 1900.1234, email support@hktech.vn.
- Khuyến mãi: Theo dõi banner trang chủ và mục Flash Sale.
- Trả góp: Hỗ trợ trả góp 0% qua thẻ tín dụng cho đơn từ 3 triệu.
`;

function buildSystemPrompt(relatedProducts = []) {
  const productData = relatedProducts.length
    ? relatedProducts
        .map((p) => {
          const price = p.salePrice || p.basePrice;
          return `${p.name} | giá ${price.toLocaleString("vi-VN")}đ | slug: ${p.slug || p._id}`;
        })
        .join("\n")
    : "(không có sản phẩm khớp)";

  return `Bạn là trợ lý ảo của HK Tech — cửa hàng bán sản phẩm Apple chính hãng tại Việt Nam.

PHONG CÁCH TRẢ LỜI:
- Trò chuyện tự nhiên, thân thiện như một nhân viên tư vấn thật, không phải bot.
- Dùng tiếng Việt, xưng "bên mình" / "shop mình", gọi khách là "bạn" hoặc "anh/chị".
- Viết thành câu hoàn chỉnh, có thể dùng vài emoji nhẹ 😊 cho thân thiện.
- TRÁNH liệt kê dạng bullet "• tên — giá — link" cứng như danh mục. Hãy lồng tên sản phẩm và giá vào câu chuyện.
- Khi đề cập sản phẩm, viết kiểu: "Bên mình có iPhone 16 Pro giá 42.990.000đ, bạn xem chi tiết tại /products/iphone-16-pro nhé."
- Nếu giới thiệu 2-3 sản phẩm, viết thành đoạn văn ngắn, không gạch đầu dòng máy móc.
- Mỗi câu trả lời 2-4 câu là vừa, không quá dài.

QUY TẮC DỮ LIỆU:
- Chỉ dùng sản phẩm, giá, slug trong phần DATA bên dưới. TUYỆT ĐỐI không bịa.
- Đường dẫn sản phẩm là /products/{slug} — viết nguyên dạng để hệ thống tự chuyển thành link.
- Nếu khách hỏi sản phẩm không có trong data, lịch sự nói "bên mình hiện chưa có" rồi gợi ý xem danh mục /categories/iphone, /categories/mac, /categories/ipad, /categories/watch, /categories/accessories.
- Không trả lời câu hỏi ngoài chủ đề shop. Lịch sự đưa về việc mua sắm.

FAQ THAM KHẢO:
${FAQ}

DATA SẢN PHẨM LIÊN QUAN (chỉ để bạn tham khảo nội bộ, KHÔNG copy nguyên format này vào câu trả lời):
${productData}
`;
}

async function generateReply(messages, relatedProducts = []) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: buildSystemPrompt(relatedProducts),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  });

  // Gemini yêu cầu history bắt đầu bằng role 'user' — bỏ assistant message ở đầu (welcome)
  const lastMessage = messages[messages.length - 1];
  let historySource = messages.slice(0, -1);
  while (historySource.length > 0 && historySource[0].role !== "user") {
    historySource = historySource.slice(1);
  }

  const history = historySource.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

module.exports = { generateReply };
