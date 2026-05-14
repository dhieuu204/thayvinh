import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axiosClient from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

/* ─── Sidebar Nav ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    key: "profile",
    label: "Thông tin cá nhân",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "password",
    label: "Đổi mật khẩu",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    key: "loyalty",
    label: "Điểm tích lũy",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: "orders",
    label: "Đơn hàng của tôi",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
    link: "/orders",
  },
  {
    key: "wishlist",
    label: "Sản phẩm yêu thích",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    link: "/wishlist",
  },
  {
    key: "addresses",
    label: "Sổ địa chỉ",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

/* ─── Input field helper ─────────────────────────────────────────── */
function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#e53e3e]">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full rounded-xl border bg-[#fafafa] px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#8e8e93] outline-none transition-all focus:bg-white focus:ring-2 ${
    err
      ? "border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/20"
      : "border-black/[0.1] focus:border-[#0071e3] focus:ring-[#0071e3]/20"
  }`;

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, avatarUrl, onUpload }) {
  const inputRef = React.useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axiosClient.post("/api/images", formData);
      onUpload?.(res.data.data.url);
    } catch (err) {
      console.error("[Avatar Upload Error]", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Upload ảnh thất bại";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative h-20 w-20">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover shadow-lg" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1d1d1f] text-[26px] font-bold text-white shadow-lg select-none">
          {initials}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 rounded-full bg-[#0071e3] p-1.5 text-white shadow-md hover:bg-[#0055b8] disabled:opacity-60 transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

/* ─── Tab: Profile ───────────────────────────────────────────────── */
function ProfileTab({ user, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || user?.fullName || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleAvatarUpload = (url) => {
    setForm((f) => ({ ...f, avatarUrl: url }));
    toast.success("Ảnh đại diện được cập nhật!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập họ tên.";
    if (form.phone && !/^0\d{9}$/.test(form.phone.trim()))
      errs.phone = "Số điện thoại không hợp lệ.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await axiosClient.put(
        "/api/users/profile",
        { fullName: form.name, phone: form.phone, dob: form.dob, gender: form.gender, avatarUrl: form.avatarUrl }
      );
      const updated = { ...user, fullName: form.name, name: form.name, phone: form.phone, dob: form.dob, gender: form.gender, avatarUrl: form.avatarUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      onSave(updated);
      toast.success("Cập nhật thông tin thành công!");
    } catch {
      toast.error("Cập nhật thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Avatar section */}
      <div className="flex items-center gap-5">
        <Avatar name={form.name || user?.email} avatarUrl={form.avatarUrl} onUpload={handleAvatarUpload} />
        <div>
          <p className="font-semibold text-[#1d1d1f]">{form.name || "Người dùng"}</p>
          <p className="text-sm text-[#6e6e73]">{user?.email}</p>
          <p className="mt-1 text-xs text-[#8e8e93]">
            Thành viên từ {new Date(user?.createdAt || Date.now()).getFullYear()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" id="acc-name" error={errors.name}>
          <input
            id="acc-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className={inputCls(errors.name)}
          />
        </Field>

        <Field label="Email" id="acc-email">
          <input
            id="acc-email"
            type="email"
            value={user?.email || ""}
            readOnly
            className="w-full rounded-xl border border-black/[0.05] bg-[#f5f5f7] px-4 py-3 text-[14px] text-[#8e8e93] outline-none cursor-not-allowed"
          />
        </Field>

        <Field label="Số điện thoại" id="acc-phone" error={errors.phone}>
          <input
            id="acc-phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="0912 345 678"
            className={inputCls(errors.phone)}
          />
        </Field>

        <Field label="Ngày sinh" id="acc-dob">
          <input
            id="acc-dob"
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className={inputCls(false)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Giới tính" id="acc-gender">
            <div className="flex gap-3">
              {["Nam", "Nữ", "Khác"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    form.gender === g
                      ? "border-[#1d1d1f] bg-[#1d1d1f] text-white"
                      : "border-black/[0.1] bg-[#fafafa] text-[#1d1d1f] hover:border-black/[0.3]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </motion.button>
      </div>
    </form>
  );
}

/* ─── Tab: Password ──────────────────────────────────────────────── */
function PasswordTab() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const EyeBtn = ({ field }) => (
    <button
      type="button"
      onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] transition-colors hover:text-[#1d1d1f]"
      tabIndex={-1}
    >
      {show[field] ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      )}
    </button>
  );

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.current) errs.current = "Vui lòng nhập mật khẩu hiện tại.";
    if (!form.newPass) errs.newPass = "Vui lòng nhập mật khẩu mới.";
    else if (form.newPass.length < 8) errs.newPass = "Mật khẩu tối thiểu 8 ký tự.";
    if (!form.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu mới.";
    else if (form.confirm !== form.newPass) errs.confirm = "Mật khẩu xác nhận không khớp.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await axiosClient.put(
        "/api/auth/change-password",
        { currentPassword: form.current, newPassword: form.newPass }
      );
      toast.success("Đổi mật khẩu thành công!");
      setForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Mật khẩu hiện tại không đúng.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "current", label: "Mật khẩu hiện tại", placeholder: "••••••••" },
    { key: "newPass", label: "Mật khẩu mới", placeholder: "Tối thiểu 8 ký tự" },
    { key: "confirm", label: "Xác nhận mật khẩu mới", placeholder: "Nhập lại mật khẩu mới" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-md">
      {fields.map(({ key, label, placeholder }) => (
        <Field key={key} label={label} id={`pwd-${key}`} error={errors[key]}>
          <div className="relative">
            <input
              id={`pwd-${key}`}
              type={show[key] ? "text" : "password"}
              name={key}
              value={form[key]}
              onChange={handleChange}
              placeholder={placeholder}
              className={`${inputCls(errors[key])} pr-11`}
            />
            <EyeBtn field={key} />
          </div>
        </Field>
      ))}

      <div className="pt-1">
        <motion.button
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
        >
          {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </motion.button>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-[#fde8b1] bg-[#fffbf0] px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-[#92400e]">Gợi ý mật khẩu mạnh:</p>
        <ul className="space-y-1 text-xs text-[#78350f]">
          {["Tối thiểu 8 ký tự", "Kết hợp chữ hoa, chữ thường và số", "Thêm ký tự đặc biệt (!@#$%)"].map((tip) => (
            <li key={tip} className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

/* ─── Tab: Loyalty Points ────────────────────────────────────────── */
function LoyaltyTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmt, setRedeemAmt] = useState("");

  useEffect(() => {
    axiosClient
      .get("/api/users/loyalty")
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    const pts = parseInt(redeemAmt);
    if (!pts || pts <= 0) return;
    setRedeeming(true);
    try {
      await axiosClient.post("/api/users/loyalty/redeem", { points: pts });
      toast.success(`Đã đổi ${pts} điểm thành công!`);
      // Reload data
      const { data: res } = await axiosClient.get("/api/users/loyalty");
      setData(res.data);
      setRedeemAmt("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể đổi điểm.");
    } finally {
      setRedeeming(false);
    }
  };

  const TYPE_LABEL = { earn: "Tích điểm", redeem: "Đổi điểm", expire: "Hết hạn", adjust: "Điều chỉnh" };
  const TYPE_COLOR = { earn: "text-[#16a34a]", redeem: "text-[#e53e3e]", expire: "text-[#8e8e93]", adjust: "text-[#0071e3]" };

  if (loading) return <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] p-6 text-white">
        <p className="text-[13px] text-white/60">Điểm tích lũy hiện tại</p>
        <p className="mt-1 text-[36px] font-bold">{(data?.loyaltyPoints ?? 0).toLocaleString("vi-VN")}</p>
        <p className="mt-1 text-[12px] text-white/50">= {((data?.loyaltyPoints ?? 0) / 100 * 1000).toLocaleString("vi-VN")}đ (100 điểm = 1.000đ)</p>
      </div>

      {/* Redeem form */}
      {(data?.loyaltyPoints ?? 0) >= 100 && (
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="number"
            min={100}
            step={100}
            value={redeemAmt}
            onChange={(e) => setRedeemAmt(e.target.value)}
            placeholder="Nhập số điểm muốn đổi (tối thiểu 100)"
            className="flex-1 rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-2.5 text-[13px] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={redeeming}
            className="rounded-xl bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
          >
            {redeeming ? "..." : "Đổi điểm"}
          </motion.button>
        </form>
      )}

      {/* Transaction history */}
      <div>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">Lịch sử giao dịch</h3>
        {(!data?.transactions || data.transactions.length === 0) ? (
          <p className="text-center py-8 text-[13px] text-[#8e8e93]">Chưa có giao dịch nào</p>
        ) : (
          <div className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            {data.transactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-[#1d1d1f]">{TYPE_LABEL[t.type] ?? t.type}</p>
                  <p className="text-[11px] text-[#8e8e93]">{t.description}</p>
                  <p className="text-[11px] text-[#8e8e93]">{new Date(t.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <span className={`text-[14px] font-bold ${TYPE_COLOR[t.type] ?? ""}`}>
                  {t.type === "earn" ? "+" : "-"}{t.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Address Form Modal ─────────────────────────────────────────── */
const EMPTY_ADDR = { fullName: "", phone: "", province: "", district: "", ward: "", street: "", isDefault: false };

function AddressFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ?? EMPTY_ADDR);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial?._id;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên.";
    if (!form.phone.trim()) errs.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^0\d{9}$/.test(form.phone.trim())) errs.phone = "Số điện thoại không hợp lệ.";
    if (!form.province.trim()) errs.province = "Vui lòng nhập tỉnh/thành.";
    if (!form.district.trim()) errs.district = "Vui lòng nhập quận/huyện.";
    if (!form.ward.trim()) errs.ward = "Vui lòng nhập phường/xã.";
    if (!form.street.trim()) errs.street = "Vui lòng nhập địa chỉ cụ thể.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await axiosClient.put(`/api/users/addresses/${initial._id}`, form);
      } else {
        await axiosClient.post("/api/users/addresses", form);
      }
      toast.success(isEdit ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể lưu địa chỉ.");
    } finally {
      setSaving(false);
    }
  };

  const addrFields = [
    { name: "fullName", label: "Họ và tên người nhận", placeholder: "Nguyễn Văn A", colSpan: "" },
    { name: "phone",    label: "Số điện thoại",        placeholder: "0912 345 678",  colSpan: "" },
    { name: "province", label: "Tỉnh / Thành phố",     placeholder: "Hà Nội",        colSpan: "" },
    { name: "district", label: "Quận / Huyện",          placeholder: "Cầu Giấy",      colSpan: "" },
    { name: "ward",     label: "Phường / Xã",           placeholder: "Dịch Vọng",     colSpan: "" },
    { name: "street",   label: "Địa chỉ cụ thể",        placeholder: "Số 1, Ngõ 2...", colSpan: "sm:col-span-2" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#1d1d1f]">
            {isEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#8e8e93] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {addrFields.map(({ name, label, placeholder, colSpan }) => (
              <Field key={name} label={label} id={`addr-${name}`} error={errors[name]}>
                <input
                  id={`addr-${name}`}
                  type="text"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`${inputCls(errors[name])} ${colSpan ? "col-span-2" : ""}`}
                />
              </Field>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="h-4 w-4 rounded border-black/20 accent-[#1d1d1f]"
            />
            <span className="text-[13px] text-[#1d1d1f]">Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-black/[0.1] px-5 py-2.5 text-[13px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]">
              Hủy
            </button>
            <motion.button
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm địa chỉ"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Tab: Address Book ──────────────────────────────────────────── */
function AddressTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);

  const fetchAddresses = () => {
    setLoading(true);
    axiosClient
      .get("/api/users/addresses")
      .then(({ data }) => setAddresses(data.data ?? []))
      .catch(() => toast.error("Không thể tải danh sách địa chỉ."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleSaved = () => {
    setShowForm(false);
    setEditingAddr(null);
    fetchAddresses();
  };

  const handleEdit = (addr) => {
    setEditingAddr(addr);
    setShowForm(true);
  };

  const handleDelete = async (addrId) => {
    setDeletingId(addrId);
    try {
      await axiosClient.delete(`/api/users/addresses/${addrId}`);
      toast.success("Đã xóa địa chỉ.");
      setAddresses((prev) => {
        const filtered = prev.filter((a) => a._id !== addrId);
        if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
          filtered[0] = { ...filtered[0], isDefault: true };
        }
        return filtered;
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa địa chỉ.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      await axiosClient.patch(`/api/users/addresses/${addrId}/default`);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === addrId })));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể đặt mặc định.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#6e6e73]">
          {addresses.length === 0 ? "Chưa có địa chỉ nào." : `${addresses.length} địa chỉ đã lưu`}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => { setEditingAddr(null); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#3d3d3f]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm địa chỉ
        </motion.button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[0.12] bg-[#fafafa] py-12">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d1d6" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-[14px] text-[#8e8e93]">Bạn chưa lưu địa chỉ nào</p>
          <button
            type="button"
            onClick={() => { setEditingAddr(null); setShowForm(true); }}
            className="text-[13px] font-medium text-[#0071e3] hover:underline"
          >
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      )}

      {/* Address cards */}
      {addresses.map((addr) => (
        <div
          key={addr._id}
          className={`relative rounded-2xl border p-4 transition-all ${
            addr.isDefault
              ? "border-[#1d1d1f] bg-[#f5f5f7]"
              : "border-black/[0.07] bg-white hover:border-black/[0.15]"
          }`}
        >
          {addr.isDefault && (
            <span className="absolute right-3 top-3 rounded-full bg-[#1d1d1f] px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Mặc định
            </span>
          )}

          <p className="font-semibold text-[#1d1d1f]">{addr.fullName}</p>
          <p className="text-[13px] text-[#6e6e73]">{addr.phone}</p>
          <p className="mt-1 text-[13px] text-[#3a3a3c]">
            {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!addr.isDefault && (
              <button
                type="button"
                onClick={() => handleSetDefault(addr._id)}
                className="rounded-lg border border-black/[0.1] px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
              >
                Đặt mặc định
              </button>
            )}
            <button
              type="button"
              onClick={() => handleEdit(addr)}
              className="rounded-lg border border-black/[0.1] px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => handleDelete(addr._id)}
              disabled={deletingId === addr._id}
              className="rounded-lg border border-[#fca5a5] px-3 py-1.5 text-[12px] font-medium text-[#e53e3e] transition-all hover:bg-[#fff1f0] disabled:opacity-60"
            >
              {deletingId === addr._id ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      ))}

      {/* Modal */}
      {showForm && (
        <AddressFormModal
          initial={editingAddr}
          onClose={() => { setShowForm(false); setEditingAddr(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* ─── AccountPage ────────────────────────────────────────────────── */
export default function AccountPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    try { await axiosClient.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));
    toast.info("Đã đăng xuất");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete("/api/users/account");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("userUpdated"));
      toast.success("Tài khoản đã được xóa.");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa tài khoản.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveUser = (updated) => setUser(updated);

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Tài khoản" },
        ]}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "24px", fontWeight: 650 }}
          className="mb-7 text-[#1d1d1f]"
        >
          Tài khoản của tôi
        </motion.h1>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[240px] lg:shrink-0"
          >
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              {/* User info */}
              <div className="border-b border-black/[0.05] p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name || user?.fullName || user?.email} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1d1d1f]">
                      {user?.name || user?.fullName || "Người dùng"}
                    </p>
                    <p className="truncate text-xs text-[#6e6e73]">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                {NAV_ITEMS.filter((item) =>
                  user?.role === "admin"
                    ? !["loyalty", "orders", "wishlist", "addresses"].includes(item.key)
                    : true
                ).map((item) =>
                  item.link ? (
                    <Link
                      key={item.key}
                      to={item.link}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#3a3a3c] transition-all hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                    >
                      <span className="text-[#6e6e73]">{item.icon}</span>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                        activeTab === item.key
                          ? "bg-[#1d1d1f] font-medium text-white"
                          : "text-[#3a3a3c] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                      }`}
                    >
                      <span className={activeTab === item.key ? "text-white" : "text-[#6e6e73]"}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  )
                )}

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-[#e53e3e] transition-all hover:bg-[#fff1f0]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Đăng xuất
                </button>
              </nav>
            </div>
          </motion.aside>

          {/* ── Main content ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7"
          >
            {activeTab === "profile" && (
              <>
                <h2 className="mb-6 text-[17px] font-semibold text-[#1d1d1f]">Thông tin cá nhân</h2>
                <ProfileTab user={user} onSave={handleSaveUser} />

                {/* Danger zone — xóa tài khoản */}
                <div className="mt-8 border-t border-black/[0.06] pt-6">
                  <h3 className="mb-1 text-[14px] font-semibold text-[#e53e3e]">Vùng nguy hiểm</h3>
                  <p className="mb-3 text-[12px] text-[#6e6e73]">Xóa tài khoản sẽ xóa vĩnh viễn mọi dữ liệu cá nhân. Hành động không thể hoàn tác.</p>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-full border border-[#e53e3e] px-5 py-2 text-[13px] font-medium text-[#e53e3e] transition-all hover:bg-[#fff1f0]"
                    >
                      Xóa tài khoản
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-[#fff1f0] px-4 py-3">
                      <p className="flex-1 text-[13px] text-[#c53030]">Bạn chắc chắn muốn xóa tài khoản?</p>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="rounded-lg bg-[#e53e3e] px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-[#c53030] disabled:opacity-60"
                      >
                        {deleting ? "Đang xóa..." : "Xác nhận xóa"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-lg border border-black/[0.1] px-4 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === "password" && (
              <>
                <h2 className="mb-6 text-[17px] font-semibold text-[#1d1d1f]">Đổi mật khẩu</h2>
                <PasswordTab />
              </>
            )}
            {activeTab === "loyalty" && (
              <>
                <h2 className="mb-6 text-[17px] font-semibold text-[#1d1d1f]">Điểm tích lũy</h2>
                <LoyaltyTab />
              </>
            )}
            {activeTab === "addresses" && (
              <>
                <h2 className="mb-6 text-[17px] font-semibold text-[#1d1d1f]">Sổ địa chỉ</h2>
                <AddressTab />
              </>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
