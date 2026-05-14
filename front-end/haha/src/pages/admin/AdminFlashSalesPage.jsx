import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}
function toInputDate(d) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}
function flashPrice(product, discountType, discountValue) {
  const base = product?.salePrice || product?.basePrice || 0;
  return discountType === "percent"
    ? base * (1 - discountValue / 100)
    : base - discountValue;
}

function StatusBadge({ fs }) {
  const now = new Date();
  const start = new Date(fs.startsAt);
  const end = new Date(fs.endsAt);

  if (now > end)
    return <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">Hết hạn</span>;
  if (!fs.isActive)
    return <span className="rounded-full bg-[#fff3cd] px-2.5 py-1 text-[11px] font-medium text-[#92400e]">Tắt</span>;
  if (now < start)
    return <span className="rounded-full bg-[#e8f4fd] px-2.5 py-1 text-[11px] font-medium text-[#0071e3]">Sắp diễn ra</span>;
  return <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-medium text-[#16a34a]">Đang chạy</span>;
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        checked ? "bg-[#34c759]" : "bg-[#e5e5ea]"
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

/* ─── Modal tạo / sửa flash sale ─────────────────────────────────────────── */
function FlashSaleModal({ flashSale, products, onClose, onSave }) {
  const isEdit = !!flashSale;
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: flashSale?.name || "",
    description: flashSale?.description || "",
    startsAt: toInputDate(flashSale?.startsAt) || today,
    endsAt: toInputDate(flashSale?.endsAt) || "",
  });
  const [fsProducts, setFsProducts] = useState(
    (flashSale?.products || []).map((p) => ({
      ...p,
      productId: typeof p.productId === "string" ? { _id: p.productId } : p.productId,
    }))
  );
  const [newProd, setNewProd] = useState({ productId: "", discountType: "percent", discountValue: "", quantity: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleAddProduct = () => {
    if (!newProd.productId || !newProd.discountValue || !newProd.quantity) {
      toast.error("Chọn sản phẩm, nhập % giảm / số tiền và số lượng");
      return;
    }
    const product = products.find((p) => p._id === newProd.productId);
    const fp = flashPrice(product, newProd.discountType, Number(newProd.discountValue));
    if (fp < (product?.basePrice || 0)) {
      toast.error(`Giá flash sale (${fmt(fp)}) thấp hơn giá nhập (${fmt(product?.basePrice)})`);
      return;
    }
    if (fsProducts.some((p) => (p.productId?._id || p.productId) === newProd.productId)) {
      toast.error("Sản phẩm đã có trong flash sale");
      return;
    }
    setFsProducts([...fsProducts, {
      productId: { _id: newProd.productId, name: product?.name, basePrice: product?.basePrice, salePrice: product?.salePrice },
      discountType: newProd.discountType,
      discountValue: Number(newProd.discountValue),
      quantity: Number(newProd.quantity),
    }]);
    setNewProd({ productId: "", discountType: "percent", discountValue: "", quantity: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nhập tên flash sale";
    if (!form.startsAt) e.startsAt = "Chọn ngày bắt đầu";
    if (!form.endsAt) e.endsAt = "Chọn ngày kết thúc";
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) e.endsAt = "Ngày kết thúc phải sau ngày bắt đầu";
    if (!isEdit && fsProducts.length === 0) e.products = "Thêm ít nhất 1 sản phẩm";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        products: fsProducts.map((p) => ({
          productId: p.productId?._id || p.productId,
          discountType: p.discountType,
          discountValue: p.discountValue,
          quantity: p.quantity,
        })),
      };
      if (isEdit) {
        await axiosClient.put(`/api/admin/flash-sales/${flashSale._id}`, payload);
        toast.success("Đã cập nhật flash sale");
      } else {
        await axiosClient.post("/api/admin/flash-sales", payload);
        toast.success("Đã tạo flash sale");
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

  const previewProduct = products.find((p) => p._id === newProd.productId);
  const previewPrice = previewProduct && newProd.discountValue
    ? flashPrice(previewProduct, newProd.discountType, Number(newProd.discountValue))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">{isEdit ? "Chỉnh sửa flash sale" : "Tạo flash sale mới"}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-4">
          {/* Thông tin cơ bản */}
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên flash sale *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Khuyến mại hè 2026" className={inputCls(errors.name)} />
              {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mô tả</label>
              <textarea name="description" value={form.description} onChange={handle} placeholder="Mô tả ngắn..." rows={2} className={inputCls(false)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ngày bắt đầu *</label>
                <input name="startsAt" type="date" value={form.startsAt} onChange={handle} className={inputCls(errors.startsAt)} />
                {errors.startsAt && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.startsAt}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ngày kết thúc *</label>
                <input name="endsAt" type="date" value={form.endsAt} onChange={handle} className={inputCls(errors.endsAt)} />
                {errors.endsAt && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.endsAt}</p>}
              </div>
            </div>
          </div>

          {/* Thêm sản phẩm */}
          <div className="border-t border-black/[0.06] pt-4">
            <label className="mb-2 block text-[12px] font-medium text-[#1d1d1f]">Sản phẩm ({fsProducts.length})</label>
            {errors.products && <p className="mb-2 text-[11px] text-[#e53e3e]">{errors.products}</p>}

            <div className="space-y-2">
              <select value={newProd.productId} onChange={(e) => setNewProd({ ...newProd, productId: e.target.value })} className={inputCls(false)}>
                <option value="">-- Chọn sản phẩm --</option>
                {products
                  .filter((p) => !fsProducts.some((fp) => (fp.productId?._id || fp.productId) === p._id))
                  .map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — {fmt(p.salePrice || p.basePrice)}</option>
                  ))}
              </select>

              <div className="grid grid-cols-4 gap-2">
                <select value={newProd.discountType} onChange={(e) => setNewProd({ ...newProd, discountType: e.target.value })} className={inputCls(false)}>
                  <option value="percent">% giảm</option>
                  <option value="fixed">VND giảm</option>
                </select>
                <input type="number" min="0" max={newProd.discountType === "percent" ? 100 : undefined} value={newProd.discountValue} onChange={(e) => setNewProd({ ...newProd, discountValue: e.target.value })}
                  placeholder={newProd.discountType === "percent" ? "20" : "500000"} className={inputCls(false)} />
                <input type="number" min="1" value={newProd.quantity} onChange={(e) => setNewProd({ ...newProd, quantity: e.target.value })}
                  placeholder="Số lượng" className={inputCls(false)} />
                <button type="button" onClick={handleAddProduct} className="rounded-xl bg-[#0071e3] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0066cc] transition-colors">
                  + Thêm
                </button>
              </div>

              {/* Preview giá */}
              {previewPrice !== null && previewProduct && (
                <div className="rounded-lg bg-[#f0f7ff] px-3 py-2 text-[12px]">
                  <span className="text-[#8e8e93]">Giá hiện tại: {fmt(previewProduct.salePrice || previewProduct.basePrice)}</span>
                  <span className="mx-2 text-[#d2d2d7]">→</span>
                  <span className={`font-semibold ${previewPrice >= 0 ? "text-[#e53e3e]" : "text-[#e53e3e]"}`}>Giá flash sale: {fmt(Math.max(0, previewPrice))}</span>
                </div>
              )}
            </div>

            {/* List sản phẩm đã thêm */}
            {fsProducts.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto">
                {fsProducts.map((p) => {
                  const pid = p.productId?._id || p.productId;
                  const pname = p.productId?.name || products.find((x) => x._id === pid)?.name || pid;
                  const prod = products.find((x) => x._id === pid) || p.productId;
                  const fp = flashPrice(prod, p.discountType, p.discountValue);
                  return (
                    <div key={pid} className="flex items-center justify-between gap-2 rounded-lg bg-[#f5f5f7] px-3 py-2 text-[12px]">
                      <span className="flex-1 text-[#1d1d1f] truncate">{pname}</span>
                      <span className="text-[#8e8e93] shrink-0">
                        {p.discountType === "percent" ? `-${p.discountValue}%` : `-${fmt(p.discountValue)}`}
                      </span>
                      <span className="font-medium text-[#e53e3e] shrink-0">{fmt(Math.max(0, fp))}</span>
                      <span className="text-[#8e8e93] shrink-0">x{p.quantity}</span>
                      <button type="button" onClick={() => setFsProducts(fsProducts.filter((x) => (x.productId?._id || x.productId) !== pid))}
                        className="text-[#e53e3e] hover:opacity-70 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-black/[0.06] pt-4">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo flash sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Trang chính ────────────────────────────────────────────────────────── */
export default function AdminFlashSalesPage() {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get("/api/admin/flash-sales"),
      axiosClient.get("/api/products?limit=1000"),
    ])
      .then(([fsRes, prodRes]) => {
        setFlashSales(fsRes.data.data || []);
        setProducts(prodRes.data.data?.products || []);
      })
      .catch(() => toast.error("Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (fs) => {
    setToggling(fs._id);
    try {
      await axiosClient.put(`/api/admin/flash-sales/${fs._id}`, { isActive: !fs.isActive });
      setFlashSales((prev) => prev.map((x) => x._id === fs._id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error("Không thể thay đổi trạng thái");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (fs) => {
    if (!confirm(`Xoá flash sale "${fs.name}"?`)) return;
    try {
      await axiosClient.delete(`/api/admin/flash-sales/${fs._id}`);
      toast.success("Đã xoá flash sale");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const handleRemoveProduct = async (fsId, productId) => {
    if (!confirm("Xoá sản phẩm khỏi flash sale này?")) return;
    try {
      await axiosClient.delete(`/api/admin/flash-sales/${fsId}/products/${productId}`);
      toast.success("Đã xoá sản phẩm");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  return (
    <div className="space-y-5">
      {modal !== null && (
        <FlashSaleModal
          flashSale={modal === "add" ? null : modal}
          products={products}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý Flash Sale</h1>
          <p className="text-sm text-[#8e8e93]">{flashSales.length} flash sale</p>
        </div>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo flash sale
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-[#8e8e93]">Đang tải...</div>
      ) : flashSales.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-[#8e8e93]">Chưa có flash sale nào</div>
      ) : (
        <div className="space-y-3">
          {flashSales.map((fs) => (
            <div key={fs._id} className="rounded-2xl border border-black/[0.08] bg-white p-5">
              {/* Header card */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#1d1d1f]">{fs.name}</h3>
                    <StatusBadge fs={fs} />
                  </div>
                  {fs.description && <p className="mt-1 text-[12px] text-[#8e8e93]">{fs.description}</p>}
                  <p className="mt-1.5 text-[12px] text-[#6e6e73]">
                    {new Date(fs.startsAt).toLocaleDateString("vi-VN")} — {new Date(fs.endsAt).toLocaleDateString("vi-VN")}
                    <span className="ml-3 text-[#8e8e93]">{fs.products.length} sản phẩm</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Toggle
                    checked={fs.isActive}
                    onChange={() => handleToggle(fs)}
                    disabled={toggling === fs._id}
                  />
                  <button type="button" onClick={() => setModal(fs)} title="Chỉnh sửa"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(fs)} title="Xoá"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#e53e3e] hover:bg-[#fff1f0] transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Product table */}
              {fs.products.length > 0 && (
                <div className="rounded-xl border border-black/[0.06] overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#f5f5f7] text-[#6e6e73]">
                        <th className="px-4 py-2.5 text-left font-medium">Sản phẩm</th>
                        <th className="px-4 py-2.5 text-right font-medium">Giá gốc</th>
                        <th className="px-4 py-2.5 text-right font-medium">Giảm</th>
                        <th className="px-4 py-2.5 text-right font-medium">Giá flash sale</th>
                        <th className="px-4 py-2.5 text-right font-medium">SL</th>
                        <th className="px-4 py-2.5 text-center font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fs.products.map((p, i) => {
                        const pid = p.productId?._id || p.productId;
                        const prod = p.productId;
                        const origPrice = prod?.salePrice || prod?.basePrice || 0;
                        const fp = flashPrice(prod, p.discountType, p.discountValue);
                        return (
                          <tr key={pid} className={`border-t border-black/[0.04] ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                            <td className="px-4 py-2.5 text-[#1d1d1f] font-medium">{prod?.name || "Sản phẩm đã xoá"}</td>
                            <td className="px-4 py-2.5 text-right text-[#8e8e93] line-through">{fmt(origPrice)}</td>
                            <td className="px-4 py-2.5 text-right text-[#e53e3e]">
                              {p.discountType === "percent" ? `-${p.discountValue}%` : `-${fmt(p.discountValue)}`}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-[#e53e3e]">{fmt(Math.max(0, fp))}</td>
                            <td className="px-4 py-2.5 text-right text-[#3a3a3c]">{p.quantity ?? "—"}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button type="button" onClick={() => handleRemoveProduct(fs._id, pid)}
                                className="text-[#e53e3e] hover:opacity-70 transition-opacity">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
