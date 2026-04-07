import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { staggerContainer, staggerItem } from "../lib/animations";
import { API_URL } from "../lib/api";

const SF_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const PAGE_SIZE = 9;

const CATEGORY_META = {
  iphone:      { emoji: "📱", name: "iPhone",      desc: "Dòng iPhone mới nhất với hiệu năng đỉnh cao và camera thế hệ mới." },
  ipad:        { emoji: "🖥️", name: "iPad",        desc: "iPad với chip mạnh mẽ, màn hình sắc nét cho công việc sáng tạo." },
  mac:         { emoji: "💻", name: "Mac",          desc: "MacBook và iMac với chip Apple Silicon, hiệu năng vượt trội." },
  watch:       { emoji: "⌚", name: "Watch",        desc: "Apple Watch theo dõi sức khoẻ, kết nối thông minh mọi lúc mọi nơi." },
  audio:       { emoji: "🎧", name: "Audio",        desc: "AirPods và tai nghe với âm thanh vòm không gian sống động." },
  accessories: { emoji: "🔌", name: "Accessories",  desc: "Phụ kiện chính hãng Apple tương thích hoàn hảo với mọi thiết bị." },
};

const SORT_OPTIONS = [
  { value: "newest",      label: "Mới nhất" },
  { value: "best_seller", label: "Bán chạy" },
  { value: "price_asc",   label: "Giá tăng dần" },
  { value: "price_desc",  label: "Giá giảm dần" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const price = product.salePrice || product.basePrice;
  const oldPrice = product.salePrice ? product.basePrice : null;
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null;

  return (
    <motion.article
      variants={staggerItem}
      className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative flex h-[220px] items-center justify-center bg-[#f5f5f7] p-6">
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="max-h-[180px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {product.isFlashSale && (
            <span className="absolute left-3 top-3 rounded-full bg-[#e53e3e] px-2.5 py-1 text-xs font-medium text-white">
              Flash Sale
            </span>
          )}
          {discount && (
            <span className="absolute right-3 top-3 rounded-full bg-[#fff1f0] px-2 py-0.5 text-xs font-semibold text-[#e53e3e]">
              -{discount}%
            </span>
          )}
        </div>

        <div className="px-4 pb-5 pt-3 text-center">
          <h3 className="text-[14px] font-medium text-[#1d1d1f]">{product.name}</h3>
          <div className="mt-1.5 flex items-baseline justify-center gap-2">
            <span className="text-[15px] font-bold text-[#1d1d1f]">{formatCurrency(price)}</span>
            {oldPrice && (
              <span className="text-xs text-[#8e8e93] line-through">{formatCurrency(oldPrice)}</span>
            )}
          </div>
          {oldPrice && (
            <p className="mt-0.5 text-xs font-medium text-[#0071e3]">Online giá rẻ quá</p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-10 min-w-10 rounded-full px-3 text-sm transition-all ${
            page === currentPage
              ? "bg-[#1d1d1f] text-white"
              : "border border-black/[0.08] bg-white text-[#6e6e73] hover:border-black/[0.2] hover:text-[#1d1d1f]"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const meta = CATEGORY_META[slug?.toLowerCase()];

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) navigate("/not-found", { replace: true });
  }, [meta, navigate]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/api/products/filter/category?categorySlug=${slug}&page=${currentPage}&limit=${PAGE_SIZE}&sort=${sortBy}`)
      .then((r) => r.json())
      .then((json) => {
        setProducts(json.data?.products || []);
        setTotalProducts(json.data?.pagination?.total || 0);
        setTotalPages(json.data?.pagination?.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, sortBy, currentPage]);

  useEffect(() => setCurrentPage(1), [sortBy]);

  if (!meta) return null;

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Sản phẩm", to: "/products" },
          { label: meta.name },
        ]}
      />

      <main className="pb-16">
        {/* Category hero */}
        <section className="border-b border-black/[0.06] bg-white py-8">
          <div className="mx-auto max-w-[1200px] px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f5f7] text-3xl">
                {meta.emoji}
              </div>
              <div>
                <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 650 }}>
                  {meta.name}
                </h1>
                <p className="mt-0.5 max-w-lg text-sm text-[#6e6e73]">{meta.desc}</p>
              </div>
              <span className="ml-auto rounded-full bg-[#f5f5f7] px-3 py-1.5 text-sm font-medium text-[#6e6e73]">
                {totalProducts} sản phẩm
              </span>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-[1200px] px-4 md:px-8">
          {/* Sort toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <span className="text-sm text-[#6e6e73]">Sắp xếp:</span>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    sortBy === opt.value
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/[0.15] bg-white py-20 text-center">
              <p className="text-lg font-medium text-[#1d1d1f]">Không có sản phẩm</p>
              <p className="mt-1 text-sm text-[#6e6e73]">Danh mục này chưa có sản phẩm nào.</p>
              <Link to="/products" className="mt-5 inline-block rounded-full border border-[#1d1d1f] px-6 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white transition-all">
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : (
            <motion.div
              key={`${sortBy}-${currentPage}`}
              variants={staggerContainer}
              initial="initial"
              animate="whileInView"
              viewport={{ once: true }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </motion.div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
