# Backend Description

## Tổng quan

| Thông tin | Giá trị |
|-----------|---------|
| Framework | Express.js 5.1.0 (Node.js) |
| Ngôn ngữ | JavaScript |
| Database | MongoDB (Mongoose 8.13.2) |
| Port mặc định | **3000** |
| API Base URL | `http://localhost:3000/api` |

## Cài đặt & Chạy

```bash
cd /home/kali/code/back-end/main
npm install
npm run dev   # development (nodemon)
npm start     # production
```

## Cấu hình CORS

```js
// app.js
cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
})
```

> **Lưu ý:** Backend cho phép request từ `http://localhost:5173` (hoặc `CLIENT_URL` trong .env)

## Authentication

- **Cơ chế:** JWT (JSON Web Token)
- **Access Token:** Gửi qua header `Authorization: Bearer <token>`, hết hạn sau **2 giờ**
- **Refresh Token:** Lưu trong HTTP-only cookie `refreshToken`, hết hạn sau **7 ngày**
- **Middleware:**
  - `authenticate` — xác thực JWT
  - `authorizeAdmin` — kiểm tra quyền admin

## Các biến môi trường (.env)

```
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=secret
CLIENT_URL=http://localhost:5173
```

## Danh sách API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/register` | Public | Đăng ký |
| POST | `/login` | Public | Đăng nhập (trả về accessToken + cookie) |
| POST | `/logout` | Public | Đăng xuất |
| POST | `/refresh-token` | Public | Làm mới access token |
| POST | `/forgot-password` | Public | Gửi OTP qua email |
| POST | `/verify-otp` | Public | Xác minh OTP |
| POST | `/reset-password` | Public | Đặt lại mật khẩu |

### Users (`/api/users`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/profile` | JWT | Xem hồ sơ |
| PUT | `/profile` | JWT | Cập nhật hồ sơ |
| DELETE | `/account` | JWT | Xóa tài khoản |
| GET | `/loyalty` | JWT | Điểm tích lũy |
| POST | `/loyalty/redeem` | JWT | Đổi điểm |
| PATCH | `/:id/ban` | Admin | Ban/unban user |

### Products (`/api/products`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Public | Danh sách sản phẩm (có phân trang) |
| GET | `/search?q=` | Public | Tìm kiếm |
| GET | `/flash-sales` | Public | Flash sale |
| GET | `/filter/category?categoryId=` | Public | Lọc theo danh mục |
| GET | `/filter/price?min=&max=` | Public | Lọc theo giá |
| GET | `/:id` | Public | Chi tiết sản phẩm |
| POST | `/` | Admin | Tạo sản phẩm |
| PUT | `/:id` | Admin | Sửa sản phẩm |
| DELETE | `/:id` | Admin | Xóa sản phẩm |

### Categories (`/api/categories`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Public | Tất cả danh mục |
| GET | `/:id/products` | Public | Sản phẩm theo danh mục |
| POST | `/` | Admin | Tạo danh mục |
| PUT | `/:id` | Admin | Sửa danh mục |
| DELETE | `/:id` | Admin | Xóa danh mục |

### Cart (`/api/cart`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/view` | JWT | Xem giỏ hàng |
| POST | `/add` | JWT | Thêm vào giỏ |
| PUT | `/update` | JWT | Cập nhật số lượng |
| DELETE | `/remove` | JWT | Xóa sản phẩm |
| DELETE | `/clear` | JWT | Xóa toàn bộ giỏ |
| POST | `/voucher` | JWT | Áp dụng voucher |

### Orders (`/api/orders`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/` | JWT | Tạo đơn hàng |
| GET | `/my` | JWT | Đơn hàng của tôi |
| PATCH | `/:orderId/cancel` | JWT | Hủy đơn |
| POST | `/:orderId/return` | JWT | Yêu cầu hoàn hàng |

### Payments (`/api/payments`)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/vnpay/create` | JWT | Tạo URL thanh toán VNPay |
| GET | `/vnpay/return` | Public | Callback từ VNPay |
| GET | `/status/:orderId` | JWT | Trạng thái thanh toán |

### Vouchers, Wishlist, Reviews, Notifications, Shipping, Admin
- Đầy đủ CRUD cho Admin
- User endpoints được bảo vệ bằng JWT

## Cấu trúc thư mục

```
back-end/main/
├── app.js                  # Entry point, cấu hình Express + CORS + routes
├── config/
│   ├── db.js               # Kết nối MongoDB
│   └── mailer.js           # Cấu hình email (nodemailer)
├── middleware/
│   └── authMiddleware.js   # JWT authenticate + authorizeAdmin
├── models/                 # Mongoose schemas (User, Product, Order, ...)
├── controllers/            # Business logic
├── routes/                 # Route definitions (13 nhóm route)
└── .env                    # Biến môi trường
```
