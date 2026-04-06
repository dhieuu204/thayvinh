# Frontend Description

## Tổng quan

| Thông tin | Giá trị |
|-----------|---------|
| Framework | React 19.0.0 + React Router v7 |
| Build tool | Vite 6.3.1 |
| Ngôn ngữ | JavaScript (JSX) |
| Port dev | **5174** (cấu hình trong vite.config.js) |
| HTTP Client | Axios 1.9.0 |

## Cài đặt & Chạy

```bash
cd /home/kali/code/front-end/haha
npm install
npm run dev     # Chạy ở http://localhost:5174
npm run build   # Build production
```

## Cấu hình API URL

File: `/home/kali/code/front-end/haha/.env`

```env
VITE_API_URL=http://localhost:5000
```

File: `/home/kali/code/front-end/haha/src/lib/api.js`

```js
const API_URL = import.meta.env.VITE_API_URL;
```

## Authentication

- **Lưu trữ:** `localStorage`
  - Access Token: `localStorage.getItem("token")`
  - User data: `localStorage.getItem("user")`
- **Gửi token:** Header `Authorization: Bearer <token>` qua axios
- **DEV_BYPASS:** Trong `App.jsx` có flag `DEV_BYPASS = true` → **bỏ qua xác thực** cho tất cả route protected khi dev

## Các route trang

| Path | Trang | Auth |
|------|-------|------|
| `/` | Trang chủ | Public |
| `/login` | Đăng nhập | Public |
| `/signup` | Đăng ký | Public |
| `/forgot-password` | Quên mật khẩu | Public |
| `/reset-password` | Đặt lại mật khẩu | Public |
| `/products` | Danh sách sản phẩm | Public |
| `/products/:id` | Chi tiết sản phẩm | Public |
| `/categories/:slug` | Sản phẩm theo danh mục | Public |
| `/cart` | Giỏ hàng | Protected |
| `/checkout` | Thanh toán | Protected |
| `/wishlist` | Danh sách yêu thích | Protected |
| `/account` | Tài khoản | Protected |
| `/orders` | Đơn hàng | Protected |
| `/about` | Giới thiệu | Public |
| `/contact` | Liên hệ | Public |
| `*` | 404 | - |

## Các API endpoint frontend gọi

```
POST   ${API_URL}/api/auth/register
POST   ${API_URL}/api/auth/login
POST   ${API_URL}/api/auth/forgot-password
POST   ${API_URL}/api/auth/reset-password
GET    ${API_URL}/api/users/profile
PUT    ${API_URL}/api/users/profile
GET    ${API_URL}/api/orders
POST   ${API_URL}/api/orders
... (và nhiều endpoint khác)
```

## Cấu trúc thư mục

```
front-end/haha/
├── src/
│   ├── main.jsx            # Entry point React
│   ├── App.jsx             # Router + Auth logic (DEV_BYPASS)
│   ├── lib/
│   │   ├── api.js          # Axios instance + API_URL config
│   │   ├── fetch.js        # fetch() wrapper cho public endpoints
│   │   ├── cart.js         # Cart logic (localStorage-based)
│   │   ├── wishlist.js     # Wishlist logic (localStorage-based)
│   │   └── products.js     # Product utilities
│   ├── pages/              # LoginPage, SignUpPage, HomePage, ...
│   └── components/         # UI components
├── .env                    # VITE_API_URL
├── vite.config.js          # Port 5174
└── package.json
```

---

# ⚠️ KIỂM TRA KẾT NỐI FRONTEND ↔ BACKEND

## Tóm tắt vấn đề

| # | Vấn đề | Backend | Frontend | Trạng thái |
|---|--------|---------|----------|------------|
| 1 | **Port API** | Chạy trên `:3000` | `.env` trỏ tới `:5000` | ❌ **KHÔNG KHỚP** |
| 2 | **CORS origin** | Cho phép `localhost:5173` | Dev server chạy `:5174` | ❌ **KHÔNG KHỚP** |
| 3 | **Cart/Wishlist** | Có API server-side | Dùng `localStorage` | ⚠️ Không đồng bộ |
| 4 | **Auth bypass** | JWT bình thường | `DEV_BYPASS = true` | ⚠️ Chỉ dùng khi dev |

## Cách fix

### Fix 1 — Sửa API URL (QUAN TRỌNG NHẤT)

Sửa file `/home/kali/code/front-end/haha/.env`:

```env
# TRƯỚC (sai)
VITE_API_URL=http://localhost:5000

# SAU (đúng)
VITE_API_URL=http://localhost:3000
```

### Fix 2 — Sửa CORS trên backend

Sửa file `/home/kali/code/back-end/main/.env`, thêm:

```env
CLIENT_URL=http://localhost:5174
```

Hoặc sửa trực tiếp trong `app.js`:

```js
cors({
  origin: process.env.CLIENT_URL || "http://localhost:5174",  // 5174 thay vì 5173
  credentials: true,
})
```

### Fix 3 — Cart/Wishlist (tùy chọn)

Hiện tại frontend dùng `localStorage` để quản lý cart/wishlist, không gọi API backend.  
Cần migrate sang gọi `/api/cart` và `/api/wishlist` để dữ liệu đồng bộ với server.

### Fix 4 — Tắt DEV_BYPASS khi production

Trong `App.jsx`, đảm bảo:

```js
const DEV_BYPASS = false; // Tắt khi deploy thật
```

## Kết luận

**Hiện tại frontend KHÔNG kết nối được với backend** do 2 lỗi chính:
1. Frontend gọi port `5000`, backend lắng nghe port `3000`
2. CORS backend chặn request từ `localhost:5174` (frontend chạy ở đây)

Sau khi fix 2 vấn đề trên, frontend sẽ kết nối được với backend.
