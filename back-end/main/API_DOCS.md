# API Documentation

Base URL: `http://localhost:3000/api`

Ký hiệu: 🔓 Public · 🔑 Cần đăng nhập (JWT) · 👑 Admin only

---

## 1. Auth — `/api/auth`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/register` | 🔓 | Đăng ký tài khoản |
| POST | `/login` | 🔓 | Đăng nhập, trả về accessToken + set refreshToken cookie |
| POST | `/logout` | 🔓 | Đăng xuất, xóa refreshToken cookie |
| POST | `/refresh-token` | 🔓 | Cấp lại accessToken từ refreshToken cookie |
| POST | `/forgot-password` | 🔓 | Gửi OTP về email |
| POST | `/verify-otp` | 🔓 | Xác thực OTP |
| POST | `/reset-password` | 🔓 | Đặt lại mật khẩu sau khi xác thực OTP |
| GET | `/google/callback` | 🔓 | Callback Google OAuth |
| GET | `/all` | 👑 | Lấy tất cả user (deprecated — dùng `/api/admin/users`) |

---

## 2. User — `/api/users`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/profile` | 🔑 | Lấy thông tin cá nhân |
| PUT | `/profile` | 🔑 | Cập nhật thông tin (fullName, phone, address, avatar) |
| DELETE | `/account` | 🔑 | Xóa tài khoản (soft delete + dọn cart/wishlist/tokens) |
| GET | `/loyalty` | 🔑 | Lấy điểm loyalty + lịch sử giao dịch |
| POST | `/loyalty/redeem` | 🔑 | Đổi điểm loyalty (atomic + idempotency) |
| GET | `/:id` | 🔑 | Lấy thông tin user theo ID |
| PATCH | `/:id/ban` | 👑 | Khóa / mở khóa tài khoản user |

---

## 3. Product — `/api/products`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | 🔓 | Danh sách sản phẩm (`?page=&limit=&sort=newest\|price_asc\|price_desc\|best_seller`) |
| GET | `/search?q=` | 🔓 | Tìm kiếm full-text |
| GET | `/flash-sales` | 🔓 | Danh sách sản phẩm flash sale |
| GET | `/filter/category?categoryId=` | 🔓 | Lọc theo danh mục |
| GET | `/filter/price?min=&max=` | 🔓 | Lọc theo khoảng giá |
| GET | `/:id` | 🔓 | Chi tiết sản phẩm |
| GET | `/:id/variants` | 🔓 | Danh sách biến thể sản phẩm |
| GET | `/:id/related` | 🔓 | Sản phẩm liên quan |
| POST | `/:id/notify-restock` | 🔑 | Đăng ký thông báo khi có hàng |
| POST | `/` | 👑 | Tạo sản phẩm mới |
| PUT | `/:id` | 👑 | Cập nhật sản phẩm |
| DELETE | `/:id` | 👑 | Xóa sản phẩm (soft delete) |
| GET | `/:id/restock-subscribers` | 👑 | Danh sách người đăng ký nhận thông báo |

---

## 4. Category — `/api/categories`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | 🔓 | Danh sách danh mục (chỉ active) |
| GET | `/:id` | 🔓 | Chi tiết danh mục |
| GET | `/:id/products` | 🔓 | Sản phẩm theo danh mục (có pagination) |
| POST | `/` | 👑 | Tạo danh mục mới |
| PUT | `/:id` | 👑 | Cập nhật danh mục |
| DELETE | `/:id` | 👑 | Xóa danh mục (soft delete) |

---

## 5. Cart — `/api/cart`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/view` | 🔑 | Xem giỏ hàng |
| POST | `/add` | 🔑 | Thêm sản phẩm vào giỏ |
| PUT | `/update` | 🔑 | Cập nhật số lượng sản phẩm |
| DELETE | `/remove` | 🔑 | Xóa một sản phẩm khỏi giỏ |
| DELETE | `/clear` | 🔑 | Xóa toàn bộ giỏ hàng |
| POST | `/voucher` | 🔑 | Áp dụng mã voucher |
| DELETE | `/voucher` | 🔑 | Gỡ mã voucher |

---

## 6. Order — `/api/orders`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/` | 🔑 | Tạo đơn hàng (atomic stock check + voucher + loyalty) |
| GET | `/my` | 🔑 | Lấy đơn hàng của tôi (có pagination) |
| PATCH | `/:orderId/cancel` | 🔑 | Hủy đơn (chỉ Pending/Confirmed) |
| POST | `/:orderId/return` | 🔑 | Yêu cầu hoàn trả (chỉ Delivered) |
| DELETE | `/:orderId` | 🔑 | Xóa đơn hàng |
| GET | `/returns` | 👑 | Danh sách yêu cầu hoàn trả |
| PATCH | `/returns/:returnId/approve` | 👑 | Duyệt yêu cầu hoàn trả |
| PATCH | `/returns/:returnId/reject` | 👑 | Từ chối yêu cầu hoàn trả |

---

## 7. Payment — `/api/payments`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/vnpay/create` | 🔑 | Tạo URL thanh toán VNPay |
| GET | `/vnpay/return` | 🔓 | VNPay callback (verify HMAC-SHA512 + idempotency) |
| GET | `/status/:orderId` | 🔑 | Kiểm tra trạng thái thanh toán đơn hàng |

