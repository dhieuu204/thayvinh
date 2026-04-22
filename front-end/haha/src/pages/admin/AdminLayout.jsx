import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const NAV = [
  {
    to: "/admin",
    end: true,
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/admin/products",
    label: "Sản phẩm",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    to: "/admin/categories",
    label: "Danh mục",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    to: "/admin/vouchers",
    label: "Voucher",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    to: "/admin/flash-sales",
    label: "Flash Sale",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
        <path d="M9 15h6M9 11h6" />
      </svg>
    ),
  },
  {
    to: "/admin/banners",
    label: "Banners",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    to: "/admin/returns",
    label: "Hoàn hàng",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
    ),
  },
  {
    to: "/admin/homepage-settings",
    label: "Trang chủ",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

const PAGE_TITLES = {
  "/admin":              "Tổng quan",
  "/admin/orders":       "Quản lý đơn hàng",
  "/admin/users":        "Quản lý người dùng",
  "/admin/products":     "Quản lý sản phẩm",
  "/admin/reviews":      "Quản lý đánh giá",
  "/admin/categories":   "Quản lý danh mục",
  "/admin/vouchers":     "Quản lý Voucher",
  "/admin/flash-sales":  "Quản lý Flash Sale",
  "/admin/banners":      "Quản lý Banner",
  "/admin/returns":           "Quản lý hoàn hàng",
  "/admin/homepage-settings": "Bố cục trang chủ",
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Admin";

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa]" style={{ fontFamily: SF }}>
        <div className="text-5xl">🔒</div>
        <p className="text-lg font-semibold text-[#1d1d1f]">Bạn không có quyền truy cập trang này</p>
        <Link to="/" className="rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm text-white hover:bg-[#3d3d3f] transition-colors">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    try { await axiosClient.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));
    toast.info("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]" style={{ fontFamily: SF }}>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col border-r border-black/[0.06] bg-white shadow-[4px_0_20px_rgba(0,0,0,0.04)] transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1d1d1f] text-white text-sm font-bold">A</div>
          <div>
            <p className="text-[13px] font-semibold text-[#1d1d1f]">Admin Panel</p>
            <p className="text-[11px] text-[#8e8e93]">Apple Store VN</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 pt-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all mb-0.5 ${
                  isActive
                    ? "bg-[#1d1d1f] font-medium text-white"
                    : "text-[#3a3a3c] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? "text-white" : "text-[#6e6e73]"}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-black/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white">
              {(user.fullName || user.email || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#1d1d1f]">{user.fullName || user.username}</p>
              <p className="truncate text-[11px] text-[#8e8e93]">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#e53e3e] hover:bg-[#fff1f0] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white px-5 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] lg:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-[14px] font-semibold text-[#1d1d1f]">{pageTitle}</span>
          </div>
          <Link to="/" className="flex items-center gap-1 text-xs text-[#6e6e73] hover:text-[#0071e3] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Về cửa hàng
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
