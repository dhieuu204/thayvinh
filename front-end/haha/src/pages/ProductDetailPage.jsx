import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { StarIcon } from "../components/icons";
import { staggerContainer, staggerItem } from "../lib/animations";
import { addToCart } from "../lib/cart";
import { isInWishlist, toggleWishlist } from "../lib/wishlist";
import { API_URL } from "../lib/api";
import { getDisplayPrice } from "../lib/pricing";
import { formatCurrency } from "../lib/format";

const HIDDEN_ATTR_KEYS = new Set(["colorHex"]);

const PROMOS = [
  "Giảm 5% tối đa 200.000đ khi thanh toán qua Kredivo",
  "Hỗ trợ trả góp 0% qua thẻ Visa, Mastercard, JCB, Amex",
  "Thu cũ lên đời tặng Voucher đến 2.500.000đ",
  "Tai nghe mua kèm giảm đến 1.000.000đ",
  "Giảm đến 40% khi mua các gói bảo hành mở rộng",
];

const POLICIES = [
  { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M12 12v4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>), text: "Hộp, Máy, Cáp Type-C" },
  { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>), text: "Miễn phí 1 đổi 1 trong 30 ngày đầu (nếu lỗi NSX)" },
  { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>), text: "Bảo hành chính hãng Apple 1 năm" },
  { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12H2l3-9 4.5 2.5L12 2l2.5 3.5L19 3l3 9h-3"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M9 12h6"/></svg>), text: "Giao hàng nhanh toàn quốc" },
];

function SimilarProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const { price, oldPrice, discount } = getDisplayPrice(product);

  return (
    <motion.article
      variants={staggerItem}
      className="group min-w-[200px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="flex h-[180px] items-center justify-center bg-[#f5f5f7] p-5">
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="max-h-[150px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="px-4 pb-4 pt-3 text-center">
          <h4 className="text-[13px] font-medium text-[#1d1d1f]">{product.name}</h4>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-[14px] font-bold text-[#1d1d1f]">{formatCurrency(price)}</span>
            {oldPrice && (
              <span className="text-xs text-[#8e8e93] line-through">{formatCurrency(oldPrice)}</span>
            )}
          </div>
          {discount != null && (
            <p className="mt-0.5 text-xs font-medium text-[#0071e3]">
              Giảm {discount}%
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [promoOpen, setPromoOpen] = useState(true);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({ orderId: "", rating: 5, comment: "", images: [] });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    // Fetch product trước (id có thể là _id hoặc slug), rồi dùng _id thật cho các API phụ
    fetch(`${API_URL}/api/products/${id}`, { signal })
      .then((r) => r.json())
      .then((prodJson) => {
        const p = prodJson.data;
        if (!p?._id) throw new Error("not found");
        setProduct(p);
        setSelectedVariant(null);
        setSelectedAttrs({});
        setWishlisted(isInWishlist(p._id));
        const pid = p._id;
        return Promise.all([
          fetch(`${API_URL}/api/products/${pid}/related`, { signal }).then((r) => r.json()),
          fetch(`${API_URL}/api/reviews/product/${pid}`, { signal }).then((r) => r.json()),
          fetch(`${API_URL}/api/products/${pid}/variants`, { signal }).then((r) => r.json()),
        ]);
      })
      .then(([relJson, revJson, varJson]) => {
        setSimilar(relJson.data || []);
        setReviews(revJson.data?.reviews || []);
        setAvgRating(revJson.data?.avgRating || 0);
        setVariants(varJson.data || []);
      })
      .catch((err) => { if (err.name !== "AbortError") setProduct(null); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id]);

  // Khi chọn attribute, tìm variant khớp — bỏ qua HIDDEN_ATTR_KEYS (colorHex không có trong UI)
  useEffect(() => {
    if (variants.length === 0) return;
    const visibleKeys = [...new Set(variants.flatMap((v) => {
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes ?? {});
      return Object.keys(attrs).filter((k) => !HIDDEN_ATTR_KEYS.has(k));
    }))];
    const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedAttrs[k]);
    if (!allSelected) { setSelectedVariant(null); return; }
    const matched = variants.find((v) => {
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes ?? {});
      return visibleKeys.every((k) => attrs[k] === selectedAttrs[k]);
    });
    setSelectedVariant(matched || null);
  }, [selectedAttrs, variants]);

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    } catch (err) {}
  }, []);

  // Fetch user's delivered orders for review selection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;
    fetch(`${API_URL}/api/orders/my?status=Delivered`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const orders = json.data?.orders || [];
        const relevantOrders = orders.filter((o) =>
          o.products?.some((p) => p.product === id || p.product?._id === id)
        );
        setUserOrders(relevantOrders);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const sync = () => setWishlisted(isInWishlist(product._id));
    window.addEventListener("wishlistUpdated", sync);
    return () => window.removeEventListener("wishlistUpdated", sync);
  }, [product]);

  // Chuyển variant object → chuỗi label để lưu vào giỏ (tránh render object ra JSX)
  const variantLabel = selectedVariant
    ? (selectedVariant.name
        || Object.entries(
            selectedVariant.attributes instanceof Map
              ? Object.fromEntries(selectedVariant.attributes)
              : (selectedVariant.attributes ?? {})
          )
            .filter(([k]) => !HIDDEN_ATTR_KEYS.has(k))
            .map(([, v]) => v)
            .join(" / ")
        || selectedVariant.sku
        || null)
    : null;

  const handleAddToCart = () => {
    const stock = selectedVariant ? selectedVariant.stock : product.stock;
    if (qty > stock) {
      toast.error(`Chỉ còn ${stock} sản phẩm trong kho!`);
      return;
    }
    const { price: effectivePrice } = getDisplayPrice(product, selectedVariant);
    const img = product.images?.[0]?.url;
    addToCart({
      id: product._id,
      name: product.name,
      image: img,
      price: effectivePrice,
      variant: variantLabel,
      variantId: selectedVariant?._id ?? null,
      quantity: qty,
    });
    toast.success("Đã thêm vào giỏ hàng!");
  };

  const handleBuyNow = () => {
    const stock = selectedVariant ? selectedVariant.stock : product.stock;
    if (qty > stock) {
      toast.error(`Chỉ còn ${stock} sản phẩm trong kho!`);
      return;
    }
    const { price: effectivePrice } = getDisplayPrice(product, selectedVariant);
    const img = product.images?.[0]?.url;
    navigate("/checkout", {
      state: {
        directBuy: [{
          id: product._id,
          name: product.name,
          image: img,
          price: effectivePrice,
          variant: variantLabel,
          variantId: selectedVariant?._id ?? null,
          color: null,
          quantity: qty,
        }],
      },
    });
  };

  const handleToggleWishlist = () => {
    const added = toggleWishlist({ ...product, id: product._id });
    setWishlisted(added);
    toast[added ? "success" : "info"](added ? "Đã thêm vào yêu thích!" : "Đã xoá khỏi yêu thích");
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) { toast.error("Vui lòng đăng nhập"); return; }

    setUploadingImage(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${API_URL}/api/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        setReviewForm((f) => ({ ...f, images: [...f.images, json.data.url] }));
      }
      toast.success("Đã upload ảnh thành công!");
    } catch (err) {
      toast.error(err.message || "Lỗi upload ảnh");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index) => {
    setReviewForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Bạn có chắc muốn xoá đánh giá này?")) return;
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Vui lòng đăng nhập"); return; }
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Đánh giá đã được xoá!");
    } catch (err) {
      toast.error(err.message || "Không thể xoá đánh giá");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Vui lòng đăng nhập để đánh giá"); return; }
    if (!reviewForm.orderId) { toast.error("Vui lòng chọn đơn hàng đã mua"); return; }
    if (!reviewForm.comment.trim()) { toast.error("Vui lòng nhập nội dung đánh giá"); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id, orderId: reviewForm.orderId, rating: reviewForm.rating, comment: reviewForm.comment, images: reviewForm.images }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setReviews((prev) => [json.data, ...prev]);
      setAvgRating((prev) => prev ? ((prev * reviews.length + reviewForm.rating) / (reviews.length + 1)) : reviewForm.rating);
      setReviewForm({ orderId: "", rating: 5, comment: "", images: [] });
      toast.success("Đánh giá của bạn đã được gửi!");
    } catch (err) {
      toast.error(err.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa]">
        <p className="text-[18px] font-medium text-[#1d1d1f]">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm text-white">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const image = product.images?.[0]?.url;
  const { price: displayPrice, oldPrice, discount } = getDisplayPrice(product, selectedVariant);
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;

  // Nhóm variants theo attribute key để render selector
  const attrKeys = [...new Set(variants.flatMap((v) => {
    const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes ?? {});
    return Object.keys(attrs).filter((k) => !HIDDEN_ATTR_KEYS.has(k));
  }))];
  const attrOptions = attrKeys.reduce((acc, key) => {
    acc[key] = [...new Set(variants.map((v) => {
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes ?? {});
      return attrs[key];
    }).filter(Boolean))];
    return acc;
  }, {});
  const attrLabel = { color: "Màu sắc", storage: "Dung lượng", size: "Kích thước", ram: "RAM" };

  const hasVariants = attrKeys.length > 0;
  const allAttrsSelected = hasVariants && attrKeys.every((k) => selectedAttrs[k]);
  const canBuy = hasVariants
    ? allAttrsSelected && selectedVariant != null && selectedVariant.stock > 0
    : product.stock > 0;

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />
      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-3 md:px-8">
            <nav className="flex items-center gap-1.5 text-sm text-[#6e6e73]">
              <Link to="/" className="hover:text-[#1d1d1f]">Trang chủ</Link>
              <span>/</span>
              <Link to="/products" className="hover:text-[#1d1d1f]">Sản phẩm</Link>
              <span>/</span>
              <Link to={`/categories/${product.category?.slug}`} className="hover:text-[#1d1d1f]">
                {product.category?.name}
              </Link>
              <span>/</span>
              <span className="truncate text-[#1d1d1f]">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Main product section */}
        <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            {/* Left: Image */}
            <div className="lg:sticky lg:top-6 lg:w-[480px] lg:shrink-0 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                <div className="flex items-center justify-center bg-[#f5f5f7] p-10">
                  <ImageWithFallback
                    src={image}
                    alt={product.name}
                    className="max-h-[360px] w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1">
              <div className="mb-4">
                {product.isFlashSale && (
                  <span className="mb-2 inline-block rounded-full bg-[#fee2e2] px-2.5 py-1 text-xs font-medium text-[#e53e3e]">
                    ⚡ Flash Sale
                  </span>
                )}
                <h1
                  className="text-[#1d1d1f]"
                  style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 650, lineHeight: 1.2 }}
                >
                  {product.name}
                </h1>
                {product.description && (
                  <p className="mt-2 text-sm text-[#6e6e73]">{product.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-bold text-[#1d1d1f]" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
                  {formatCurrency(displayPrice)}
                </span>
                {oldPrice && (
                  <>
                    <span className="text-base text-[#8e8e93] line-through">{formatCurrency(oldPrice)}</span>
                    <span className="rounded-full bg-[#fff1f0] px-2 py-0.5 text-sm font-semibold text-[#e53e3e]">
                      Giảm {discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock */}
              <p className="mb-4 text-sm text-[#6e6e73]">
                Còn lại:{" "}
                <span className={`font-medium ${displayStock > 0 ? "text-[#1d8348]" : "text-[#e53e3e]"}`}>
                  {displayStock > 0 ? `${displayStock} sản phẩm` : "Hết hàng"}
                </span>
              </p>

              {/* Promotions */}
              <div className="mb-5 overflow-hidden rounded-xl border border-[#fde8b1] bg-[#fffbf0]">
                <button
                  type="button"
                  onClick={() => setPromoOpen((v) => !v)}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#fffbeb] active:bg-[#fef3c7]"
                >
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <span className="text-sm font-semibold text-[#92400e]">Ưu đãi &amp; Khuyến mãi</span>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round"
                    className={`transition-transform duration-200 ${promoOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {promoOpen && (
                  <ul className="border-t border-[#fde8b1] px-4 pb-4 pt-3 space-y-2">
                    {PROMOS.map((promo, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#78350f]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 shrink-0">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {promo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Policy */}
              <ul className="mb-6 space-y-2.5 rounded-xl border border-black/[0.06] bg-white px-4 py-3.5">
                {POLICIES.map((policy, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[#3a3a3c]">
                    <span className="shrink-0 text-[#0071e3]">{policy.icon}</span>
                    {policy.text}
                  </li>
                ))}
              </ul>

              {/* Variant Selector */}
              {attrKeys.length > 0 && (
                <div className="mb-5 space-y-4">
                  {attrKeys.map((key) => (
                    <div key={key}>
                      <p className="mb-2 text-sm font-medium text-[#1d1d1f]">
                        {attrLabel[key] || key}:
                        {selectedAttrs[key] && (
                          <span className="ml-1.5 font-normal text-[#6e6e73]">{selectedAttrs[key]}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {attrOptions[key]?.map((val) => {
                          const isSelected = selectedAttrs[key] === val;
                          // Kiểm tra xem option này có variant còn hàng không
                          const hasStock = variants.some((v) => {
                            const attrs = v.attributes instanceof Map
                              ? Object.fromEntries(v.attributes)
                              : (v.attributes ?? {});
                            return attrs[key] === val && v.stock > 0;
                          });
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedAttrs((prev) => ({ ...prev, [key]: prev[key] === val ? undefined : val }))}
                              disabled={!hasStock}
                              className={`relative rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95
                                ${isSelected
                                  ? "border-[#1d1d1f] bg-[#1d1d1f] text-white"
                                  : hasStock
                                    ? "border-black/[0.15] text-[#1d1d1f] hover:border-[#1d1d1f]"
                                    : "cursor-not-allowed border-black/[0.08] text-[#c7c7cc] line-through"
                                }`}
                            >
                              {val}
                              {!hasStock && (
                                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e53e3e] text-[8px] font-bold text-white">
                                  !
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {attrKeys.every((k) => selectedAttrs[k]) && !selectedVariant && (
                    <p className="text-sm text-[#e53e3e]">Phiên bản này tạm thời hết hàng.</p>
                  )}
                </div>
              )}

              {/* Qty */}
              <div className="mb-5 flex items-center gap-3">
                <span className="text-sm font-medium text-[#1d1d1f]">Số lượng:</span>
                <div className="flex items-center rounded-xl border border-black/[0.1] bg-white">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center text-[#1d1d1f] transition-colors duration-150 hover:text-[#0071e3] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <span className="min-w-[32px] text-center text-sm font-semibold text-[#1d1d1f]">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => Math.min(displayStock, q + 1))}
                    disabled={qty >= displayStock}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center text-[#1d1d1f] transition-colors duration-150 hover:text-[#0071e3] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {hasVariants && !allAttrsSelected && (
                  <p className="text-sm text-[#f59e0b] font-medium">Vui lòng chọn đầy đủ phiên bản trước khi mua.</p>
                )}
                <motion.button type="button" whileTap={{ scale: 0.985 }} onClick={handleBuyNow}
                  disabled={!canBuy}
                  className="w-full cursor-pointer rounded-full bg-[#1d1d1f] py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#3d3d3f] disabled:cursor-not-allowed disabled:opacity-50">
                  MUA NGAY
                </motion.button>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button type="button" whileTap={{ scale: 0.985 }} onClick={handleAddToCart}
                    disabled={!canBuy}
                    className="cursor-pointer rounded-full border border-[#1d1d1f] py-3 text-sm font-medium text-[#1d1d1f] transition-all duration-200 hover:bg-[#1d1d1f] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                    Thêm vào giỏ
                  </motion.button>
                  <motion.button type="button" whileTap={{ scale: 0.985 }} onClick={handleToggleWishlist}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full border py-3 text-sm font-medium transition-all duration-200 ${
                      wishlisted ? "border-[#e53e3e] bg-[#fff1f0] text-[#e53e3e]" : "border-black/[0.1] text-[#1d1d1f] hover:border-[#e53e3e] hover:text-[#e53e3e]"
                    }`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {wishlisted ? "Đã yêu thích" : "Yêu thích"}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="border-t border-black/[0.06] bg-[#fafafa] py-10">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-[#1d1d1f]" style={{ fontSize: "20px", fontWeight: 650 }}>
                Đánh giá sản phẩm
              </h2>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-1 text-sm font-semibold text-[#c2410c]">
                  ★ {avgRating.toFixed(1)} ({reviews.length} đánh giá)
                </span>
              )}
            </div>

            {/* Review form */}
            <form onSubmit={handleSubmitReview} className="mb-8 rounded-2xl border border-black/[0.06] bg-white p-5">
              <p className="mb-3 text-[14px] font-semibold text-[#1d1d1f]">Viết đánh giá của bạn</p>
              {userOrders.length > 0 ? (
                <div className="mb-4">
                  <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Chọn đơn hàng *</label>
                  <select
                    value={reviewForm.orderId}
                    onChange={(e) => setReviewForm((f) => ({ ...f, orderId: e.target.value }))}
                    className="w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
                  >
                    <option value="">-- Chọn đơn hàng --</option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Đơn hàng {order.orderNumber || order._id.slice(-6)} - {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-[#fff3cd] p-3 text-[13px] text-[#856404]">
                  Bạn cần mua sản phẩm này và nhận hàng để có thể đánh giá.
                </div>
              )}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-[#6e6e73]">Đánh giá:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                    className={`cursor-pointer text-2xl transition-all duration-150 hover:scale-110 active:scale-95 ${star <= reviewForm.rating ? "text-[#f59e0b]" : "text-[#d1d5db] hover:text-[#fbbf24]"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                className="w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] outline-none transition-all placeholder-[#8e8e93] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
              />

              {/* Image upload */}
              <div className="mt-3">
                <label className="mb-2 block text-[12px] font-medium text-[#1d1d1f]">Thêm ảnh/video (tùy chọn)</label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                    id="review-images"
                  />
                  <label
                    htmlFor="review-images"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[13px] text-[#6e6e73] transition-all hover:border-[#0071e3] hover:bg-[#eff6ff]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    {uploadingImage ? "Đang upload..." : "Click để chọn ảnh/video"}
                  </label>
                </div>
              </div>

              {/* Display uploaded images */}
              {reviewForm.images.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-[12px] font-medium text-[#1d1d1f]">Ảnh đã upload ({reviewForm.images.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {reviewForm.images.map((img, idx) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f7]">
                        <img src={img} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="cursor-pointer rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#3d3d3f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="text-center text-sm text-[#8e8e93]">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white shrink-0">
                          {(r.userId?.fullName || r.userId?.username || "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[#1d1d1f]">
                            {r.userId?.fullName || r.userId?.username || "Người dùng"}
                          </p>
                          <p className="text-[11px] text-[#8e8e93]">
                            {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-[#f59e0b]">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                        {currentUserId === r.userId?._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#8e8e93] hover:text-[#e53e3e] hover:bg-[#ffe0e0] transition-colors"
                            title="Xoá đánh giá"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#3a3a3c]">{r.comment}</p>
                    {r.images && r.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {r.images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f7]"
                          >
                            <img src={img} alt={`review-${idx}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    {r.reply && (
                      <div className="mt-3 rounded-xl bg-[#f5f5f7] px-3 py-2">
                        <p className="text-xs font-semibold text-[#1d1d1f]">Phản hồi từ cửa hàng:</p>
                        <p className="mt-0.5 text-xs text-[#3a3a3c]">{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Similar products */}
        {similar.length > 0 && (
          <div className="border-t border-black/[0.06] bg-white py-10">
            <div className="mx-auto max-w-[1200px] px-6 md:px-8">
              <h2 className="mb-6 text-[#1d1d1f]" style={{ fontSize: "20px", fontWeight: 650 }}>
                Sản phẩm tương tự
              </h2>
              <div className="overflow-x-auto pb-2">
                <motion.div
                  className="flex gap-4"
                  style={{ minWidth: "max-content" }}
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true, margin: "-50px" }}
                >
                  {similar.map((p) => (
                    <SimilarProductCard key={p._id} product={p} />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
