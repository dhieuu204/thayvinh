# 📋 Kế Hoạch Hoàn Thiện Frontend

> **Tech stack:** React 19 + Vite + TailwindCSS v4 + Framer Motion + Lucide + React Toastify + Axios  
> **Thiết kế:** Apple-inspired (font SF Pro, màu `#1d1d1f`, `#0071e3`, `#f5f5f7`)  
> **Dữ liệu:** Mock từ `src/lib/products.js` (sẽ chuyển sang API thật khi BE sẵn sàng)

---

## ✅ Trạng Thái Hiện Tại

| Trang | File | Trạng thái |
|---|---|---|
| Home | `HomePage.jsx` | ✅ Hoàn thành |
| Login | `LoginPage.jsx` | ✅ Hoàn thành |
| Sign Up | `SignUpPage.jsx` | ✅ Hoàn thành |
| Products (danh sách) | `ProductsPage.jsx` | ✅ Hoàn thành |
| Product Detail | `ProductDetailPage.jsx` | ✅ Hoàn thành |
| 404 Not Found | `NotFoundPage.jsx` | ✅ Hoàn thành |
| Giỏ hàng | `CartPage.jsx` | ❌ Placeholder |
| Thanh toán | `CheckoutPage.jsx` | ❌ Placeholder |
| Lịch sử đơn hàng | `OrdersPage.jsx` | ❌ Placeholder |
| Tài khoản | `AccountPage.jsx` | ❌ Placeholder |
| Wishlist | `WishlistPage.jsx` | ❌ Placeholder |
| Quên mật khẩu | `ForgotPasswordPage.jsx` | ❌ Placeholder |
| Đặt lại mật khẩu | `ResetPasswordPage.jsx` | ❌ Placeholder |
| Danh mục | `CategoryPage.jsx` | ❌ Placeholder |
| Giới thiệu | `AboutPage.jsx` | ❌ Placeholder |
| Liên hệ | `ContactPage.jsx` | ❌ Placeholder |

**Tiến độ: 6 / 16 trang (37.5%)**

---

## 🗓️ Lộ Trình Thực Hiện

### 🔴 GIAI ĐOẠN 1 — Luồng Mua Hàng Cốt Lõi
> Ưu tiên cao nhất vì đây là user journey chính, các trang liên kết trực tiếp với nhau.

---

#### 1.1 — `CartPage.jsx` _(~3–4h)_

**Mục tiêu:** Xem và quản lý sản phẩm trong giỏ hàng.

**UI cần có:**
- Danh sách cart items: ảnh, tên, variant đã chọn, màu, giá, số lượng
- Nút `+` / `-` để thay đổi số lượng, nút xoá (icon thùng rác)
- Phần tổng kết bên phải (sticky trên desktop):
  - Tạm tính (subtotal)
  - Phí vận chuyển (miễn phí nếu > 500k)
  - Tổng cộng
  - Nút **"Tiến hành thanh toán"** → `/checkout`
- Empty state khi giỏ hàng trống (icon + link về trang sản phẩm)
- Breadcrumb: Home / Cart

**State cần quản lý:**
```js
// Mỗi cart item
{ id, name, image, price, variant, color, quantity }
```

**Lưu ý kỹ thuật:**
- Dùng `localStorage` để persist cart (key: `cart`)
- Tạo helper: `src/lib/cart.js` với các hàm: `getCart`, `addToCart`, `updateQty`, `removeFromCart`, `clearCart`
- Kết nối nút "Thêm vào giỏ" trong `ProductDetailPage` với helper này

---

#### 1.2 — `CheckoutPage.jsx` _(~4–5h)_

**Mục tiêu:** Form đặt hàng, xác nhận và thanh toán.

**UI cần có:**
- **Cột trái — Form thông tin:**
  - Họ tên, SĐT, Email
  - Địa chỉ giao hàng (Tỉnh/Thành, Quận/Huyện, Phường/Xã, số nhà)
  - Ghi chú đơn hàng (textarea, optional)
