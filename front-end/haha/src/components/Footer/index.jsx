export default function Footer() {
  return (
    <footer className="w-full bg-[#f5f5f7] border-t border-black/[0.06] pt-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-4 gap-8 mb-6">
          <div>
            <h4
              className="text-[#1d1d1f] mb-3 tracking-tight"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Shop
            </h4>
            <ul className="space-y-3">
              {["iPhone", "iPad", "Mac"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[#1d1d1f] mb-3 tracking-tight"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Support
            </h4>
            <ul className="space-y-3">
              {["Warranty", "Shipping", "Returns", "Confirm"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[#1d1d1f] mb-3 tracking-tight"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              About Us
            </h4>
            <ul className="space-y-1.5">
              {["Our Story", "Contact", "Careers"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[#1d1d1f] mb-3 tracking-tight"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Email Signup
            </h4>
            <div className="flex items-center bg-white border border-black/[0.08] rounded-xl overflow-hidden focus-within:border-[#0071e3] transition-colors shadow-sm">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-4 py-2.5 bg-transparent text-[#1d1d1f] placeholder-[#86868b] focus:outline-none"
                style={{ fontSize: "13px" }}
              />
              <button className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-[#2d2d2f] transition-colors flex-shrink-0 rounded-r-xl">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Social icons row */}
        <div className="flex items-center gap-5 mb-6 justify-center">
          <a
            href="#"
            className="text-[#1d1d1f] hover:opacity-60 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="#"
            className="text-[#1d1d1f] hover:opacity-60 transition-opacity"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="#"
            className="text-[#1d1d1f] hover:opacity-60 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
              <polygon
                points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                fill="white"
              />
            </svg>
          </a>
        </div>

        <div className="border-t border-black/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 pb-2 flex flex-items-center justify-center">
          <p className="text-[#86868b]" style={{ fontSize: "12px" }}>
            © 2024 Cửa hàng điện thoại. Tất cả quyền lợi được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
