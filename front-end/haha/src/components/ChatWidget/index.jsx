import { useEffect, useRef, useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { sendChatMessage, loadHistory, saveHistory } from "../../lib/chatApi";

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "Xin chào! Mình là trợ lý ảo của HK Tech 🍎\nMình có thể tư vấn iPhone, MacBook, iPad, AirPods... hoặc giải đáp về đổi trả, vận chuyển. Bạn cần hỗ trợ gì?",
};

const QUICK_REPLIES = [
  "iPhone mới nhất có gì hot?",
  "Chính sách đổi trả thế nào?",
  "Tư vấn MacBook cho sinh viên",
];

function renderContent(text) {
  // Render **bold** của Markdown thành chữ in đậm
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = /^\*\*([^*]+)\*\*$/.exec(part);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-[#1d1d1f]">
          {boldMatch[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = loadHistory();
    setMessages(stored.length > 0 ? stored : [WELCOME_MESSAGE]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const payload = newMessages.filter((m) => m !== WELCOME_MESSAGE);
      const reply = await sendChatMessage(payload);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi kết nối. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở chat tư vấn"
          className="group fixed bottom-6 right-6 z-[9999] bg-transparent border-none p-0 hover:scale-110 active:scale-95 transition-all cursor-pointer drop-shadow-lg"
          style={{ width: 60, height: 60 }}
        >
          {/* Bot icon */}
          <img src="https://slink.ptit.edu.vn/images/chatbot.png" alt="chatbot" className="w-full h-full object-contain" />

          {/* Online dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[#34c759] border-2 border-white z-10" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1d1d1f] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden">
                <img src="https://slink.ptit.edu.vn/images/chatbot.png" alt="chatbot" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-sm font-semibold">HK Tech Assistant</div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  Đang hoạt động
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              title="Đóng"
              className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#fafafa]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-[14px] leading-snug whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-[#0071e3] text-white rounded-br-sm"
                      : "bg-white text-[#1d1d1f] border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? renderContent(m.content) : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-500 py-1">{error}</div>
            )}

            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-white border border-gray-300 text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0071e3] transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Nhập tin nhắn..."
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-[14px] focus:outline-none focus:border-[#0071e3] disabled:bg-gray-100 max-h-24"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-[#0071e3] text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#0077ed] transition cursor-pointer"
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
