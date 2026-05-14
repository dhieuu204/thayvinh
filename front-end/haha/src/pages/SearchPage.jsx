import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { staggerContainer, staggerItem } from "../lib/animations";
import { API_URL } from "../lib/api";
import { getDisplayPrice } from "../lib/pricing";
import { formatCurrency } from "../lib/format";

const PAGE_SIZE = 12;

function HighlightedText({ text, keyword }) {
  if (!keyword?.trim()) return <span>{text}</span>;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.trim().toLowerCase() ? (
          <mark key={i} className="rounded bg-[#fff3cd] px-0.5 text-[#1d1d1f] not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function ProductCard({ product, keyword }) {
  const image = product.images?.[0]?.url;
  const { price, oldPrice, discount } = getDisplayPrice(product);

  return (
    <motion.article
      variants={staggerItem}
      className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative flex h-[200px] items-center justify-center bg-[#f5f5f7] p-6">
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="max-h-[160px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {product.isFlashSale && (
            <span className="absolute left-3 top-3 rounded-full bg-[#e53e3e] px-2.5 py-1 text-xs font-medium text-white">
              Flash Sale
            </span>
          )}
          {discount != null && (
            <span className="absolute right-3 top-3 rounded-full bg-[#fff1f0] px-2 py-0.5 text-xs font-semibold text-[#e53e3e]">
              -{discount}%
            </span>
          )}
        </div>
        <div className="px-4 pb-5 pt-3 text-center">
          <p className="mb-1 text-xs text-[#86868b]">{product.category?.name}</p>
          <h3 className="text-[14px] font-medium text-[#1d1d1f]">
            <HighlightedText text={product.name} keyword={keyword} />
          </h3>
          <div className="mt-1.5 flex items-baseline justify-center gap-2">
            <p className="text-[14px] font-bold text-[#1d1d1f]">{formatCurrency(price)}</p>
            {oldPrice && (
              <p className="text-xs text-[#8e8e93] line-through">{formatCurrency(oldPrice)}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="h-[200px] animate-pulse bg-[#f5f5f7]" />
      <div className="space-y-2.5 px-4 pb-5 pt-3">
        <div className="mx-auto h-3 w-14 animate-pulse rounded bg-[#f5f5f7]" />
        <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-[#f5f5f7]" />
        <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-[#f5f5f7]" />
      </div>
    </div>
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
          className={`h-10 min-w-[40px] cursor-pointer rounded-full px-3 text-sm transition-all duration-200 active:scale-95 ${
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

const SORT_OPTIONS = [
  { value: "newest",      label: "Mới nhất" },
  { value: "best_seller", label: "Bán chạy" },
  { value: "price_asc",   label: "Giá ↑" },
  { value: "price_desc",  label: "Giá ↓" },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy]           = useState("newest");

  useEffect(() => { setCurrentPage(1); }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      search: query,
      page:   currentPage,
      limit:  PAGE_SIZE,
      sort:   sortBy,
    });
    fetch(`${API_URL}/api/products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        const d = json.data;
        setProducts(d?.products || []);
        setTotalPages(d?.pagination?.totalPages || 1);
        setTotalResults(d?.pagination?.total || 0);
      })
      .catch(() => { setProducts([]); setTotalResults(0); })
      .finally(() => setLoading(false));
  }, [query, currentPage, sortBy]);

  const handleSortChange = (val) => { setSortBy(val); setCurrentPage(1); };

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] antialiased"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />

      <main className="bg-[#fafafa] pb-16">
        {/* Breadcrumb */}
        <section className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-4 md:px-8">
            <p className="text-sm text-[#6e6e73]">
              <Link to="/" className="hover:text-[#1d1d1f]">Home</Link>
              {" / "}
              <span className="text-[#1d1d1f]">Tìm kiếm</span>
              {query && (
                <><span> / </span><span className="text-[#1d1d1f]">"{query}"</span></>
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-[1200px] px-4 md:px-8">
          {/* Header */}
          <div className="mb-6">
            {query ? (
              <>
                <p className="text-[13px] text-[#6e6e73]">Kết quả tìm kiếm cho</p>
                <h1 className="text-[24px] font-semibold text-[#1d1d1f]">
                  "{query}"
                  {!loading && (
                    <span className="ml-2 text-[16px] font-normal text-[#8e8e93]">
                      · {totalResults} sản phẩm
                    </span>
                  )}
                </h1>
              </>
            ) : (
              <h1 className="text-[24px] font-semibold text-[#1d1d1f]">Tìm kiếm</h1>
            )}
          </div>

          {/* Sort bar — chỉ hiện khi có query */}
          {query && !loading && products.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-x-1 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <span className="mr-2 text-sm text-[#6e6e73]">Sắp xếp:</span>
              {SORT_OPTIONS.map((opt, i) => (
                <span key={opt.value} className="flex items-center">
                  {i > 0 && <span className="mx-2 select-none text-[#c7c7cc]">•</span>}
                  <button
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className={`cursor-pointer text-sm transition-all duration-150 active:scale-95 ${
                      sortBy === opt.value
                        ? "font-semibold text-[#1d1d1f]"
                        : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {opt.label}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* No query state */}
          {!query ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-black/[0.15] bg-white px-6 py-16 text-center">
              <svg className="mx-auto mb-4 text-[#c7c7cc]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <h2 className="text-[18px] font-medium text-[#1d1d1f]">Nhập từ khoá để tìm kiếm</h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                Tìm iPhone, iPad, Mac, AirPods và nhiều hơn nữa...
              </p>
              <Link
                to="/products"
                className="mt-5 inline-block rounded-full border border-[#1d1d1f] px-5 py-2.5 text-sm text-[#1d1d1f] transition-all duration-200 hover:bg-[#1d1d1f] hover:text-white active:scale-95"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          ) : loading ? (
            /* Skeleton */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            /* Empty state */
            <div className="mt-4 rounded-[24px] border border-dashed border-black/[0.15] bg-white px-6 py-16 text-center">
              <svg className="mx-auto mb-4 text-[#c7c7cc]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <h2 className="text-[18px] font-medium text-[#1d1d1f]">Không tìm thấy kết quả</h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                Không có sản phẩm nào khớp với "{query}". Thử từ khoá khác nhé.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="cursor-pointer rounded-full border border-[#1d1d1f] px-5 py-2.5 text-sm text-[#1d1d1f] transition-all duration-200 hover:bg-[#1d1d1f] hover:text-white active:scale-95"
                >
                  Xoá tìm kiếm
                </button>
                <Link
                  to="/products"
                  className="cursor-pointer rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm text-white transition-all duration-200 hover:bg-[#3d3d3f] active:scale-95"
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            </div>
          ) : (
            /* Results grid */
            <>
              <motion.div
                key={`${query}-${currentPage}-${sortBy}`}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: "-50px" }}
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} keyword={query} />
                ))}
              </motion.div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
