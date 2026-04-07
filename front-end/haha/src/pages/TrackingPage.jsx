import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumb from "../components/Breadcrumb";
import axiosClient from "../lib/api";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const STATUS_STEPS = [
  { key: "order_placed",  label: "Đặt hàng thành công" },
  { key: "confirmed",     label: "Đã xác nhận" },
  { key: "picked_up",     label: "Đã lấy hàng" },
  { key: "in_transit",    label: "Đang vận chuyển" },
  { key: "out_for_delivery", label: "Đang giao" },
  { key: "delivered",     label: "Đã giao hàng" },
];

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);
    try {
      const { data } = await axiosClient.get(`/api/shipping/track/${encodeURIComponent(code.trim())}`);
      setResult(data.data ?? { trackingCode: code.trim(), events: [] });
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tìm thấy thông tin vận chuyển.";
      // Nếu API trả 503 (GHN chưa tích hợp) → hiển thị thông báo thân thiện
      if (err?.response?.status === 503) {
        setError("Tính năng theo dõi đơn hàng qua đơn vị vận chuyển đang được tích hợp. Vui lòng liên hệ shop để được hỗ trợ.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />
      <Breadcrumb
        items={[
          { label: "Trang chủ", to: "/" },
          { label: "Theo dõi đơn hàng" },
        ]}
      />

      <main className="mx-auto max-w-[720px] px-4 py-10 md:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 text-center"
          style={{ fontSize: "28px", fontWeight: 650 }}
        >
          Theo dõi đơn hàng
        </motion.h1>

        {/* Search form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSearch}
          className="flex gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="Nhập mã vận đơn (VD: VNEX123456789)"
            className="flex-1 rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[14px] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-xl bg-[#1d1d1f] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#3d3d3f] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Tìm...
              </span>
            ) : "Tra cứu"}
          </motion.button>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] px-5 py-4 text-[13px] text-[#92400e]"
            >
              <p className="font-medium mb-1">Không tra cứu được</p>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            >
              {/* Header */}
              <div className="border-b border-black/[0.05] bg-[#f5f5f7] px-5 py-4">
                <p className="text-[12px] text-[#6e6e73]">Mã vận đơn</p>
                <p className="text-[17px] font-bold text-[#1d1d1f]">{result.trackingCode ?? code}</p>
                {result.status && (
                  <span className="mt-1 inline-block rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-medium text-white">
                    {result.status}
                  </span>
                )}
              </div>

              {/* Progress steps */}
              {result.events && result.events.length > 0 ? (
                <div className="px-5 py-5">
                  <div className="relative space-y-5">
                    {result.events.map((ev, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-[#34c759]" : "bg-[#c7c7cc]"}`} />
                          {i < result.events.length - 1 && (
                            <div className="mt-1 w-px flex-1 bg-[#e5e5ea]" style={{ minHeight: "28px" }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-[13px] font-medium text-[#1d1d1f]">{ev.status ?? ev.description}</p>
                          {ev.location && <p className="text-[12px] text-[#6e6e73]">{ev.location}</p>}
                          <p className="text-[11px] text-[#8e8e93]">
                            {ev.time ? new Date(ev.time).toLocaleString("vi-VN") : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-[13px] text-[#6e6e73]">
                  Chưa có thông tin cập nhật cho đơn hàng này.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when no search yet */}
        {!searched && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7] text-[#c7c7cc]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1d1d1f]">Tra cứu vận đơn</p>
            <p className="mt-1 text-[13px] text-[#6e6e73]">Nhập mã vận đơn từ email xác nhận đơn hàng của bạn</p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