- **Cột phải — Order Summary:**
  - Danh sách sản phẩm (thumbnail nhỏ + tên + qty + giá)
  - Tạm tính / Phí ship / Tổng
  - Phương thức thanh toán: COD / Chuyển khoản (radio cards)
- Nút **"Đặt hàng"** → gọi API → toast success → redirect `/orders`
- Validation: required fields, định dạng SĐT/email
- Loading state khi submit

**Lưu ý kỹ thuật:**
- Đọc cart từ `localStorage` để hiển thị order summary
- Sau khi đặt hàng thành công → `clearCart()` và redirect
- Guard: redirect về `/cart` nếu cart rỗng

---

#### 1.3 — `OrdersPage.jsx` _(~3h)_

**Mục tiêu:** Xem lịch sử đơn hàng của người dùng.

**UI cần có:**
- Tabs: **Tất cả / Chờ xác nhận / Đang giao / Đã giao / Đã huỷ**
- Mỗi đơn hàng hiển thị dạng card:
  - Mã đơn `#ORD-XXXXXX`, ngày đặt
  - Thumbnail sản phẩm (tối đa 3, còn lại hiện "+N")
  - Tổng tiền + trạng thái (badge màu)
  - Nút **"Xem chi tiết"** (expand accordion hoặc modal)
- Empty state nếu chưa có đơn hàng
- Loading skeleton khi fetch

**Lưu ý kỹ thuật:**
- Gọi API: `GET /orders` với Bearer token
- Mock data dự phòng nếu API chưa sẵn sàng
- Route đã có AuthRoute bảo vệ

---

### 🟡 GIAI ĐOẠN 2 — Khu Vực Tài Khoản

---

#### 2.1 — `AccountPage.jsx` _(~4h)_

**Mục tiêu:** Xem và cập nhật thông tin cá nhân.

**UI cần có:**
- Sidebar dọc (desktop) / Tabs (mobile):
  - Thông tin cá nhân
  - Đổi mật khẩu
  - Địa chỉ giao hàng đã lưu
  - Đăng xuất
- **Tab Thông tin cá nhân:**
  - Avatar (upload hoặc placeholder với chữ cái đầu)
  - Form: Họ tên, Email (readonly), SĐT, Ngày sinh, Giới tính
  - Nút Lưu thay đổi
- **Tab Đổi mật khẩu:**
  - Nhập mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu mới
- **Tab Địa chỉ:**
  - Danh sách địa chỉ đã lưu
  - Thêm / sửa / xoá địa chỉ

**Lưu ý kỹ thuật:**
- Gọi API: `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/change-password`
- Lưu user info vào state hoặc `localStorage`

---

#### 2.2 — `WishlistPage.jsx` _(~2h)_

**Mục tiêu:** Xem danh sách sản phẩm đã yêu thích.

**UI cần có:**
- Grid sản phẩm (tái sử dụng `ProductCard` từ `ProductsPage`)
- Nút xoá khỏi wishlist (icon ❌ góc card)
- Nút **"Thêm vào giỏ"** trên mỗi card
- Empty state: icon trái tim rỗng + link về trang sản phẩm
- Số lượng sản phẩm trong wishlist

**Lưu ý kỹ thuật:**
- Dùng `localStorage` (key: `wishlist`) hoặc API
- Tạo helper `src/lib/wishlist.js`: `getWishlist`, `toggleWishlist`, `isInWishlist`
- Kết nối nút ❤️ trong `ProductDetailPage` và `ProductCard`

---

### 🟠 GIAI ĐOẠN 3 — Auth Flows

---

#### 3.1 — `ForgotPasswordPage.jsx` _(~1.5h)_

**Mục tiêu:** Gửi email reset mật khẩu.

**UI cần có:**
- Layout centered (giống LoginPage)
- Step 1: Form nhập email → nút Gửi
- Step 2 (sau khi submit): Thông báo "Chúng tôi đã gửi email, kiểm tra hộp thư của bạn"
- Link quay lại Login

**Lưu ý kỹ thuật:**
- Gọi API: `POST /auth/forgot-password` với `{ email }`
- Validation email
- Loading + error state

