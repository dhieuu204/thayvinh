# Backend Flow Documentation

## 📋 Tổng Quan Hệ Thống

Đây là một E-Commerce Backend được xây dựng với **Node.js + Express + MongoDB**, cung cấp các API cho ứng dụng frontend React.

### Tech Stack
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB (Mongoose 8.13.2)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs 3.0.2
- **Email Service**: Nodemailer 6.10.1
- **Environment Config**: dotenv 16.5.0
- **CORS Support**: Cho phép frontend ở localhost:5173

---

## 🏗️ Kiến Trúc Thư Mục

```
main/
├── app.js                  # Entry point - khởi chạy server
├── config/
│   ├── db.js              # Kết nối MongoDB
│   └── mailer.js          # Cấu hình gửi email (Nodemailer)
├── middleware/
│   └── authMiddleware.js  # Middleware xác thực JWT
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   ├── Cart.js
│   ├── Order.js
│   ├── WishList.js
│   └── Otp.js
├── controllers/           # Business logic
│   ├── AuthController.js
│   ├── UserController.js
│   ├── ProductController.js
│   ├── CategoryController.js
│   ├── CartController.js
│   ├── OrderController.js
│   ├── PaymentController.js
│   ├── AdminController.js
│   └── WishListController.js
├── routes/                # API endpoints
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── categoryRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── paymentRoutes.js
│   ├── adminRoutes.js
│   └── wishListRoutes.js
├── scripts/               # Seed database
│   ├── seed_1.js
│   ├── seed_2.js
│   └── seed_3.js
└── uploads/               # Lưu trữ file upload
    └── img/
```

---

## 🚀 Luồng Khởi Chạy Server (app.js)

```
1. Load biến môi trường (.env)
   ↓
2. Import tất cả dependencies (express, cors, mongoose, routes)
   ↓
3. Khởi tạo Express app
   ↓
4. Cấu hình CORS
   - Cho phép yêu cầu từ http://localhost:5173 (frontend)
   - Bật credentials cho cookie authentication
   ↓
5. Cấu hình middleware
   - app.use(express.json()) - parse JSON
   - app.use(express.urlencoded({ extended: true })) - parse form data
   ↓
6. Kết nối MongoDB
   ↓
7. Mount routes
   - /api/auth → authentication
   - /api/users → user management
   - /api/products → product listing
   - /api/categories → product categories
   - /api/cart → shopping cart
   - /api/orders → order management
   - /api/payments → payment processing
   - /api/admin → admin functions
   - /api/wishlist → wishlist management
   ↓
8. Lắng nghe trên PORT (mặc định 3000)
```

---

## 🔐 Authentication Flow

### 1. **Đăng Ký (Register)**
```
POST /api/auth/register
├── Input: {username, email, password}
├── Validate: kiểm tra username chưa tồn tại
├── Hash: mã hóa password với bcryptjs
├── Save: lưu user vào MongoDB
└── Response: success message
```

### 2. **Đăng Nhập (Login)**
```
POST /api/auth/login
├── Input: {username, password}
├── Find: tìm user theo username
├── Verify: so sánh password hash
├── Generate: tạo JWT token (hết hạn sau 2 giờ)
└── Response: {token}
```

### 3. **Quên Mật Khẩu (Forgot Password)**
```
POST /api/auth/forgot-password
├── Input: {email}
├── Find: tìm user theo email
├── Generate: tạo OTP 6 chữ số
├── Save: lưu OTP + thời gian hết hạn (5 phút)
├── Send email: gửi OTP qua Nodemailer
└── Response: success message
```

### 4. **Xác Thực OTP (Verify OTP)**
```
POST /api/auth/verify-otp
├── Input: {email, code}
├── Find: tìm OTP record
├── Validate: kiểm tra code đúng
├── Check: kiểm tra OTP chưa hết hạn
└── Response: success/error
```

### 5. **Reset Mật Khẩu (Reset Password)**
```
POST /api/auth/reset-password
├── Sau khi verify OTP thành công
├── Input: {email, newPassword}
├── Update: mã hóa mật khẩu mới
└── Save: lưu vào database
```

---

## 🔒 Middleware Authentication

### **authMiddleware.js** - Kiểm tra JWT Token

```javascript
authenticate middleware:
├── Lấy token từ header: Authorization: Bearer <token>
├── Verify: xác minh token với JWT_SECRET
├── Find user: lấy thông tin user từ decoded token id
├── Attach: gắn user info vào req.user
└── Cho phép tiếp tục nếu thành công

authorizeAdmin middleware:
├── Kiểm tra: req.user.role === 'admin'
├── Nếu có quyền: next()
└── Nếu không: trả về 403 Forbidden
```

### **Routes với Authentication**

- **Yêu cầu authentication**: `/api/cart/view`, `/api/cart/add`, `/api/orders/create`, `/api/users/*` (hầu hết)
- **Yêu cầu admin**: `/api/auth/all` (get all users)
- **Public routes**: `/api/auth/register`, `/api/auth/login`, `/api/products/*`, `/api/categories/*`

---

## 🛒 Luồng Mua Hàng (Shopping Flow)

