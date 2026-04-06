# Trạng thái dự án — Cập nhật 2026-04-07

## Môi trường

| | Giá trị |
|--|--|
| Backend | `http://localhost:3000` — chạy bằng `node app.js` trong `/home/kali/code/back-end/main` |
| Frontend | `http://localhost:5178` — chạy bằng `npm run dev` trong `/home/kali/code/front-end/haha` |
| Database | MongoDB local `mongodb://localhost:27017/ecommerce` (standalone — **không có replica set**) |
| Seed | `node seed.js` trong `/home/kali/code/back-end/main` |

Tài khoản test:
- Admin: `admin@gmail.com` / `Admin@123`
- User: `user01@gmail.com` / `User@123`

---

## ✅ Đã hoàn thành

### Kết nối backend ↔ frontend (dữ liệu thật)
- [x] Fix `.env` frontend: `VITE_API_URL=http://localhost:3000`
- [x] Fix CORS backend
- [x] Fix login: backend nhận cả `email` lẫn `username`, trả về `user` object
- [x] Tạo seed data: 2 users, 6 categories, 12 products, 13 variants, 4 shipping zones, 2 vouchers

### lib/api.js — axiosClient với auto refresh token
- [x] Viết lại `lib/api.js`: tạo `axiosClient` (axios instance) với baseURL + attach token mỗi request
- [x] Interceptor tự động refresh token khi nhận 401 (gọi `POST /api/auth/refresh-token`)
- [x] Queue các request đang chờ khi đang refresh (tránh race condition nhiều 401 đồng thời)
- [x] Nếu refresh thất bại → clear localStorage + redirect `/login`

### 10 User features
- [x] **Bell thông báo** — Header: badge unread-count, dropdown panel, mark-one/mark-all đã đọc
- [x] **Logout gọi API** — AccountPage: `POST /api/auth/logout` trước khi clear localStorage
- [x] **Voucher trong Checkout** — input mã, `GET /api/vouchers/check?code=`, hiển thị discount
- [x] **Phí ship từ API** — Checkout: load zones `GET /api/shipping/zones`, dropdown chọn tỉnh kèm phí
- [x] **Trang tracking** — `TrackingPage.jsx`: `GET /api/shipping/track/:trackingCode`, timeline events
- [x] **Yêu cầu hoàn hàng** — OrdersPage: `ReturnModal`, `POST /api/orders/:orderId/return`
- [x] **Điểm tích lũy** — AccountPage tab "Loyalty": balance, redeem, transaction history
- [x] **Xóa tài khoản** — AccountPage: confirm dialog + `DELETE /api/users/account`
- [x] **Lọc theo giá** — ProductsPage: minPrice/maxPrice inputs + URLSearchParams
- [x] **Route `/tracking`** — đã thêm vào `App.jsx`

### Admin Panel (toàn bộ)
- [x] `AdminLayout.jsx` — sidebar 8 mục, mobile responsive, logout
- [x] `AdminDashboardPage.jsx` — stat cards, revenue bar chart, low-stock, top products, recent orders
- [x] `AdminOrdersPage.jsx` — bảng đơn hàng, filter tab, update status, expand chi tiết
- [x] `AdminUsersPage.jsx` — danh sách user, search, ban/unban, **tạo tài khoản mới**
- [x] `AdminProductsPage.jsx` — CRUD sản phẩm (modal thêm/sửa, xóa)
- [x] `AdminReviewsPage.jsx` — tìm sản phẩm, xem reviews, reply/xóa
- [x] `AdminCategoriesPage.jsx` — CRUD danh mục
- [x] `AdminVouchersPage.jsx` — CRUD voucher (percent/fixed, startsAt, expiresAt, usageLimit...)
- [x] `AdminReturnRequestsPage.jsx` — danh sách hoàn hàng, filter tab, approve/reject
- [x] Routes `/admin/categories`, `/admin/vouchers`, `/admin/returns` đã thêm vào `App.jsx`
- [x] **Tất cả admin pages** — migrate từ `axios` + `authH()` sang `axiosClient`

