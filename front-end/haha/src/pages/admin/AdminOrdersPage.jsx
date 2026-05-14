import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";
function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUSES = ["", "PendingPayment", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const STATUS_VN = {
  "": "Tất cả",
  PendingPayment: "Đã TT · Chờ xác nhận",
  Pending:   "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Shipped:   "Đang giao",
  Delivered: "Đã giao",
  Cancelled: "Đã huỷ",
};
const STATUS_COLOR = {
  PendingPayment: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  Pending:   "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Confirmed: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  Shipped:   "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Delivered: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Cancelled: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
};
const REFUND_COLOR = {
  pending_refund: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  refunded:       "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
};
const REFUND_VN = { pending_refund: "Chờ hoàn tiền", refunded: "Đã hoàn tiền" };
const NEXT_STATUS = {
  PendingPayment: ["Cancelled"],
  Pending:   ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped:   ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLOR[status] || "bg-[#f5f5f7] text-[#6e6e73] border-transparent"}`}>
      {STATUS_VN[status] || status}
    </span>
  );
}

function OrderRow({ order, onStatusChange, onOrderUpdate }) {
  const [expanded, setExpanded]   = useState(false);
  const [updating, setUpdating]   = useState(false);
  const nexts = NEXT_STATUS[order.status] || [];

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await axiosClient.patch(`/api/admin/orders/${order._id}/status`, { status: newStatus });
      onStatusChange(order._id, newStatus);
      toast.success(`Cập nhật → ${STATUS_VN[newStatus]}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setUpdating(true);
    try {
      await axiosClient.patch(`/api/orders/${order._id}/confirm-payment`);
      onOrderUpdate(order._id, { status: "Confirmed", paidAt: new Date().toISOString() });
      toast.success("Đã xác nhận thanh toán");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xác nhận thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkRefunded = async () => {
    setUpdating(true);
    try {
      await axiosClient.patch(`/api/orders/${order._id}/mark-refunded`);
      onOrderUpdate(order._id, { refundStatus: "refunded" });
      toast.success("Đã đánh dấu hoàn tiền");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const showRefundInfo = order.refundStatus === "pending_refund" && order.refundBankInfo?.accountNumber;

  return (
    <>
      <tr className="border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors">
        <td className="px-4 py-3">
          <p className="text-[12px] font-mono font-medium text-[#1d1d1f]">#{order._id.slice(-8).toUpperCase()}</p>
          <p className="text-[11px] text-[#8e8e93]">{fmtDate(order.createdAt)}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-[13px] text-[#1d1d1f]">{order.user?.fullName || order.user?.username || "—"}</p>
          <p className="text-[11px] text-[#8e8e93]">{order.user?.email}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1d1d1f]">{fmt(order.total)}</p>
          <p className="text-[11px] text-[#8e8e93]">{order.products?.length || 0} sản phẩm</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1 items-start">
            <StatusBadge status={order.status} />
            {order.refundStatus && order.refundStatus !== "none" && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${REFUND_COLOR[order.refundStatus] || ""}`}>
                {REFUND_VN[order.refundStatus]}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Xác nhận thanh toán CK */}
            {order.status === "PendingPayment" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleConfirmPayment}
                className="rounded-full bg-[#16a34a] px-2.5 py-1 text-[11px] font-medium text-white transition-all hover:bg-[#15803d] disabled:opacity-50"
              >
                Xác nhận thanh toán
              </button>
            )}
            {/* Đã hoàn tiền */}
            {order.refundStatus === "pending_refund" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleMarkRefunded}
                className="rounded-full bg-[#2563eb] px-2.5 py-1 text-[11px] font-medium text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                Đã hoàn tiền
              </button>
            )}
            {nexts.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating}
                onClick={() => handleUpdate(s)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50 ${
                  s === "Cancelled"
                    ? "border border-[#e53e3e] text-[#e53e3e] hover:bg-[#fff1f0]"
                    : "bg-[#1d1d1f] text-white hover:bg-[#3d3d3f]"
                }`}
              >
                {STATUS_VN[s]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full border border-black/[0.1] px-2.5 py-1 text-[11px] text-[#6e6e73] hover:border-black/[0.3] transition-colors"
            >
              {expanded ? "Ẩn" : "Chi tiết"}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#fafafa] border-b border-black/[0.04]">
          <td colSpan={5} className="px-4 pb-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-[#1d1d1f]">Sản phẩm</p>
                <div className="space-y-1.5">
                  {(order.products || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="text-[#6e6e73]">×{p.quantity}</span>
                      <span className="text-[#1d1d1f]">{p.product?.name || "Sản phẩm"}</span>
                      <span className="ml-auto font-medium text-[#1d1d1f]">
                        {fmt((p.priceAtOrder ?? p.product?.salePrice ?? p.product?.basePrice ?? 0) * p.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1 border-t border-black/[0.06] pt-2 text-[12px]">
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">Giảm giá{order.voucherCode ? ` (${order.voucherCode})` : ""}</span>
                      <span className="text-[#16a34a]">-{fmt(order.discountAmount)}</span>
                    </div>
                  )}
                  {order.shippingFee != null && (
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">Phí vận chuyển</span>
                      <span>{order.shippingFee === 0 ? "Miễn phí" : fmt(order.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Tổng cộng</span><span>{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[12px] font-semibold text-[#1d1d1f]">Địa chỉ giao hàng</p>
                  <p className="text-[12px] text-[#3a3a3c]">{order.billingInfo?.fullName} · {order.billingInfo?.phone}</p>
                  <p className="text-[12px] text-[#6e6e73]">
                    {[order.billingInfo?.street, order.billingInfo?.district, order.billingInfo?.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6e6e73]">
                    Thanh toán: <span className="font-medium text-[#1d1d1f]">{order.paymentMethod?.toUpperCase() || "—"}</span>
                    {order.paidAt && <span className="ml-1 text-[#16a34a]">(Đã nhận {fmtDate(order.paidAt)})</span>}
                  </p>
                </div>

                {/* Thông tin hoàn tiền */}
                {showRefundInfo && (
                  <div className="rounded-xl border border-[#fde68a] bg-[#fffbf0] p-3 text-[12px]">
                    <p className="mb-1.5 font-semibold text-[#92400e]">Tài khoản nhận hoàn tiền</p>
                    {[
                      ["Ngân hàng", order.refundBankInfo.bankName],
                      ["Số TK", order.refundBankInfo.accountNumber],
                      ["Chủ TK", order.refundBankInfo.accountHolder],
                    ].map(([label, val]) => val && (
                      <div key={label} className="flex justify-between">
                        <span className="text-[#78350f]">{label}</span>
                        <span className="font-medium text-[#1d1d1f]">{val}</span>
                      </div>
                    ))}
                    <p className="mt-1.5 font-semibold text-[#c2410c]">
                      Cần hoàn: {fmt(order.total)}
                    </p>
                  </div>
                )}
                {order.refundStatus === "refunded" && order.refundBankInfo?.refundedAt && (
                  <p className="text-[12px] text-[#16a34a]">
                    Đã hoàn tiền lúc {fmtDate(order.refundBankInfo.refundedAt)}
                    {order.refundBankInfo.refundNote && ` — ${order.refundBankInfo.refundNote}`}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    axiosClient
      .get(`/api/admin/orders?${params}`)
      .then((res) => {
        setOrders(res.data.data?.orders || []);
        setTotalPages(res.data.data?.pagination?.totalPages || 1);
        setTotal(res.data.data?.pagination?.total || 0);
      })
      .catch(() => toast.error("Không tải được danh sách đơn hàng"))
      .finally(() => setLoading(false));
  }, [status, page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, search]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleOrderUpdate = (orderId, patch) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, ...patch } : o));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý đơn hàng</h1>
          <p className="text-sm text-[#8e8e93]">{total} đơn hàng</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              clearTimeout(searchTimer.current);
              const v = e.target.value;
              searchTimer.current = setTimeout(() => setSearch(v), 400);
            }}
            placeholder="Tìm tên khách, email..."
            className="rounded-xl border border-black/[0.1] bg-white py-2 pl-8 pr-4 text-[13px] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 w-56"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              status === s ? "bg-[#1d1d1f] text-white shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            {STATUS_VN[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Không có đơn hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow key={o._id} order={o} onStatusChange={handleStatusChange} onOrderUpdate={handleOrderUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-9 min-w-[36px] rounded-full px-3 text-sm transition-all ${
                p === page ? "bg-[#1d1d1f] text-white" : "border border-black/[0.1] text-[#6e6e73] hover:border-black/[0.3]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
