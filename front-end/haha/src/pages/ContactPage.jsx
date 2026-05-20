import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const CONTACT_INFO = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Địa chỉ",
    value: "123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM",
    sub: "Thứ 2 – Thứ 7: 8:00 – 21:00",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    label: "Hotline",
    value: "1900 1234",
    sub: "Hỗ trợ 24/7, miễn phí",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    value: "support@hktech.vn",
    sub: "Phản hồi trong 2 giờ làm việc",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Giờ làm việc",
    value: "8:00 – 21:00",
    sub: "Tất cả các ngày trong tuần",
  },
];

const SUBJECTS = [
  "Hỏi về sản phẩm",
  "Tư vấn mua hàng",
  "Hỗ trợ đơn hàng",
  "Bảo hành & sửa chữa",
  "Hợp tác kinh doanh",
  "Khác",
];

const inputCls = (err) =>
  `w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
    err
      ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
      : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
  }`;

function Field({ label, id, error, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]">
        {label}{required && <span className="ml-0.5 text-[#e53e3e]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#e53e3e]">{error}</p>}
    </div>
  );
}

/* ─── ContactPage ────────────────────────────────────────────────── */
export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", subject: SUBJECTS[0], message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập họ tên.";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email không hợp lệ.";
    if (!form.message.trim()) errs.message = "Vui lòng nhập nội dung liên hệ.";
    else if (form.message.trim().length < 20) errs.message = "Nội dung tối thiểu 20 ký tự.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/contact`, form);
    } catch {}
    // Mock: luôn success
    setSent(true);
    toast.success("Cảm ơn bạn! Chúng tôi sẽ phản hồi trong 2 giờ làm việc.");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb items={[{ label: "Trang chủ", to: "/" }, { label: "Liên hệ" }]} />

      <main className="pb-16">
        {/* ── Hero ── */}
        <section className="border-b border-black/[0.06] bg-white py-10">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700 }} className="text-[#1d1d1f]">
                Liên hệ với chúng tôi
              </h1>
              <p className="mt-2 max-w-lg text-[15px] text-[#6e6e73]">
                Đội ngũ hỗ trợ của HK Tech luôn sẵn sàng tư vấn và giải đáp mọi thắc mắc của bạn.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

            {/* ── Left: Contact info ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full lg:w-[320px] lg:shrink-0 space-y-4"
            >
              {CONTACT_INFO.map((info) => (
                <div
                  key={info.label}
                  className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6ff] text-[#0071e3]">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-[#8e8e93]">
                      {info.label}
                    </p>
                    <p className="mt-0.5 font-semibold text-[#1d1d1f]">{info.value}</p>
                    <p className="text-[12px] text-[#6e6e73]">{info.sub}</p>
                  </div>
                </div>
              ))}

              {/* Social links */}
              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-[#8e8e93]">
                  Mạng xã hội
                </p>
                <div className="flex gap-3">
                  {[
                    { name: "Facebook", color: "#1877f2", icon: "f" },
                    { name: "Instagram", color: "#e1306c", icon: "ig" },
                    { name: "Zalo", color: "#0068ff", icon: "z" },
                    { name: "YouTube", color: "#ff0000", icon: "▶" },
                  ].map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      title={s.name}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f7] text-sm font-bold transition-all hover:opacity-80"
                      style={{ color: s.color }}
                    >
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f5f5f7] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="flex h-40 items-center justify-center text-center">
                  <div>
                    <p className="text-3xl">🗺️</p>
                    <p className="mt-2 text-sm font-medium text-[#1d1d1f]">Google Maps</p>
                    <p className="text-xs text-[#6e6e73]">123 Lê Lợi, Q.1</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Right: Contact form ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="h-1 w-full bg-[#1d1d1f]" />
              <div className="p-6 sm:p-8">
                {!sent ? (
                  <>
                    <h2 className="mb-6 text-[17px] font-semibold text-[#1d1d1f]">
                      Gửi tin nhắn cho chúng tôi
                    </h2>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Họ và tên" id="ct-name" error={errors.name} required>
                          <input
                            id="ct-name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            className={inputCls(errors.name)}
                          />
                        </Field>
                        <Field label="Email" id="ct-email" error={errors.email} required>
                          <input
                            id="ct-email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={inputCls(errors.email)}
                          />
                        </Field>
                      </div>

                      <Field label="Chủ đề" id="ct-subject">
                        <select
                          id="ct-subject"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className={`${inputCls(false)} cursor-pointer`}
                        >
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Nội dung" id="ct-message" error={errors.message} required>
                        <textarea
                          id="ct-message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Mô tả chi tiết câu hỏi hoặc vấn đề của bạn..."
                          className={`resize-none ${inputCls(errors.message)}`}
                        />
                        <p className="mt-1 text-right text-xs text-[#8e8e93]">
                          {form.message.length}/500
                        </p>
                      </Field>

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-[#6e6e73]">
                          Thời gian phản hồi thông thường: <br />
                          <span className="font-medium text-[#1d1d1f]">trong vòng 2 giờ làm việc</span>
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.985 }}
                          type="submit"
                          disabled={loading}
                          className="shrink-0 rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                              Đang gửi...
                            </span>
                          ) : "Gửi tin nhắn"}
                        </motion.button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Success state */
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0fdf4]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="text-[20px] font-semibold text-[#1d1d1f]">Gửi thành công!</h3>
                    <p className="mt-2 max-w-sm text-sm text-[#6e6e73]">
                      Cảm ơn <span className="font-medium text-[#1d1d1f]">{form.name}</span> đã liên hệ!
                      Chúng tôi sẽ phản hồi qua email <span className="font-medium text-[#0071e3]">{form.email}</span> trong 2 giờ làm việc.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSent(false); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                      className="mt-6 rounded-full border border-[#1d1d1f] px-6 py-2.5 text-sm font-medium text-[#1d1d1f] transition-all hover:bg-[#1d1d1f] hover:text-white"
                    >
                      Gửi tin nhắn khác
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
