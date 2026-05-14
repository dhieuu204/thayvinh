import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";
import { fetchAPI } from "../../lib/api";
import { getDisplayPrice } from "../../lib/pricing";
import { formatCurrency } from "../../lib/format";

export default function BestSelling() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchAPI("/api/products?sort=best_seller&limit=4")
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] py-10">
      <motion.div className="max-w-[1200px] mx-auto px-6" {...fadeInUp}>
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[#1d1d1f] tracking-tight"
            style={{ fontSize: "32px", fontWeight: 600 }}
          >
            Bán chạy nhất
          </h2>
          <Link to="/products?sort=best-selling" className="text-sm text-[#0071e3] hover:underline">
            Xem tất cả
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {products.map((product, i) => {
            const image = product.images?.[0]?.url;
            const { price, oldPrice, discount } = getDisplayPrice(product);

            return (
              <motion.div key={product._id} variants={staggerItem}>
                <Link
                  to={`/products/${product._id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-black/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group block"
                >
                  <div className="relative flex items-center justify-center bg-[#f5f5f7] p-5 h-[200px]">
                    {i < 3 && (
                      <span className="absolute top-2 left-2 rounded-full bg-[#1d1d1f] px-2 py-0.5 text-xs font-bold text-white">
                        #{i + 1}
                      </span>
                    )}
                    <ImageWithFallback
                      src={image}
                      alt={product.name}
                      className="max-h-[160px] w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount && (
                      <span className="absolute top-2 right-2 rounded-full bg-[#fff1f0] px-2 py-0.5 text-xs font-semibold text-[#e53e3e]">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-[13px] font-medium text-[#1d1d1f] line-clamp-2">
                      {product.name}
                    </p>
                    <div className="mt-1.5 flex items-baseline justify-center gap-2">
                      <span className="text-[15px] font-bold text-[#1d1d1f]">
                        {formatCurrency(price)}
                      </span>
                      {oldPrice && (
                        <span className="text-xs text-[#8e8e93] line-through">
                          {formatCurrency(oldPrice)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      Đã bán {product.sold?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
