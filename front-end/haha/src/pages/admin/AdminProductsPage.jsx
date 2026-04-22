import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";
import { ImageWithFallback } from "../../components/ImageWithFallback";

function fmt(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

/* ── Shared form fields logic ── */
function useProductForm(product) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice || "",
    salePrice: product?.salePrice || "",
    saleDiscount: product?.saleDiscount || "",
    stock: product?.stock || "",
    category: product?.category?._id || product?.category || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.images?.[0]?.url || null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên sản phẩm";
    if (!form.basePrice || Number(form.basePrice) <= 0) e.basePrice = "Giá phải lớn hơn 0";
    if (form.salePrice && Number(form.salePrice) < Number(form.basePrice)) {
      e.salePrice = "Giá bán không được nhỏ hơn giá gốc";
    }
    if (form.saleDiscount) {
      const discountPercent = Number(form.saleDiscount);
      if (discountPercent < 0 || discountPercent > 100) {
        e.saleDiscount = "Giảm giá phải từ 0-100%";
      } else {
        const baseForDiscount = Number(form.salePrice || form.basePrice);
        const finalPrice = baseForDiscount * (1 - discountPercent / 100);
        if (finalPrice < Number(form.basePrice)) {
          e.saleDiscount = `Giá sau giảm (${fmt(finalPrice)}) không được nhỏ hơn giá gốc (${fmt(form.basePrice)})`;
        }
      }
    }
    if (!form.stock || Number(form.stock) < 0) e.stock = "Số lượng không hợp lệ";
    if (!form.category) e.category = "Chọn danh mục";
    return e;
  };

  return { form, handle, imageFile, setImageFile, imagePreview, handleImageChange, validate, saving, setSaving, errors, setErrors };
}

const inputCls = (err) =>
  `w-full rounded-xl border bg-[#fafafa] px-4 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition-all focus:bg-white focus:ring-2 ${
    err ? "border-[#e53e3e] focus:ring-[#e53e3e]/20" : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
  }`;

