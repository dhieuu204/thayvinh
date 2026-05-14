import { API_URL } from "./api";

const WISHLIST_KEY = "wishlist";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function syncServer(productId) {
  const headers = authHeaders();
  if (!headers) return;
  // POST /api/wishlist toggles add/remove on server
  fetch(`${API_URL}/api/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ productId }),
  }).catch(() => {});
}

/** @returns {Array} danh sách sản phẩm yêu thích */
export const getWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
};

/** Kiểm tra sản phẩm có trong wishlist không */
export const isInWishlist = (id) => getWishlist().some((i) => i.id === id);

/**
 * Toggle sản phẩm trong wishlist.
 * @param {object} product
 * @returns {boolean} true nếu vừa thêm vào, false nếu vừa xoá
 */
export const toggleWishlist = (product) => {
  const list = getWishlist();
  const exists = list.some((i) => i.id === product.id);
  const updated = exists
    ? list.filter((i) => i.id !== product.id)
    : [
        ...list,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          oldPrice: product.oldPrice,
          category: product.category,
          badge: product.badge,
          rating: product.rating,
          reviews: product.reviews,
          variants: product.variants,
          colors: product.colors,
        },
      ];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("wishlistUpdated"));
  syncServer(product.id);
  return !exists;
};

/** Xoá khỏi wishlist theo id */
export const removeFromWishlist = (id) => {
  const updated = getWishlist().filter((i) => i.id !== id);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("wishlistUpdated"));
  syncServer(id);
};
