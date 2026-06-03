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

// Mapping từ khóa ngữ nghĩa → keyword tìm kiếm sản phẩm
const INTENT_KEYWORDS = [
  { match: /iphone|ip\d|điện thoại|phone/i,   search: "iPhone" },
  { match: /macbook|mac\s*book|laptop/i,        search: "MacBook" },
  { match: /ipad|máy tính bảng|tablet/i,        search: "iPad" },
  { match: /airpods|tai nghe|headphone/i,        search: "AirPods" },
  { match: /apple watch|đồng hồ|watch/i,         search: "Apple Watch" },
  { match: /mac mini|mac pro|imac/i,             search: "Mac" },
];

async function findRelatedProducts(query) {
  if (!query || query.length < 2) return [];

  const tokens = query
    .toLowerCase()
    .split(/[\s,.!?;:()/]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .slice(0, 8);

  // 1) Ưu tiên text search (dùng index trên Product.name)
  if (tokens.length > 0) {
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
      /* fall through */
    }

    // 2) Fallback regex trên name
    try {
      const regex = new RegExp(tokens.map(escapeRegex).join("|"), "i");
      const regexResults = await Product.find({
        name: regex,
        isActive: true,
        deletedAt: null,
      })
        .select("name slug basePrice salePrice")
        .limit(8)
        .lean();

      if (regexResults.length > 0) return regexResults;
    } catch (err) {
      /* fall through */
    }
  }

  // 3) Fallback intent: nếu query đề cập đến loại sản phẩm (vd: "phòng bạt tốt nhất")
  //    thì tìm theo category keyword tương ứng
  for (const intent of INTENT_KEYWORDS) {
    if (intent.match.test(query)) {
      try {
        const regex = new RegExp(intent.search, "i");
        const results = await Product.find({
          name: regex,
          isActive: true,
          deletedAt: null,
        })
          .select("name slug basePrice salePrice")
          .limit(8)
          .lean();
        if (results.length > 0) return results;
      } catch (err) {
        /* ignore */
      }
    }
  }

  return [];
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
