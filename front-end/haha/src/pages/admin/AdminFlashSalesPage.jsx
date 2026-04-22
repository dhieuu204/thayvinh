import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}
function toInputDate(d) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}

function FlashSaleModal({ flashSale, products, onClose, onSave }) {
  const isEdit = !!flashSale;
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: flashSale?.name || "",
    description: flashSale?.description || "",
    startsAt: toInputDate(flashSale?.startsAt) || today,
    endsAt: toInputDate(flashSale?.endsAt),
  });
  const [fsProducts, setFsProducts] = useState(flashSale?.products || []);
  const [newProduct, setNewProduct] = useState({ productId: "", discountType: "percent", discountValue: "", quantity: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleAddProduct = () => {
    if (!newProduct.productId || !newProduct.discountValue || !newProduct.quantity) {
      toast.error("Chọn sản phẩm, nhập giá trị giảm giá và số lượng");
      return;
    }

    const product = products.find(p => p._id === newProduct.productId);
    const basePrice = product?.basePrice || 0;
    const salePrice = product?.salePrice || basePrice;
    const discountValue = Number(newProduct.discountValue);

    // Tính giá sau khi flash sale
    let finalPrice;
    if (newProduct.discountType === "percent") {
      finalPrice = salePrice * (1 - discountValue / 100);
    } else {
      finalPrice = salePrice - discountValue;
    }

    // Kiểm tra giá sau flash sale không được nhỏ hơn giá gốc
    if (finalPrice < basePrice) {
      toast.error(`Giá sau khi flash sale (${fmt(finalPrice)}) không được nhỏ hơn giá gốc (${fmt(basePrice)})`);
      return;
    }

    setFsProducts([...fsProducts, {
      productId: { _id: newProduct.productId, name: product?.name },
      discountType: newProduct.discountType,
      discountValue: discountValue,
      quantity: Number(newProduct.quantity),
    }]);
    setNewProduct({ productId: "", discountType: "percent", discountValue: "", quantity: "" });
  };

  const handleRemoveProduct = (productId) => {
    setFsProducts(fsProducts.filter(p => p.productId._id !== productId));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên flash sale";
    if (!form.startsAt) e.startsAt = "Chọn ngày bắt đầu";
    if (!form.endsAt) e.endsAt = "Chọn ngày kết thúc";
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) e.endsAt = "Ngày kết thúc phải sau ngày bắt đầu";
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
        products: fsProducts.map(p => ({
          productId: typeof p.productId === 'string' ? p.productId : p.productId._id,
          discountType: p.discountType,
          discountValue: p.discountValue,
        })),
      };
      if (isEdit) {
        await axiosClient.put(`/api/admin/flash-sales/${flashSale._id}`, payload);
        toast.success("Đã cập nhật flash sale");
      } else {
        await axiosClient.post(`/api/admin/flash-sales`, payload);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">{isEdit ? "Chỉnh sửa flash sale" : "Tạo flash sale mới"}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên flash sale *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Khuyến mại hè 2026" className={inputCls(errors.name)} />
              {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mô tả</label>
              <textarea name="description" value={form.description} onChange={handle} placeholder="Mô tả chi tiết..." rows="2" className={inputCls(false)} />
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

          <div className="border-t border-black/[0.06] pt-4">
            <label className="mb-2 block text-[12px] font-medium text-[#1d1d1f]">Sản phẩm ({fsProducts.length})</label>
            <div className="space-y-3">
              <div className="grid gap-2">
                <select value={newProduct.productId} onChange={(e) => setNewProduct({...newProduct, productId: e.target.value})} className={inputCls(false)}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.filter(p => !fsProducts.some(fp => (typeof fp.productId === 'string' ? fp.productId : fp.productId._id) === p._id)).map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <select value={newProduct.discountType} onChange={(e) => setNewProduct({...newProduct, discountType: e.target.value})} className={inputCls(false)}>
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền (VND)</option>
                </select>
                <input type="number" value={newProduct.discountValue} onChange={(e) => setNewProduct({...newProduct, discountValue: e.target.value})} placeholder={newProduct.discountType === "percent" ? "20" : "50000"} className={inputCls(false)} />
                <input type="number" value={newProduct.quantity} onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})} placeholder="Số lượng" min="1" className={inputCls(false)} />
                <button type="button" onClick={handleAddProduct} className="rounded-lg bg-[#0071e3] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0066cc] transition-colors">
                  Thêm
                </button>
              </div>
              {fsProducts.length > 0 && (
                <div className="space-y-2 mt-3 max-h-40 overflow-y-auto">
                  {fsProducts.map((p) => {
                    const prodId = typeof p.productId === 'string' ? p.productId : p.productId._id;
                    const prodName = typeof p.productId === 'string' ? products.find(x => x._id === p.productId)?.name : p.productId.name;
                    return (
                      <div key={prodId} className="flex items-center justify-between gap-2 rounded-lg bg-[#f5f5f7] px-3 py-2 text-[12px]">
                        <span className="text-[#1d1d1f]">{prodName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#8e8e93]">{p.discountType === "percent" ? `${p.discountValue}%` : fmt(p.discountValue)}</span>
                          <span className="text-[#8e8e93]">x{p.quantity}</span>
                          <button type="button" onClick={() => handleRemoveProduct(prodId)} className="text-[#e53e3e] hover:opacity-70">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-black/[0.06]">
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

function AddProductModal({ flashSaleId, availableProducts, onClose, onSave }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !discountValue || !quantity) {
      setError("Chọn sản phẩm, nhập giá trị giảm giá và số lượng");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.patch(`/api/admin/flash-sales/${flashSaleId}/products`, {
        productId: selectedProduct,
        discountType,
        discountValue: Number(discountValue),
        quantity: Number(quantity),
      });
      toast.success("Đã thêm sản phẩm");
      onSave();
    } catch (err) {
      setError(err?.response?.data?.message || "Thêm thất bại");
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Thêm sản phẩm vào flash sale</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Sản phẩm *</label>
            <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setError(""); }} className={inputCls(false)}>
              <option value="">-- Chọn sản phẩm --</option>
              {availableProducts.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Loại giảm giá</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={inputCls(false)}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền (VND)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá trị *</label>
              <input type="number" value={discountValue} onChange={(e) => { setDiscountValue(e.target.value); setError(""); }} placeholder={discountType === "percent" ? "20" : "50000"} className={inputCls(false)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Số lượng *</label>
              <input type="number" value={quantity} onChange={(e) => { setQuantity(e.target.value); setError(""); }} placeholder="10" min="1" className={inputCls(false)} />
            </div>
          </div>
          {error && <p className="text-[11px] text-[#e53e3e]">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang thêm..." : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFlashSalesPage() {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [addProductModal, setAddProductModal] = useState(null);

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
      .catch(() => toast.error("Không tải được danh sách"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
    try {
      await axiosClient.delete(`/api/admin/flash-sales/${fsId}/products/${productId}`);
      toast.success("Đã xoá sản phẩm");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const now = new Date();

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

      {addProductModal && (
        <AddProductModal
          flashSaleId={addProductModal}
          availableProducts={products}
          onClose={() => setAddProductModal(null)}
          onSave={() => { setAddProductModal(null); load(); }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý Flash Sale</h1>
          <p className="text-sm text-[#8e8e93]">{flashSales.length} flash sales</p>
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
        <div className="rounded-2xl bg-white p-8 text-center text-[#8e8e93]">Đang tải...</div>
      ) : flashSales.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-[#8e8e93]">Chưa có flash sale nào</div>
      ) : (
        <div className="space-y-3">
          {flashSales.map((fs) => (
            <div key={fs._id} className="rounded-2xl border border-black/[0.08] bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1d1d1f]">{fs.name}</h3>
                  <p className="text-[12px] text-[#8e8e93] mt-1">{fs.description}</p>
                  <div className="flex gap-4 mt-2 text-[12px] text-[#8e8e93]">
                    <span>📅 {new Date(fs.startsAt).toLocaleDateString("vi-VN")} - {new Date(fs.endsAt).toLocaleDateString("vi-VN")}</span>
                    <span>{fs.products.length} sản phẩm</span>
                    {fs.isActive && now < new Date(fs.endsAt) && <span className="text-[#34c759]">🔴 Đang chạy</span>}
                    {!fs.isActive && <span className="text-[#8e8e93]">⚪ Tắt</span>}
                    {now > new Date(fs.endsAt) && <span className="text-[#8e8e93]">⏱️ Hết hạn</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(fs)} className="p-2 rounded-full hover:bg-[#f5f5f7] text-[#3a3a3c]" title="Chỉnh sửa">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(fs)} className="p-2 rounded-full hover:bg-[#f5f5f7] text-[#e53e3e]" title="Xoá">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              {fs.products.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[12px] font-medium text-[#1d1d1f]">Sản phẩm:</div>
                  <div className="grid gap-2">
                    {fs.products.map((p) => (
                      <div key={p.productId?._id || p.productId} className="flex items-center justify-between gap-3 rounded-lg bg-[#f5f5f7] px-3 py-2 text-[12px]">
                        <span className="text-[#1d1d1f]">{p.productId?.name || "Sản phẩm đã xoá"}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#8e8e93]">
                            {p.discountType === "percent" ? `${p.discountValue}%` : fmt(p.discountValue)}
                          </span>
                          <button type="button" onClick={() => handleRemoveProduct(fs._id, p.productId?._id || p.productId)} className="text-[#e53e3e] hover:opacity-70">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setAddProductModal(fs._id)}
                className="mt-4 w-full rounded-full border border-[#0071e3] px-4 py-2 text-[13px] font-semibold text-[#0071e3] hover:bg-[#0071e3]/5 transition-colors"
              >
                + Thêm sản phẩm
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
