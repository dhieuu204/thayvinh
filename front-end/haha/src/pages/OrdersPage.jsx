import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import { ImageWithFallback } from "../components/ImageWithFallback";
import axiosClient from "../lib/api";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Mock orders dùng khi API chưa sẵn sàng ─────────────────────── */
const MOCK_ORDERS = [
  {
    _id: "ORD-001234",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "delivered",
    paymentMethod: "cod",
    total: 34990000,
    items: [
      { productId: 101, name: "iPhone 17 Pro Max", variant: "256GB", color: "Cam Vũ Trụ", price: 34990000, quantity: 1, image: "https://cdn.tgdd.vn/Products/Images/42/342680/s16/iphone-17-pro-max-cam-thumb-650x650.png" },
    ],
    shippingInfo: { fullName: "Nguyễn Văn A", phone: "0912345678", address: "123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM" },
  },
  {
    _id: "ORD-002345",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "shipping",
    paymentMethod: "bank",
    total: 49980000,
    items: [
      { productId: 105, name: "MacBook Pro 14 M5 Pro", variant: "1TB", color: "Đen Thiên Hà", price: 56990000, quantity: 1, image: "https://cdn.tgdd.vn/Products/Images/44/363488/s16/macbook-pro-14-inch-m5-pro-24gb-1tb-den-thumb-650x650.png" },
      { productId: 109, name: "AirPods Pro 3", variant: "USB-C", color: "Trắng", price: 6990000, quantity: 2, image: "https://cdn.tgdd.vn/Products/Images/54/329154/s16/airpods-4-thumb-1-650x650.png" },
    ],
    shippingInfo: { fullName: "Nguyễn Văn A", phone: "0912345678", address: "123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM" },
  },
  {
    _id: "ORD-003456",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: "pending",
    paymentMethod: "momo",
    total: 11990000,
    items: [
      { productId: 107, name: "Apple Watch Series 11", variant: "42mm", color: "Vàng Hồng", price: 11990000, quantity: 1, image: "https://cdn.tgdd.vn/Products/Images/7077/344750/s16/apple-watch-series-11-42mm-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png" },
    ],
    shippingInfo: { fullName: "Nguyễn Văn A", phone: "0912345678", address: "123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM" },
  },
  {
    _id: "ORD-004567",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    status: "cancelled",
    paymentMethod: "cod",
    total: 17990000,
    items: [
      { productId: 104, name: "iPad Air 11-inch", variant: "128GB", color: "Xanh Dương", price: 17990000, quantity: 1, image: "https://cdn.tgdd.vn/Products/Images/522/328576/s16/ipad-air-11-inch-m3-wifi-blue-thumb-650x650.png" },
    ],
    shippingInfo: { fullName: "Nguyễn Văn A", phone: "0912345678", address: "123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM" },
  },
];

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", color: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]", dot: "bg-[#f97316]" },
  confirmed: { label: "Đã xác nhận", color: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]", dot: "bg-[#3b82f6]" },
  shipping: { label: "Đang giao", color: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]", dot: "bg-[#22c55e] animate-pulse" },
  delivered: { label: "Đã giao", color: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]", dot: "bg-[#16a34a]" },
  cancelled: { label: "Đã huỷ", color: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]", dot: "bg-[#ef4444]" },
};

const PAYMENT_LABEL = { cod: "COD", bank: "Chuyển khoản", momo: "MoMo" };

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" },
];

/* ─── Skeleton loader ─────────────────────────────────────────────── */
function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/[0.06] bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-32 rounded bg-[#f5f5f7]" />
        <div className="h-6 w-24 rounded-full bg-[#f5f5f7]" />
      </div>
      <div className="flex gap-3 mb-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 w-14 rounded-xl bg-[#f5f5f7]" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-[#f5f5f7]" />
        <div className="h-9 w-28 rounded-full bg-[#f5f5f7]" />
      </div>
    </div>
  );
}

/* ─── Return Request Modal ───────────────────────────────────────── */
function ReturnModal({ orderId, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do hoàn hàng."); return; }
    setLoading(true);
    try {
      await axiosClient.post(`/api/orders/${orderId}/return`, { reason });
      toast.success("Yêu cầu hoàn hàng đã được gửi!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể gửi yêu cầu hoàn hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-black/[0.06] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Yêu cầu hoàn hàng</h3>
          <p className="mt-0.5 text-[12px] text-[#6e6e73]">Đơn hàng #{orderId}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]">
              Lý do hoàn hàng <span className="text-[#e53e3e]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Mô tả lý do bạn muốn hoàn trả sản phẩm..."
              className="w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[14px] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-[#1d1d1f] py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </motion.button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-black/[0.15] py-3 text-[13px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
            >
              Hủy
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────────────────── */
function OrderCard({ order, onCancel, onReturn }) {
  const [expanded, setExpanded] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const MAX_THUMBS = 3;
  const extraCount = order.items.length - MAX_THUMBS;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-[#6e6e73]">Mã đơn hàng</span>
          <span className="font-semibold text-[#1d1d1f]">#{order._id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8e8e93]">{formatDate(order.createdAt)}</span>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4">
        {/* Thumbnails */}
        <div className="mb-4 flex items-center gap-2">
          {order.items.slice(0, MAX_THUMBS).map((item, i) => (
            <div
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f5f5f7] p-1"
              title={item.name}
            >
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="max-h-full w-auto object-contain"
              />
            </div>
          ))}
          {extraCount > 0 && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f5f5f7] text-sm font-medium text-[#6e6e73]">
              +{extraCount}
            </div>
          )}
          <div className="ml-2 text-sm text-[#3a3a3c]">
            {order.items.length} sản phẩm
          </div>
        </div>

        {/* Price + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#6e6e73]">
              TT: <span className="font-medium">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
            </p>
            <p className="mt-0.5 text-[17px] font-bold text-[#1d1d1f]">
              {formatCurrency(order.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-[#1d1d1f] px-4 py-2 text-sm font-medium text-[#1d1d1f] transition-all hover:bg-[#1d1d1f] hover:text-white"
          >
            {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-black/[0.05] px-5 py-4">
              {/* Item list */}
              <div className="mb-4 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7] p-1">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#1d1d1f]">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#6e6e73]">
                        {[item.variant, item.color].filter(Boolean).join(" · ")} · x{item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-[13px] font-semibold text-[#1d1d1f]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Shipping info */}
              <div className="rounded-xl bg-[#f5f5f7] px-4 py-3 space-y-1">
                <p className="text-[12px] font-medium text-[#1d1d1f]">Địa chỉ giao hàng</p>
                <p className="text-[12px] text-[#3a3a3c]">
                  {order.shippingInfo?.fullName} · {order.shippingInfo?.phone}
                </p>
                <p className="text-[12px] text-[#6e6e73]">
                  {order.shippingInfo?.address}
                </p>
              </div>

              {/* Re-order or Cancel (if pending) */}
              {order.status === "pending" && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onCancel(order._id)}
                    className="rounded-full border border-[#e53e3e] px-4 py-2 text-sm font-medium text-[#e53e3e] transition-all hover:bg-[#fff1f0]"
                  >
                    Huỷ đơn hàng
                  </button>
                </div>
              )}
              {order.status === "delivered" && !order._returnRequested && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {order.items && order.items.length > 0 ? (
                    <Link
                      to={`/products/${order.items[0].productId}`}
                      className="rounded-full border border-[#0071e3] px-4 py-2 text-sm font-medium text-[#0071e3] transition-all hover:bg-[#eef6ff]"
                    >
                      Đánh giá sản phẩm
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#9ca3af] cursor-not-allowed"
                    >
                      Không có sản phẩm
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowReturn(true)}
                    className="rounded-full border border-[#8e8e93] px-4 py-2 text-sm font-medium text-[#3a3a3c] transition-all hover:bg-[#f5f5f7]"
                  >
                    Yêu cầu hoàn hàng
                  </button>
                </div>
              )}
              {order._returnRequested && (
                <p className="mt-3 text-[12px] text-[#8e8e93]">Đã gửi yêu cầu hoàn hàng</p>
              )}

              <AnimatePresence>
                {showReturn && (
                  <ReturnModal
                    orderId={order._id}
                    onClose={() => setShowReturn(false)}
                    onSuccess={() => onReturn(order._id)}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Backend trả về status dạng PascalCase (Pending, Shipped...), frontend dùng lowercase
const STATUS_MAP = {
  Pending: "pending",
  Confirmed: "confirmed",
  Shipped: "shipping",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

function normalizeOrder(o) {
  return {
    ...o,
    status: STATUS_MAP[o.status] || o.status?.toLowerCase() || o.status,
    items: (o.products || o.items || []).map((p) => ({
      productId: p.product?._id,
      name: p.product?.name || p.name || "Sản phẩm",
      image: p.product?.images?.[0]?.url || p.image,
      price: p.product?.salePrice || p.product?.basePrice || p.price || 0,
      quantity: p.quantity,
      variant: p.variant || null,
      color: p.color || null,
    })),
    shippingInfo: o.shippingInfo || {
      fullName: o.billingInfo?.fullName,
      phone: o.billingInfo?.phone,
      address: [o.billingInfo?.street, o.billingInfo?.district, o.billingInfo?.city]
        .filter(Boolean)
        .join(", "),
    },
  };
}

/* ─── OrdersPage ───────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    axiosClient
      .get("/api/orders/my")
      .then((res) => {
        const raw = res.data?.data?.orders || res.data?.orders || [];
        setOrders(raw.map(normalizeOrder));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId) => {
    try {
      await axiosClient.patch(`/api/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "cancelled" } : o))
      );
      toast.success("Đã huỷ đơn hàng");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể huỷ đơn hàng");
    }
  };

  const handleReturn = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, _returnRequested: true } : o))
    );
  };

  const filtered = orders.filter(
    (o) => activeTab === "all" || o.status === activeTab
  );

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Tài khoản", to: "/account" },
          { label: "Đơn hàng của tôi" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: "24px", fontWeight: 650 }}
            className="text-[#1d1d1f]"
          >
            Đơn hàng của tôi
          </motion.h1>
          <Link
            to="/tracking"
            className="flex items-center gap-1.5 rounded-full border border-black/[0.1] px-4 py-2 text-[13px] font-medium text-[#3a3a3c] transition-all hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            Tra cứu vận đơn
          </Link>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            {TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#1d1d1f] text-white shadow-sm"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#f5f5f7] text-[#6e6e73]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <OrderSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-20 text-center"
          >
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f5f7] text-[#c7c7cc]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold text-[#1d1d1f]">
              {activeTab === "all" ? "Chưa có đơn hàng nào" : "Không có đơn hàng nào ở trạng thái này"}
            </h2>
            <p className="mt-2 text-sm text-[#6e6e73]">
              Hãy khám phá và đặt hàng ngay hôm nay!
            </p>
            <Link
              to="/products"
              className="mt-6 rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3d3d3f]"
            >
              Mua sắm ngay
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((order) => (
                <OrderCard key={order._id} order={order} onCancel={handleCancel} onReturn={handleReturn} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
