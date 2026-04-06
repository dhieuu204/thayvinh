# So sánh Frontend ↔ Backend

## Tổng quan

| | Giá trị |
|--|--|
| Backend URL | `http://localhost:3000/api` |
| Frontend URL | `http://localhost:5175` |
| Ngày kiểm tra | 2026-04-05 |

---

## 🔴 Có trang nhưng gọi API sai hoặc không gọi

| Trang | Chức năng | Vấn đề | API đúng |
|-------|-----------|--------|---------|
| `OrdersPage.jsx:298` | Xem đơn hàng | Gọi `GET /api/orders` | `GET /api/orders/my` |
| `AccountPage.jsx:122` | Cập nhật profile | Gọi `PUT /api/auth/profile` | `PUT /api/users/profile` |
| `AccountPage.jsx:273` | Đổi mật khẩu | Gọi `PUT /api/auth/change-password` — không tồn tại | Cần thêm endpoint vào backend |
| `ContactPage.jsx:117` | Form liên hệ | Gọi `POST /api/contact` — không tồn tại | Cần thêm endpoint vào backend |
| `CartPage` | Giỏ hàng | Dùng `localStorage`, không gọi API | `GET/POST/PUT/DELETE /api/cart/*` |
| `WishlistPage` | Yêu thích | Dùng `localStorage`, không gọi API | `GET/POST/DELETE /api/wishlist/*` |
| `CheckoutPage` | Thanh toán VNPay | Không có nút chọn VNPay | `POST /api/payments/vnpay/create` |
| `ProductDetailPage` | Đánh giá sản phẩm | Không hiển thị reviews | `GET /api/reviews/product/:productId` |

---

## 🟡 Backend có API — Frontend chưa có giao diện

### Auth & User

| API | Mô tả | Frontend |
|-----|-------|---------|
| `POST /api/auth/logout` | Đăng xuất | Nút logout chỉ xóa localStorage, không gọi API |
| `POST /api/auth/refresh-token` | Làm mới token | Không tự động refresh khi token hết hạn (2h) |
| `GET /api/users/loyalty` | Điểm tích lũy + lịch sử | Không có trang hiển thị |
| `POST /api/users/loyalty/redeem` | Đổi điểm | Không có nút đổi điểm |
| `DELETE /api/users/account` | Xóa tài khoản | Không có tùy chọn trong AccountPage |

### Sản phẩm

| API | Mô tả | Frontend |
|-----|-------|---------|
| `GET /api/products/search?q=` | Tìm kiếm full-text | Thanh search chưa gọi API (nếu có) |
| `GET /api/products/filter/price?min=&max=` | Lọc theo giá | Không có bộ lọc giá |
| `GET /api/products/:id/variants` | Danh sách variants từ DB | Không fetch, hiện không có dữ liệu variants |
| `POST /api/products/:id/notify-restock` | Thông báo khi có hàng | Không có nút đăng ký |

### Đánh giá (Reviews)

| API | Mô tả | Frontend |
|-----|-------|---------|
| `GET /api/reviews/product/:productId` | Danh sách đánh giá | Trang sản phẩm không hiển thị reviews |
| `POST /api/reviews` | Viết đánh giá | Không có form |
| `PUT /api/reviews/:reviewId` | Sửa đánh giá | Không có |
| `DELETE /api/reviews/:reviewId` | Xóa đánh giá | Không có |

### Thông báo (Notifications)

| API | Mô tả | Frontend |
|-----|-------|---------|
| `GET /api/notifications` | Danh sách thông báo | Không có trang/panel |
| `GET /api/notifications/unread-count` | Số chưa đọc | Không có badge trên header |
| `PATCH /api/notifications/read-all` | Đánh dấu tất cả đã đọc | Không có |
| `PATCH /api/notifications/:id/read` | Đánh dấu 1 thông báo | Không có |

### Vận chuyển & Thanh toán

