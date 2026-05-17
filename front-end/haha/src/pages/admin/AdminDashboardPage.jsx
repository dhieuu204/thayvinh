import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../lib/api";
import { ImageWithFallback } from "../../components/ImageWithFallback";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

const MONTH_LABELS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

const PIE_COLORS = [
  "#1d1d1f","#0071e3","#34c759","#ff9500","#ff3b30",
  "#af52de","#5ac8fa","#ffcc00","#ff6b6b","#4cd964",
];

/* ── Pie Chart theo danh mục ── */
function CategoryPieChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-[#8e8e93]">Chưa có dữ liệu</p>;
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const SIZE = 200;
  const cx = SIZE / 2, cy = SIZE / 2, R = 80, innerR = 44;

  // Tính góc từng mảnh
  let startAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct = totalRevenue > 0 ? d.revenue / totalRevenue : 0;
    const angle = pct * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const slice = { ...d, startAngle, endAngle, pct, color: PIE_COLORS[i % PIE_COLORS.length] };
    startAngle = endAngle;
    return slice;
  });

  const arc = (sa, ea, r) => {
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const donutPath = (sa, ea) => {
    const x1o = cx + R * Math.cos(sa), y1o = cy + R * Math.sin(sa);
    const x2o = cx + R * Math.cos(ea), y2o = cy + R * Math.sin(ea);
    const x2i = cx + innerR * Math.cos(ea), y2i = cy + innerR * Math.sin(ea);
    const x1i = cx + innerR * Math.cos(sa), y1i = cy + innerR * Math.sin(sa);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${x1o} ${y1o} A ${R} ${R} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${large} 0 ${x1i} ${y1i} Z`;
  };

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* SVG donut */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={donutPath(s.startAngle, s.endAngle)}
              fill={s.color}
              opacity={hovered === null || hovered === i ? 1 : 0.35}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              transform={hovered === i ? `translate(${3 * Math.cos((s.startAngle + s.endAngle) / 2)}, ${3 * Math.sin((s.startAngle + s.endAngle) / 2)})` : ""}
            />
          ))}
          {/* Nhãn trung tâm */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#8e8e93">
            {active ? active.categoryName : "Tổng"}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1d1d1f">
            {active ? `${Math.round(active.pct * 100)}%` : `${data.length} DM`}
          </text>
        </svg>
      </div>

      {/* Tooltip + Legend */}
      <div className="flex-1 w-full">
        {/* Tooltip khi hover */}
        {active && (
          <div className="mb-3 rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-3 text-[12px]">
            <p className="font-semibold text-[#1d1d1f] mb-1.5">{active.categoryName}</p>
            <div className="space-y-0.5 text-[#3a3a3c]">
              <p>Doanh thu: <span className="font-medium text-[#1d1d1f]">{fmt(active.revenue)}</span></p>
              <p>Lợi nhuận: <span className="font-medium text-[#34c759]">{fmt(active.profit)}</span></p>
              <p>Sản phẩm bán: <span className="font-medium text-[#1d1d1f]">{fmtNum(active.quantity)}</span></p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {slices.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${hovered === i ? "bg-[#f5f5f7]" : "hover:bg-[#fafafa]"}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 truncate text-[12px] text-[#1d1d1f]">{s.categoryName}</span>
              <span className="shrink-0 text-[11px] text-[#6e6e73]">{Math.round(s.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LIMIT = 5;

function LowStockPanel({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, LIMIT);
  const hidden = items.length - LIMIT;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fee2e2] text-[10px] font-bold text-[#e53e3e]">!</span>
        Sắp hết hàng
        {items.length > 0 && (
          <span className="ml-auto text-[11px] font-normal text-[#8e8e93]">{items.length} sản phẩm</span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#8e8e93]">Không có sản phẩm nào sắp hết</p>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7]">
                  <ImageWithFallback src={p.images?.[0]?.url} alt={p.name} className="max-h-full w-auto object-contain" />
                </div>
                <p className="flex-1 min-w-0 text-[13px] text-[#1d1d1f] truncate">{p.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stock <= 3 ? "bg-[#fee2e2] text-[#e53e3e]" : "bg-[#fff7ed] text-[#c2410c]"}`}>
                  {p.stock} còn
                </span>
              </div>
            ))}
          </div>
          {items.length > LIMIT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 w-full rounded-xl border border-black/[0.08] py-2 text-[12px] font-medium text-[#0071e3] hover:bg-[#f0f7ff] transition-colors"
            >
              {expanded ? "Thu gọn" : `Xem thêm ${hidden} sản phẩm`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const ORDER_STATUS_COLOR = {
  Pending:   "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Confirmed: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  Shipped:   "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Delivered: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Cancelled: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
};
const ORDER_STATUS_VN = { Pending:"Chờ xác nhận", Confirmed:"Đã xác nhận", Shipped:"Đang giao", Delivered:"Đã giao", Cancelled:"Đã huỷ" };

/* ── Stat Card ── */
function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <p className="text-[12px] text-[#8e8e93]">{label}</p>
      <p className="text-[22px] font-bold text-[#1d1d1f] leading-none mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-[#6e6e73] mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Revenue Bar Chart ── */
function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-[#8e8e93]">Chưa có dữ liệu lợi nhuận</p>;
  }
  const max = Math.max(...data.map((d) => d.profit || 0), 1);

  return (
    <div className="flex items-end gap-2 h-36 pt-2">
      {MONTH_LABELS.map((label, i) => {
        const month = i + 1;
        const found = data.find((d) => d._id?.month === month);
        const profit = found?.profit || 0;
        const height = Math.max((profit / max) * 100, profit > 0 ? 4 : 0);
        return (
          <div key={month} className="flex flex-1 flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: "112px" }}>
              {profit > 0 && (
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[#1d1d1f] text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-10">
                  {fmt(profit)}
                </div>
              )}
              <div
                className="w-full rounded-t-lg bg-[#1d1d1f] transition-all duration-500"
                style={{ height: `${height}%`, minHeight: profit > 0 ? "4px" : "0" }}
              />
            </div>
            <span className="text-[10px] text-[#8e8e93]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      axiosClient.get("/api/admin/stats/overview"),
      axiosClient.get(`/api/admin/stats/revenue?period=monthly&year=${year}`),
      axiosClient.get("/api/admin/stats/top-products?limit=5"),
      axiosClient.get("/api/admin/stats/low-stock?threshold=10&limit=200"),
      axiosClient.get("/api/admin/orders?limit=5"),
    ])
      .then(([ov, rev, top, low, ord]) => {
        setOverview(ov.data.data);
        setRevenue(rev.data.data || []);
        setTopProducts(top.data.data || []);
        setLowStock(low.data.data || []);
        setRecentOrders(ord.data.data?.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Dashboard</h1>
        <p className="text-sm text-[#8e8e93]">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lợi nhuận" value={fmt(overview?.totalProfit || 0)} sub={`Doanh thu: ${fmt(overview?.totalRevenue || 0)}`} />
        <StatCard label="Đơn hàng" value={fmtNum(overview?.orderCount || 0)} sub="Tổng tất cả" />
        <StatCard label="Sản phẩm" value={fmtNum(overview?.productCount || 0)} sub="Đang kinh doanh" />
        <StatCard label="Người dùng" value={fmtNum(overview?.userCount || 0)} sub="Đã đăng ký" />
      </div>

      {/* ── Revenue + Low stock ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Lợi nhuận {new Date().getFullYear()}</h2>
            <span className="text-xs text-[#8e8e93]">Hover để xem chi tiết</span>
          </div>
          <RevenueChart data={revenue} />
        </div>

        {/* Low stock */}
        <LowStockPanel items={lowStock} />
      </div>

      {/* ── Top products + Recent orders ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h2 className="mb-4 text-[15px] font-semibold text-[#1d1d1f]">Top sản phẩm bán chạy</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#8e8e93]">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-[#8e8e93] w-5 text-center">#{i + 1}</span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7]">
                    <ImageWithFallback src={p.images?.[0]?.url} alt={p.name} className="max-h-full w-auto object-contain" />
                  </div>
                  <p className="flex-1 min-w-0 text-[13px] text-[#1d1d1f] truncate">{p.name}</p>
                  <span className="shrink-0 text-[13px] font-semibold text-[#1d1d1f]">
                    {fmtNum(p.sold || 0)} đã bán
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-xs text-[#0071e3] hover:underline">Xem tất cả</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#8e8e93]">Chưa có đơn hàng</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o._id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1d1d1f] truncate">#{o._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[11px] text-[#8e8e93]">{o.user?.email || o.user?.fullName || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ORDER_STATUS_COLOR[o.status] || "bg-[#f5f5f7] text-[#6e6e73]"}`}>
                    {ORDER_STATUS_VN[o.status] || o.status}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-[#1d1d1f]">
                    {fmt(o.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