---

#### 3.2 — `ResetPasswordPage.jsx` _(~1.5h)_

**Mục tiêu:** Đặt lại mật khẩu từ link email.

**UI cần có:**
- Layout centered (giống LoginPage)
- Form: Mật khẩu mới + Xác nhận mật khẩu mới
- Validation: match, độ dài tối thiểu
- Nút Đặt lại → redirect về `/login` khi thành công

**Lưu ý kỹ thuật:**
- Lấy token từ URL: `?token=xxxxx` và gửi lên API
- Gọi API: `POST /auth/reset-password` với `{ token, password }`

---

### 🔵 GIAI ĐOẠN 4 — Khám Phá Sản Phẩm

---

#### 4.1 — `CategoryPage.jsx` _(~2h)_

**Mục tiêu:** Hiển thị sản phẩm theo danh mục từ URL slug.

**UI cần có:**
- Header danh mục: tên + icon + mô tả ngắn
- Grid sản phẩm đã filter theo `params.slug` (tái sử dụng component từ `ProductsPage`)
- Bộ lọc sort (giống `ProductsPage`)
- Breadcrumb: Home / Categories / [Tên danh mục]

**Lưu ý kỹ thuật:**
- Đọc `params.slug` từ `useParams()`
- Map slug → category name: `{ iphone: "iPhone", ipad: "iPad", mac: "Mac", ... }`
- Tái dùng `ProductCard` và `Pagination` component từ `ProductsPage`
- Nếu category không tồn tại → redirect về `NotFoundPage`

---

### 🟢 GIAI ĐOẠN 5 — Nội Dung Tĩnh

---

#### 5.1 — `AboutPage.jsx` _(~2h)_

**Mục tiêu:** Giới thiệu thương hiệu, câu chuyện, đội ngũ.

**UI cần có:**
- Hero section: tagline lớn + ảnh nền
- Section "Câu chuyện của chúng tôi" (text + ảnh xen kẽ)
- Section thống kê số (animate counter khi vào viewport):
  - Số sản phẩm, khách hàng, năm kinh nghiệm, đánh giá 5 sao
- Section "Tại sao chọn chúng tôi?" (icon cards)
- Section đội ngũ (3–4 avatar cards với tên + chức vụ)

---

#### 5.2 — `ContactPage.jsx` _(~1.5h)_

**Mục tiêu:** Form liên hệ và thông tin liên lạc.

**UI cần có:**
- **Cột trái — Thông tin liên hệ:**
  - Địa chỉ, SĐT, Email hỗ trợ
  - Icon mạng xã hội
  - Giờ làm việc
- **Cột phải — Form liên hệ:**
  - Họ tên, Email, Chủ đề, Nội dung (textarea)
  - Nút Gửi → toast success
- Map embed (Google Maps iframe hoặc placeholder)

---

## 🏗️ Kiến Trúc & Quy Ước Code

### Cấu trúc file mới cần tạo

```
src/
├── lib/
│   ├── api.js          ✅ Có
│   ├── fetch.js        ✅ Có
│   ├── products.js     ✅ Có (mock data)
│   ├── animations.js   ✅ Có
│   ├── cart.js         ❌ Cần tạo (localStorage helpers)
│   └── wishlist.js     ❌ Cần tạo (localStorage helpers)
├── components/
│   ├── Header/         ✅ Có
│   ├── Footer/         ✅ Có
│   └── ... (các component khác)
└── pages/
    └── ... (theo lộ trình trên)
```

### Quy ước nhất quán