### Bug fixes hôm nay (2026-04-07)
- [x] **Voucher admin** — fix endpoint (`/api/vouchers/admin` → `/api/vouchers`), fix response parse (`data.vouchers`), fix field `minOrder` → `minOrderValue`, thêm field `startsAt` (bắt buộc theo backend)
- [x] **Cart badge không cập nhật khi xóa** — CartPage server-mode `handleRemove`/`handleQtyChange`: sync localStorage + dispatch `cartUpdated` sau khi update
- [x] **Wishlist double-click bug** — event listener `wishlistUpdated` dùng localStorage thay vì re-fetch server (tránh race condition); `handleRemove` optimistic update
- [x] **Orders không hiển thị sau đặt hàng** — thêm `STATUS_MAP` trong `normalizeOrder` để map `"Pending"` → `"pending"`, `"Shipped"` → `"shipping"` v.v.
- [x] **Tạo đơn hàng thất bại (root cause)** — MongoDB standalone không hỗ trợ transactions. Đã bỏ `session.startTransaction()` trong `createOrder` và `cancelOrder` (OrderController.js), giữ nguyên toàn bộ logic
- [x] **Mua ngay không thêm vào giỏ** — race condition: server cart chưa sync kịp khi CartPage load. Fix 2 mặt: (1) CartPage merge localStorage với server cart, (2) `handleBuyNow` truyền sản phẩm qua `navigate state` đến CheckoutPage thay vì qua cart — không ảnh hưởng giỏ hàng hiện tại

---

## ❌ Chưa làm / Có thể cải thiện

| Hạng mục | Ghi chú |
|----------|---------|
| VNPay / MoMo / Bank tích hợp thật | Hiện chỉ là UI chọn, không có payment gateway |
| AdminFlashSalesPage | Chưa tạo |
| AdminBannersPage | Chưa tạo |
| AdminShippingPage | Chưa tạo (quản lý shipping zones) |
| Email xác nhận đơn hàng | Backend có TODO comment, chưa có mailer |
| Tìm kiếm toàn cục nâng cao | Hiện chỉ search theo tên |

---

## File quan trọng

| File | Mô tả |
|------|-------|
| `/home/kali/code/back-end/main/controllers/OrderController.js` | createOrder + cancelOrder đã bỏ transaction (MongoDB standalone) |
| `/home/kali/code/back-end/main/controllers/AuthController.js` | login, changePassword, refreshToken |
| `/home/kali/code/back-end/main/controllers/UserController.js` | updateProfile (nhận fullName, phone, address) |
| `/home/kali/code/front-end/haha/src/lib/api.js` | axiosClient với auto refresh token interceptor |
| `/home/kali/code/front-end/haha/src/lib/cart.js` | localStorage + server sync khi login |
| `/home/kali/code/front-end/haha/src/lib/wishlist.js` | localStorage + server sync khi login |
| `/home/kali/code/front-end/haha/src/pages/CheckoutPage.jsx` | Hỗ trợ `directBuy` state từ "Mua ngay" |
| `/home/kali/code/front-end/haha/src/pages/admin/` | Toàn bộ 9 admin pages |
| `/home/kali/code/front-end/haha/src/App.jsx` | Routes đầy đủ bao gồm /admin/* và /tracking |

---

## Lưu ý kỹ thuật

- Frontend: **React 19 + Vite 6 + Tailwind CSS** — font SF Pro, màu `#1d1d1f` (Apple style)
- Backend: **Express 5.1 + Mongoose + JWT** — access token 2h, refresh token 7d (HTTP-only cookie)
- **MongoDB standalone** — không dùng transactions, dùng sequential operations thay thế
- Cart & Wishlist: localStorage là nguồn chính cho guest; khi login load từ server + sync ngược lên
- "Mua ngay" truyền items qua `navigate("/checkout", { state: { directBuy: [...] } })` — không dùng cart
- Order payload backend cần: `{ products: [{product: id, quantity}], billingInfo: {fullName, phone, email, street, district, city}, note, paymentMethod, voucherCode? }`
- Backend status values: `"Pending"`, `"Confirmed"`, `"Shipped"`, `"Delivered"`, `"Cancelled"` (PascalCase) — frontend map sang lowercase trong `normalizeOrder`
- Vite port hay thay đổi nếu port bị chiếm — kiểm tra log khi chạy (`npm run dev`)
