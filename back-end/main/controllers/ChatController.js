const { generateReply } = require("../services/geminiService");
const Product = require("../models/Product");

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1000;

const STOPWORDS = new Set([
  "tôi","toi","minh","mình","muốn","muon","cần","can","mua","ban","bán",
  "cho","và","va","hoặc","hoac","bao","nhiêu","nhieu","giá","gia",
  "sản","san","phẩm","pham","shop","giúp","giup","tư","tu","vấn","van",
  "xem","có","co","là","la","của","cua","với","voi","này","nay","kia",
  "được","duoc","hay","thì","thi","nhé","nhe","ạ","a","ok","alo",
]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findRelatedProducts(query) {
  if (!query || query.length < 2) return [];

  const tokens = query
    .toLowerCase()
    .split(/[\s,.!?;:()/]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .slice(0, 8);

  if (tokens.length === 0) return [];

  // 1) Ưu tiên text search (dùng index trên Product.name, có ranking theo độ liên quan)
  try {
    const textResults = await Product.find(
      {
        $text: { $search: tokens.join(" ") },
        isActive: true,
        deletedAt: null,
      },
      { score: { $meta: "textScore" } }
    )
      .select("name slug basePrice salePrice")
      .sort({ score: { $meta: "textScore" } })
      .limit(8)
      .lean();

    if (textResults.length > 0) return textResults;
  } catch (err) {
    /* fall through to regex */
  }

  // 2) Fallback: regex trên name (xử lý viết tắt như "ip16" → "iPhone 16")
  try {
    const regex = new RegExp(tokens.map(escapeRegex).join("|"), "i");
    return await Product.find({
      name: regex,
      isActive: true,
      deletedAt: null,
    })
      .select("name slug basePrice salePrice")
      .limit(8)
      .lean();
  } catch (err) {
    console.error("findRelatedProducts error:", err.message);
    return [];
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages không hợp lệ." });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ success: false, message: "Cuộc hội thoại quá dài." });
    }
    for (const m of messages) {
      if (!m || typeof m.content !== "string" || !["user", "assistant"].includes(m.role)) {
        return res.status(400).json({ success: false, message: "Định dạng message sai." });
      }
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ success: false, message: "Tin nhắn quá dài." });
      }
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const relatedProducts = lastUserMessage
      ? await findRelatedProducts(lastUserMessage.content)
      : [];

    const reply = await generateReply(messages, relatedProducts);
    return res.json({ success: true, reply });
  } catch (err) {
    console.error("Chat error:", err);
    const msg = err.message?.includes("GEMINI_API_KEY")
      ? "Chatbot chưa được cấu hình. Liên hệ admin."
      : "Đã có lỗi xảy ra. Vui lòng thử lại.";
    return res.status(500).json({ success: false, message: msg });
  }
};
