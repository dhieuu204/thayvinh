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
 * Thêm sản phẩm vào giỏ. Nếu trùng id + variantId + color thì tăng qty.
 * @param {{ id, name, image, price, variantId, variant, color, quantity }} item
 */
export const addToCart = (item) => {
  const cart = getCart();
  const idx = cart.findIndex(
    (i) =>
      i.id === item.id &&
      (i.variantId ?? null) === (item.variantId ?? null) &&
      i.color === item.color
  );
  if (idx !== -1) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/add", "POST", {
    productId: item.id,
    variantId: item.variantId || null,
    color: item.color || "",
    quantity: item.quantity,
  });
};

/**
 * Cập nhật số lượng của 1 item.
 * @param {string} id productId
 * @param {string} variant variant label (for localStorage dedup)
 * @param {string} color
 * @param {number} quantity
 * @param {string|null} [variantId] ObjectId ref ProductVariant
 */
export const updateQty = (id, variant, color, quantity, variantId = null) => {
  const cart = getCart().map((i) =>
    i.id === id && i.variant === variant && i.color === color
      ? { ...i, quantity }
      : i
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/update", "PUT", { productId: id, variantId: variantId || null, quantity });
};

/**
 * Xoá 1 item khỏi giỏ.
 * @param {string} id productId
 * @param {string} variant variant label (for localStorage dedup)
 * @param {string} color
 * @param {string|null} [variantId] ObjectId ref ProductVariant
 */
export const removeFromCart = (id, variant, color, variantId = null) => {
  const cart = getCart().filter(
    (i) => !(i.id === id && i.variant === variant && i.color === color)
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  syncServer("/api/cart/remove", "DELETE", { productId: id, variantId: variantId || null });
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
