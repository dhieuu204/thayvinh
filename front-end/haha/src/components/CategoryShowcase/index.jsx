import { useRef, useCallback, useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";
import { getDisplayPrice } from "../../lib/pricing";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { AppleLogo } from "../icons";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + "đ";
}

/* ─── Arrow button (không absolute, nằm trong flex) ────────────── */
function CarouselArrow({ left, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Trước" : "Sau"}
      className="flex-shrink-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#1d1d1f] shadow-md transition-all duration-200 hover:border-[#0071e3] hover:bg-[#0071e3] hover:text-white active:scale-90"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {left ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

/* ─── Product Card ──────────────────────────────────────────────── */
function ShowcaseCard({ product }) {
  const image = product.images?.[0]?.url;
  const { price, oldPrice, discount } = getDisplayPrice(product);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)]"
    >
      {/* Image */}
      <div className="relative flex h-[260px] items-center justify-center bg-[#f5f5f7] p-6">
        <ImageWithFallback
          src={image}
          alt={product.name}
          className="max-h-[210px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {discount && (
          <span className="absolute right-3 top-3 rounded bg-[#e53e3e] px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-5 text-center">
        <p className="line-clamp-2 min-h-[36px] text-[13px] font-medium leading-snug text-[#1d1d1f]">
          {product.name}
        </p>

        <div className="mt-2 flex flex-wrap justify-center items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[15px] font-bold text-[#e53e3e]">
            {formatCurrency(price)}
          </span>
          {oldPrice && (
            <span className="text-[11px] text-[#8e8e93] line-through">
              {formatCurrency(oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Category Section ───────────────────────────────────────────── */
function CategorySection({ category }) {
  const trackRef = useRef(null);

  const scroll = useCallback((dir) => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.children[0]?.offsetWidth + 16 || 280;
    trackRef.current.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
  }, []);

  return (
    <div className="mb-16 last:mb-0">
      {/* Header */}
      <Link
        to={`/categories/${category.slug}`}
        className="mb-6 flex items-center justify-center gap-1 text-[#1d1d1f]"
      >
        <div className="flex-shrink-0 flex items-center justify-center" style={{ paddingBottom: "4px" }}>
          <AppleLogo size={26} />
        </div>
        <h2 className="font-semibold tracking-tight" style={{ fontSize: "28px", lineHeight: 1 }}>
          {category.name}
        </h2>
      </Link>

      {/* Slider row: arrow — cards — arrow */}
      <div className="flex items-center gap-4 relative">
        <CarouselArrow left onClick={() => scroll(-1)} />

        <div
          ref={trackRef}
          className="flex flex-1 gap-4 overflow-x-auto snap-x snap-mandatory hide-scroll"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          
          {category.products.map((p) => (
            <div 
              key={p._id} 
              className="w-[calc(100%)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] shrink-0 snap-start flex pb-3 pt-2"
            >
              <ShowcaseCard product={p} />
            </div>
          ))}
        </div>

        <CarouselArrow onClick={() => scroll(1)} />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function CategoryShowcase() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAPI("/api/products/category-showcase")
      .then((data) => { if (data) setCategories(data); })
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {categories.map((cat) => (
            <CategorySection key={cat.slug} category={cat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
