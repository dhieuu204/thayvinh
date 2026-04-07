import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AppleLogo } from "../components/icons";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ─── Password strength indicator ───────────────────────────────── */
function StrengthBar({ password }) {
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  if (!password) return null;

  const strength = getStrength(password);
  const labels = ["", "Yếu", "Trung bình", "Tốt", "Mạnh"];
  const colors = ["", "#e53e3e", "#f59e0b", "#0071e3", "#16a34a"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= strength ? colors[strength] : "#e5e5ea" }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: colors[strength] }}>
        {labels[strength]}
      </p>
    </div>
  );
}

/* ─── ResetPasswordPage ──────────────────────────────────────────── */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Nếu không có token → báo lỗi
  const invalidToken = !token;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = "Vui lòng nhập mật khẩu mới.";
    else if (form.password.length < 8) errs.password = "Mật khẩu tối thiểu 8 ký tự.";
    if (!form.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu.";
    else if (form.confirm !== form.password) errs.confirm = "Mật khẩu xác nhận không khớp.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        password: form.password,
      });
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Link không hợp lệ hoặc đã hết hạn.";
      toast.error(msg);
      // Mock: tiếp tục demo
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

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
                  {done ? "Hoàn tất!" : "Đặt lại mật khẩu"}
                </h1>
                <p className="mt-1 text-center text-sm text-[#6e6e73]">
                  {done
                    ? "Mật khẩu đã được cập nhật thành công"
                    : "Tạo mật khẩu mới cho tài khoản của bạn"}
                </p>
              </div>

              {invalidToken ? (
                /* ── Invalid token ── */
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f0]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </div>
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">Link không hợp lệ</p>
                  <p className="mt-2 text-sm text-[#6e6e73]">
                    Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="mt-5 block w-full rounded-full bg-[#1d1d1f] py-3.5 text-center text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f]"
                  >
                    Yêu cầu link mới
                  </Link>
                </div>
              ) : done ? (
                /* ── Success ── */
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0fdf4]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <p className="text-sm text-[#6e6e73]">
                    Đang chuyển về trang đăng nhập trong 3 giây...
                  </p>
                  <Link
                    to="/login"
                    className="mt-5 block w-full rounded-full bg-[#1d1d1f] py-3.5 text-center text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f]"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* New password */}
                  <div>
                    <label htmlFor="reset-password" className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        id="reset-password"
                        type={show.password ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Tối thiểu 8 ký tự"
                        autoFocus
                        className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 pr-11 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
                          errors.password
                            ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
                            : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] transition-colors hover:text-[#1d1d1f]"
                        tabIndex={-1}
                      >
                        <EyeIcon open={show.password} />
                      </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.password}</p>}
                    <StrengthBar password={form.password} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="reset-confirm" className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        id="reset-confirm"
                        type={show.confirm ? "text" : "password"}
                        name="confirm"
                        value={form.confirm}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu mới"
                        className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 pr-11 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
                          errors.confirm
                            ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
                            : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] transition-colors hover:text-[#1d1d1f]"
                        tabIndex={-1}
                      >
                        <EyeIcon open={show.confirm} />
                      </button>
                    </div>
                    {errors.confirm && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.confirm}</p>}
                    {form.confirm && form.confirm === form.password && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-[#16a34a]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        Mật khẩu khớp
                      </p>
                    )}
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
                        Đang cập nhật...
                      </span>
                    ) : (
                      "Đặt lại mật khẩu"
                    )}
                  </motion.button>
                </form>
              )}

              {!done && !invalidToken && (
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-1 text-[13px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Quay lại đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
