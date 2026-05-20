export default function Footer() {
  return (
    <footer className="w-full bg-[#1a1a1a] text-white pt-10 pb-6">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: Logo + mô tả + hotline */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-bold text-lg tracking-wide">HK TECH</span>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-center leading-tight">
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span style={{ fontSize: "9px" }} className="text-white/80 font-medium">Authorised</span>
                </div>
                <span style={{ fontSize: "9px" }} className="text-white/80">Reseller</span>
              </div>
            </div>
            <p className="text-white/60 mb-5 leading-relaxed" style={{ fontSize: "12px" }}>
              Năm 2026, HK Tech trở thành đại lý ủy quyền của Apple. Chúng tôi phát triển chuỗi cửa hàng tiêu chuẩn và Apple Mono Store nhằm mang đến trải nghiệm tốt nhất về sản phẩm và dịch vụ của Apple cho người dùng Việt Nam.
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Hotline mua hàng:", number: "1900.1234" },
                { label: "Hotline tư vấn:", number: "1900.5678" },
              ].map(({ label, number }) => (
                <div key={label} className="flex items-center gap-2" style={{ fontSize: "12px" }}>
                  <span className="font-bold text-white">{label}</span>
                  <a href={`tel:${number}`} className="text-[#4a9eff] hover:text-[#74b6ff] transition-colors">
                    {number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Cột 2: Thông tin */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontSize: "13px" }}>
              Thông tin
            </h4>
            <ul className="space-y-2.5">
              {[
                "Newsfeed",
                "Giới thiệu",
                "Check IMEI",
                "Bảo hành và sửa chữa",
                "Tuyển dụng",
                "Đánh giá chất lượng, khiếu nại",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Chính sách */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontSize: "13px" }}>
              Chính sách
            </h4>
            <ul className="space-y-2.5">
              {[
                "Thu cũ đổi mới",
                "Giao hàng",
                "Huỷ giao dịch",
                "Đổi trả",
                "Bảo hành",
                "Dịch vụ",
                "Giải quyết khiếu nại",
                "Bảo mật thông tin",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Địa chỉ & Liên hệ */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontSize: "13px" }}>
              Địa chỉ & Liên hệ
            </h4>
            <ul className="space-y-2.5">
              {[
                "Tài khoản của tôi",
                "Đơn đặt hàng",
                "Tìm Store trên Google Map",
                "Hệ thống cửa hàng",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li className="text-white/50" style={{ fontSize: "12px" }}>
                Mua hàng: 1900.1357
              </li>
              {[
                "Nhánh 1: 122 Hoàng Quốc Việt, Cầu Giấy",
                "Nhánh 2: Km10, Đường Nguyễn Trãi, Hà Đông",
              ].map((item) => (
                <li key={item} className="text-white/40" style={{ fontSize: "11px" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/40" style={{ fontSize: "11px" }}>
            © 2024 HK Tech. Tất cả quyền lợi được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
