import { Link } from "react-router-dom";

/**
 * Breadcrumb dùng chung toàn app.
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 * items cuối cùng không cần `to` (trang hiện tại).
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <div className="border-b border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-3 md:px-8">
        <nav className="flex items-center gap-1.5 text-sm text-[#6e6e73]">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-[#c7c7cc]">/</span>}
                {isLast || !item.to ? (
                  <span className={isLast ? "text-[#1d1d1f] truncate max-w-[200px]" : ""}>
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.to} className="hover:text-[#1d1d1f] transition-colors">
                    {item.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
