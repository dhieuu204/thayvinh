import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AppleLogo } from "../components/icons";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus]   = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/auth/verify-email/${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.message ||
            "Liên kết xác minh không hợp lệ hoặc đã hết hạn."
        );
      });
  }, [token]);

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f] antialiased"
      style={{ fontFamily: SF_FONT }}
    >
      <Header />

      <main className="bg-[#fafafa] min-h-[calc(100vh-130px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="w-full max-w-[400px]"
        >
          <div className="rounded-[24px] border border-black/[0.07] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1 w-full bg-[#1d1d1f]" />

            <div className="px-8 pt-8 pb-9 text-center">
              <div className="mb-5 flex justify-center text-[#1d1d1f]">
                <AppleLogo size={36} />
              </div>

              {status === "loading" && (
                <>
                  <div className="w-10 h-10 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                  <p className="text-[15px] text-[#6e6e73]">Đang xác minh email...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h1 className="text-[20px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">
                    Xác minh thành công!
                  </h1>
                  <p className="text-[14px] text-[#6e6e73] mb-7">{message}</p>
                  <Link
                    to="/login"
                    className="block w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="w-16 h-16 bg-[#e53e3e]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <h1 className="text-[20px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">
                    Xác minh thất bại
                  </h1>
                  <p className="text-[14px] text-[#6e6e73] mb-7">{message}</p>
                  <Link
                    to="/signup"
                    className="block w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white hover:bg-[#3d3d3f] transition-colors"
                  >
                    Đăng ký lại
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