| API | Mô tả | Frontend |
|-----|-------|---------|
| `GET /api/shipping/fee?provinceCode=` | Tính phí ship | Checkout không tính phí ship từ API |
| `GET /api/shipping/zones` | Danh sách khu vực ship | Không hiển thị |
| `GET /api/shipping/track/:trackingCode` | Theo dõi đơn hàng | Không có trang tracking |
| `GET /api/payments/status/:orderId` | Trạng thái thanh toán | Không kiểm tra sau khi đặt |

### Voucher

| API | Mô tả | Frontend |
|-----|-------|---------|
| `GET /api/vouchers/check?code=` | Kiểm tra voucher | Checkout không có ô nhập voucher |

### Đơn hàng (bổ sung)

| API | Mô tả | Frontend |
|-----|-------|---------|
| `PATCH /api/orders/:orderId/cancel` | Hủy đơn | OrdersPage không có nút hủy |
| `POST /api/orders/:orderId/return` | Hoàn hàng | Không có |

---

## 🟢 Toàn bộ Admin — Frontend chưa có

Backend có đầy đủ `/api/admin/*` nhưng **không có trang Admin nào** trên frontend.

| Nhóm | API | Mô tả |
|------|-----|-------|
| Thống kê | `GET /api/admin/stats/overview` | Tổng quan: user, đơn hàng, doanh thu |
| Thống kê | `GET /api/admin/stats/revenue` | Doanh thu theo tháng |
| Thống kê | `GET /api/admin/stats/top-products` | Sản phẩm bán chạy |
| Thống kê | `GET /api/admin/stats/top-customers` | Khách hàng chi tiêu nhiều |
| Thống kê | `GET /api/admin/stats/low-stock` | Cảnh báo hết hàng |
| Đơn hàng | `GET /api/admin/orders` | Quản lý tất cả đơn |
| Đơn hàng | `PATCH /api/admin/orders/:id/status` | Cập nhật trạng thái đơn |
| Users | `GET /api/admin/users` | Danh sách người dùng |
| Users | `PATCH /api/admin/users/:id/ban` | Khóa/mở tài khoản |
| Banner | `GET/POST/PUT/DELETE /api/admin/banners` | Quản lý banner trang chủ |
| Flash Sale | `GET/POST/PUT/DELETE /api/admin/flash-sales` | Quản lý flash sale |
| Sản phẩm | `POST/PUT/DELETE /api/products` | Thêm/sửa/xóa sản phẩm |
| Danh mục | `POST/PUT/DELETE /api/categories` | Thêm/sửa/xóa danh mục |
| Voucher | `GET/POST/PUT/DELETE /api/vouchers` | Quản lý voucher |
| Reviews | `PATCH /api/reviews/:id/reply` | Admin phản hồi đánh giá |
| Shipping | `POST/PUT/DELETE /api/shipping/zones` | Quản lý khu vực ship |
| Returns | `GET /api/orders/returns` | Danh sách yêu cầu hoàn hàng |
| Returns | `PATCH /api/orders/returns/:id/approve` | Duyệt hoàn hàng |

---

## Thứ tự ưu tiên fix

| # | Ưu tiên | Việc cần làm |
|---|---------|-------------|
| 1 | 🔴 Cao | Fix sai path: `OrdersPage`, `AccountPage` |
| 2 | 🔴 Cao | Kết nối Cart & Wishlist với API server-side |
| 3 | 🟡 Trung bình | Hiển thị Reviews + form đánh giá trên trang sản phẩm |
| 4 | 🟡 Trung bình | Tích hợp VNPay + tính phí ship + nhập voucher trong Checkout |
| 5 | 🟡 Trung bình | Bell thông báo trên Header (badge + panel) |
| 6 | 🟡 Trung bình | Nút hủy đơn / yêu cầu hoàn hàng trong OrdersPage |
| 7 | 🟡 Trung bình | Auto refresh token (interceptor axios) |
| 8 | 🟢 Thấp | Trang Admin dashboard (thống kê, quản lý) |
| 9 | 🟢 Thấp | Loyalty points, xóa tài khoản, lọc giá |
| 10 | 🟢 Thấp | Trang theo dõi đơn hàng (tracking) |
