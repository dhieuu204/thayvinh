import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLOR = {
  Pending:  "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Approved: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Rejected: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
};
const STATUS_VN = { Pending: "Chờ duyệt", Approved: "Đã chấp nhận", Rejected: "Đã từ chối" };

function ReturnRow({ req, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      const endpoint = action === "Approved"
        ? `/api/orders/returns/${req._id}/approve`
        : `/api/orders/returns/${req._id}/reject`;
      await axiosClient.patch(endpoint);
      onAction(req._id, action);
      toast.success(action === "Approved" ? "Đã chấp nhận hoàn hàng" : "Đã từ chối hoàn hàng");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <tr className="border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors">
        <td className="px-4 py-3">
          <p className="text-[12px] font-mono font-medium text-[#1d1d1f]">#{req._id.slice(-8).toUpperCase()}</p>
          <p className="text-[11px] text-[#8e8e93]">{fmtDate(req.createdAt)}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-[13px] text-[#1d1d1f]">{req.userId?.fullName || req.userId?.username || "—"}</p>
          <p className="text-[11px] text-[#8e8e93]">{req.userId?.email}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-[12px] font-mono text-[#1d1d1f]">#{req.orderId?._id?.slice(-8).toUpperCase() || "—"}</p>
          {req.orderId?.total && <p className="text-[11px] text-[#8e8e93]">{fmt(req.orderId.total)}</p>}
        </td>
        <td className="px-4 py-3 max-w-[200px]">
          <p className="text-[13px] text-[#3a3a3c] line-clamp-2">{req.reason}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLOR[req.status] || "bg-[#f5f5f7] text-[#6e6e73] border-transparent"}`}>
            {STATUS_VN[req.status] || req.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {req.status === "Pending" && (
              <>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleAction("Approved")}
                  className="rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#3d3d3f] disabled:opacity-50 transition-colors"
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleAction("Rejected")}
                  className="rounded-full border border-[#e53e3e] px-2.5 py-1 text-[11px] font-medium text-[#e53e3e] hover:bg-[#fff1f0] disabled:opacity-50 transition-colors"
                >
                  Từ chối
                </button>
              </>
            )}
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
          <td colSpan={6} className="px-4 pb-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-[#1d1d1f]">Lý do hoàn hàng</p>
                <p className="text-[13px] text-[#3a3a3c]">{req.reason}</p>
              </div>
              {req.orderId?.products && (
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-[#1d1d1f]">Sản phẩm trong đơn</p>
                  <div className="space-y-1">
                    {req.orderId.products.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span className="text-[#6e6e73]">×{p.quantity}</span>
                        <span className="text-[#1d1d1f]">{p.product?.name || "Sản phẩm"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminReturnRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (status) params.set("status", status);
    axiosClient.get(`/api/orders/returns?${params}`)
      .then((r) => {
        setRequests(r.data.data?.requests || []);
        setTotalPages(r.data.data?.pagination?.totalPages || 1);
        setTotal(r.data.data?.pagination?.total || 0);
      })
      .catch(() => toast.error("Không tải được danh sách hoàn hàng"))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const handleAction = (id, newStatus) => {
    setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status: newStatus } : r));
  };

  const TABS = ["", "Pending", "Approved", "Rejected"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý hoàn hàng</h1>
          <p className="text-sm text-[#8e8e93]">{total} yêu cầu</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              status === s ? "bg-[#1d1d1f] text-white shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            {s === "" ? "Tất cả" : STATUS_VN[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Không có yêu cầu hoàn hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Mã yêu cầu", "Khách hàng", "Đơn hàng", "Lý do", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <ReturnRow key={r._id} req={r} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
