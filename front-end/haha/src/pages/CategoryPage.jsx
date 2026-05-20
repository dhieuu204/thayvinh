import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { staggerContainer, staggerItem } from "../lib/animations";
import { API_URL } from "../lib/api";
import { getDisplayPrice } from "../lib/pricing";
import { AppleLogo } from "../components/icons";
import { formatCurrency } from "../lib/format";

const SF_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const PAGE_SIZE = 12;

const CATEGORY_META = {
  iphone:      { emoji: "📱", name: "iPhone",      desc: "Dòng iPhone mới nhất với hiệu năng đỉnh cao và camera thế hệ mới." },
  ipad:        { emoji: "🖥️", name: "iPad",        desc: "iPad với chip mạnh mẽ, màn hình sắc nét cho công việc sáng tạo." },
  mac:         { emoji: "💻", name: "Mac",          desc: "MacBook và iMac với chip Apple Silicon, hiệu năng vượt trội." },
  watch:       { emoji: "⌚", name: "Watch",        desc: "Apple Watch theo dõi sức khoẻ, kết nối thông minh mọi lúc mọi nơi." },
  audio:       { emoji: "🎧", name: "Audio",        desc: "AirPods và tai nghe với âm thanh vòm không gian sống động." },
  accessories: { emoji: "🔌", name: "Accessories",  desc: "Phụ kiện chính hãng Apple tương thích hoàn hảo với mọi thiết bị." },
};

const SORT_OPTIONS = [
  { value: "newest",      label: "Mới" },
  { value: "best_seller", label: "Bán chạy" },
  { value: "price_asc",   label: "Giá thấp đến cao" },
  { value: "price_desc",  label: "Giá cao đến thấp" },
];