/* ── Slide-in Drawer: CHỈ dùng khi THÊM MỚI ── */
function ProductDrawer({ categories, onClose, onSave }) {
  const { form, handle, imageFile, imagePreview, handleImageChange, validate, saving, setSaving, errors } = useProductForm(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { return; }
    setSaving(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await axiosClient.post("/api/images", formData);
        imageUrl = uploadRes.data.data.url;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description,
        basePrice: Number(form.basePrice),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        saleDiscount: form.saleDiscount ? Number(form.saleDiscount) : null,
        stock: Number(form.stock),
        category: form.category,
        images: imageUrl ? [{ url: imageUrl }] : [],
      };

      await axiosClient.post(`/api/products`, payload);
      toast.success("Thêm sản phẩm thành công");
      onSave();
    } catch (err) {
      console.error("[Upload Error] Full:", err);
      console.error("[Upload Error] Response:", err?.response?.data);
      console.error("[Upload Error] Status:", err?.response?.status);
      const errorMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-screen w-full max-w-[480px] flex-col bg-white shadow-[-6px_0_40px_rgba(0,0,0,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4 shrink-0">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Thêm sản phẩm mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên sản phẩm *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="iPhone 17 Pro..." className={inputCls(errors.name)} />
              {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá gốc (VNĐ) *</label>
              <input name="basePrice" type="number" value={form.basePrice} onChange={handle} placeholder="29990000" className={inputCls(errors.basePrice)} />
              {errors.basePrice && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.basePrice}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá bán (VNĐ) <span className="text-[#8e8e93]">(tùy chọn)</span></label>
              <input name="salePrice" type="number" value={form.salePrice} onChange={handle} placeholder="Để trống nếu không giảm giá" className={inputCls(errors.salePrice)} />
              {errors.salePrice && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.salePrice}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giảm giá (%) <span className="text-[#8e8e93]">(tùy chọn)</span></label>
              <div className="flex gap-2">
                <input name="saleDiscount" type="number" min="0" max="100" value={form.saleDiscount} onChange={handle} placeholder="0-100" className={inputCls(errors.saleDiscount)} />
              </div>
              {form.saleDiscount && !errors.saleDiscount && (
                <p className="mt-1.5 text-[11px] text-[#6e6e73]">
                  Giá sau giảm: {fmt(Number(form.salePrice || form.basePrice) * (1 - Number(form.saleDiscount) / 100))}
                </p>
              )}
              {errors.saleDiscount && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.saleDiscount}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Số lượng kho *</label>
              <input name="stock" type="number" value={form.stock} onChange={handle} placeholder="100" className={inputCls(errors.stock)} />
              {errors.stock && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.stock}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Danh mục *</label>
              <select name="category" value={form.category} onChange={handle} className={inputCls(errors.category)}>
                <option value="">Chọn danh mục</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.category}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ảnh sản phẩm</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] file:mr-3 file:border-0 file:bg-[#1d1d1f] file:px-3 file:py-1.5 file:text-white file:text-[11px] file:rounded file:cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-3 rounded-lg overflow-hidden border border-black/[0.1]">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mô tả</label>
              <textarea name="description" value={form.description} onChange={handle} rows={4} placeholder="Mô tả ngắn..." className={`resize-none ${inputCls(false)}`} />
            </div>
          </div>

          {/* Footer cố định */}
          <div className="shrink-0 border-t border-black/[0.06] px-6 py-4 flex justify-end gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors"
            >
              {saving ? "Đang lưu..." : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ── Modal popup: CHỈ dùng khi SỬA ── */
function ProductModal({ product, categories, onClose, onSave }) {
  const { form, handle, imageFile, imagePreview, handleImageChange, validate, saving, setSaving, errors } = useProductForm(product);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { return; }
    setSaving(true);

    try {
      let imageUrl = product?.images?.[0]?.url;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await axiosClient.post("/api/images", formData);
        imageUrl = uploadRes.data.data.url;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description,
        basePrice: Number(form.basePrice),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        saleDiscount: form.saleDiscount ? Number(form.saleDiscount) : null,
        stock: Number(form.stock),
        category: form.category,
        images: imageUrl ? [{ url: imageUrl }] : [],
      };

      await axiosClient.put(`/api/products/${product._id}`, payload);
      toast.success("Cập nhật sản phẩm thành công");
      onSave();
    } catch (err) {
      console.error("[Upload Error] Full:", err);
      console.error("[Upload Error] Response:", err?.response?.data);
      console.error("[Upload Error] Status:", err?.response?.status);
      const errorMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Chỉnh sửa sản phẩm</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên sản phẩm *</label>
            <input name="name" value={form.name} onChange={handle} placeholder="iPhone 17 Pro..." className={inputCls(errors.name)} />
            {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá gốc (VND) *</label>
            <input name="basePrice" type="number" value={form.basePrice} onChange={handle} placeholder="29990000" className={inputCls(errors.basePrice)} />
            {errors.basePrice && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.basePrice}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giá bán (VND) <span className="text-[#8e8e93]">(tùy chọn)</span></label>
            <input name="salePrice" type="number" value={form.salePrice} onChange={handle} placeholder="Để trống nếu không giảm giá" className={inputCls(errors.salePrice)} />
            {errors.salePrice && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.salePrice}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Giảm giá (%) <span className="text-[#8e8e93]">(tùy chọn)</span></label>
            <input name="saleDiscount" type="number" min="0" max="100" value={form.saleDiscount} onChange={handle} placeholder="0-100" className={inputCls(errors.saleDiscount)} />
            {form.saleDiscount && !errors.saleDiscount && (
              <p className="mt-1.5 text-[11px] text-[#6e6e73]">
                Giá sau giảm: {fmt(Number(form.salePrice || form.basePrice) * (1 - Number(form.saleDiscount) / 100))}
              </p>
            )}
            {errors.saleDiscount && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.saleDiscount}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Số lượng kho *</label>
            <input name="stock" type="number" value={form.stock} onChange={handle} placeholder="100" className={inputCls(errors.stock)} />
            {errors.stock && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.stock}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Danh mục *</label>
            <select name="category" value={form.category} onChange={handle} className={inputCls(errors.category)}>
              <option value="">Chọn danh mục</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.category}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Ảnh sản phẩm</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] file:mr-3 file:border-0 file:bg-[#1d1d1f] file:px-3 file:py-1.5 file:text-white file:text-[11px] file:rounded file:cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3 rounded-lg overflow-hidden border border-black/[0.1]">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mô tả</label>
            <textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Mô tả ngắn..." className={`resize-none ${inputCls(false)}`} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | product object

  const load = useCallback(() => {
    setLoading(true);
    axiosClient.get(`/api/products?page=${page}&limit=15`)
      .then((res) => {
        setProducts(res.data.data?.products || []);
        setTotalPages(res.data.data?.pagination?.totalPages || 1);
        setTotal(res.data.data?.pagination?.total || 0);
      })
      .catch(() => toast.error("Không tải được sản phẩm"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    axiosClient.get(`/api/categories`).then((r) => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const handleDelete = async (product) => {
    if (!confirm(`Xoá sản phẩm "${product.name}"?`)) return;
    try {
      await axiosClient.delete(`/api/products/${product._id}`);
      toast.success("Đã xoá sản phẩm");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const handleSave = () => {
    setModal(null);
    load();
  };

  return (
    <div className="space-y-5">
      {/* Drawer — chỉ mở khi thêm mới */}
      {modal === "add" && (
        <ProductDrawer
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Modal popup — chỉ mở khi sửa */}
      {modal !== null && modal !== "add" && (
        <ProductModal
          product={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý sản phẩm</h1>
          <p className="text-sm text-[#8e8e93]">{total} sản phẩm</p>
        </div>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm sản phẩm
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Chưa có sản phẩm nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Sản phẩm", "Danh mục", "Giá", "Kho", "Đã bán", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7]">
                          <ImageWithFallback src={p.images?.[0]?.url} alt={p.name} className="max-h-full w-auto object-contain" />
                        </div>
                        <p className="max-w-[200px] text-[13px] font-medium text-[#1d1d1f] truncate">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6e6e73]">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">{fmt(p.salePrice || p.basePrice)}</p>
                      {p.salePrice && <p className="text-[11px] text-[#8e8e93] line-through">{fmt(p.basePrice)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[13px] font-medium ${p.stock <= 5 ? "text-[#e53e3e]" : p.stock <= 10 ? "text-[#c2410c]" : "text-[#1d1d1f]"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6e6e73]">{p.sold || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModal(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3] transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.1] text-[#6e6e73] hover:border-[#e53e3e] hover:text-[#e53e3e] transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