| Hạng mục | Quy ước |
|---|---|
| **Font** | SF Pro / `-apple-system` |
| **Màu chính** | `#1d1d1f` (text), `#0071e3` (accent), `#f5f5f7` (bg nhạt) |
| **Border radius** | `rounded-2xl` (cards), `rounded-full` (buttons/badges) |
| **Shadow** | `shadow-[0_4px_20px_rgba(0,0,0,0.06)]` |
| **Animation** | Dùng `framer-motion` + reuse từ `src/lib/animations.js` |
| **Icons** | `lucide-react` |
| **Toast** | `react-toastify` với `theme="colored"` |
| **Loading** | Skeleton animation (Tailwind `animate-pulse`) |
| **Error** | Toast hoặc inline error message |
| **Form validation** | Tự viết (không dùng thư viện form riêng) |
| **Auth guard** | Dùng `AuthRoute` đã có trong `App.jsx` |

### Pattern API Call chuẩn

```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const token = localStorage.getItem("token");
  fetch(`${API_URL}/endpoint`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => setData(data))
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

---

## 📦 Các Helper Cần Tạo

### `src/lib/cart.js`

```js
const CART_KEY = "cart";

export const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");

export const addToCart = (item) => {
  const cart = getCart();
  const existing = cart.find(
    (i) => i.id === item.id && i.variant === item.variant && i.color === item.color
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const updateQty = (id, variant, color, quantity) => {
  const cart = getCart().map((i) =>
    i.id === id && i.variant === variant && i.color === color
      ? { ...i, quantity }
      : i
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const removeFromCart = (id, variant, color) => {
  const cart = getCart().filter(
    (i) => !(i.id === id && i.variant === variant && i.color === color)
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const clearCart = () => localStorage.removeItem(CART_KEY);
```

### `src/lib/wishlist.js`

```js
const WISHLIST_KEY = "wishlist";

export const getWishlist = () =>
  JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");

export const isInWishlist = (id) => getWishlist().some((i) => i.id === id);

export const toggleWishlist = (product) => {
  const list = getWishlist();
  const exists = list.some((i) => i.id === product.id);
  const updated = exists ? list.filter((i) => i.id !== product.id) : [...list, product];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return !exists; // true nếu vừa thêm
};
```

---

## 🎯 Thứ Tự Làm Việc Đề Xuất

```
✅ SignUpPage (đang hoàn thành)
   ↓
1. CartPage        ← Kết nối với ProductDetailPage
2. CheckoutPage    ← Đọc cart, gọi API đặt hàng
3. OrdersPage      ← Sau khi đặt hàng redirect tới đây
   ↓
4. WishlistPage    ← Kết nối với ProductDetailPage
5. AccountPage     ← Profile + đổi mật khẩu
   ↓
6. ForgotPasswordPage
7. ResetPasswordPage
   ↓
8. CategoryPage    ← Tái dùng component từ ProductsPage
   ↓
9. AboutPage
10. ContactPage
```

---

## ⏱️ Ước Tính Thời Gian

| Giai đoạn | Trang | Thời gian |
|---|---|---|
| 1 — Mua hàng | CartPage + CheckoutPage + OrdersPage | ~10–12h |
| 2 — Tài khoản | AccountPage + WishlistPage | ~6h |
| 3 — Auth | ForgotPasswordPage + ResetPasswordPage | ~3h |
| 4 — Danh mục | CategoryPage | ~2h |
| 5 — Tĩnh | AboutPage + ContactPage | ~3.5h |
| **Tổng** | **10 trang còn lại** | **~25–27h** |

---

## 🔗 Kết Nối Giữa Các Trang (User Flow)

```
HomePage
  ├── [Sản phẩm] → ProductDetailPage
  │     ├── [Thêm vào giỏ] → CartPage
  │     │     └── [Thanh toán] → CheckoutPage
  │     │           └── [Đặt hàng thành công] → OrdersPage
  │     └── [Yêu thích] → WishlistPage
  │           └── [Thêm vào giỏ] → CartPage
  ├── [Danh mục] → CategoryPage → ProductDetailPage
  ├── [Tài khoản] → AccountPage
  │     └── [Đơn hàng] → OrdersPage
  ├── [Header Login] → LoginPage
  │     └── [Quên mật khẩu] → ForgotPasswordPage
  │           └── [Link email] → ResetPasswordPage
  └── [Footer] → AboutPage / ContactPage
```

---

_Cập nhật lần cuối: 2026-04-04_
