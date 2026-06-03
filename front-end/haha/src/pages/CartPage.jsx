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
import {
  getCart,
  updateQty,
  removeFromCart,
  getCartTotal,
} from "../lib/cart";
import { FREE_SHIPPING_THRESHOLD as FREE_SHIP_THRESHOLD, SHIPPING_FEE, calcShippingFee } from "../lib/shipping";
import { formatCurrency } from "../lib/format";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── Cart Item Row ──────────────────────────────────────────────── */
function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -32, transition: { duration: 0.2 } }}
      className="flex gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-5"
    >
      {/* Image */}
      <Link
        to={`/products/${item.id}`}
        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f7] p-2 sm:h-28 sm:w-28"
      >
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="max-h-full w-auto object-contain transition-transform duration-300 hover:scale-105"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/products/${item.id}`}
              className="text-[14px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors line-clamp-2"
            >
              {item.name}
            </Link>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.variant && (
                <span className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-xs text-[#6e6e73]">
                  {item.variant}
                </span>
              )}
              {item.color && (
                <span className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-xs text-[#6e6e73]">
                  {item.color}
                </span>
              )}
            </div>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label="Xoá sản phẩm"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8e8e93] transition-all duration-150 hover:bg-[#f5f5f7] hover:text-[#e53e3e] active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>

        {/* Price + Qty */}
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-[#1d1d1f]">
            {formatCurrency(item.price * item.quantity)}
          </p>

          {/* Qty stepper */}
          <div className="flex items-center rounded-xl border border-black/[0.1] bg-[#fafafa]">
            <button
              type="button"
              onClick={() => onQtyChange(item, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#1d1d1f] transition-colors duration-150 hover:text-[#0071e3] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <span className="min-w-[28px] text-center text-sm font-semibold text-[#1d1d1f]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQtyChange(item, item.quantity + 1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#1d1d1f] transition-colors duration-150 hover:text-[#0071e3] active:scale-90"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Order Summary Sidebar ──────────────────────────────────────── */
function OrderSummary({ items, onCheckout }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 30_000;
  const total = subtotal + shipping;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Top accent */}
      <div className="h-1 w-full bg-[#1d1d1f]" />

      <div className="p-5 sm:p-6">
        <h2 className="mb-5 text-[17px] font-semibold text-[#1d1d1f]">
          Tóm tắt đơn hàng
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-[#3a3a3c]">
            <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between text-[#3a3a3c]">
            <span>Phí vận chuyển</span>
            {shipping === 0 ? (
              <span className="font-medium text-[#34c759]">Miễn phí</span>
            ) : (
              <span className="font-medium">{formatCurrency(shipping)}</span>
            )}
          </div>

          {shipping > 0 && (
            <p className="rounded-xl bg-[#f5f5f7] px-3 py-2 text-xs text-[#6e6e73]">
              Mua thêm{" "}
              <span className="font-semibold text-[#0071e3]">
                {formatCurrency(FREE_SHIP_THRESHOLD - subtotal)}
              </span>{" "}
              để được miễn phí vận chuyển
            </p>
          )}

          <div className="border-t border-black/[0.06] pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-[#1d1d1f]">Tổng cộng</span>
              <span className="text-[18px] font-bold text-[#1d1d1f]">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="mt-0.5 text-right text-xs text-[#6e6e73]">
              Đã bao gồm VAT
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={onCheckout}
          className="mt-5 w-full cursor-pointer rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#3d3d3f] active:scale-95"
        >
          Tiến hành thanh toán
        </motion.button>

        <Link
          to="/products"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-[#0071e3] hover:underline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          Tiếp tục mua sắm
        </Link>

        {/* Trust badges */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            { icon: "🔒", text: "Thanh toán bảo mật" },
            { icon: "🔄", text: "Đổi trả 30 ngày" },
            { icon: "🚚", text: "Giao hàng nhanh" },
            { icon: "✅", text: "Chính hãng 100%" },
          ].map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] px-2.5 py-2 text-[11px] text-[#3a3a3c]"
            >
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty Cart ─────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-20 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f5f7] text-[#c7c7cc]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      </div>
      <h2 className="text-[18px] font-semibold text-[#1d1d1f]">
        Giỏ hàng trống
      </h2>
      <p className="mt-2 text-sm text-[#6e6e73]">
        Hãy khám phá và thêm sản phẩm yêu thích vào giỏ hàng của bạn
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

function normalizeServerCart(products) {
  return products.map((p) => {
    const prod = p.productId || {};
    const { price } = getDisplayPrice(prod);
    const variantLabel = typeof p.variantId === "object" && p.variantId !== null
      ? (p.variantId.name || p.variantId.sku || null)
      : null;
    return {
      id: prod._id || (typeof p.productId === "string" ? p.productId : p.productId?._id) || "",
      name: prod.name || "Sản phẩm",
      image: prod.images?.[0]?.url,
      price: price || 0,
      quantity: p.quantity,
      variant: variantLabel,
      color: typeof p.color === "string" ? p.color : null,
    };
  });
}

/* ─── CartPage ───────────────────────────────────────────────────── */
export default function CartPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [items, setItems] = useState(() => getCart());
  const [isServerCart, setIsServerCart] = useState(false);

  // Load từ server nếu đã đăng nhập
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/api/cart/view`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const serverItems = normalizeServerCart(res.data?.data?.products || []);
        // Merge: giữ lại item trong localStorage chưa kịp sync lên server (race condition)
        const localItems = getCart();
        const serverIds = new Set(serverItems.map((i) => i.id));
        const pendingItems = localItems.filter((i) => !serverIds.has(i.id));
        setItems([...serverItems, ...pendingItems]);
        setIsServerCart(true);
      })
      .catch(() => setItems(getCart()));
  }, [token]);

  // Sync localStorage khi không đăng nhập
  useEffect(() => {
    if (token) return;
    const sync = () => setItems(getCart());
    window.addEventListener("cartUpdated", sync);
    return () => window.removeEventListener("cartUpdated", sync);
  }, [token]);

  const handleQtyChange = useCallback(async (item, newQty) => {
    if (isServerCart && token) {
      try {
        await axios.put(
          `${API_URL}/api/cart/update`,
          { productId: item.id, quantity: newQty },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems((prev) => {
          const next = prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
          localStorage.setItem("cart", JSON.stringify(next));
          window.dispatchEvent(new Event("cartUpdated"));
          return next;
        });
      } catch {
        toast.error("Không thể cập nhật số lượng");
      }
    } else {
      updateQty(item.id, item.variant, item.color, newQty);
      setItems(getCart());
    }
  }, [isServerCart, token]);

  const handleRemove = useCallback(async (item) => {
    if (isServerCart && token) {
      try {
        await axios.delete(`${API_URL}/api/cart/remove`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { productId: item.id },
        });
        setItems((prev) => {
          const next = prev.filter((i) => i.id !== item.id);
          // sync localStorage so Header badge updates
          localStorage.setItem("cart", JSON.stringify(next));
          window.dispatchEvent(new Event("cartUpdated"));
          return next;
        });
        toast.info(`Đã xoá "${item.name}" khỏi giỏ hàng`);
      } catch {
        toast.error("Không thể xoá sản phẩm");
      }
    } else {
      removeFromCart(item.id, item.variant, item.color);
      setItems(getCart());
      toast.info(`Đã xoá "${item.name}" khỏi giỏ hàng`);
    }
  }, [isServerCart, token]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate("/checkout");
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
          { label: "Giỏ hàng" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-[24px] font-semibold text-[#1d1d1f]"
          style={{ fontWeight: 650 }}
        >
          Giỏ hàng{" "}
          {items.length > 0 && (
            <span className="text-[18px] font-normal text-[#6e6e73]">
              ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
            </span>
          )}
        </motion.h1>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Cart items list */}
            <div className="flex-1">
              <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <CartItem
                      key={`${item.id}-${item.variant}-${item.color}`}
                      item={item}
                      onQtyChange={handleQtyChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {/* Summary sidebar */}
            <div className="w-full lg:w-[340px] lg:shrink-0 lg:sticky lg:top-24">
              <OrderSummary items={items} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
