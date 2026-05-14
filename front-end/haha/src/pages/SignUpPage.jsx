import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PasswordStrengthBar({ password }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const labels = ["", "Yếu", "Trung bình", "Tốt", "Mạnh"];
  const colors = ["", "#e53e3e", "#f59e0b", "#0071e3", "#10b981"];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? colors[score] : "#e5e7eb" }} />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

// ─── Step 1: Form đăng ký ─────────────────────────────────────────────────────
function RegisterForm({ onOtpSent }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [agreed, setAgreed]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const VALID_NAME  = /^[\p{L}\s'-]+$/u;
  const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (name, value) => {
    if (name === "name") {
      if (!value.trim()) return "Vui lòng nhập họ tên.";
      if (!VALID_NAME.test(value.trim())) return "Họ tên không được chứa số hoặc ký tự đặc biệt.";
    }
    if (name === "email") {
      if (!value.trim()) return "Vui lòng nhập email.";
      if (!VALID_EMAIL.test(value)) return "Email không hợp lệ.";
    }
    if (name === "password") {
      if (!value) return "Vui lòng nhập mật khẩu.";
      if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (name === "confirmPassword") {
      if (!value) return "Vui lòng xác nhận mật khẩu.";
      if (value !== form.password) return "Mật khẩu xác nhận không khớp.";
    }
    return undefined;
  };

  const validate = () => {
    const e = {};
    ["name", "email", "password", "confirmPassword"].forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) e[f] = err;
    });
    if (!agreed) e.agreed = "Bạn cần đồng ý với điều khoản sử dụng.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, { email: form.email, password: form.password });
      onOtpSent({ email: form.email, password: form.password, name: form.name });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    { label: "Ít nhất 8 ký tự", ok: form.password.length >= 8 },
    { label: "Chứa chữ hoa",    ok: /[A-Z]/.test(form.password) },
    { label: "Chứa số",         ok: /[0-9]/.test(form.password) },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="signup-name" className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Họ và tên</label>
        <input id="signup-name" type="text" name="name" autoComplete="name" value={form.name}
          onChange={handleChange} onBlur={handleBlur} placeholder="Nguyễn Văn A"
          className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${errors.name ? "border-[#e53e3e]" : "border-black/[0.1] focus:border-[#0071e3]"}`}
        />
        {errors.name && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="signup-email" className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Email</label>
        <input id="signup-email" type="email" name="email" autoComplete="email" value={form.email}
          onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com"
          className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${errors.email ? "border-[#e53e3e]" : "border-black/[0.1] focus:border-[#0071e3]"}`}
        />
        {errors.email && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="signup-password" className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Mật khẩu</label>
        <div className="relative">
          <input id="signup-password" type={showPassword ? "text" : "password"} name="password"
            autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="••••••••"
            className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 pr-11 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${errors.password ? "border-[#e53e3e]" : "border-black/[0.1] focus:border-[#0071e3]"}`}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#1d1d1f]">
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.password}</p>}
        {form.password && <PasswordStrengthBar password={form.password} />}
        {form.password && (
          <ul className="mt-2 space-y-1">
            {passwordRules.map((rule) => (
              <li key={rule.label} className="flex items-center gap-1.5 text-[11px] transition-colors"
                style={{ color: rule.ok ? "#10b981" : "#8e8e93" }}>
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all ${rule.ok ? "bg-[#10b981] text-white" : "border border-[#c7c7cc]"}`}>
                  {rule.ok && <CheckIcon />}
                </span>
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="signup-confirm" className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Xác nhận mật khẩu</label>
        <div className="relative">
          <input id="signup-confirm" type={showConfirm ? "text" : "password"} name="confirmPassword"
            autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••"
            className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 pr-11 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${errors.confirmPassword ? "border-[#e53e3e]" : form.confirmPassword && form.password === form.confirmPassword ? "border-[#10b981]" : "border-black/[0.1] focus:border-[#0071e3]"}`}
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#1d1d1f]">
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        {errors.confirmPassword && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.confirmPassword}</p>}
        {form.confirmPassword && form.password === form.confirmPassword && (
          <p className="mt-1.5 text-[11px] text-[#10b981] flex items-center gap-1"><CheckIcon /> Mật khẩu khớp</p>
        )}
      </div>

      {/* Terms */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <div className="relative mt-0.5 shrink-0">
            <input id="signup-terms" type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: undefined })); }} className="sr-only" />
            <div className={`h-4 w-4 cursor-pointer rounded flex items-center justify-center transition-all duration-150 border ${agreed ? "bg-[#1d1d1f] border-[#1d1d1f]" : errors.agreed ? "border-[#e53e3e]" : "border-black/[0.2] hover:border-black/[0.4]"}`}
              onClick={() => { setAgreed((v) => !v); setErrors((err) => ({ ...err, agreed: undefined })); }}>
              {agreed && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
          </div>
          <span className="text-[13px] text-[#6e6e73] leading-snug">
            Tôi đồng ý với{" "}
            <a href="#" className="text-[#0071e3] hover:underline">Điều khoản sử dụng</a>{" "}
            và{" "}
            <a href="#" className="text-[#0071e3] hover:underline">Chính sách bảo mật</a>
          </span>
        </label>
        {errors.agreed && <p className="mt-1.5 text-xs text-[#e53e3e]">{errors.agreed}</p>}
      </div>

      {/* Submit */}
      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.985 }}
        className="mt-2 w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f] disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Đang gửi mã...
          </span>
        ) : "Tiếp tục"}
      </motion.button>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/[0.07]" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-[12px] text-[#8e8e93]">hoặc</span></div>
      </div>

      {/* Google */}
      <a href={`${API_URL}/api/auth/google`}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-black/[0.1] bg-white py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:bg-[#fafafa] hover:border-black/[0.2]">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
        </svg>
        Đăng ký bằng Google
      </a>

      <p className="text-center text-[13px] text-[#6e6e73]">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold text-[#0071e3] hover:underline">Đăng nhập ngay</Link>
      </p>
    </form>
  );
}

// ─── Step 2: Nhập OTP ─────────────────────────────────────────────────────────
function OtpStep({ email, password, name, onBack }) {
  const navigate   = useNavigate();
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCd, setResendCd] = useState(60);
  const inputRefs = useRef([]);

  // Countdown resend
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  const handleInput = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, { email, password });
      setOtp(["", "", "", "", "", ""]);
      setResendCd(60);
      inputRefs.current[0]?.focus();
      toast.success("Đã gửi lại mã OTP!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể gửi lại mã.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Vui lòng nhập đủ 6 chữ số."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-register-otp`, { email, code, password, name });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Tạo tài khoản thành công! Chào mừng bạn.");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "OTP không đúng hoặc đã hết hạn.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
          <h2 className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">Nhập mã xác minh</h2>
        <p className="text-[13px] text-[#6e6e73] mt-1.5">
          Mã 6 chữ số đã được gửi đến<br />
          <span className="font-medium text-[#1d1d1f]">{email}</span>
        </p>
      </div>

      {/* OTP inputs */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 h-13 text-center text-[20px] font-semibold rounded-xl border bg-[#fafafa] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] ${digit ? "border-[#0071e3] bg-white" : "border-black/[0.1]"}`}
            style={{ height: "52px" }}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {/* Submit */}
      <motion.button type="submit" disabled={loading || otp.join("").length < 6} whileTap={{ scale: 0.985 }}
        className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f] disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Đang xác minh...
          </span>
        ) : "Xác nhận"}
      </motion.button>

      {/* Resend + Back */}
      <div className="flex items-center justify-between text-[13px]">
        <button type="button" onClick={onBack} className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
          ← Quay lại
        </button>
        {resendCd > 0 ? (
          <span className="text-[#8e8e93]">Gửi lại sau {resendCd}s</span>
        ) : (
          <button type="button" onClick={handleResend} className="font-semibold text-[#0071e3] hover:underline">
            Gửi lại mã
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const [step, setStep]       = useState("form"); // "form" | "otp"
  const [pending, setPending] = useState(null);   // { email, password, name }

  const handleOtpSent = (data) => {
    setPending(data);
    setStep("otp");
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3] selection:text-white antialiased"
      style={{ fontFamily: SF_FONT }}>
      <Header />

      <main className="bg-[#fafafa] min-h-[calc(100vh-130px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="w-full max-w-[460px]"
        >
          <div className="rounded-[24px] border border-black/[0.07] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1 w-full bg-[#1d1d1f]" />

            <div className="px-8 pt-8 pb-9">
              {/* Logo + heading (chỉ hiện ở step form) */}
              {step === "form" && (
                <div className="flex flex-col items-center mb-7">
                  <div className="mb-3 text-[#1d1d1f]"><AppleLogo size={36} /></div>
                  <h1 className="text-[#1d1d1f] tracking-tight" style={{ fontSize: "22px", fontWeight: 650 }}>
                    Tạo tài khoản
                  </h1>
                  <p className="mt-1 text-sm text-[#6e6e73]">Tham gia để trải nghiệm mua sắm tốt hơn</p>
                </div>
              )}

              {step === "otp" && (
                <div className="mb-3 flex justify-center text-[#1d1d1f]">
                  <AppleLogo size={32} />
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === "form" && (
                  <motion.div key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}>
                    <RegisterForm onOtpSent={handleOtpSent} />
                  </motion.div>
                )}
                {step === "otp" && pending && (
                  <motion.div key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}>
                    <OtpStep
                      email={pending.email}
                      password={pending.password}
                      name={pending.name}
                      onBack={() => setStep("form")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-5 text-[11px] text-[#8e8e93]">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Bảo mật SSL
            </span>
            <span className="text-black/[0.1]">|</span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Bảo vệ thông tin
            </span>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
