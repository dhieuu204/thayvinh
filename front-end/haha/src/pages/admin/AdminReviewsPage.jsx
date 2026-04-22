import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";
import { ImageWithFallback } from "../../components/ImageWithFallback";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Stars({ rating }) {
  return (
    <span className="text-sm text-[#f59e0b]">
      {"★".repeat(rating)}
      <span className="text-[#d1d5db]">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReplyModal({ review, onClose, onSave }) {
  const [reply, setReply] = useState(review.reply || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim()) { toast.error("Vui lòng nhập nội dung phản hồi"); return; }
    setSaving(true);
    try {
      await axiosClient.patch(`/api/reviews/${review._id}/reply`, { reply: reply.trim() });
      toast.success("Đã gửi phản hồi");
      onSave(review._id, reply.trim());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gửi phản hồi thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Phản hồi đánh giá</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Review preview */}
          <div className="rounded-xl bg-[#f5f5f7] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-medium text-[#1d1d1f]">
                {review.userId?.fullName || review.userId?.username || "Người dùng"}
              </span>
              <Stars rating={review.rating} />
            </div>
            <p className="text-[13px] text-[#3a3a3c]">{review.comment}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Phản hồi của cửa hàng</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Cảm ơn quý khách đã đánh giá..."
              className="w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
              <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
                {saving ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyModal, setReplyModal] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [loadingAllReviews, setLoadingAllReviews] = useState(true);
  const [ratingFilter, setRatingFilter] = useState(null);
  const dropdownRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Load danh sách sản phẩm để chọn
  useEffect(() => {
    axiosClient.get(`/api/products?limit=100`).then((r) => {
      setProducts(r.data.data?.products || []);
    }).catch(() => {});
  }, []);

  // Load tất cả đánh giá khi vào trang
  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = () => {
    setLoadingAllReviews(true);
    axiosClient.get(`/api/reviews?limit=100`)
      .then((r) => {
        setAllReviews(r.data.data?.reviews || []);
      })
      .catch(() => setAllReviews([]))
      .finally(() => setLoadingAllReviews(false));
  };

  // Filter sản phẩm theo search
  useEffect(() => {
    if (!search.trim()) { setFilteredProducts([]); return; }
    const q = search.toLowerCase();
    setFilteredProducts(products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8));
  }, [search, products]);

  // Click ngoài đóng dropdown
  useEffect(() => {
    const handler = (e) => { if (!dropdownRef.current?.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup auto-refresh interval when component unmounts or product changes
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [selectedProduct]);

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearch(product.name);
    setShowDropdown(false);
    loadReviews(product._id);
    // Auto-refresh reviews every 5 seconds when a product is selected
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      loadReviews(product._id);
    }, 5000);
  };

  const loadReviews = (productId) => {
    setLoadingReviews(true);
    axiosClient.get(`/api/reviews/product/${productId}`)
      .then((r) => {
        setReviews(r.data.data?.reviews || []);
        setAvgRating(r.data.data?.avgRating || 0);
      })
      .catch(() => toast.error("Không tải được đánh giá"))
      .finally(() => setLoadingReviews(false));
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Xoá đánh giá này?")) return;
    try {
      await axiosClient.delete(`/api/reviews/${reviewId}/admin`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Đã xoá đánh giá");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const handleReplySave = (reviewId, reply) => {
    setReviews((prev) => prev.map((r) => r._id === reviewId ? { ...r, reply } : r));
    setReplyModal(null);
  };

  const getFilteredReviews = (reviewList) => {
    if (!ratingFilter) return reviewList;
    return reviewList.filter((r) => r.rating === ratingFilter);
  };

  return (
    <div className="space-y-5">
      {replyModal && (
        <ReplyModal review={replyModal} onClose={() => setReplyModal(null)} onSave={handleReplySave} />
      )}

      <div>
        <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý đánh giá</h1>
        <p className="text-sm text-[#8e8e93]">Tìm sản phẩm để xem và phản hồi đánh giá</p>
      </div>

      {/* Product search */}
      <div ref={dropdownRef} className="relative max-w-lg">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => search && setShowDropdown(true)}
            placeholder="Tìm sản phẩm theo tên..."
            className="w-full rounded-2xl border border-black/[0.1] bg-white py-3 pl-10 pr-4 text-[14px] text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSelectedProduct(null); setReviews([]); setShowDropdown(false); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#1d1d1f]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        {showDropdown && filteredProducts.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => selectProduct(p)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f5f7] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f7]">
                  <ImageWithFallback src={p.images?.[0]?.url} alt={p.name} className="max-h-full w-auto object-contain" />
                </div>
                <span className="text-[13px] text-[#1d1d1f] truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#1d1d1f]">Lọc theo sao:</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              ratingFilter === null
                ? "bg-[#1d1d1f] text-white"
                : "border border-black/[0.1] text-[#1d1d1f] hover:bg-[#f5f5f7]"
            }`}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatingFilter(star)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                ratingFilter === star
                  ? "bg-[#f59e0b] text-white"
                  : "border border-black/[0.1] text-[#1d1d1f] hover:bg-[#f5f5f7]"
              }`}
            >
              <span>{"★".repeat(star)}</span>
              <span className="text-xs">({allReviews.filter((r) => r.rating === star).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* All Reviews List - Show on page load */}
      {!selectedProduct && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Tất cả đánh giá</h2>
              <p className="text-sm text-[#8e8e93]">{getFilteredReviews(allReviews).length} / {allReviews.length} đánh giá</p>
            </div>
            <button
              type="button"
              onClick={loadAllReviews}
              disabled={loadingAllReviews}
              className="flex items-center gap-2 rounded-full border border-black/[0.1] px-4 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loadingAllReviews ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
              </svg>
              Làm mới
            </button>
          </div>

          {loadingAllReviews ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
            </div>
          ) : allReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white py-16 text-center">
              <p className="text-sm text-[#8e8e93]">Chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredReviews(allReviews).map((r) => (
                <div key={r._id} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white">
                          {(r.userId?.fullName || r.userId?.username || "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-[#1d1d1f]">
                            {r.userId?.fullName || r.userId?.username || "Người dùng"}
                          </p>
                          <p className="text-[11px] text-[#8e8e93]">{fmtDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-[#6e6e73] mb-2">
                        Sản phẩm: <span className="font-medium text-[#1d1d1f]">{r.productId?.name || "N/A"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars rating={r.rating} />
                      <button
                        type="button"
                        onClick={() => setReplyModal(r)}
                        className="flex items-center gap-1 rounded-full border border-[#0071e3] px-2.5 py-1 text-[11px] font-medium text-[#0071e3] hover:bg-[#eef6ff] transition-colors"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {r.reply ? "Sửa" : "Phản hồi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.1] text-[#8e8e93] hover:border-[#e53e3e] hover:text-[#e53e3e] transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] text-[#3a3a3c]">{r.comment}</p>

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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm3.5-9c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/>
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {r.reply && (
                    <div className="mt-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                      <p className="mb-1 text-[11px] font-semibold text-[#1d4ed8]">Phản hồi từ cửa hàng</p>
                      <p className="text-[13px] text-[#1e40af]">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews by selected product */}
      {selectedProduct && (
        <div className="space-y-4">
          {/* Rating Filter for product reviews */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1d1d1f]">Lọc theo sao:</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  ratingFilter === null
                    ? "bg-[#1d1d1f] text-white"
                    : "border border-black/[0.1] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                }`}
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(star)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                    ratingFilter === star
                      ? "bg-[#f59e0b] text-white"
                      : "border border-black/[0.1] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                  }`}
                >
                  <span>{"★".repeat(star)}</span>
                  <span className="text-xs">({reviews.filter((r) => r.rating === star).length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f7]">
                <ImageWithFallback src={selectedProduct.images?.[0]?.url} alt={selectedProduct.name} className="max-h-full w-auto object-contain" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1d1d1f]">{selectedProduct.name}</p>
                <p className="text-sm text-[#8e8e93]">{getFilteredReviews(reviews).length} / {reviews.length} đánh giá · ★ {avgRating.toFixed(1)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadReviews(selectedProduct._id)}
              disabled={loadingReviews}
              className="flex items-center gap-2 rounded-full border border-black/[0.1] px-4 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loadingReviews ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
              </svg>
              Làm mới
            </button>
          </div>

          {/* Review list */}
          {loadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white py-16 text-center">
              <p className="text-sm text-[#8e8e93]">Sản phẩm này chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredReviews(reviews).map((r) => (
                <div key={r._id} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white">
                        {(r.userId?.fullName || r.userId?.username || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1d1d1f]">
                          {r.userId?.fullName || r.userId?.username || "Người dùng"}
                        </p>
                        <p className="text-[11px] text-[#8e8e93]">{fmtDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars rating={r.rating} />
                      <button
                        type="button"
                        onClick={() => setReplyModal(r)}
                        className="flex items-center gap-1 rounded-full border border-[#0071e3] px-2.5 py-1 text-[11px] font-medium text-[#0071e3] hover:bg-[#eef6ff] transition-colors"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {r.reply ? "Sửa phản hồi" : "Phản hồi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.1] text-[#8e8e93] hover:border-[#e53e3e] hover:text-[#e53e3e] transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] text-[#3a3a3c]">{r.comment}</p>

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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm3.5-9c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/>
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {r.reply && (
                    <div className="mt-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                      <p className="mb-1 text-[11px] font-semibold text-[#1d4ed8]">Phản hồi từ cửa hàng</p>
                      <p className="text-[13px] text-[#1e40af]">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
