import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { staggerContainer, staggerItem } from "../../lib/animations";
import { fetchAPI } from "../../lib/api";
import { getDisplayPrice } from "../../lib/pricing";
import { formatCurrency } from "../../lib/format";

export default function NewArrival() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchAPI("/api/products?sort=newest&limit=3")
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] py-8 pt-10">
      <div className="max-w-[1200px] mx-auto px-8 flex flex-col items-center gap-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-[#1d1d1f] mb-2 tracking-tight"
            style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.1 }}
          >
            Sản phẩm mới nhất
          </h2>
          {/* <p
            className="text-[#6e6e73]"
            style={{ fontSize: "13px", lineHeight: 1.6 }}
          >
            Khám phá những sản phẩm Apple mới nhất vừa ra mắt.
          </p> */}
        </motion.div>

        <motion.div
          className="w-full grid grid-cols-3 gap-5 pt-5"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {products.map((product) => {
            const image = product.images?.[0]?.url;
            const { price } = getDisplayPrice(product);
            return (
              <motion.div
                key={product._id}
                variants={staggerItem}
                className="bg-[#fafafa] rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-400 cursor-pointer group flex flex-col"
                style={{ minHeight: "300px" }}
              >
                <Link to={`/products/${product._id}`} className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center px-6 py-6">
                    <ImageWithFallback
                      src={image}
                      alt={product.name}
                      className="max-h-[180px] w-auto object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="px-5 pb-5 text-center">
                    <p
                      className="text-[#1d1d1f] tracking-tight"
                      style={{ fontSize: "14px", fontWeight: 700 }}
                    >
                      {product.name}
                    </p>
                    <p className="text-[#0071e3] mt-1" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {formatCurrency(price)}
                    </p>
                    <p
                      className="text-[#86868b] mt-1"
                      style={{ fontSize: "12px" }}
                    >
                      {product.category?.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* <Link
          to="/products"
          className="bg-[#1d1d1f] text-white px-5 py-2 rounded-full hover:bg-[#3d3d3f] transition-colors duration-200 border border-transparent cursor-pointer"
          style={{ fontSize: "12px", fontWeight: 400 }}
        >
          Xem tất cả
        </Link> */}
      </div>
    </section>
  );
}
