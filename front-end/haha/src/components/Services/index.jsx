import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { ShieldIcon, HeadsetIcon, PhoneIcon, StarIcon } from "../icons";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";

const features = [
  {
    icon: <ShieldIcon />,
    title: "Bảo hành chính hãng",
    desc: "Sản phẩm đi kèm bảo hành chính hãng, an tâm sử dụng.",
  },
  {
    icon: <HeadsetIcon />,
    title: "Hỗ trợ kỹ thuật",
    desc: "Hỗ trợ nhanh chóng mọi vấn đề từ cài đặt đến sử dụng.",
  },
  {
    icon: <PhoneIcon />,
    title: "Hỗ trợ miễn phí",
    desc: "Tư vấn, hướng dẫn và giải đáp hoàn toàn miễn phí.",
  },
];

const testimonials = [
  {
    quote:
      "Dich vu tuyet voi, giao hang than toc. San pham dong goi rat can than, nguyen seal chinh hang. Chac chan se quay lai!",
    name: "Hoang Minh",
    role: "Doanh nhan",
    image:
      "https://images.unsplash.com/photo-1765366574945-e2f1b4b1a5b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGJsYWNrJTIwbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3NDQyODAwMXww&ixlib=rb-4.1.0&q=80&w=200",
  },
  {
    quote:
      "Lan dau mua online tren web nay ma qua ung y. Nhan vien tu van nhiet tinh, co ca uu dai thu cu doi moi rat tien loi.",
    name: "Lan Huong",
    role: "Thiet ke do hoa",
    image:
      "https://images.unsplash.com/photo-1774233492889-6a064e0aa4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0MzY1MzMwfDA&ixlib=rb-4.1.0&q=80&w=200",
  },
  {
    quote:
      "Trang web thiet ke muot ma, de thao tac. Da mua iPhone 15 Pro Max tai day, hang chuan VN/A. Rat xuat sac!",
    name: "Quoc Tuan",
    role: "Lap trinh vien",
    image:
      "https://images.unsplash.com/photo-1614807536394-cd67bd4a634b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwYWZyaWNhbiUyMG1hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc0NDI4MDA3fDA&ixlib=rb-4.1.0&q=80&w=200",
  },
];

export default function Services() {
  return (
    <>
      <section className="w-full bg-[#fbfbfd] py-10">
        <motion.div
          className="max-w-[1200px] mx-auto px-6 flex gap-16 flex items-center"
          {...fadeInUp}
        >
          <div className="flex-shrink-0 max-w-[280px]">
            <h2
              className="text-[#1d1d1f] mb-2 tracking-tight"
              style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.15 }}
            >
              Connect with
              <br />
              Confidence
            </h2>
            <p
              className="text-[#6e6e73] mb-4"
              style={{ fontSize: "13px", lineHeight: 1.6 }}
            >
              Khám phá hệ sinh thái dịch vụ và hỗ trợ toàn diện của chúng tôi dành riêng cho bạn.
            </p>
            <button
              className="bg-[#1d1d1f] border border-black/[0.08] text-white px-4 py-2 rounded-full hover:bg-white hover:text-[#1d1d1f] transition-all duration-300 shadow-sm cursor-pointer"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              Tìm hiểu thêm
            </button>
          </div>

          <motion.div
            className="flex-1 grid grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-[#fafafa] rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-500 items-center text-center flex flex-col"
              >
                <div className="w-14 h-14 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6 text-[#1d1d1f]">
                  {f.icon}
                </div>
                <h3
                  className="text-[#1d1d1f] mb-3 tracking-tight"
                  style={{ fontSize: "16px", fontWeight: 600 }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[#6e6e73]"
                  style={{ fontSize: "13px", lineHeight: 1.6 }}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* <section className="w-full bg-[#fbfbfd] py-24">
        <motion.div
          className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row gap-16 items-start"
          {...fadeInUp}
        >
          <div className="flex-shrink-0 max-w-[280px]">
            <h2
              className="text-[#1d1d1f] mb-4 tracking-tight"
              style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}
            >
              Khach hang
              <br />
              noi gi ve chung toi.
            </h2>
            <p
              className="text-[#6e6e73] mb-8"
              style={{ fontSize: "15px", lineHeight: 1.6 }}
            >
              Nhung danh gia chan thuc tu hang ngan khach hang da trai nghiem
              mua sam tai cua hang.
            </p>
          </div>

          <motion.div
            className="flex-1 grid grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-[#f5f5f7] opacity-60">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                  </svg>
                </div>

                <div className="flex gap-1 text-[#f5a623] mb-5 relative z-10">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} filled />
                  ))}
                </div>

                <p
                  className="text-[#1d1d1f] mb-8 flex-1 italic relative z-10"
                  style={{ fontSize: "14px", lineHeight: 1.6 }}
                >
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#f5f5f7]">
                    <ImageWithFallback
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p
                      className="text-[#1d1d1f]"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      {t.name}
                    </p>
                    <p className="text-[#86868b]" style={{ fontSize: "11px" }}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section> */}
    </>
  );
}
