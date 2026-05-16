import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import { ImageWithFallback } from "../components/ImageWithFallback";
import axiosClient from "../lib/api";
import { getCart, clearCart } from "../lib/cart";
import { SHOP_BANK, buildVietQRUrl } from "../lib/shopConfig";
import { FREE_SHIPPING_THRESHOLD as FREE_SHIP_THRESHOLD, SHIPPING_FEE as DEFAULT_SHIP_FEE, calcShippingFee } from "../lib/shipping";
import { formatCurrency } from "../lib/format";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── Form Field ─────────────────────────────────────────────────── */
function Field({ label, id, error, required, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]"
      >
        {label}
        {required && <span className="ml-0.5 text-[#e53e3e]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#e53e3e]">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
    err
      ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
      : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
  }`;

/* ─── Bank Transfer Modal ────────────────────────────────────────── */
function BankTransferModal({ order, onClose }) {
  const amount = order?.total ?? 0;
  const orderRef = order?.orderNumber ?? order?._id ?? "";
  const qrUrl = buildVietQRUrl(amount, orderRef);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1d1d1f] px-6 py-3 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Chuyển khoản ngân hàng
          </p>
          <p className="mt-0.5 text-[16px] font-semibold text-white">
            Hoàn tất thanh toán
          </p>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* QR */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-black/[0.08] p-2.5 bg-[#fafafa]">
              <img
                src={qrUrl}
                alt="VietQR"
                className="h-[150px] w-[150px] object-contain"
              />
            </div>
          </div>
          <p className="text-center text-[12px] text-[#8e8e93]">
            Quét bằng app ngân hàng bất kỳ
          </p>

          {/* Bank info */}
          <div className="rounded-xl border border-black/[0.07] divide-y divide-black/[0.05] text-[13px]">
            {[
              { label: "Ngân hàng", value: SHOP_BANK.bankName },
              { label: "Số tài khoản", value: SHOP_BANK.accountNumber },
              { label: "Chủ tài khoản", value: SHOP_BANK.accountHolder },
              {
                label: "Số tiền",
                value: new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(amount),
                highlight: true,
              },
              { label: "Nội dung CK", value: orderRef, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5 gap-3"
              >
                <span className="text-[#6e6e73] shrink-0">{label}</span>
                <span
                  className={`font-semibold text-right ${highlight ? "text-[#e53e3e]" : "text-[#1d1d1f]"}`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          <p className="rounded-xl bg-[#fffbf0] border border-[#fde8b1] px-4 py-2.5 text-[12px] text-[#92400e]">
            Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận giao dịch (thường
            trong vòng 1-2 giờ).
          </p>
        </div>

        {/* Button cố định ở dưới */}
        <div className="px-5 pb-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#1d1d1f] py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#3d3d3f]"
          >
            Tôi đã chuyển khoản
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Payment icons (SVG) ────────────────────────────────────────── */
const PAY_ICONS = {
  cod: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  ),
  bank: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" />
    </svg>
  ),
};

/* ─── Payment Method Card ────────────────────────────────────────── */
function PaymentCard({
  value,
  selected,
  onChange,
  imgSrc,
  iconBg,
  title,
  desc,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-[#1d1d1f] bg-white shadow-[0_0_0_2px_#1d1d1f]"
          : "border-black/[0.1] bg-[#fafafa] hover:border-black/[0.25]"
      }`}
    >
      {/* Icon box — màu cố định, không đổi theo selected */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ background: iconBg }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          PAY_ICONS[value]
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#1d1d1f]">{title}</p>
        <p className="text-xs text-[#6e6e73]">{desc}</p>
      </div>

      <span
        className={`ml-2 h-5 w-5 shrink-0 rounded-full border-2 transition-all ${
          selected
            ? "border-[#1d1d1f] bg-[#1d1d1f]"
            : "border-black/[0.2] bg-white"
        }`}
      >
        {selected && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            className="h-full w-full p-0.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* ─── Order Summary (Checkout) ───────────────────────────────────── */
function CheckoutSummary({
  items,
  discount = 0,
  shippingFee = null,
  shippingLabel = "",
}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping =
    shippingFee !== null
      ? shippingFee
      : subtotal >= FREE_SHIP_THRESHOLD
        ? 0
        : DEFAULT_SHIP_FEE;
  const total = Math.max(0, subtotal - discount) + shipping;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="h-1 w-full bg-[#1d1d1f]" />
      <div className="p-5 sm:p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f]">
          Đơn hàng ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
        </h2>

        {/* Items list */}
        <div className="mb-4 space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.variant}-${item.color}`}
              className="flex items-center gap-3"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7] p-1.5">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#1d1d1f]">
                  {item.name}
                </p>
                <p className="text-[11px] text-[#6e6e73]">
                  {[item.variant, item.color].filter(Boolean).join(" · ")} ×
                  {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-semibold text-[#1d1d1f]">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 border-t border-black/[0.06] pt-4 text-sm">
          <div className="flex justify-between text-[#3a3a3c]">
            <span>Tạm tính</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#16a34a]">
              <span>Giảm giá (voucher)</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#3a3a3c]">
            <span>
              Phí vận chuyển
              {shippingLabel && (
                <span className="ml-1 text-[11px] text-[#8e8e93]">
                  ({shippingLabel})
                </span>
              )}
            </span>
            {shipping === 0 ? (
              <span className="font-medium text-[#34c759]">Miễn phí</span>
            ) : (
              <span>{formatCurrency(shipping)}</span>
            )}
          </div>
          <div className="flex justify-between border-t border-black/[0.06] pt-2">
            <span className="font-semibold text-[#1d1d1f]">Tổng cộng</span>
            <span className="text-[17px] font-bold text-[#1d1d1f]">
              {formatCurrency(total)}
            </span>
          </div>
          <p className="text-right text-xs text-[#6e6e73]">Đã bao gồm VAT</p>
        </div>
      </div>
    </div>
  );
}

/* ─── CheckoutPage ───────────────────────────────────────────────── */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // directBuy: mua ngay từ ProductDetailPage (không qua giỏ hàng)
  const directBuyItems = location.state?.directBuy ?? null;
  const [items, setItems] = useState(() => directBuyItems ?? getCart());
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    province: "",
    district: "",
    ward: "",
    address: "",
    note: "",
  });
  const [errors, setErrors] = useState({});

  // ── Voucher state ──────────────────────────────────────────────────
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherInfo, setVoucherInfo] = useState(null); // { code, discount }
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  // ── Shipping fee state ─────────────────────────────────────────────
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null); // { code, name, fee, estimatedDays }

  // ── Saved addresses ────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddr, setSelectedSavedAddr] = useState(null);

  // ── Bank transfer result modal ─────────────────────────────────────
  const [bankOrder, setBankOrder] = useState(null);

  // Load shipping zones on mount
  useEffect(() => {
    axiosClient
      .get("/api/shipping/zones")
      .then(({ data }) => setShippingZones(data.data ?? []))
      .catch(() => {});
  }, []);

  // Khi cả shippingZones lẫn savedAddresses đã load → auto-select zone của địa chỉ mặc định
  useEffect(() => {
    if (!shippingZones.length || !savedAddresses.length || selectedZone) return;
    const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    if (!def?.province) return;
    const match = shippingZones.find(
      (z) => z.name.toLowerCase() === def.province.toLowerCase(),
    );
    if (match) setSelectedZone(match);
  }, [shippingZones, savedAddresses]);

  // Nếu cart rỗng và không phải mua ngay → redirect về /cart
  useEffect(() => {
    if (!directBuyItems && items.length === 0) {
      toast.info("Giỏ hàng trống, vui lòng thêm sản phẩm trước");
      navigate("/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Điền sẵn thông tin từ API profile + saved addresses
  useEffect(() => {
    // Fetch profile (email)
    const profilePromise = axiosClient
      .get("/api/users/profile")
      .then(({ data }) => {
        const u = data.data || data.user || data;
        setForm((f) => ({
          ...f,
          email: u.email || f.email,
          fullName: u.fullName || u.name || f.fullName,
          phone: u.phone || u.phoneNumber || f.phone,
        }));
      })
      .catch(() => {
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          if (u.email)
            setForm((f) => ({
              ...f,
              email: u.email,
              fullName: u.name || u.fullName || f.fullName,
              phone: u.phone || u.phoneNumber || f.phone,
            }));
        } catch {}
      });

    // Fetch saved addresses; auto-fill from default if exists
    axiosClient
      .get("/api/users/addresses")
      .then(({ data }) => {
        const addrs = data.data ?? [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) {
          setSelectedSavedAddr(def._id);
          setForm((f) => ({
            ...f,
            fullName: def.fullName || f.fullName,
            phone: def.phone || f.phone,
            province: def.province || f.province,
            district: def.district || f.district,
            ward: def.ward || f.ward,
            address: def.street || f.address,
          }));
        }
      })
      .catch(() => {});

    void profilePromise;
  }, []);

  const VALID_NAME = /^[\p{L}\s'-]+$/u;
  const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (name, value) => {
    if (name === "fullName") {
      if (!value.trim()) return "Vui lòng nhập họ tên.";
      if (!VALID_NAME.test(value.trim()))
        return "Họ tên không được chứa số hoặc ký tự đặc biệt.";
    }
    if (name === "email") {
      if (!value.trim()) return "Vui lòng nhập email.";
      if (!VALID_EMAIL.test(value)) return "Email không hợp lệ.";
    }
    return undefined;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name])
      setErrors((err) => ({ ...err, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleApplyVoucher = useCallback(async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    setVoucherError("");
    setVoucherInfo(null);
    try {
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const { data } = await axiosClient.get(
        `/api/vouchers/check?code=${encodeURIComponent(voucherInput.trim())}`,
      );
      const v = data.data;
      const discount =
        v.type === "percent"
          ? Math.min((subtotal * v.value) / 100, v.maxDiscount ?? Infinity)
          : v.value;
      setVoucherInfo({
        code: v.code,
        discount: Math.min(discount, subtotal),
        type: v.type,
        value: v.value,
      });
      toast.success(`Áp dụng voucher "${v.code}" thành công!`);
    } catch (err) {
      setVoucherError(
        err?.response?.data?.message || "Mã voucher không hợp lệ.",
      );
    } finally {
      setVoucherLoading(false);
    }
  }, [voucherInput, items]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên.";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^0\d{9}$/.test(form.phone.trim()))
      e.phone = "Số điện thoại không hợp lệ (VD: 0912345678).";
    if (!form.email.trim()) e.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ.";
    if (!form.province.trim() && !selectedZone)
      e.province = "Vui lòng chọn tỉnh/thành phố.";
    if (!form.district.trim()) e.district = "Vui lòng nhập quận/huyện.";
    if (!form.ward.trim()) e.ward = "Vui lòng nhập phường/xã.";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ chi tiết.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // scroll lên field đầu tiên báo lỗi
      const firstErrKey = Object.keys(errs)[0];
      document
        .getElementById(`checkout-${firstErrKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        products: items.map((i) => ({
          product: i.id,
          quantity: i.quantity,
          variantId: i.variantId ?? i.variant?._id ?? null,
        })),
        billingInfo: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          street: form.address,
          district: form.district,
          city: selectedZone?.name || form.province,
        },
        note: form.note,
        paymentMethod,
        shippingFee: selectedZone?.fee ?? DEFAULT_SHIP_FEE,
        voucherCode: voucherInfo?.code || undefined,
      };

      const { data: res } = await axiosClient.post("/api/orders", payload);
      if (!directBuyItems) clearCart();

      if (paymentMethod === "bank") {
        setBankOrder(res.data);
      } else if (paymentMethod === "vnpay") {
        const { data: vnpRes } = await axiosClient.post("/api/payments/vnpay/create", {
          orderId: res.data._id,
        });
        window.location.href = vnpRes.data.paymentUrl;
      } else if (paymentMethod === "momo") {
        const { data: momoRes } = await axiosClient.post("/api/payments/momo/create", {
          orderId: res.data._id,
        });
        window.location.href = momoRes.data.paymentUrl;
      } else {
        toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua hàng.");
        navigate("/orders");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
          { label: "Giỏ hàng", to: "/cart" },
          { label: "Thanh toán" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
          style={{ fontSize: "24px", fontWeight: 650 }}
        >
          Thanh toán
        </motion.h1>

        {bankOrder && (
          <BankTransferModal
            order={bankOrder}
            onClose={() => {
              setBankOrder(null);
              navigate("/orders");
            }}
          />
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* ── LEFT: Form ─────────────────────────────────── */}
            <div className="flex-1 space-y-5">
              {/* Thông tin liên hệ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
              >
                <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f]">
                  Thông tin liên hệ
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Họ và tên"
                    id="checkout-fullName"
                    error={errors.fullName}
                    required
                  >
                    <input
                      id="checkout-fullName"
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      className={inputCls(errors.fullName)}
                    />
                  </Field>

                  <Field
                    label="Số điện thoại"
                    id="checkout-phone"
                    error={errors.phone}
                    required
                  >
                    <input
                      id="checkout-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0912 345 678"
                      autoComplete="tel"
                      className={inputCls(errors.phone)}
                    />
                  </Field>

                  <Field
                    label="Email"
                    id="checkout-email"
                    error={errors.email}
                    required
                  >
                    <input
                      id="checkout-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`${inputCls(errors.email)} sm:col-span-2`}
                    />
                  </Field>
                </div>
              </motion.div>

              {/* Địa chỉ giao hàng */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
              >
                <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f]">
                  Địa chỉ giao hàng
                </h2>

                {/* Saved address picker */}
                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-[12px] font-medium text-[#6e6e73]">
                      Địa chỉ đã lưu
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => {
                            setSelectedSavedAddr(addr._id);
                            // Auto-match shipping zone by province name
                            const zone =
                              shippingZones.find(
                                (z) =>
                                  z.name.toLowerCase() ===
                                  (addr.province || "").toLowerCase(),
                              ) ?? null;
                            setSelectedZone(zone);
                            setForm((f) => ({
                              ...f,
                              fullName: addr.fullName || f.fullName,
                              phone: addr.phone || f.phone,
                              province: zone
                                ? zone.name
                                : addr.province || f.province,
                              district: addr.district || f.district,
                              ward: addr.ward || f.ward,
                              address: addr.street || f.address,
                            }));
                            setErrors({});
                          }}
                          className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left text-[12px] transition-all ${
                            selectedSavedAddr === addr._id
                              ? "border-[#1d1d1f] bg-[#f5f5f7] font-medium text-[#1d1d1f]"
                              : "border-black/[0.08] bg-white text-[#3a3a3c] hover:border-black/[0.2]"
                          }`}
                        >
                          <span className="font-semibold">{addr.fullName}</span>
                          <span className="text-[11px] text-[#6e6e73]">
                            {addr.phone}
                          </span>
                          <span className="text-[11px] text-[#6e6e73]">
                            {[addr.ward, addr.district, addr.province]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                          {addr.isDefault && (
                            <span className="mt-1 rounded-full bg-[#1d1d1f] px-1.5 py-px text-[9px] font-semibold text-white">
                              Mặc định
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSavedAddr(null);
                        setForm((f) => ({
                          ...f,
                          fullName: f.fullName,
                          phone: f.phone,
                          province: "",
                          district: "",
                          ward: "",
                          address: "",
                        }));
                      }}
                      className="mt-2 text-[12px] text-[#0071e3] hover:underline"
                    >
                      Nhập địa chỉ khác
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Tỉnh / Thành phố"
                    id="checkout-province"
                    error={errors.province}
                    required
                  >
                    {shippingZones.length > 0 ? (
                      <select
                        id="checkout-province"
                        name="province"
                        value={selectedZone?.code ?? ""}
                        onChange={(e) => {
                          const zone =
                            shippingZones.find(
                              (z) => z.code === e.target.value,
                            ) ?? null;
                          setSelectedZone(zone);
                          setForm((f) => ({
                            ...f,
                            province: zone?.name ?? "",
                          }));
                          setErrors((err) => ({ ...err, province: undefined }));
                        }}
                        className={inputCls(errors.province)}
                      >
                        <option value="">-- Chọn tỉnh/thành phố --</option>
                        {shippingZones.map((z) => (
                          <option key={z.code} value={z.code}>
                            {z.name} — {z.fee?.toLocaleString("vi-VN")}đ (
                            {z.estimatedDays})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="checkout-province"
                        type="text"
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        placeholder="TP. Hồ Chí Minh"
                        className={inputCls(errors.province)}
                      />
                    )}
                  </Field>

                  <Field
                    label="Quận / Huyện"
                    id="checkout-district"
                    error={errors.district}
                    required
                  >
                    <input
                      id="checkout-district"
                      type="text"
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      placeholder="Quận 1"
                      className={inputCls(errors.district)}
                    />
                  </Field>

                  <Field
                    label="Phường / Xã"
                    id="checkout-ward"
                    error={errors.ward}
                    required
                  >
                    <input
                      id="checkout-ward"
                      type="text"
                      name="ward"
                      value={form.ward}
                      onChange={handleChange}
                      placeholder="Phường Bến Nghé"
                      className={inputCls(errors.ward)}
                    />
                  </Field>

                  <Field
                    label="Số nhà, tên đường"
                    id="checkout-address"
                    error={errors.address}
                    required
                  >
                    <input
                      id="checkout-address"
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="123 Lê Lợi"
                      autoComplete="street-address"
                      className={inputCls(errors.address)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label="Ghi chú đơn hàng"
                      id="checkout-note"
                      error={errors.note}
                    >
                      <textarea
                        id="checkout-note"
                        name="note"
                        value={form.note}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Giao giờ hành chính, gọi trước khi giao..."
                        className={`resize-none ${inputCls(errors.note)}`}
                      />
                    </Field>
                  </div>
                </div>
              </motion.div>

              {/* Phương thức thanh toán */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
              >
                <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f]">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  <PaymentCard
                    value="cod"
                    selected={paymentMethod === "cod"}
                    onChange={setPaymentMethod}
                    iconBg="#16a34a"
                    title="Thanh toán khi nhận hàng (COD)"
                    desc="Trả tiền mặt khi nhận hàng tại địa chỉ giao"
                  />
                  <PaymentCard
                    value="bank"
                    selected={paymentMethod === "bank"}
                    onChange={setPaymentMethod}
                    iconBg="#2563eb"
                    title="Chuyển khoản ngân hàng"
                    desc="Thông tin tài khoản sẽ được gửi qua email"
                  />
                  <PaymentCard
                    value="momo"
                    selected={paymentMethod === "momo"}
                    onChange={setPaymentMethod}
                    imgSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MoMo_Logo_App.svg/960px-MoMo_Logo_App.svg.png"
                    iconBg="#ae2070"
                    title="Ví điện tử MoMo"
                    desc="Thanh toán nhanh qua ứng dụng MoMo"
                  />
                  <PaymentCard
                    value="vnpay"
                    selected={paymentMethod === "vnpay"}
                    onChange={setPaymentMethod}
                    imgSrc="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png"
                    iconBg="#0050a0"
                    title="VNPay"
                    desc="Thanh toán qua cổng VNPay (ATM, QR, Visa...)"
                  />
                </div>
              </motion.div>

              {/* Mã voucher */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-6"
              >
                <h2 className="mb-3 text-[15px] font-semibold text-[#1d1d1f]">
                  Mã giảm giá
                </h2>
                {voucherInfo ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#f0fdf4] px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#16a34a]">
                        "{voucherInfo.code}" đã áp dụng
                      </p>
                      <p className="text-[12px] text-[#4ade80]">
                        Giảm {formatCurrency(voucherInfo.discount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherInfo(null);
                        setVoucherInput("");
                      }}
                      className="text-[12px] text-[#6e6e73] hover:text-[#e53e3e]"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value.toUpperCase());
                        setVoucherError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleApplyVoucher())
                      }
                      placeholder="Nhập mã voucher"
                      className="flex-1 rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[14px] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherInput.trim()}
                      className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-50"
                    >
                      {voucherLoading ? "..." : "Áp dụng"}
                    </button>
                  </div>
                )}
                {voucherError && (
                  <p className="mt-1.5 text-[12px] text-[#e53e3e]">
                    {voucherError}
                  </p>
                )}
              </motion.div>

              {/* Submit (mobile) */}
              <div className="lg:hidden">
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#1d1d1f] py-4 text-[15px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đặt hàng ngay"
                  )}
                </motion.button>
              </div>
            </div>

            {/* ── RIGHT: Summary ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-24 space-y-4"
            >
              <CheckoutSummary
                items={items}
                discount={voucherInfo?.discount ?? 0}
                shippingFee={selectedZone ? selectedZone.fee : null}
                shippingLabel={selectedZone?.estimatedDays}
              />

              {/* Submit (desktop) */}
              <div className="hidden lg:block">
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#1d1d1f] py-4 text-[15px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đặt hàng ngay"
                  )}
                </motion.button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#8e8e93]">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Thông tin được mã hoá & bảo mật SSL
                </p>
              </div>

              <Link
                to="/cart"
                className="flex items-center justify-center gap-1 text-sm text-[#6e6e73] hover:text-[#0071e3] transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Quay lại giỏ hàng
              </Link>
            </motion.div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
