import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";
import { fetchAPI } from "../../lib/api";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FlashSale() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchAPI("/api/products/flash-sales")
      .then(setProducts)
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] py-10">
      <motion.div className="max-w-[1200px] mx-auto px-6" {...fadeInUp}>
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[#1d1d1f] tracking-tight flex items-center gap-2"
            style={{ fontSize: "32px", fontWeight: 600 }}
          >
            ⚡ Flash Sale
          </h2>
          <Link
            to="/products"
            className="text-sm text-[#0071e3] hover:underline"
          >
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
          {products.map((product) => {
            const image = product.images?.[0]?.url;
            const salePrice = product.flashSalePrice || product.salePrice;
            const originalPrice = product.basePrice;
            const discount = salePrice
              ? Math.round((1 - salePrice / originalPrice) * 100)
              : null;

            return (
              <motion.div key={product._id} variants={staggerItem}>
                <Link
                  to={`/products/${product._id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-black/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group block"
                >
                  <div className="relative flex items-center justify-center bg-[#f5f5f7] p-5 h-[180px]">
                    <ImageWithFallback
                      src={image}
                      alt={product.name}
                      className="max-h-[140px] w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount && (
                      <span className="absolute top-2 right-2 rounded-full bg-[#e53e3e] px-2 py-0.5 text-xs font-bold text-white">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-[13px] font-medium text-[#1d1d1f] line-clamp-2">
                      {product.name}
                    </p>
                    <div className="mt-1.5 flex items-baseline justify-center gap-2">
                      {salePrice && (
                        <span className="text-[15px] font-bold text-[#e53e3e]">
                          {formatCurrency(salePrice)}
                        </span>
                      )}
                      <span
                        className={`text-xs ${salePrice ? "text-[#8e8e93] line-through" : "font-bold text-[#1d1d1f] text-[15px]"}`}
                      >
                        {formatCurrency(originalPrice)}
                      </span>
                    </div>
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
