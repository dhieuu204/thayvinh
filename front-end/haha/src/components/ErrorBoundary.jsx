import { Component } from "react";

const SF_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4"
        style={{ fontFamily: SF_FONT }}
      >
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f0]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#e53e3e" opacity="0.15" />
              <path d="M12 8v4M12 16h.01" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="mb-2 text-[20px] font-bold text-[#1d1d1f]">Đã xảy ra lỗi</h1>
          <p className="mb-6 text-[14px] text-[#6e6e73]">Trang này gặp lỗi không mong muốn. Vui lòng thử lại.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="block w-full rounded-full bg-[#1d1d1f] py-3 text-[14px] font-semibold text-white hover:bg-[#3d3d3f] transition-all"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
