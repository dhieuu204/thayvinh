import { API_URL } from "./api";

const CART_KEY = "cart";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function syncServer(path, method, body) {
  const headers = authHeaders();
  if (!headers) return;
  fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/** @returns {Array} danh sách items trong giỏ hàng */
export const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * Thêm sản phẩm vào giỏ. Nếu trùng id + variant + color thì tăng qty.
 * @param {{ id, name, image, price, variant, color, quantity }} item
 */
export const addToCart = (item) => {
  const cart = getCart();
  const idx = cart.findIndex(
    (i) =>
      i.id === item.id &&
      i.variant === item.variant &&
      i.color === item.color
  );
  if (idx !== -1) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/add", "POST", { productId: item.id, quantity: item.quantity });
};

/**
 * Cập nhật số lượng của 1 item.
 */
export const updateQty = (id, variant, color, quantity) => {
  const cart = getCart().map((i) =>
    i.id === id && i.variant === variant && i.color === color
      ? { ...i, quantity }
      : i
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/update", "PUT", { productId: id, quantity });
};

/**
 * Xoá 1 item khỏi giỏ.
 */
export const removeFromCart = (id, variant, color) => {
  const cart = getCart().filter(
    (i) => !(i.id === id && i.variant === variant && i.color === color)
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/remove", "DELETE", { productId: id });
};

/** Xoá toàn bộ giỏ hàng */
export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/clear", "DELETE", {});
};

/** Tính tổng số lượng items */
export const getCartCount = () =>
  getCart().reduce((sum, i) => sum + i.quantity, 0);

/** Tính tổng tiền */
export const getCartTotal = () =>
  getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
