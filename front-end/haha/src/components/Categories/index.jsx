import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";
import { fetchAPI } from "../../lib/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAPI("/api/categories")
      .then(setCategories)
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] pt-10">
      <motion.div className="max-w-[1200px] mx-auto px-6" {...fadeInUp}>
        {/* <div className="flex mb-6">
          <h2
            className="text-[#1d1d1f] tracking-tight"
            style={{ fontSize: "32px", fontWeight: 600 }}
          >
            Apple Categories
          </h2>
        </div> */}

        <motion.div
          className="flex flex-wrap justify-center gap-2"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {categories.map((item) => (
            <motion.div key={item._id} variants={staggerItem} className="w-[calc(50%-4px)] sm:w-44 shrink-0">
              <Link
                to={`/categories/${item.slug}`}
                className="bg-[#fbfbfd] rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer group flex flex-col h-[220px] block"
              >
                <div className="flex-1 flex items-center justify-center p-2 pt-4 relative">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-[140px] w-auto object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="px-6 py-5 bg-[#fbfbfd] group-hover:bg-white transition-colors duration-500">
                  <p
                    className="text-[#1d1d1f] tracking-tight text-center"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    {item.name}
                  </p>
                  {/* <p
                    className="text-[#86868b] text-center"
                    style={{ fontSize: "12px", marginTop: "4px", lineHeight: 1.4 }}
                  >
                    {item.description}
                  </p> */}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