---

## 8. Voucher — `/api/vouchers`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/check?code=` | 🔑 | Kiểm tra mã voucher hợp lệ |
| GET | `/` | 👑 | Danh sách voucher |
| GET | `/:id` | 👑 | Chi tiết voucher |
| POST | `/` | 👑 | Tạo voucher mới |
| PUT | `/:id` | 👑 | Cập nhật voucher |
| DELETE | `/:id` | 👑 | Xóa voucher (soft delete) |
| PATCH | `/:id/toggle` | 👑 | Bật/tắt voucher |

---

## 9. WishList — `/api/wishlist`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | 🔑 | Xem danh sách yêu thích |
| POST | `/` | 🔑 | Thêm/bỏ sản phẩm (toggle) |
| DELETE | `/` | 🔑 | Xóa sản phẩm khỏi wishlist |
| POST | `/add-all` | 🔑 | Thêm tất cả wishlist vào giỏ hàng |

---

## 10. Review — `/api/reviews`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/` | 🔑 | Tạo đánh giá (phải có đơn Delivered chứa sản phẩm) |
| GET | `/product/:productId` | 🔓 | Danh sách đánh giá theo sản phẩm + avg rating |
| PUT | `/:reviewId` | 🔑 | Cập nhật đánh giá của mình |
| DELETE | `/:reviewId` | 🔑 | Xóa đánh giá của mình |
| PATCH | `/:reviewId/reply` | 👑 | Admin phản hồi đánh giá |
| DELETE | `/:reviewId/admin` | 👑 | Admin xóa bất kỳ đánh giá |

---

## 11. Notification — `/api/notifications`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | 🔑 | Danh sách thông báo (hỗ trợ `?unreadOnly=true`) |
| GET | `/unread-count` | 🔑 | Số thông báo chưa đọc |
| PATCH | `/read-all` | 🔑 | Đánh dấu tất cả đã đọc |
| PATCH | `/:notificationId/read` | 🔑 | Đánh dấu một thông báo đã đọc |

---

## 12. Shipping — `/api/shipping`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/fee?provinceCode=` | 🔓 | Tính phí vận chuyển theo tỉnh/thành |
| GET | `/zones` | 🔓 | Danh sách khu vực vận chuyển |
| GET | `/track/:trackingCode` | 🔓 | Theo dõi đơn vị vận chuyển (GHN — coming soon) |
| POST | `/zones` | 👑 | Tạo khu vực vận chuyển |
| PUT | `/zones/:id` | 👑 | Cập nhật khu vực vận chuyển |
| DELETE | `/zones/:id` | 👑 | Xóa khu vực vận chuyển |

---

## 13. Admin — `/api/admin`

### Thống kê

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/stats/overview` | 👑 | Tổng quan: user, sản phẩm, đơn hàng, doanh thu |
| GET | `/stats/revenue?period=monthly&year=` | 👑 | Doanh thu theo tháng/ngày |
| GET | `/stats/top-products?limit=` | 👑 | Top sản phẩm bán chạy |
| GET | `/stats/top-customers?limit=` | 👑 | Top khách hàng chi tiêu nhiều nhất |
| GET | `/stats/categories` | 👑 | Thống kê theo danh mục |
| GET | `/stats/low-stock?threshold=` | 👑 | Cảnh báo sản phẩm sắp hết hàng |
| GET | `/stats/orders-by-status` | 👑 | Số đơn hàng theo trạng thái |

### Quản lý đơn hàng

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/orders?status=&page=&limit=` | 👑 | Tất cả đơn hàng (có filter + pagination) |
| PATCH | `/orders/:orderId/status` | 👑 | Cập nhật trạng thái đơn (state machine) |

### Quản lý user

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/users?search=&page=&limit=` | 👑 | Danh sách user (có tìm kiếm) |
| PATCH | `/users/:id/ban` | 👑 | Khóa / mở khóa tài khoản |

### Banner

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/banners` | 👑 | Danh sách banner |
| POST | `/banners` | 👑 | Tạo banner mới |
| PUT | `/banners/:id` | 👑 | Cập nhật banner |
| DELETE | `/banners/:id` | 👑 | Xóa banner (soft delete) |

### Flash Sale

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/flash-sales` | 👑 | Danh sách flash sale |
| POST | `/flash-sales` | 👑 | Tạo flash sale (tự cập nhật Product) |
| PUT | `/flash-sales/:id` | 👑 | Cập nhật flash sale |
| DELETE | `/flash-sales/:id` | 👑 | Xóa flash sale (tự hoàn Product) |

---

## Ghi chú chung

### Request Headers
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Response format
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Lý do lỗi." }
```

### Order status flow
```
Pending → Confirmed → Shipped → Delivered
Pending → Cancelled
Confirmed → Cancelled
```

### Điểm loyalty
- Earn: 1 điểm / 1.000 VND khi đặt hàng thành công
- Redeem: POST `/api/users/loyalty/redeem` với `{ points, idempotencyKey }`
