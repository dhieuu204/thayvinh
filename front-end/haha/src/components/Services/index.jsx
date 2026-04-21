import { motion } from "framer-motion";
import { ShieldIcon, TruckIcon, CheckCircleIcon } from "../icons";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";

const features = [
  {
    icon: <CheckCircleIcon size={36} />,
    title: "Mẫu mã đa dạng,\nchính hãng",
  },
  {
    icon: <TruckIcon size={36} />,
    title: "Giao hàng toàn quốc",
  },
  {
    icon: <ShieldIcon size={36} />,
    title: "Bảo hành có cam kết\ntới 12 tháng",
  },
];

export default function Services() {
  return (
    <>
      <section className="w-full bg-[#fafafa] py-6">
        <motion.div
          className="max-w-[1200px] mx-auto px-6 text-[#1d1d1f]"
          {...fadeInUp}
        >
          <motion.div
            className="flex flex-col md:flex-row justify-center items-center md:items-start gap-24 md:gap-48"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="flex flex-col items-center text-center max-w-[200px]"
              >
                <div className="flex items-center justify-center mb-4 text-[#1d1d1f]">
                  {f.icon}
                </div>
                <h3
                  className="text-[#1d1d1f] whitespace-pre-line"
                  style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.5 }}
                >
                  {f.title}
                </h3>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
