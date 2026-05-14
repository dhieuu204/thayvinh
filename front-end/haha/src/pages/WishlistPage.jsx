import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { API_URL } from "../lib/api";
import { getDisplayPrice } from "../lib/pricing";
import { getWishlist, removeFromWishlist } from "../lib/wishlist";
import { addToCart } from "../lib/cart";
import { staggerContainer, staggerItem } from "../lib/animations";
import { formatCurrency } from "../lib/format";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── Wishlist Card ──────────────────────────────────────────────── */
function WishlistCard({ product, onRemove, onAddToCart }) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <motion.article
      layout
      variants={staggerItem}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
    >
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative flex h-[220px] items-center justify-center bg-[#f5f5f7] p-6">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="max-h-[180px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-[#0071e3] px-2.5 py-1 text-xs font-medium text-white">
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="absolute right-3 top-3 rounded-full bg-[#fff1f0] px-2 py-0.5 text-xs font-semibold text-[#e53e3e]">
              -{discount}%
            </span>
          )}

          {/* Remove button overlay */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemove(product);
            }}
            aria-label="Xoá khỏi yêu thích"
            className="absolute right-3 bottom-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#e53e3e] opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-white active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="px-4 pb-5 pt-3">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-[#1d1d1f]">
            {formatCurrency(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-[#8e8e93] line-through">
              {formatCurrency(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Variants chips */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.variants.slice(0, 3).map((v) => (
              <span
                key={v}
                className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#6e6e73]"
              >
                {v}
              </span>
            ))}
            {product.variants.length > 3 && (
              <span className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#6e6e73]">
                +{product.variants.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => onAddToCart(product)}
            className="cursor-pointer rounded-full bg-[#1d1d1f] py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#3d3d3f] active:scale-95"
          >
            Thêm vào giỏ
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => onRemove(product)}
            className="flex cursor-pointer items-center justify-center gap-1 rounded-full border border-[#e53e3e] py-2.5 text-xs font-medium text-[#e53e3e] transition-all duration-200 hover:bg-[#fff1f0] active:scale-95"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Bỏ thích
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Empty Wishlist ─────────────────────────────────────────────── */
function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-24 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1f0] text-[#e53e3e]/40">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <h2 className="text-[18px] font-semibold text-[#1d1d1f]">
        Danh sách yêu thích trống
      </h2>
      <p className="mt-2 max-w-xs text-sm text-[#6e6e73]">
        Nhấn vào biểu tượng ❤️ trên trang sản phẩm để lưu vào đây
      </p>
      <Link
        to="/products"
        className="mt-6 rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3d3d3f]"
      >
        Khám phá sản phẩm
      </Link>
    </motion.div>
  );
}

function normalizeServerWishlist(products) {
  return products.map((p) => {
    const prod = p.productId || {};
    const { price, oldPrice } = getDisplayPrice(prod);
    return {
      id: prod._id || p.productId,
      name: prod.name || "Sản phẩm",
      image: prod.images?.[0]?.url,
      price: price || p.priceAtAdd || 0,
      oldPrice,
    };
  });
}

/* ─── WishlistPage ───────────────────────────────────────────────── */
export default function WishlistPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [items, setItems] = useState(() => getWishlist());
  const [isServerWishlist, setIsServerWishlist] = useState(false);

  const fetchServerWishlist = useCallback(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const serverItems = normalizeServerWishlist(res.data?.data?.products || []);
        setItems(serverItems);
        setIsServerWishlist(true);
      })
      .catch(() => setItems(getWishlist()));
  }, [token]);

  useEffect(() => {
    fetchServerWishlist();
  }, [fetchServerWishlist]);

  // Khi user toggle wishlist từ trang khác, dùng localStorage làm nguồn (tránh race condition với server)
  useEffect(() => {
    const sync = () => setItems(getWishlist());
    window.addEventListener("wishlistUpdated", sync);
    return () => window.removeEventListener("wishlistUpdated", sync);
  }, []);

  const handleRemove = useCallback(async (product) => {
    // Optimistic update localStorage trước
    removeFromWishlist(product.id);
    setItems(getWishlist());
    toast.info(`Đã xoá "${product.name}" khỏi yêu thích`);
    if (isServerWishlist && token) {
      try {
        await axios.delete(`${API_URL}/api/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { productId: product.id },
        });
      } catch {
        toast.error("Không thể đồng bộ với server");
      }
    }
  }, [isServerWishlist, token]);

  // Thêm vào giỏ không kèm variant (không biết user muốn variant nào)
  // → redirect sang trang chi tiết để chọn
  const handleAddToCart = useCallback((product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

  const handleAddAllToCart = () => {
    items.forEach((p) =>
      addToCart({
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        variant: null,
        color: null,
        quantity: 1,
      })
    );
    toast.success(`Đã thêm ${items.length} sản phẩm vào giỏ hàng!`);
    navigate("/cart");
  };

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Yêu thích" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        {/* Header row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: "24px", fontWeight: 650 }}
          >
            Yêu thích{" "}
            {items.length > 0 && (
              <span className="text-[18px] font-normal text-[#6e6e73]">
                ({items.length} sản phẩm)
              </span>
            )}
          </motion.h1>

          {items.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleAddAllToCart}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[#1d1d1f] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition-all duration-200 hover:bg-[#1d1d1f] hover:text-white active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Thêm tất cả vào giỏ
            </motion.button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="whileInView"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {items.map((product) => (
                <WishlistCard
                  key={product.id}
                  product={product}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
