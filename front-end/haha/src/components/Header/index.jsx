import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppleLogo,
  SearchIcon,
  TruckIcon,
  ClockIcon,
  UserIcon,
  CartIcon,
  BellIcon,
} from "../icons";
import { getCartCount } from "../../lib/cart";
import axiosClient from "../../lib/api";

/* ─── Nav items ──────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "iPhone", to: "/categories/iphone" },
  { label: "iPad", to: "/categories/ipad" },
  { label: "Mac", to: "/categories/mac" },
  { label: "Watch", to: "/categories/watch" },
  { label: "Audio", to: "/categories/audio" },
  { label: "Accessories", to: "/categories/accessories" },
];

/* ─── Shared state helpers ───────────────────────────────────────── */
function useHeaderState() {
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

  useEffect(() => {
    const syncCart = () => setCartCount(getCartCount());
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
        setIsLoggedIn(!!localStorage.getItem("token"));
      } catch { setUser(null); setIsLoggedIn(false); }
    };
    window.addEventListener("cartUpdated", syncCart);
    window.addEventListener("userUpdated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("cartUpdated", syncCart);
      window.removeEventListener("userUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const userInitial = user?.name
    ? user.name.trim().split(" ").pop()?.[0]?.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? null;

  const userName = user?.name?.split(" ").pop() || null;
  const isAdmin = user?.role === "admin";

  return { cartCount, user, isLoggedIn, userInitial, userName, isAdmin };
}

/* ─── Notification Bell ──────────────────────────────────────────── */
function NotificationBell({ size = 13 }) {
  const [unread, setUnread]         = useState(0);
  const [open, setOpen]             = useState(false);
  const [notifications, setNotifs]  = useState([]);
  const [loading, setLoading]       = useState(false);
  const wrapRef                     = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/api/notifications/unread-count");
      setUnread(data.data?.count ?? 0);
    } catch {}
  }, []);

  // Poll mỗi 60s, chỉ khi đã đăng nhập; tự dừng sau logout
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    fetchCount();
    const id = setInterval(() => {
      if (!localStorage.getItem("token")) { clearInterval(id); return; }
      fetchCount();
    }, 60_000);
    const stopOnLogout = () => clearInterval(id);
    window.addEventListener("userUpdated", stopOnLogout);
    return () => {
      clearInterval(id);
      window.removeEventListener("userUpdated", stopOnLogout);
    };
  }, [fetchCount]);

  // Fetch danh sách khi mở dropdown
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axiosClient
      .get("/api/notifications?limit=10")
      .then(({ data }) => setNotifs(data.data?.notifications ?? []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    try {
      await axiosClient.patch("/api/notifications/read-all");
      setUnread(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await axiosClient.patch(`/api/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
        title="Thông báo"
      >
        <BellIcon size={size} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e53e3e] text-[9px] font-bold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-[200] w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <span className="text-[13px] font-semibold text-[#1d1d1f]">Thông báo</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="text-[11px] text-[#0071e3] hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[#8e8e93]">
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => markOne(n._id)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5f5f7] ${
                      !n.isRead ? "bg-[#f0f7ff]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.isRead ? "bg-[#0071e3]" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-[#1d1d1f]">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[#6e6e73]">{n.message}</p>
                      <p className="mt-1 text-[10px] text-[#8e8e93]">
                        {new Date(n.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── UserCartControls — dùng chung ở 2 nơi ─────────────────────── */
function UserCartControls({ size = 13, isLoggedIn, isAdmin, userInitial, userName, cartCount, textVisible = true }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4">
      {/* Account */}
      <button
        onClick={() => navigate(isLoggedIn ? "/account" : "/login")}
        className="flex items-center gap-1.5 text-[#1d1d1f] hover:text-[#0071e3] transition-colors cursor-pointer"
        style={{ fontSize: "12px", fontWeight: 500 }}
        title={isLoggedIn ? "Tài khoản" : "Đăng nhập"}
      >
        {isLoggedIn && userInitial ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1d1d1f] text-[10px] font-bold text-white">
            {userInitial}
          </span>
        ) : (
          <UserIcon size={size} />
        )}
        {textVisible && (
          <span className="hidden sm:inline">
            {isLoggedIn ? (userName || "Tài khoản") : "Đăng nhập"}
          </span>
        )}
      </button>

      {/* Notification Bell — chỉ hiện khi đã đăng nhập */}
      {isLoggedIn && <NotificationBell size={size} />}

      {/* Dashboard (admin) hoặc Cart (user đã đăng nhập) */}
      {isAdmin ? (
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
          style={{ fontSize: "12px", fontWeight: 500 }}
          title="Dashboard"
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {textVisible && <span className="hidden sm:inline">Dashboard</span>}
        </Link>
      ) : isLoggedIn ? (
        <Link
          to="/cart"
          className="relative flex items-center gap-1.5 text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
          style={{ fontSize: "12px", fontWeight: 500 }}
        >
          <span className="relative">
            <CartIcon size={size} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e53e3e] text-[9px] font-bold text-white"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          {textVisible && <span className="hidden sm:inline">Giỏ hàng</span>}
        </Link>
      ) : null}
    </div>
  );
}

/* ─── Announcement Bar (top, không sticky) ───────────────────────── */
function AnnouncementBar({ cartCount, isLoggedIn, isAdmin, userInitial }) {
  return (
    <div className="w-full bg-[#fafafa] border-b border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-2 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-1.5 text-[#1d1d1f]" style={{ fontSize: "12px", fontWeight: 500 }}>
          <TruckIcon size={13} />
          <span>Miễn phí vận chuyển toàn quốc</span>
        </div>

        {/* Center */}
        <div className="hidden md:flex items-center gap-1.5 text-[#1d1d1f]" style={{ fontSize: "12px", fontWeight: 500 }}>
          <ClockIcon size={13} />
          <span>Đổi trả 30 ngày</span>
          <span className="mx-3 text-[#c7c7cc]">|</span>
          <span>Hỗ trợ 24/7</span>
        </div>

        {/* Right: User + Cart/Dashboard */}
        <UserCartControls
          cartCount={cartCount}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          userInitial={userInitial}
          textVisible={true}
        />
      </div>
    </div>
  );
}

/* ─── Navbar (sticky) ────────────────────────────────────────────── */
function Navbar({ scrolled, cartCount, isLoggedIn, isAdmin, userInitial }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const debounceRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounce fetch gợi ý + cancel inflight request
  const abortRef = useRef(null);
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      axiosClient
        .get(`/api/products?search=${encodeURIComponent(query.trim())}&limit=6`, {
          signal: abortRef.current.signal,
        })
        .then((r) => setSuggestions(r.data?.data?.products || []))
        .catch((err) => { if (err.name !== "CanceledError") setSuggestions([]); });
    }, 300);
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setShowSuggest(false);
    setMobileOpen(false);
  };

  const handlePickSuggestion = (productId) => {
    setQuery("");
    setShowSuggest(false);
    setMobileOpen(false);
    navigate(`/products/${productId}`);
  };

  function formatVnd(n) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n || 0);
  }

  return (
    <nav
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] shadow-[0_1px_8px_rgba(0,0,0,0.05)]"
          : "bg-[#fafafa]"
      }`}
    >
      <div
        className="relative max-w-[1200px] mx-auto px-6 md:px-8 flex items-center justify-between"
        style={{ height: "56px" }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="text-[#1d1d1f] flex-shrink-0 transition-opacity hover:opacity-75"
          aria-label="HK Tech - Trang chủ"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <AppleLogo size={30} />
          </motion.div>
        </Link>

        {/* Desktop nav — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative py-1 text-[13px] transition-colors ${
                  isActive
                    ? "font-semibold text-[#1d1d1f]"
                    : "font-normal text-[#6e6e73] hover:text-[#1d1d1f]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#1d1d1f]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right: Search + (User+Cart khi scrolled) + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div ref={searchBoxRef} className="relative hidden sm:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
                onFocus={() => setShowSuggest(true)}
                placeholder="Tìm kiếm..."
                className="rounded-lg border border-[#c7c7cc] bg-white py-1.5 pl-3 pr-8 text-[13px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:border-[#0071e3]"
                style={{ width: "220px" }}
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#0071e3] transition-colors"
              >
                <SearchIcon size={13} />
              </button>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggest && query.trim() && (
              <div className="absolute right-0 top-full mt-1.5 w-[320px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] z-50">
                {suggestions.length === 0 ? (
                  <p className="px-4 py-4 text-[13px] text-[#8e8e93]">Không có gợi ý cho "{query}"</p>
                ) : (
                  <>
                    {suggestions.map((p) => {
                      const sell = Number(p.salePrice || p.basePrice || 0);
                      const pct  = Number(p.saleDiscount || 0);
                      const finalPrice = pct > 0 && pct < 100 ? Math.round(sell * (1 - pct / 100)) : sell;
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handlePickSuggestion(p._id)}
                          className="flex w-full items-center gap-3 border-b border-black/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-[#f5f5f7] last:border-b-0"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f7]">
                            {p.images?.[0]?.url && (
                              <img src={p.images[0].url} alt={p.name} className="max-h-full w-auto object-contain" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[13px] font-medium text-[#1d1d1f]">{p.name}</p>
                            <p className="text-[12px] text-[#0071e3]">{formatVnd(finalPrice)}</p>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="block w-full border-t border-black/[0.06] bg-[#fafafa] px-3 py-2.5 text-center text-[12px] font-medium text-[#0071e3] hover:bg-[#f0f7ff] transition-colors"
                    >
                      Xem tất cả kết quả cho "{query}" →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User + Cart — chỉ hiện trong Navbar khi đã scroll xuống */}
          <AnimatePresence>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="hidden md:flex items-center"
              >
                <div className="ml-1 mr-1 h-4 w-px bg-black/[0.1]" />
                <div className="pl-3">
                  <UserCartControls
                    size={14}
                    cartCount={cartCount}
                    isLoggedIn={isLoggedIn}
                    isAdmin={isAdmin}
                    userInitial={userInitial}
                    textVisible={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label="Menu"
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6 : 0 }}
              className="block h-0.5 w-5 bg-[#1d1d1f] origin-center"
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1, scaleX: mobileOpen ? 0 : 1 }}
              className="block h-0.5 w-5 bg-[#1d1d1f]"
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6 : 0 }}
              className="block h-0.5 w-5 bg-[#1d1d1f] origin-center"
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/[0.06] bg-white md:hidden"
          >
            <div className="px-6 py-3 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-[#f5f5f7] text-[#1d1d1f]" : "text-[#3a3a3c] hover:bg-[#f5f5f7]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative pt-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full rounded-xl border border-black/[0.1] bg-[#f5f5f7] py-2.5 pl-4 pr-10 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none focus:border-[#0071e3] focus:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-3.5 top-1/2 translate-y-[-40%] text-[#8e8e93]"
                >
                  <SearchIcon size={15} />
                </button>
              </form>

              {/* Mobile user + cart */}
              <div className="flex items-center justify-between border-t border-black/[0.06] pt-3 mt-1 px-1">
                <UserCartControls
                  size={15}
                  cartCount={cartCount}
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  userInitial={userInitial}
                  textVisible={true}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── Header ─────────────────────────────────────────────────────── */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, isLoggedIn, isAdmin, userInitial, userName } = useHeaderState();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 36);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AnnouncementBar
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        userInitial={userInitial}
        userName={userName}
      />
      <Navbar
        scrolled={scrolled}
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        userInitial={userInitial}
        userName={userName}
      />
    </>
  );
}
