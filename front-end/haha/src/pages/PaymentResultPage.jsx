import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SF_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const VNP_ERRORS = {
  "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.",
  "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
  "10": "Xác thực thông tin thẻ/tài khoản quá 3 lần.",
  "11": "Đã hết hạn chờ thanh toán.",
  "12": "Thẻ/Tài khoản bị khóa.",
  "13": "Sai mật khẩu OTP.",
  "24": "Giao dịch bị hủy.",
  "51": "Tài khoản không đủ số dư.",
  "65": "Tài khoản vượt hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng đang bảo trì.",
  "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
  "99": "Lỗi không xác định.",
};

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const success  = params.get("success") === "true";
  const orderId  = params.get("orderId");
  const code     = params.get("code");
  const errorMsg = VNP_ERRORS[code] || "Giao dịch không thành công.";

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: SF_FONT }}>
      <Header />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          {success ? (
            <>
              {/* Success icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0fdf4]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#16a34a" opacity="0.15" />
                  <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="mb-2 text-[22px] font-bold text-[#1d1d1f]">Thanh toán thành công!</h1>
              <p className="mb-6 text-[14px] text-[#6e6e73]">
                Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="block w-full rounded-full bg-[#1d1d1f] py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#3d3d3f]"
                >
                  Xem đơn hàng
                </Link>
                <Link
                  to="/"
                  className="block w-full rounded-full border border-black/[0.15] py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Failed icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1f0]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#e53e3e" opacity="0.15" />
                  <path d="M8 8l8 8M16 8l-8 8" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="mb-2 text-[22px] font-bold text-[#1d1d1f]">Thanh toán thất bại</h1>
              <p className="mb-2 text-[14px] text-[#6e6e73]">{errorMsg}</p>
              {code && code !== "INVALID_SIGNATURE" && code !== "ORDER_NOT_FOUND" && (
                <p className="mb-6 text-[12px] text-[#8e8e93]">Mã lỗi: {code}</p>
              )}
              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="block w-full rounded-full bg-[#1d1d1f] py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#3d3d3f]"
                >
                  Thử lại
                </Link>
                <Link
                  to="/orders"
                  className="block w-full rounded-full border border-black/[0.15] py-3 text-[14px] font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7]"
                >
                  Xem đơn hàng
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
