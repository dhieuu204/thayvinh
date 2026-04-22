import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageWithFallback } from "../ImageWithFallback";
import { fetchAPI } from "../../lib/api";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Countdown ─────────────────────────────────────────────────── */
function getSecondsUntil(target) {
  return Math.max(0, Math.floor((new Date(target) - Date.now()) / 1000));
}

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { h, m, s };
}

function CountdownUnit({ value }) {
  return (
    <span className="flex h-9 min-w-[36px] items-center justify-center rounded-lg bg-[#1d1d1f] px-1.5 text-[20px] font-bold tabular-nums text-white shadow-sm">
      {value}
    </span>
  );
}

function Countdown({ endsAt }) {
  const [secs, setSecs] = useState(() => getSecondsUntil(endsAt));
  useEffect(() => {
    setSecs(getSecondsUntil(endsAt));
    const id = setInterval(() => setSecs(getSecondsUntil(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const { h, m, s } = formatTime(secs);
  return (
    <div className="flex items-center gap-1">
      <CountdownUnit value={h} />
      <span className="text-lg font-bold text-[#1d1d1f]">:</span>
      <CountdownUnit value={m} />
      <span className="text-lg font-bold text-[#1d1d1f]">:</span>
      <CountdownUnit value={s} />
    </div>
  );
}

/* ─── Flame icon ────────────────────────────────────────────────── */
function FlameIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f97316">
      <path d="M12 2C12 2 7 8.5 7 13a5 5 0 0 0 10 0c0-4.5-5-11-5-11z" />
    </svg>
  );
}

/* ─── Flash Sale title ──────────────────────────────────────────── */
function FlashSaleTitle() {
  return (
    <img
      src="https://cdnv2.tgdd.vn/webmwg/2024/tz/images/icon-fs.png"
      alt="Flash Sale"
      className="h-10 w-auto object-contain select-none"
      draggable={false}
    />
  );
}

/* ─── Product card (light) ──────────────────────────────────────── */
function FlashCard({ product, discountType, discountValue, flashQuantity, flashSold }) {
  const image = product.images?.[0]?.url;
  const originalPrice = product.basePrice;
  let salePrice = product.basePrice;

  if (discountType === "percent") {
    salePrice = Math.round(originalPrice * (1 - discountValue / 100));
  } else if (discountType === "fixed") {
    salePrice = Math.max(0, originalPrice - discountValue);
  }

  const discount =
    salePrice && salePrice < originalPrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : null;
  const totalFlashStock = flashQuantity || product.stock || 0;
  const soldFlash = flashSold || 0;
  const soldPct = totalFlashStock > 0 ? Math.min(100, Math.round((soldFlash / totalFlashStock) * 100)) : 0;
  const remaining = Math.max(0, totalFlashStock - soldFlash);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex w-[180px] shrink-0 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
    >
      {/* Image */}
      <div className="relative flex h-[155px] items-center justify-center bg-[#f5f5f7] p-4">
        <ImageWithFallback
          src={image}
          alt={product.name}
          className="max-h-[125px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {discount && (
          <span className="absolute right-2 top-2 rounded bg-[#e53e3e] px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[#1d1d1f]">
          {product.name}
        </p>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[14px] font-bold text-[#e53e3e]">
            {formatCurrency(salePrice)}
          </span>
          {discount && (
            <span className="text-[11px] text-[#8e8e93] line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Stock bar */}
        <div className="mt-2.5">
          <div className="relative h-5 overflow-hidden rounded-full bg-[#f0f0f0]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#f5c518]"
              initial={{ width: 0 }}
              whileInView={{ width: `${soldPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              <FlameIcon />
              <span className="text-[10px] font-semibold text-[#1d1d1f]">
                Còn {remaining}/{totalFlashStock || remaining}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Arrow nav ─────────────────────────────────────────────────── */
function CarouselArrow({ left, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Trước" : "Sau"}
      className={`absolute top-1/2 z-10 -translate-y-6 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#1d1d1f] shadow-md transition-all duration-200 hover:border-[#f5c518] hover:bg-[#f5c518] hover:text-white active:scale-90 ${left ? "-left-4" : "-right-4"}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {left ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function FlashSale() {
  const [products, setProducts] = useState([]);
  const [endsAt, setEndsAt] = useState(null);
  const trackRef = useRef(null);

  useEffect(() => {
    fetchAPI("/api/products/flash-sales")
      .then((data) => {
        console.log("[FlashSale] API Response:", data);
        if (data && data.length > 0) {
          // Transform flash sales to flat product list with discount info
          const flatProducts = [];
          let soonest = null;

          data.forEach((flashSale) => {
            if (new Date(flashSale.endsAt) < (soonest ? new Date(soonest) : new Date())) {
              soonest = flashSale.endsAt;
            } else if (!soonest) {
              soonest = flashSale.endsAt;
            }

            flashSale.products?.forEach((item) => {
              if (item.productId) {
                flatProducts.push({
                  ...item.productId,
                  discountType: item.discountType,
                  discountValue: item.discountValue,
                  flashQuantity: item.quantity,
                  flashSold: item.sold || 0,
                  flashSaleEndsAt: flashSale.endsAt,
                });
              }
            });
          });

          console.log("[FlashSale] Transformed products:", flatProducts);
          console.log("[FlashSale] Soonest end:", soonest);
          setProducts(flatProducts);
          if (soonest) setEndsAt(new Date(soonest));
        } else {
          console.log("[FlashSale] No flash sales data or empty array");
        }
      })
      .catch((err) => {
        console.error("[FlashSale] Error fetching:", err);
      });
  }, []);

  const scroll = useCallback((dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 400, behavior: "smooth" });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#fafafa] px-4 py-5 md:px-8">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">

        {/* Top accent stripe
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#f97316] via-[#f5c518] to-[#f97316]" /> */}

        {/* Header */}
        <div className="mb-4 mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
          <FlashSaleTitle />

          <div className="h-7 w-px bg-black/[0.08]" />

          {/* Countdown */}
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8e8e93]">
              Kết thúc trong
            </span>
            <Countdown endsAt={endsAt} />
          </div>

          <div className="h-7 w-px bg-black/[0.08] hidden sm:block" />

          {/* Session tabs — far right */}
          <div className="ml-auto hidden sm:flex">
            {[
              { label: "Đang diễn ra", time: "09:00 - 23:59", active: true },
              { label: "Ngày mai",     time: "09:00 - 23:59", active: false },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                className={`flex cursor-pointer flex-col items-center px-6 py-1 transition-all duration-150 ${
                  tab.active
                    ? "border-b-2 border-[#f5c518]"
                    : "border-b-2 border-transparent opacity-50 hover:opacity-75"
                }`}
              >
                <span className="text-[12px] font-medium text-[#1d1d1f]">
                  {tab.label}
                </span>
                <span className={`text-[14px] font-bold ${tab.active ? "text-[#1d1d1f]" : "text-[#6e6e73]"}`}>
                  {tab.time}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative px-1">
          <CarouselArrow left onClick={() => scroll(-1)} />

          <div
            ref={trackRef}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <FlashCard
                key={product._id}
                product={product}
                discountType={product.discountType}
                discountValue={product.discountValue}
                flashQuantity={product.flashQuantity}
                flashSold={product.flashSold}
              />
            ))}
          </div>

          <CarouselArrow onClick={() => scroll(1)} />
        </div>
      </div>
    </section>
  );
}
