import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AppleLogo } from "../components/icons";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── ForgotPasswordPage ─────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) return "Vui lòng nhập địa chỉ email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch {
      // Mock: luôn thành công để demo UI
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />

      <main className="flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="w-full max-w-[420px]"
        >
          <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
            {/* Top accent */}
            <div className="h-1 w-full bg-[#1d1d1f]" />

            <div className="px-8 pb-9 pt-8">
              {/* Logo + heading */}
              <div className="mb-7 flex flex-col items-center">
                <div className="mb-3 text-[#1d1d1f]">
                  <AppleLogo size={36} />
                </div>
                <h1
                  className="text-[#1d1d1f] tracking-tight"
                  style={{ fontSize: "22px", fontWeight: 650 }}
                >
                  Quên mật khẩu
                </h1>
                <p className="mt-1 text-center text-sm text-[#6e6e73]">
                  {sent
                    ? "Kiểm tra hộp thư email của bạn"
                    : "Nhập email để nhận link đặt lại mật khẩu"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!sent ? (
                  /* ── Step 1: Input email ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      <div>
                        <label
                          htmlFor="forgot-email"
                          className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]"
                        >
                          Địa chỉ email
                        </label>
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          placeholder="you@example.com"
                          autoComplete="email"
                          autoFocus
                          className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
                            error
                              ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
                              : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
                          }`}
                        />
                        {error && <p className="mt-1.5 text-xs text-[#e53e3e]">{error}</p>}
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            Đang gửi...
                          </span>
                        ) : (
                          "Gửi link đặt lại"
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  /* ── Step 2: Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    {/* Success icon */}
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0fdf4]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1d1d1f]">Email đã được gửi!</p>
                    <p className="mt-2 text-sm text-[#6e6e73]">
                      Chúng tôi đã gửi link đặt lại mật khẩu đến{" "}
                      <span className="font-medium text-[#1d1d1f]">{email}</span>.
                      <br />
                      Kiểm tra cả thư mục Spam nếu không thấy.
                    </p>

                    <div className="mt-5 rounded-xl border border-[#fde8b1] bg-[#fffbf0] px-4 py-3 text-left">
                      <p className="text-xs font-medium text-[#92400e]">Không nhận được email?</p>
                      <ul className="mt-1.5 space-y-1 text-xs text-[#78350f]">
                        <li>• Kiểm tra thư mục Spam / Junk</li>
                        <li>• Đảm bảo email nhập đúng</li>
                        <li>• Chờ 1–2 phút rồi thử lại</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSent(false); }}
                      className="mt-4 text-sm text-[#0071e3] hover:underline"
                    >
                      Thử lại với email khác
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to login */}
              <div className="mt-6 text-center text-[13px] text-[#6e6e73]">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1 font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-[#8e8e93]">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Bảo mật SSL
            </span>
            <span className="text-black/[0.1]">|</span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Bảo vệ thông tin
            </span>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
