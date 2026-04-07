import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../lib/api";
function fmtDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function CreateUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!form.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    if (!form.password || form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await axiosClient.post("/api/auth/register", {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Tạo tài khoản thành công");
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo tài khoản thất bại");
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
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Tạo tài khoản mới</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e93] hover:bg-[#f5f5f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Họ và tên *</label>
            <input name="fullName" value={form.fullName} onChange={handle} placeholder="Nguyễn Văn A" className={inputCls(errors.fullName)} />
            {errors.fullName && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.fullName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Tên đăng nhập *</label>
              <input name="username" value={form.username} onChange={handle} placeholder="nguyenvana" className={inputCls(errors.username)} />
              {errors.username && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.username}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="user@email.com" className={inputCls(errors.email)} />
              {errors.email && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1d1d1f]">Mật khẩu *</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="Tối thiểu 6 ký tự" className={inputCls(errors.password)} />
            {errors.password && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.password}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-black/[0.1] px-5 py-2.5 text-sm text-[#3a3a3c] hover:bg-[#f5f5f7] transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] disabled:opacity-60 transition-colors">
              {saving ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const searchTimer = useRef(null);

  const load = useCallback((q, p) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 15 });
    if (q) params.set("search", q);
    axiosClient
      .get(`/api/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data.data?.users || []);
        setTotalPages(res.data.data?.pagination?.totalPages || 1);
        setTotal(res.data.data?.pagination?.total || 0);
      })
      .catch(() => toast.error("Không tải được danh sách người dùng"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(val, 1);
    }, 400);
  };

  const handleBanToggle = async (user) => {
    setBanning(user._id);
    try {
      await axiosClient.patch(
        `/api/admin/users/${user._id}/ban`,
        { banned: !user.isBanned }
      );
      setUsers((prev) =>
        prev.map((u) => u._id === user._id ? { ...u, isBanned: !user.isBanned } : u)
      );
      toast.success(user.isBanned ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setBanning(null);
    }
  };

  return (
    <div className="space-y-5">
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSave={() => { setShowCreate(false); load(search, page); }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Quản lý người dùng</h1>
          <p className="text-sm text-[#8e8e93]">{total} tài khoản</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm tên, email..."
              className="w-[240px] rounded-xl border border-black/[0.1] bg-[#fafafa] py-2 pl-9 pr-4 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo tài khoản
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d1d1f] border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8e8e93]">Không tìm thấy người dùng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Người dùng", "Email", "Vai trò", "Ngày tham gia", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-semibold text-[#6e6e73]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-bold text-white">
                          {(u.fullName || u.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#1d1d1f]">{u.fullName || u.username}</p>
                          <p className="text-[11px] text-[#8e8e93]">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#3a3a3c]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        u.role === "admin" ? "bg-[#fdf4ff] text-[#7e22ce]" : "bg-[#f5f5f7] text-[#6e6e73]"
                      }`}>
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6e6e73]">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-0.5 text-[11px] font-medium text-[#dc2626]">
                          Đã khoá
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-[11px] font-medium text-[#15803d]">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          disabled={banning === u._id}
                          onClick={() => handleBanToggle(u)}
                          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all disabled:opacity-50 ${
                            u.isBanned
                              ? "bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]"
                              : "bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]"
                          }`}
                        >
                          {banning === u._id ? "..." : u.isBanned ? "Mở khoá" : "Khoá"}
                        </button>
                      )}
                    </td>
                  </tr>
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
