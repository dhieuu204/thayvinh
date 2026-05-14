import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { staggerContainer, staggerItem } from "../lib/animations";
import { API_URL } from "../lib/api";
import { getDisplayPrice } from "../lib/pricing";
import { formatCurrency } from "../lib/format";

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: "newest",      label: "Mới nhất",    api: "newest" },
  { value: "best_seller", label: "Bán chạy",    api: "best_seller" },
  { value: "price_asc",   label: "Giá ↑",       api: "price_asc" },
  { value: "price_desc",  label: "Giá ↓",       api: "price_desc" },
];

function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const { price, oldPrice, discount } = getDisplayPrice(product);

  return (
    <motion.article
      variants={staggerItem}
      className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative flex h-[240px] items-center justify-center bg-[#f5f5f7] p-6">
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="max-h-[200px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
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
          <p className="text-xs text-[#86868b] mb-1">{product.category?.name}</p>
          <h3 className="text-[15px] font-medium text-[#1d1d1f]">{product.name}</h3>
          <div className="mt-1.5 flex items-baseline justify-center gap-2">
            <p className="text-[15px] font-bold text-[#1d1d1f]">
              {formatCurrency(price)}
            </p>
            <p className={`text-xs text-[#8e8e93] line-through ${oldPrice ? "" : "invisible"}`}>
              {oldPrice ? formatCurrency(oldPrice) : "0"}
            </p>
          </div>
          <p className={`mt-1 text-xs font-medium ${oldPrice ? "text-[#0071e3]" : "invisible"}`}>
            Online giá rẻ quá
          </p>
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
          className={`h-10 min-w-10 cursor-pointer rounded-full px-3 text-sm transition-all duration-200 active:scale-95 ${
            page === currentPage
              ? "bg-[#1d1d1f] text-white"
              : "bg-white text-[#6e6e73] border border-black/[0.08] hover:border-black/[0.2] hover:text-[#1d1d1f]"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Lấy danh mục từ API
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((json) => setCategories(json.data || []))
      .catch(() => {});
  }, []);

  // Đổi query URL -> reset về trang 1
  useEffect(() => { setCurrentPage(1); }, [urlQuery]);

  // Lấy sản phẩm từ API
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_SIZE,
      sort: sortBy,
    });
    if (priceMin) params.set("minPrice", priceMin);
    if (priceMax) params.set("maxPrice", priceMax);
    if (urlQuery) params.set("search", urlQuery);

    let url;
    if (selectedCategory === "all") {
      url = `${API_URL}/api/products?${params}`;
    } else {
      params.set("categorySlug", selectedCategory);
      url = `${API_URL}/api/products/filter/category?${params}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data;
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalResults(data.pagination?.total || 0);
      })
      .catch(() => { setProducts([]); setTotalResults(0); })
      .finally(() => setLoading(false));
  }, [selectedCategory, sortBy, currentPage, priceMin, priceMax, urlQuery]);

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePriceFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // trigger useEffect via state (already set via onChange)
  };

  const handleResetFilters = () => {
    handleCategoryChange("all");
    handleSortChange("newest");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] antialiased"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />

      <main className="bg-[#fafafa] pb-16">
        {/* Breadcrumb */}
        <section className="w-full border-b border-black/[0.06] bg-[#fafafa]">
          <div className="mx-auto max-w-[1200px] px-6 py-4 md:px-8">
            <p className="text-sm text-[#6e6e73]">
              <Link to="/" className="hover:text-[#1d1d1f]">Home</Link>
              {" / "}
              <span className="text-[#1d1d1f]">Products</span>
            </p>
          </div>
        </section>

        <section className="mx-auto mt-4 max-w-[1200px] px-4 md:px-8">
          {/* Search result banner */}
          {urlQuery && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div>
                <p className="text-[13px] text-[#6e6e73]">Kết quả tìm kiếm cho</p>
                <p className="text-[16px] font-semibold text-[#1d1d1f]">
                  "{urlQuery}"
                  {!loading && (
                    <span className="ml-2 text-[13px] font-normal text-[#8e8e93]">
                      · {totalResults} sản phẩm
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="shrink-0 rounded-full border border-black/[0.1] px-4 py-1.5 text-[13px] text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors"
              >
                Xoá tìm kiếm
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            {/* Category filter */}
            <div className="flex items-center gap-3 overflow-x-auto border-b border-black/[0.06] px-4 py-3">
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={`shrink-0 cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                  selectedCategory === "all"
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`shrink-0 cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                    selectedCategory === cat.slug
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex flex-wrap items-center gap-x-1 px-4 py-2.5 text-sm border-b border-black/[0.06]">
              <span className="mr-1.5 text-[#6e6e73]">Sắp xếp:</span>
              {SORT_OPTIONS.map((option, index) => (
                <span key={option.value} className="flex items-center">
                  {index > 0 && <span className="mx-2 select-none text-[#c7c7cc]">•</span>}
                  <button
                    type="button"
                    onClick={() => handleSortChange(option.value)}
                    className={`cursor-pointer transition-all duration-150 active:scale-95 ${
                      sortBy === option.value
                        ? "font-semibold text-[#1d1d1f]"
                        : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {option.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Price range filter */}
            <form onSubmit={handlePriceFilter} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              <span className="text-sm text-[#6e6e73]">Giá:</span>
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setCurrentPage(1); }}
                placeholder="Từ (đ)"
                className="w-28 rounded-lg border border-black/[0.1] bg-[#f5f5f7] px-3 py-1.5 text-[13px] outline-none focus:border-[#0071e3]"
              />
              <span className="text-[#8e8e93]">—</span>
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setCurrentPage(1); }}
                placeholder="Đến (đ)"
                className="w-28 rounded-lg border border-black/[0.1] bg-[#f5f5f7] px-3 py-1.5 text-[13px] outline-none focus:border-[#0071e3]"
              />
              {(priceMin || priceMax) && (
                <button
                  type="button"
                  onClick={() => { setPriceMin(""); setPriceMax(""); setCurrentPage(1); }}
                  className="cursor-pointer rounded-lg border border-black/[0.1] px-3 py-1.5 text-[12px] text-[#6e6e73] transition-all duration-150 hover:text-[#1d1d1f] active:scale-95"
                >
                  Xóa bộ lọc giá
                </button>
              )}
            </form>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="mt-8 flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-black/[0.15] bg-white px-6 py-12 text-center">
              <h2 className="text-[#1d1d1f]" style={{ fontSize: "22px", fontWeight: 600 }}>
                Không tìm thấy sản phẩm
              </h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                {urlQuery
                  ? `Không có sản phẩm nào khớp với "${urlQuery}". Thử từ khoá khác hoặc xoá bộ lọc.`
                  : "Thử chọn danh mục khác."}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (urlQuery) setSearchParams({});
                  handleResetFilters();
                }}
                className="mt-5 cursor-pointer rounded-full border border-[#1d1d1f] px-5 py-2.5 text-sm text-[#1d1d1f] transition-all duration-200 hover:bg-[#1d1d1f] hover:text-white active:scale-95"
              >
                {urlQuery ? "Xoá tìm kiếm & bộ lọc" : "Reset bộ lọc"}
              </button>
            </div>
          ) : (
            <motion.div
              key={`${selectedCategory}-${sortBy}-${currentPage}`}
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-50px" }}
            >
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
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