```
1. Xem Sản Phẩm
   GET /api/products/ → Lấy danh sách sản phẩm
   GET /api/products/:id → Chi tiết sản phẩm
   GET /api/products/search → Tìm kiếm
   GET /api/products/filter/category → Lọc theo category
   GET /api/products/filter/price → Lọc theo giá
   GET /api/products/flash-sales → Flash sales

2. Quản Lý Giỏ Hàng (yêu cầu authentication)
   GET /api/cart/view → Xem giỏ hàng
   POST /api/cart/add → Thêm sản phẩm
   PUT /api/cart/update → Cập nhật số lượng
   DELETE /api/cart/remove → Xóa sản phẩm
   DELETE /api/cart/clear → Xóa tất cả

3. Wishlist (yêu cầu authentication)
   GET /api/wishlist → Xem wishlist
   POST /api/wishlist/add → Thêm sản phẩm
   DELETE /api/wishlist/remove → Xóa sản phẩm

4. Tạo Đơn Hàng
   POST /api/orders/create (authenticate)
   ├── Input: giỏ hàng, địa chỉ giao hàng
   ├── Validate: kiểm tra sản phẩm còn hàng
   ├── Create: tạo Order record
   ├── Clear: xóa giỏ hàng
   └── Response: order info

5. Xem Đơn Hàng
   GET /api/orders/my-orders (authenticate)
   ├── Lấy tất cả đơn hàng của user
   └── Response: danh sách orders

6. Thanh Toán
   POST /api/payments/... (yêu cầu authentication)
   ├── Xử lý thanh toán
   └── Cập nhật trạng thái order

7. Xóa Đơn Hàng
   DELETE /api/orders/delete/:orderId (authenticate)
   ├── Kiểm tra quyền (chủ sở hữu)
   └── Xóa order
```

---

## 👤 Luồng User Management

```
Các endpoint User (yêu cầu authentication):
├── GET /api/users/:id → Lấy thông tin user
├── PUT /api/users/update → Cập nhật profile
├── GET /api/users/profile → Lấy profile
└── DELETE /api/users/:id → Xóa tài khoản

Admin endpoint:
└── GET /api/auth/all → Lấy tất cả users (yêu cầu admin role)
```

---

## 📊 Cấu Trúc Data Models

### **User Model**
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String (unique),
  role: String (default: 'user', có thể 'admin'),
  phone: String,
  address: {
    street: String,
    district: String,
    city: String
  },
  firstName: String,
  lastName: String
}
```

### **Product Model**
```javascript
{
  name: String,
  price: Number,
  description: String,
  category: ObjectId (ref Category),
  image: String,
  inStock: Boolean,
  createdAt: Date,
  flashSales: Number (discount %),
  rating: Number,
  color: String,
  quantity: Number
}
```

### **Category Model**
```javascript
{
  name: String,
  description: String,
  image: String
}
```

### **Cart Model**
```javascript
{
  userId: ObjectId (ref User),
  items: [
    {
      productId: ObjectId (ref Product),
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number
}
```

### **Order Model**
```javascript
{
  userId: ObjectId (ref User),
  products: [
    {
      productId: ObjectId,
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  status: String (pending, confirmed, shipped, delivered),
  shippingAddress: Object,
  createdAt: Date,
  paymentStatus: String
}
```

### **OTP Model**
```javascript
{
  email: String,
  code: String (6 digits),
  expiresAt: Date
}
```

### **WishList Model**
```javascript
{
  userId: ObjectId (ref User),
  products: [ObjectId] (ref Product)
}
```

---

## 🔄 Request-Response Flow (Ví dụ: Add to Cart)

```
Client Request:
POST /api/cart/add
Headers: {
  Authorization: "Bearer <jwt_token>",
  Content-Type: "application/json"
}
Body: {
  productId: "123...",
  quantity: 2
}
     ↓
     ↓
Express Router (cartRoutes.js):
├── Kiểm tra route /api/cart/add
├── Chạy middleware authenticate
│   └── Verify JWT token, attach req.user
└── Gọi CartController.addToCart
     ↓
     ↓
CartController:
├── Lấy dữ liệu từ req.body
├── Validate input
├── Tìm hoặc tạo Cart của user
├── Thêm/cập nhật item trong cart
├── Tính toán totalPrice
└── Lưu Cart vào MongoDB
     ↓
     ↓
Response:
{
  status: 200,
  data: { cart info },
  message: "Thêm vào giỏ hàng thành công"
}
```

---

## ⚙️ Error Handling

```
Status Codes sử dụng:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate username/email)
- 500: Server Error

Error Response Format:
{
  status: error_code,
  message: "Mô tả lỗi"
}
```

---

## 🚀 Chạy Server

```bash
# Development (với hot reload)
npm run dev

# Production
npm start

# Server sẽ chạy trên http://localhost:3000
```

---

## 🌐 CORS Configuration

```javascript
Frontend URL được phép: http://localhost:5173
- Credentials: true (cho phép gửi cookies)
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization
```

---

## 📝 Summary

**Backend Flow**:
1. ✅ Client gửi request HTTP đến Express server
2. ✅ CORS middleware kiểm tra quyền
3. ✅ Router tìm endpoint phù hợp
4. ✅ Middleware authenticate (nếu cần) verify JWT token
5. ✅ Controller xử lý business logic
6. ✅ Model tương tác với MongoDB
7. ✅ Response được gửi lại cho client

**Các tính năng chính**:
- 🔐 Authentication với JWT
- 👤 User management
- 📦 Product catalog & search
- 🛒 Shopping cart
- ❤️ Wishlist
- 📋 Order management
- 💳 Payment processing
- 👨‍💼 Admin dashboard
- 📧 Email notifications (OTP, password reset)

