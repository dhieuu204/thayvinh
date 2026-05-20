import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { toast } from "react-toastify";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── Animated counter ───────────────────────────────────────────── */
function AnimatedStat({ value, suffix, label, delay }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useState(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(value);
    const duration = 1500;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <p className="text-[42px] font-bold tracking-tight text-[#1d1d1f]" style={{ fontWeight: 700 }}>
        {isInView ? value : "0"}{suffix}
      </p>
      <p className="mt-1 text-sm text-[#6e6e73]">{label}</p>
    </motion.div>
  );
}

const STATS = [
  { value: "200", suffix: "+", label: "Sản phẩm chính hãng" },
  { value: "50", suffix: "K+", label: "Khách hàng tin tưởng" },
  { value: "8", suffix: " năm", label: "Kinh nghiệm" },
  { value: "99", suffix: "%", label: "Đánh giá 5 sao" },
];

const WHY_US = [
  {
    icon: "🛡️",
    title: "Chính hãng 100%",
    desc: "Tất cả sản phẩm đều được nhập khẩu trực tiếp từ Apple, kèm hoá đơn và phiếu bảo hành chính hãng.",
  },
  {
    icon: "🚚",
    title: "Giao hàng nhanh",
    desc: "Miễn phí vận chuyển toàn quốc. Giao trong 24h tại nội thành, 2–3 ngày tỉnh xa.",
  },
  {
    icon: "🔄",
    title: "Đổi trả 30 ngày",
    desc: "Đổi trả miễn phí trong 30 ngày nếu sản phẩm lỗi nhà sản xuất, không cần giải thích.",
  },
  {
    icon: "💳",
    title: "Thanh toán linh hoạt",
    desc: "Hỗ trợ COD, chuyển khoản, ví điện tử và trả góp 0% qua thẻ tín dụng.",
  },
  {
    icon: "🎧",
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ tư vấn viên sẵn sàng 24/7 qua hotline, chat và email để hỗ trợ bạn.",
  },
  {
    icon: "✨",
    title: "Trải nghiệm premium",
    desc: "Đóng gói cao cấp, tặng kèm phụ kiện và kiểm tra kỹ lưỡng trước khi giao.",
  },
];

const TEAM = [
  { name: "Nguyễn Minh Tuấn", role: "CEO & Co-founder", emoji: "👨‍💼", desc: "10 năm kinh nghiệm phân phối thiết bị Apple tại Việt Nam." },
  { name: "Trần Thanh Hà", role: "CTO", emoji: "👩‍💻", desc: "Chuyên gia công nghệ với passion về trải nghiệm người dùng." },
  { name: "Lê Quang Khải", role: "Head of Operations", emoji: "👨‍🔧", desc: "Đảm bảo mọi đơn hàng được xử lý nhanh chóng và chính xác." },
  { name: "Phạm Bảo Ngọc", role: "Customer Success", emoji: "👩‍💼", desc: "Xây dựng nền tảng dịch vụ khách hàng tốt nhất ngành." },
];

/* ─── AboutPage ──────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb items={[{ label: "Trang chủ", to: "/" }, { label: "Về chúng tôi" }]} />

      {/* ── Hero ── */}
      <section className="overflow-hidden bg-[#1d1d1f] py-20 text-white">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="mb-4 inline-block rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/60">
              Về chúng tôi
            </span>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.1 }}>
              Chúng tôi mang <span className="text-[#0071e3]">Apple</span> đến tay bạn
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-white/70">
              Từ năm 2016, chúng tôi đã trở thành đại lý Apple uy tín hàng đầu Việt Nam — nơi mà mỗi chiếc iPhone, MacBook hay AirPods đều được đảm bảo 100% chính hãng với dịch vụ tốt nhất.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1d1d1f] transition-all hover:bg-white/90"
              >
                Khám phá sản phẩm
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/50"
              >
                Liên hệ chúng tôi
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-black/[0.06] py-14">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <AnimatedStat key={stat.label} {...stat} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3]">
                Câu chuyện của chúng tôi
              </span>
              <h2 className="mt-3 text-[28px] font-bold leading-tight text-[#1d1d1f]">
                Từ đam mê <br />đến sứ mệnh
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#3a3a3c]">
                <p>
                  HK Tech ra đời từ một nhóm những người trẻ yêu công nghệ, với niềm tin rằng mọi người Việt đều xứng đáng được trải nghiệm sản phẩm Apple chính hãng với chi phí hợp lý.
                </p>
                <p>
                  Chúng tôi bắt đầu từ một cửa hàng nhỏ tại TP.HCM năm 2016. Với cam kết không bán hàng xách tay, không lừa dối khách hàng — chúng tôi đã dần xây dựng được niềm tin và mở rộng ra toàn quốc.
                </p>
                <p>
                  Hôm nay, hơn 50.000 khách hàng tin tưởng HK Tech là điểm đến đầu tiên khi cần mua thiết bị Apple.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-[480px] lg:shrink-0"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { year: "2016", text: "Thành lập cửa hàng đầu tiên tại Q.1, TP.HCM" },
                  { year: "2018", text: "Mở rộng ra Hà Nội và Đà Nẵng" },
                  { year: "2021", text: "Ra mắt nền tảng thương mại điện tử" },
                  { year: "2024", text: "Phục vụ 50.000+ khách hàng trên toàn quốc" },
                ].map((item) => (
                  <div
                    key={item.year}
                    className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-5"
                  >
                    <p className="text-[22px] font-bold text-[#0071e3]">{item.year}</p>
                    <p className="mt-1 text-sm text-[#3a3a3c]">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="bg-[#fafafa] py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3]">
              Tại sao chọn chúng tôi
            </span>
            <h2 className="mt-3 text-[28px] font-bold text-[#1d1d1f]">
              Cam kết của HK Tech
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f7] text-2xl">
                  {item.icon}
                </div>
                <h3 className="mb-2 font-semibold text-[#1d1d1f]">{item.title}</h3>
                <p className="text-[14px] leading-relaxed text-[#6e6e73]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071e3]">Đội ngũ</span>
            <h2 className="mt-3 text-[28px] font-bold text-[#1d1d1f]">Con người tạo nên HK Tech</h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7] text-3xl">
                  {member.emoji}
                </div>
                <p className="font-semibold text-[#1d1d1f]">{member.name}</p>
                <p className="mt-0.5 text-xs font-medium text-[#0071e3]">{member.role}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#6e6e73]">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1d1d1f] py-16 text-center text-white">
        <div className="mx-auto max-w-xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-[28px] font-bold">Sẵn sàng trải nghiệm?</h2>
            <p className="mt-3 text-white/70">
              Khám phá hàng trăm sản phẩm Apple chính hãng với giá tốt nhất thị trường.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link to="/products" className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#1d1d1f] hover:bg-white/90 transition-all">
                Mua sắm ngay
              </Link>
              <Link to="/contact" className="rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-white hover:border-white/50 transition-all">
                Liên hệ hỗ trợ
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
