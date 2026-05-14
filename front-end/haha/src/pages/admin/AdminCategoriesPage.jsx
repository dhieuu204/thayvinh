import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

/* ─── Toggle Switch ─────────────────────────────────────────────── */
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
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Drag Handle Icon ───────────────────────────────────────────── */
function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[#c7c7cc]">
      <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
      <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
      <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
    </svg>
  );
}

/* ─── Category Modal ─────────────────────────────────────────────── */
function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    name:        category?.name        || "",
    description: category?.description || "",
    imageUrl:    category?.imageUrl    || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: "Vui lòng nhập tên danh mục" }); return; }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        imageUrl:    form.imageUrl.trim(),
      };
      if (isEdit) {
        await axiosClient.put(`/api/categories/${category._id}`, payload);
        toast.success("Đã cập nhật danh mục");
      } else {
        await axiosClient.post("/api/categories", payload);
        toast.success("Đã thêm danh mục");
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">
            {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên danh mục *</label>
            <input value={form.name} onChange={set("name")} placeholder="iPhone, MacBook, iPad..." className={inputCls("name")} />
            {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mô tả</label>
            <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Mô tả ngắn..."
              className="w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">URL ảnh danh mục</label>
            <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." className={inputCls("imageUrl")} />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-16 w-auto rounded-lg border border-black/[0.06] object-contain"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [toggling, setToggling]     = useState(null); // "_id" hoặc "_id_home" để phân biệt
  const [saving, setSaving]         = useState(false);

  // Drag state
  const [dragIndex, setDragIndex]   = useState(null);
  const [overIndex, setOverIndex]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosClient.get("/api/admin/categories")
      .then((r) => setCategories(r.data.data || []))
      .catch(() => toast.error("Không tải được danh mục"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Drag & Drop handlers ── */
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // transparent drag image để không bị ghost xấu
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== overIndex) setOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setCategories(withOrder);
    setDragIndex(null);
    setOverIndex(null);

    setSaving(true);
    try {
      await Promise.all(
        withOrder.map((c) =>
          axiosClient.put(`/api/categories/${c._id}`, { sortOrder: c.sortOrder })
        )
      );
      toast.success("Đã lưu thứ tự mới");
    } catch {
      toast.error("Lưu thứ tự thất bại");
      load();
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle active ── */
  const handleToggleActive = async (cat) => {
    setToggling(cat._id);
    try {
      await axiosClient.put(`/api/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(cat.isActive ? "Đã ẩn danh mục" : "Đã hiện danh mục");
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setToggling(null);
    }
  };

  /* ── Toggle showOnHome ── */
  const handleToggleHome = async (cat) => {
    setToggling(cat._id + "_home");
    try {
      await axiosClient.put(`/api/categories/${cat._id}`, { showOnHome: !cat.showOnHome });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, showOnHome: !c.showOnHome } : c))
      );
      toast.success(cat.showOnHome ? "Đã ẩn khỏi trang chủ" : "Đã hiện trên trang chủ");
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setToggling(null);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (cat) => {
    if (!confirm(`Xoá danh mục "${cat.name}"? Sản phẩm trong danh mục sẽ không bị xoá.`)) return;
    try {
      await axiosClient.delete(`/api/categories/${cat._id}`);
      toast.success("Đã xoá danh mục");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  return (
    <div className="space-y-5">
      {modal !== null && (
        <CategoryModal
          category={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý danh mục</h1>
          <p className="text-sm text-[#8e8e93]">
            {categories.length} danh mục
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
          Thêm danh mục
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Chưa có danh mục nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["", "Ảnh", "Tên danh mục", "Slug", "Mô tả", "Hiển thị", "Trang chủ", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((c, index) => (
                  <tr
                    key={c._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
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
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name}
                          className="h-10 w-10 rounded-lg border border-black/[0.06] object-contain bg-[#f5f5f7]"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f5f7]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Tên */}
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#1d1d1f]">{c.name}</p>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-[#f5f5f7] px-2 py-1 font-mono text-[11px] text-[#6e6e73]">{c.slug || "—"}</span>
                    </td>

                    {/* Mô tả */}
                    <td className="max-w-[220px] truncate px-4 py-3 text-[13px] text-[#6e6e73]">{c.description || "—"}</td>

                    {/* Toggle isActive */}
                    <td className="px-4 py-3">
                      <Toggle checked={c.isActive !== false} onChange={() => handleToggleActive(c)} disabled={toggling === c._id} />
                    </td>

                    {/* Toggle showOnHome */}
                    <td className="px-4 py-3">
                      <Toggle
                        checked={c.showOnHome !== false}
                        onChange={() => handleToggleHome(c)}
                        disabled={toggling === c._id + "_home"}
                      />
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModal(c)} title="Sửa"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDelete(c)} title="Xoá"
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