function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const { price, oldPrice, discount } = getDisplayPrice(product);

  return (
    <motion.article
      variants={staggerItem}
      className="group overflow-hidden rounded-[16px] bg-white border border-black/[0.06] transition-all duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative flex h-[240px] items-center justify-center bg-[#f5f5f7] p-6">
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="max-h-[190px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {product.isFlashSale && (
            <span className="absolute left-3 top-3 rounded-full bg-[#e53e3e] px-2.5 py-1 text-[10px] font-bold uppercase text-white">
              Flash Sale
            </span>
          )}
        </div>

        <div className="px-5 pb-6 pt-4 text-center bg-[#f5f5f7]">
          <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-medium text-[#1d1d1f]">{product.name}</h3>
          <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
            <span className="text-[16px] font-bold text-[#1d1d1f]">{formatCurrency(price)}</span>
            <div className={`flex items-center gap-2 ${oldPrice ? "" : "invisible"}`}>
              <span className="text-[13px] text-[#8e8e93] line-through">
                {oldPrice ? formatCurrency(oldPrice) : "0"}
              </span>
              <span className="text-[13px] text-[#e53e3e]">
                {discount ? `-${discount}%` : "-0%"}
              </span>
            </div>
          </div>
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
          className={`h-10 min-w-10 cursor-pointer rounded-lg px-3 text-sm transition-all duration-200 active:scale-95 ${
            page === currentPage
              ? "bg-[#1d1d1f] text-white font-bold"
              : "bg-white text-[#1d1d1f] border border-black/[0.08] hover:bg-[#f5f5f7]"
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
  const [seriesFilters, setSeriesFilters] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    if (!meta) navigate("/not-found", { replace: true });
  }, [meta, navigate]);

  useEffect(() => {
    if (!slug) return;
    setBannerIdx(0);
    fetch(`${API_URL}/api/banners?position=${slug}&isActive=true`)
      .then((r) => r.json())
      .then((json) => setBanners((json.data || []).filter((b) => b.isActive)))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const searchParam = activeFilter ? `&search=${encodeURIComponent(activeFilter)}` : "";
    fetch(`${API_URL}/api/products/filter/category?categorySlug=${slug}&page=${currentPage}&limit=${PAGE_SIZE}&sort=${sortBy}${searchParam}`)
      .then((r) => r.json())
      .then((json) => {
        setProducts(json.data?.products || []);
        setTotalProducts(json.data?.pagination?.total || 0);
        setTotalPages(json.data?.pagination?.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, sortBy, currentPage, activeFilter]);

  useEffect(() => setCurrentPage(1), [sortBy]);
  useEffect(() => { setCurrentPage(1); setActiveFilter(null); }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/products/filter/category?categorySlug=${slug}&limit=100&sort=newest`)
      .then((r) => r.json())
      .then((json) => {
        const names = (json.data?.products || []).map((p) => p.name);
        const keywords = [...new Set(
          names.map((n) => n.split(" ").slice(0, 2).join(" "))
        )].slice(0, 8);
        setSeriesFilters(keywords);
      })
      .catch(() => {});
  }, [slug]);

  if (!meta) return null;

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      
      {/* <div className="bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto text-[#1d1d1f]">
          <Breadcrumb
            items={[
              { label: "Trang chủ", to: "/" },
              { label: "Sản phẩm", to: "/products" },
              { label: meta.name },
            ]}
          />
        </div>
      </div> */}

      <main className="pb-20">
        <section className="mx-auto max-w-[1200px] px-4 md:px-8">
          {/* Category Logo & Title
          <div className="flex justify-center items-center gap-2 mb-8 text-[#1d1d1f]">
            <div className="flex-shrink-0 flex items-center justify-center pb-1">
              <AppleLogo size={32} />
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight leading-none">{meta.name}</h1>
          </div> */}

          {/* Banner Slider */}
          {banners.length > 0 ? (
            <div className="relative w-full rounded-2xl overflow-hidden mb-8 group bg-white border border-black/[0.04]">
              {banners[bannerIdx].linkUrl ? (
                <a href={banners[bannerIdx].linkUrl}>
                  <img src={banners[bannerIdx].imageUrl} alt={banners[bannerIdx].title} className="w-full h-auto block" />
                </a>
              ) : (
                <img src={banners[bannerIdx].imageUrl} alt={banners[bannerIdx].title} className="w-full h-auto block" />
              )}
              {banners.length > 1 && (
                <>
                  <button type="button" onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)}
                    className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 bg-white/80 text-[#1d1d1f] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black/10 shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button type="button" onClick={() => setBannerIdx((i) => (i + 1) % banners.length)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 bg-white/80 text-[#1d1d1f] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black/10 shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, i) => (
                      <button key={i} type="button" onClick={() => setBannerIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative w-full rounded-2xl overflow-hidden mb-8 group cursor-pointer bg-white border border-black/[0.04]">
              <img
                src="https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iP17promax_PC.png"
                alt="Category Banner"
                className="w-full h-auto block"
              />
            </div>
          )}

          {/* Filter Bar */}
          {seriesFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setActiveFilter(null); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg border text-[14px] font-medium transition-colors ${
                  !activeFilter
                    ? "bg-[#1d1d1f] text-white border-[#1d1d1f]"
                    : "bg-white text-[#1d1d1f] border-black/[0.08] hover:bg-[#f5f5f7]"
                }`}
              >
                Tất cả
              </button>
              {seriesFilters.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => { setActiveFilter(kw); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg border text-[14px] font-medium transition-colors ${
                    activeFilter === kw
                      ? "bg-[#1d1d1f] text-white border-[#1d1d1f]"
                      : "bg-white text-[#1d1d1f] border-black/[0.06] hover:bg-[#f5f5f7]"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          {/* Sort Info Text */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-[14px]">
            <span className="text-[#6e6e73]">Sắp xếp theo:</span>
            {SORT_OPTIONS.map((opt, idx) => (
              <div key={opt.value} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`transition-colors font-medium ${
                    sortBy === opt.value ? "text-[#1d1d1f]" : "text-[#8e8e93] hover:text-[#1d1d1f]"
                  }`}
                >
                  {opt.label}
                </button>
                {idx < SORT_OPTIONS.length - 1 && <span className="text-[#d2d2d7]">•</span>}
              </div>
            ))}
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
              <Link to="/products" className="mt-5 inline-block cursor-pointer rounded-full border border-[#1d1d1f] bg-[#1d1d1f] px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-95">
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
              className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
