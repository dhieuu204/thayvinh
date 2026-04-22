import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#34c759]" : "bg-[#e5e5ea]"
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function DragHandle() {
  return (
    <div className="cursor-grab active:cursor-grabbing p-1 text-[#c7c7cc]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
      </svg>
    </div>
  );
}

const SECTION_ICONS = {
  flashSale:        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L4.09 12.26A1 1 0 0 0 5 14h7l-1 8 8.91-10.26A1 1 0 0 0 19 10h-7l1-8z"/></svg>,
  categories:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  newArrival:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12l7-7 7 7"/></svg>,
  categoryShowcase: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  exploreProducts:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  services:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

export default function AdminHomepageSettingsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // drag state
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  useEffect(() => {
    axiosClient.get("/api/admin/homepage-layout")
      .then(({ data }) => setSections(data.data || []))
      .catch(() => toast.error("Không tải được cài đặt"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, visible: !s.visible } : s));
    setDirty(true);
  };

  const handleDragStart = (e, idx) => {
    dragIdx.current = idx;
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOverIdx.current = idx;
    setSections((prev) => {
      if (dragIdx.current === null || dragIdx.current === idx) return prev;
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    dragOverIdx.current = null;
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosClient.put("/api/admin/homepage-layout", { sections });
      toast.success("Đã lưu cài đặt trang chủ");
      setDirty(false);
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Bố cục trang chủ</h1>
          <p className="text-sm text-[#8e8e93]">Bật/tắt và kéo thả để sắp xếp thứ tự các section</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-40 transition-colors"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {/* Fixed: Banner */}
      <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-[#f5f5f7] border-b border-black/[0.06]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93]">Cố định (không thể thay đổi)</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-6" />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f7] text-[#6e6e73]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-[#1d1d1f]">Banner</p>
            <p className="text-[12px] text-[#8e8e93]">Quản lý ảnh tại trang Banners</p>
          </div>
          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] text-[#8e8e93]">Luôn hiển thị</span>
        </div>
      </div>

      {/* Draggable sections */}
      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-[#8e8e93]">Đang tải...</div>
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-[#f5f5f7] border-b border-black/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93]">Kéo thả để sắp xếp</span>
          </div>
          <div>
            {sections.map((section, idx) => (
              <div
                key={section.key}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 px-5 py-4 transition-colors border-b border-black/[0.04] last:border-b-0 ${
                  !section.visible ? "opacity-50" : ""
                }`}
              >
                <DragHandle />

                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.visible ? "bg-[#f0f7ff] text-[#0071e3]" : "bg-[#f5f5f7] text-[#8e8e93]"}`}>
                  {SECTION_ICONS[section.key]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#1d1d1f]">{section.label}</p>
                  <p className="text-[12px] text-[#8e8e93]">Vị trí {idx + 1}</p>
                </div>

                <Toggle checked={section.visible} onChange={() => handleToggle(section.key)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12px] text-[#8e8e93]">
        * Thay đổi sẽ áp dụng cho tất cả người dùng sau khi lưu.
      </p>
    </div>
  );
}
