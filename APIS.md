# Kiểm tra kết nối Frontend ↔ Backend

## Tổng quan

| | Giá trị |
|--|--|
| Backend URL | `http://localhost:3000/api` |
| Frontend dev server | `http://localhost:5174` |
| VITE_API_URL (đã fix) | `http://localhost:3000` |
| Backend CORS (đã fix) | `http://localhost:5174` |

---

## ✅ Endpoint đúng — kết nối được

| File frontend | Method | Endpoint gọi | Backend thực tế |
|---------------|--------|-------------|-----------------|
| `SignUpPage.jsx:118` | POST | `/api/auth/register` | ✅ Khớp |
| `LoginPage.jsx:59` | POST | `/api/auth/login` | ✅ Khớp |
| `ForgotPasswordPage.jsx:34` | POST | `/api/auth/forgot-password` | ✅ Khớp |
| `ResetPasswordPage.jsx:100` | POST | `/api/auth/reset-password` | ✅ Khớp |
| `CheckoutPage.jsx:262` | POST | `/api/orders` | ✅ Khớp |

---

## ❌ Endpoint sai path — gọi nhầm, sẽ bị lỗi 404

| File frontend | Method | Frontend đang gọi | Đúng phải là | Ghi chú |
|---------------|--------|-------------------|--------------|---------|
| `AccountPage.jsx:122` | PUT | `/api/auth/profile` | `/api/users/profile` | Sai nhóm route: `auth` → `users` |
| `AccountPage.jsx:273` | PUT | `/api/auth/change-password` | **Không tồn tại** | Backend không có endpoint này |
| `OrdersPage.jsx:298` | GET | `/api/orders` | `/api/orders/my` | Thiếu `/my` ở cuối |
| `ContactPage.jsx:117` | POST | `/api/contact` | **Không tồn tại** | Backend chưa có route `/api/contact` |

---

## ⚠️ Trang dùng dữ liệu tĩnh thay vì gọi API

Các trang/component sau đang dùng `PRODUCT_LIST` hardcoded từ `src/lib/products.js`  
thay vì fetch từ backend. `fetchModel` trong `src/lib/fetch.js` đã được định nghĩa nhưng **không nơi nào sử dụng**.

| File frontend | Đang dùng | Nên gọi API |
|---------------|-----------|-------------|
| `ProductsPage.jsx:216` | `PRODUCT_LIST` static | `GET /api/products?page=&limit=&sort=` |
| `ProductDetailPage.jsx:143` | `PRODUCT_LIST` static | `GET /api/products/:id` |
| `CategoryPage.jsx:152` | `PRODUCT_LIST` static | `GET /api/categories/:id/products` |
| `components/Banner` | Không fetch | `GET /api/admin/banners` |
| `components/FlashSale` | Không fetch | `GET /api/products/flash-sales` |
| `components/Categories` | Không fetch | `GET /api/categories` |
| `components/BestSelling` | Không fetch | `GET /api/products?sort=best_seller` |
| `components/ExploreProducts` | Không fetch | `GET /api/products?sort=newest` |

---

## ⚠️ Cart & Wishlist không đồng bộ với server

Frontend quản lý cart và wishlist hoàn toàn qua `localStorage` (`src/lib/cart.js`, `src/lib/wishlist.js`),  
trong khi backend đã có đầy đủ API server-side.

| Chức năng | Frontend | Backend API có sẵn |
|-----------|----------|-------------------|
| Xem giỏ hàng | localStorage | `GET /api/cart/view` |
| Thêm vào giỏ | localStorage | `POST /api/cart/add` |
| Cập nhật số lượng | localStorage | `PUT /api/cart/update` |
| Xóa sản phẩm | localStorage | `DELETE /api/cart/remove` |
| Xóa toàn bộ | localStorage | `DELETE /api/cart/clear` |
| Xem wishlist | localStorage | `GET /api/wishlist` |
| Thêm/bỏ wishlist | localStorage | `POST /api/wishlist` |

---

## Các bước cần fix

### 1. Fix sai path (ưu tiên cao)

**`AccountPage.jsx:122`** — đổi `/api/auth/profile` → `/api/users/profile`

**`OrdersPage.jsx:298`** — đổi `/api/orders` → `/api/orders/my`

### 2. Tạo endpoint còn thiếu trong backend (hoặc bỏ chức năng)

- `PUT /api/auth/change-password` — hiện không tồn tại, cần thêm vào `AuthController` + route
- `POST /api/contact` — hiện không tồn tại, cần thêm route mới

### 3. Kết nối các trang sản phẩm với API thật

Thay `PRODUCT_LIST` static bằng `fetchModel` hoặc `axios` gọi `/api/products`, `/api/categories`, v.v.

### 4. Migrate Cart/Wishlist lên server-side (tùy chọn)

Thay `localStorage` bằng các API `/api/cart` và `/api/wishlist` để dữ liệu đồng bộ khi user đăng nhập nhiều thiết bị.

---

## Trạng thái tổng thể

| Hạng mục | Trạng thái |
|----------|-----------|
| Port backend (3000) | ✅ Đã fix `.env` frontend |
| CORS origin (5174) | ✅ Đã fix `.env` backend |
| Auth endpoints | ✅ Hoạt động |
| Checkout | ✅ Hoạt động |
| Account / Update profile | ❌ Sai path |
| Đổi mật khẩu | ❌ Endpoint không tồn tại |
| Xem đơn hàng | ❌ Sai path |
| Trang liên hệ | ❌ Endpoint không tồn tại |
| Trang sản phẩm | ⚠️ Dùng data giả |
| Giỏ hàng / Wishlist | ⚠️ Chỉ lưu localStorage |
