import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

const POSITIONS = [
  { value: "homepage",    label: "Trang chủ" },
  { value: "iphone",     label: "iPhone" },
  { value: "ipad",       label: "iPad" },
  { value: "mac",        label: "Mac" },
  { value: "watch",      label: "Watch" },
  { value: "audio",      label: "Audio" },
  { value: "accessories",label: "Accessories" },
];

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
        checked ? "bg-[#34c759]" : "bg-[#d1d1d6]"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

/* ─── Drag Handle ────────────────────────────────────────────────── */
function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[#c7c7cc]">
      <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
      <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
      <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
    </svg>
  );
}

/* ─── Banner Modal ───────────────────────────────────────────────── */
function BannerModal({ banner, onClose, onSave }) {
  const isEdit = !!banner;
  const [form, setForm] = useState({
    title:    banner?.title    || "",
    imageUrl: banner?.imageUrl || "",
    linkUrl:  banner?.linkUrl  || "",
    position: banner?.position || "homepage",
    isActive: banner?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())    errs.title    = "Vui lòng nhập tiêu đề";
    if (!form.imageUrl.trim()) errs.imageUrl = "Vui lòng nhập URL ảnh";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        title:    form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        linkUrl:  form.linkUrl.trim(),
        position: form.position,
        isActive: form.isActive,
      };
      if (isEdit) {
        await axiosClient.put(`/api/admin/banners/${banner._id}`, payload);
        toast.success("Đã cập nhật banner");
      } else {
        await axiosClient.post("/api/admin/banners", payload);
        toast.success("Đã thêm banner");
      }
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (key) =>
    `w-full rounded-xl border bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:bg-white focus:ring-2 ${
      errors[key]
        ? "border-[#e53e3e] focus:ring-[#e53e3e]/20"
        : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">
            {isEdit ? "Chỉnh sửa banner" : "Thêm banner mới"}
          </h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Tiêu đề */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tiêu đề *</label>
            <input value={form.title} onChange={set("title")} placeholder="iPhone 17 Pro Max - Titanium" className={inputCls("title")} />
            {errors.title && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.title}</p>}
          </div>

          {/* URL ảnh */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">URL ảnh *</label>
            <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." className={inputCls("imageUrl")} />
            {errors.imageUrl && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.imageUrl}</p>}
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview"
                className="mt-2 h-20 w-full rounded-xl border border-black/[0.06] object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
          </div>

          {/* Link URL */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Link khi click (tuỳ chọn)</label>
            <input value={form.linkUrl} onChange={set("linkUrl")} placeholder="/categories/iphone" className={inputCls("linkUrl")} />
          </div>

          {/* Vị trí */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Hiển thị tại</label>
            <select value={form.position} onChange={set("position")}
              className="w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20">
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            <span className="text-[13px] text-[#1d1d1f]">Hiển thị banner</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function AdminBannersPage() {
  const [banners, setBanners]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [filterPos, setFilterPos] = useState("all");
  const [toggling, setToggling]   = useState(null);
  const [saving, setSaving]       = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosClient.get("/api/admin/banners")
      .then((r) => setBanners(r.data.data || []))
      .catch(() => toast.error("Không tải được banners"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Drag & Drop ── */
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== overIndex) setOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); setOverIndex(null); return; }

    const reordered = [...displayed];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((b, i) => ({ ...b, sortOrder: i + 1 }));

    setBanners((prev) => {
      const ids = new Set(withOrder.map((b) => b._id));
      return [...withOrder, ...prev.filter((b) => !ids.has(b._id))];
    });
    setDragIndex(null);
    setOverIndex(null);

    setSaving(true);
    try {
      await Promise.all(withOrder.map((b) => axiosClient.put(`/api/admin/banners/${b._id}`, { sortOrder: b.sortOrder })));
      toast.success("Đã lưu thứ tự mới");
    } catch {
      toast.error("Lưu thứ tự thất bại");
      load();
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle active ── */
  const handleToggle = async (banner) => {
    setToggling(banner._id);
    try {
      await axiosClient.put(`/api/admin/banners/${banner._id}`, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => b._id === banner._id ? { ...b, isActive: !b.isActive } : b));
      toast.success(banner.isActive ? "Đã ẩn banner" : "Đã hiện banner");
    } catch { toast.error("Cập nhật thất bại"); }
    finally { setToggling(null); }
  };

  /* ── Delete ── */
  const handleDelete = async (banner) => {
    if (!confirm(`Xoá banner "${banner.title}"?`)) return;
    try {
      await axiosClient.delete(`/api/admin/banners/${banner._id}`);
      toast.success("Đã xoá banner");
      load();
    } catch { toast.error("Xoá thất bại"); }
  };

  const displayed = filterPos === "all" ? banners : banners.filter((b) => b.position === filterPos);

  return (
    <div className="space-y-5">
      {modal !== null && (
        <BannerModal
          banner={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý Banner</h1>
          <p className="text-sm text-[#8e8e93]">
            {banners.length} banner
            {saving && <span className="ml-2 text-[#0071e3]">· Đang lưu thứ tự...</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm banner
        </button>
      </div>

      {/* Position filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: "Tất cả" }, ...POSITIONS].map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setFilterPos(p.value)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              filterPos === p.value
                ? "bg-[#1d1d1f] text-white"
                : "bg-white border border-black/[0.08] text-[#6e6e73] hover:bg-[#f5f5f7]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : displayed.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Chưa có banner nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["", "Ảnh", "Tiêu đề", "Vị trí", "Link", "Hiển thị", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((b, index) => (
                  <tr
                    key={b._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                    className={`border-b border-black/[0.04] transition-all duration-150 ${
                      dragIndex === index
                        ? "opacity-40 bg-[#f5f5f7]"
                        : overIndex === index && dragIndex !== null
                        ? "bg-[#f0f7ff] border-t-2 border-t-[#0071e3]"
                        : "hover:bg-[#fafafa]"
                    }`}
                  >
                    {/* Drag handle */}
                    <td className="w-10 cursor-grab pl-4 pr-1 py-3 active:cursor-grabbing">
                      <DragHandle />
                    </td>

                    {/* Ảnh */}
                    <td className="px-4 py-3">
                      <img
                        src={b.imageUrl} alt={b.title}
                        className="h-12 w-20 rounded-lg border border-black/[0.06] object-cover bg-[#f5f5f7]"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </td>

                    {/* Tiêu đề */}
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1d1d1f]">{b.title}</p>
                    </td>

                    {/* Vị trí */}
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-[#f5f5f7] px-2 py-1 text-[11px] font-medium text-[#6e6e73]">
                        {POSITIONS.find((p) => p.value === b.position)?.label || b.position}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="max-w-[160px] truncate px-4 py-3 font-mono text-[11px] text-[#8e8e93]">
                      {b.linkUrl || "—"}
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-3">
                      <Toggle checked={b.isActive} onChange={() => handleToggle(b)} disabled={toggling === b._id} />
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModal(b)} title="Sửa"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDelete(b)} title="Xoá"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#e53e3e] hover:text-[#e53e3e] transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
