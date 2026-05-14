import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import axiosClient, { API_URL } from "../lib/api";
import { getCart } from "../lib/cart";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const oauthError = searchParams.get("error");

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ.";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
    return e;
  };

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Vui lòng nhập email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email không hợp lệ.";
    }
    if (name === "password") {
      if (!value) return "Vui lòng nhập mật khẩu.";
    }
    return undefined;
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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });
      const { token, user, emailVerified } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("userUpdated"));

      // Merge giỏ hàng localStorage vào server
      const localCart = getCart();
      if (localCart.length > 0) {
        axiosClient.post("/api/cart/merge", {
          items: localCart.map((i) => ({
            productId: i.product || i.id,
            variantId: i.variantId || null,
            color: i.color || "",
            quantity: i.quantity || 1,
          })),
        }).catch(() => {});
      }

      toast.success("Đăng nhập thành công!");
      if (emailVerified === false) {
        toast.warn("Email chưa được xác minh. Vui lòng kiểm tra hộp thư của bạn.", { autoClose: 6000 });
      }
      navigate("/");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Email hoặc mật khẩu không đúng.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3] selection:text-white antialiased"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />

      <main className="bg-[#fafafa] min-h-[calc(100vh-130px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="w-full max-w-[420px]"
        >
          {/* Card */}
          <div className="rounded-[24px] border border-black/[0.07] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Top accent */}
            <div className="h-1 w-full bg-[#1d1d1f]" />

            <div className="px-8 pt-8 pb-9">
              {/* Logo + heading */}
              <div className="flex flex-col items-center mb-7">
                <div className="mb-3 text-[#1d1d1f]">
                  <AppleLogo size={36} />
                </div>
                <h1
                  className="text-[#1d1d1f] tracking-tight"
                  style={{ fontSize: "22px", fontWeight: 650 }}
                >
                  Đăng nhập
                </h1>
                <p className="mt-1 text-sm text-[#6e6e73]">
                  Chào mừng bạn quay lại
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${
                      errors.email
                        ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
                        : "border-black/[0.1] focus:border-[#0071e3]"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-[#e53e3e]">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="text-[13px] font-medium text-[#1d1d1f]"
                    >
                      Mật khẩu
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[12px] text-[#0071e3] hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border bg-[#fafafa] px-4 py-3 pr-11 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 ${
                        errors.password
                          ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
                          : "border-black/[0.1] focus:border-[#0071e3]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#8e8e93] transition-colors duration-150 hover:text-[#1d1d1f]"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-[#e53e3e]">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.985 }}
                  className="mt-2 w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#3d3d3f] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Đang đăng nhập...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/[0.07]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[12px] text-[#8e8e93]">
                    hoặc
                  </span>
                </div>
              </div>

              {/* Google OAuth */}
              <a
                href={`${API_URL}/api/auth/google`}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-black/[0.1] bg-white py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:bg-[#fafafa] hover:border-black/[0.2] mb-5"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                </svg>
                Tiếp tục bằng Google
              </a>

              {oauthError && (
                <p className="mb-4 text-center text-[13px] text-[#e53e3e]">
                  {oauthError === "oauth_not_configured"
                    ? "Google OAuth chưa được cấu hình."
                    : "Đăng nhập Google thất bại. Vui lòng thử lại."}
                </p>
              )}

              {/* Sign up link */}
              <p className="text-center text-[13px] text-[#6e6e73]">
                Chưa có tài khoản?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-[#0071e3] hover:underline"
                >
                  Tạo tài khoản
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-5 text-[11px] text-[#8e8e93]">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
