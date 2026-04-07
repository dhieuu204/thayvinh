import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function toInputDate(d) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}

function VoucherModal({ voucher, onClose, onSave }) {
  const isEdit = !!voucher;
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    code: voucher?.code || "",
    type: voucher?.type || "percent",
    value: voucher?.value || "",
    minOrderValue: voucher?.minOrderValue || "",
    maxDiscount: voucher?.maxDiscount || "",
    usageLimit: voucher?.usageLimit || "",
    startsAt: toInputDate(voucher?.startsAt) || today,
    expiresAt: toInputDate(voucher?.expiresAt),
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Vui lòng nhập mã voucher";
    if (!form.value || Number(form.value) <= 0) e.value = "Giá trị phải lớn hơn 0";
    if (form.type === "percent" && Number(form.value) > 100) e.value = "Phần trăm không được vượt quá 100";
    if (!form.startsAt) e.startsAt = "Chọn ngày bắt đầu";
    if (!form.expiresAt) e.expiresAt = "Chọn ngày hết hạn";
    if (form.startsAt && form.expiresAt && form.startsAt >= form.expiresAt) e.expiresAt = "Ngày hết hạn phải sau ngày bắt đầu";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startsAt: form.startsAt,
      expiresAt: form.expiresAt,
    };
    try {
      if (isEdit) {
        await axiosClient.put(`/api/vouchers/${voucher._id}`, payload);
        toast.success("Đã cập nhật voucher");
      } else {
        await axiosClient.post(`/api/vouchers`, payload);
        toast.success("Đã tạo voucher");
      }
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (err) =>
    `w-full rounded-xl border bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:bg-white focus:ring-2 ${
      err ? "border-[#e53e3e] focus:ring-[#e53e3e]/20" : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">{isEdit ? "Chỉnh sửa voucher" : "Tạo voucher mới"}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mã voucher *</label>
              <input name="code" value={form.code} onChange={handle} placeholder="SUMMER20" className={`uppercase ${inputCls(errors.code)}`} />
              {errors.code && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.code}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Loại giảm giá</label>
              <select name="type" value={form.type} onChange={handle} className={inputCls(false)}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá trị *</label>
              <input name="value" type="number" value={form.value} onChange={handle} placeholder={form.type === "percent" ? "20" : "50000"} className={inputCls(errors.value)} />
              {errors.value && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.value}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Đơn tối thiểu (VND)</label>
              <input name="minOrderValue" type="number" value={form.minOrderValue} onChange={handle} placeholder="200000" className={inputCls(false)} />
            </div>
            {form.type === "percent" && (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giảm tối đa (VND)</label>
                <input name="maxDiscount" type="number" value={form.maxDiscount} onChange={handle} placeholder="100000" className={inputCls(false)} />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Số lần dùng tối đa</label>
              <input name="usageLimit" type="number" value={form.usageLimit} onChange={handle} placeholder="100" className={inputCls(false)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ngày bắt đầu *</label>
              <input name="startsAt" type="date" value={form.startsAt} onChange={handle} className={inputCls(errors.startsAt)} />
              {errors.startsAt && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.startsAt}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ngày hết hạn *</label>
              <input name="expiresAt" type="date" value={form.expiresAt} onChange={handle} className={inputCls(errors.expiresAt)} />
              {errors.expiresAt && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.expiresAt}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosClient.get("/api/vouchers")
      .then((r) => setVouchers(r.data.data?.vouchers || []))
      .catch(() => toast.error("Không tải được danh sách voucher"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (v) => {
    if (!confirm(`Xoá voucher "${v.code}"?`)) return;
    try {
      await axiosClient.delete(`/api/vouchers/${v._id}`);
      toast.success("Đã xoá voucher");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const now = new Date();

  return (
    <div className="space-y-5">
      {modal !== null && (
        <VoucherModal
          voucher={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý Voucher</h1>
          <p className="text-sm text-[#8e8e93]">{vouchers.length} voucher</p>
        </div>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo voucher
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : vouchers.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Chưa có voucher nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Mã", "Loại / Giá trị", "Đơn tối thiểu", "Đã dùng / Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const expired = new Date(v.expiresAt) < now;
                  const exhausted = v.usageLimit && v.usedCount >= v.usageLimit;
                  const active = !expired && !exhausted;
                  return (
                    <tr key={v._id} className="border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-[#f5f5f7] px-2.5 py-1 font-mono text-[12px] font-semibold text-[#1d1d1f]">{v.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">
                          {v.type === "percent" ? `${v.value}%` : fmt(v.value)}
                        </p>
                        {v.type === "percent" && v.maxDiscount && (
                          <p className="text-[11px] text-[#8e8e93]">Tối đa {fmt(v.maxDiscount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6e6e73]">
                        {v.minOrderValue ? fmt(v.minOrderValue) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6e6e73]">
                        {v.usedCount || 0} / {v.usageLimit ?? "∞"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#6e6e73]">{fmtDate(v.expiresAt)}</td>
                      <td className="px-4 py-3">
                        {active ? (
                          <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-[11px] font-medium text-[#15803d]">Đang dùng</span>
                        ) : expired ? (
                          <span className="rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-0.5 text-[11px] font-medium text-[#dc2626]">Hết hạn</span>
                        ) : (
                          <span className="rounded-full border border-[#e5e7eb] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#6e6e73]">Hết lượt</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setModal(v)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#e53e3e] hover:text-[#e53e3e] transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
