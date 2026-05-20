import axiosClient from "./api";

const STORAGE_KEY = "hktech_chat_history";
const MAX_STORED_MESSAGES = 30;

export async function sendChatMessage(messages) {
  const { data } = await axiosClient.post("/api/chat/message", { messages });
  return data.reply;
}

export function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && m.role && typeof m.content === "string");
  } catch {
    return [];
  }
}

export function saveHistory(messages) {
  try {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota errors */
  }
}

export function clearHistory() {
  sessionStorage.removeItem(STORAGE_KEY);
}
