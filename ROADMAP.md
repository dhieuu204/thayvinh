# Kế hoạch cải tiến Dự án Thương mại điện tử

## Context

Dự án là một nền tảng e-commerce phong cách Apple (React 19 + Node.js/Express + MongoDB) đã có
đầy đủ khung xương: auth, sản phẩm, giỏ hàng, đơn hàng, admin dashboard, flash sale, voucher,
loyalty points, notifications. Mục tiêu của plan này là nâng cấp dự án lên mức **production-ready**
trong vòng 2-3 tháng, bao gồm 4 nhóm: Chức năng còn thiếu, UX/UI, Performance & Security, Tính
năng nâng cao.

---

## PHASE 1 — Chức năng còn thiếu (Tuần 1–4)

### 1.1 Search Page có UI riêng
**Hiện trạng:** Backend đã có `/api/products/search` (MongoDB $text + regex). Frontend có ô tìm kiếm
trên Header nhưng chưa có trang kết quả riêng.

**Việc cần làm:**
- [x] Tạo trang `front-end/haha/src/pages/SearchPage.jsx`
- [x] Route `/search?q=...` trong `App.jsx`
- [x] Hiển thị kết quả dạng grid với filter (sắp xếp)
- [x] Highlight từ khóa tìm kiếm trên tên sản phẩm
- [x] Empty state khi không có kết quả (+ skeleton loading)

### 1.2 Product Variants UI
**Hiện trạng:** Model `ProductVariant` và state `selectedVariant` trong `ProductDetailPage.jsx` đã
có nhưng UI chọn màu/dung lượng chưa được render.

**Việc cần làm:**
- [x] Thêm component `VariantSelector` trong `ProductDetailPage.jsx`
- [x] Hiển thị color swatches / size buttons dựa trên `variantKey` (color, storage, etc.)
- [x] Cập nhật giá và tồn kho theo variant được chọn
- [ ] Cập nhật Admin Product form để thêm/sửa variants

### 1.3 Google OAuth
**Hiện trạng:** Backend có skeleton callback handler, chưa cài Passport.js. Frontend chưa có nút.

**Việc cần làm:**
- [ ] Backend: cài `passport`, `passport-google-oauth20`, tạo Google Strategy
- [ ] Tạo route `/api/auth/google` và `/api/auth/google/callback`
- [ ] Frontend: thêm nút "Đăng nhập bằng Google" trong `LoginPage.jsx` và `SignUpPage.jsx`
- [ ] Xử lý redirect và lưu token sau OAuth thành công

### 1.4 Xác minh Email khi Đăng ký
**Hiện trạng:** Đăng ký xong là dùng được ngay, không qua email verification.

**Việc cần làm:**
- [ ] Thêm field `isEmailVerified: Boolean` vào User model
- [ ] Sau register: gửi email chứa link xác minh (token có TTL)
- [ ] Route `GET /api/auth/verify-email/:token`
- [ ] Chặn login nếu email chưa verified (hoặc nhắc nhở)
- [ ] Trang `VerifyEmailPage.jsx` thông báo kết quả

### 1.5 Address Book hoàn chỉnh
**Hiện trạng:** `AccountPage.jsx` có form địa chỉ đơn giản, chưa hỗ trợ nhiều địa chỉ.

**Việc cần làm:**
- [ ] Thêm `addresses[]` array vào User model (name, phone, province, district, ward, street, isDefault)
- [ ] API: thêm/sửa/xóa/đặt mặc định địa chỉ
- [ ] UI trong `AccountPage.jsx` để quản lý danh sách địa chỉ
- [ ] `CheckoutPage.jsx` cho chọn từ danh sách địa chỉ đã lưu

### 1.6 Luồng Thanh toán thực (VNPay / MoMo)
**Hiện trạng:** Các nút thanh toán đã có trong `CheckoutPage.jsx` nhưng chỉ là mock — không có
redirect đến cổng thanh toán thực.

**Việc cần làm:**
- [ ] **VNPay:** Tạo URL thanh toán từ `PaymentController`, redirect user, xử lý IPN callback
- [ ] **MoMo:** Tương tự — gọi MoMo API, nhận redirect URL, xử lý callback
- [ ] Cập nhật trạng thái đơn hàng sang `Paid` khi callback thành công
- [ ] Trang `PaymentResultPage.jsx` (success / failure)

---

## PHASE 2 — UX/UI hoàn thiện (Tuần 5–7)

### 2.1 Skeleton Loading
**Hiện trạng:** Đang loading là màn hình trắng hoặc spinner đơn giản.

**Việc cần làm:**
- [ ] Tạo component `SkeletonCard`, `SkeletonList`, `SkeletonDetail`
- [ ] Áp dụng cho: ProductsPage, ProductDetailPage, OrdersPage, AdminDashboard
- [ ] Dùng Tailwind `animate-pulse` — không cần thư viện thêm

### 2.2 Empty States
**Việc cần làm:**
- [ ] Giỏ hàng trống → minh họa + CTA "Tiếp tục mua sắm"
- [ ] Wishlist trống → gợi ý xem sản phẩm
- [ ] Không có đơn hàng → CTA mua hàng
- [ ] Không có kết quả tìm kiếm → gợi ý từ khóa khác

### 2.3 SEO cơ bản
**Hiện trạng:** Không có `<title>` hay `<meta>` động. Cài `react-helmet-async`.

**Việc cần làm:**
- [ ] Cài `react-helmet-async` vào frontend
- [ ] Thêm `<Helmet>` vào mỗi trang chính: title, description, og:image
- [ ] Trang sản phẩm: title = tên sản phẩm, description = mô tả ngắn

### 2.4 Error Boundary
**Việc cần làm:**
- [ ] Tạo `ErrorBoundary.jsx` (React class component) bao toàn bộ `App.jsx`
- [ ] Hiển thị trang lỗi đẹp thay vì crash trắng
- [ ] Log lỗi (console hoặc Sentry nếu muốn)

### 2.5 Mobile Responsive Audit
**Việc cần làm:**
- [ ] Kiểm tra và fix: Admin Dashboard, Checkout multi-step, Header navigation trên mobile
- [ ] Sidebar admin → hamburger menu trên mobile
- [ ] Table sản phẩm / đơn hàng → card layout trên màn nhỏ

### 2.6 Pagination / Infinite Scroll thực sự
**Hiện trạng:** Backend có phân trang nhưng frontend chưa dùng nhất quán.

**Việc cần làm:**
- [ ] `ProductsPage` và `SearchPage`: thêm phân trang (page buttons) hoặc "Tải thêm" button
- [ ] `AdminProductsPage`, `AdminOrdersPage`: server-side pagination thật sự

---

## PHASE 3 — Performance & Security (Tuần 8–9)

### 3.1 Rate Limiting
**Việc cần làm:**
- [ ] Cài `express-rate-limit` vào backend (`back-end/main/package.json`)
- [ ] Global limit: 100 req/15 phút
- [ ] Login/Register: 5 req/15 phút (chống brute force)
- [ ] Search: 30 req/phút

### 3.2 Input Validation
**Việc cần làm:**
- [ ] Cài `express-validator` hoặc `joi`
- [ ] Thêm validation middleware vào các route quan trọng: auth, order, product CRUD
- [ ] Trả về lỗi 400 rõ ràng thay vì crash

### 3.3 Helmet & CORS hardening
**Việc cần làm:**
- [ ] Cài `helmet` — tự động set security headers (XSS, HSTS, CSP...)
- [ ] Cấu hình CORS chặt hơn: chỉ cho phép domain frontend chính thức
- [ ] Thêm vào `back-end/main/app.js`

### 3.4 Image Optimization
**Hiện trạng:** Multer upload ảnh thô, không resize. Ảnh lớn làm chậm trang.

**Việc cần làm:**
- [ ] Cài `sharp` vào backend
- [ ] Resize ảnh sản phẩm xuống 800x800 max, chuyển sang WebP
- [ ] Tạo thumbnail 200x200 cho product card
- [ ] Hoặc tích hợp Cloudinary (code đã có reference)

### 3.5 API Response Caching
**Việc cần làm:**
- [ ] Cài `node-cache` (in-memory, không cần Redis setup)
- [ ] Cache: `/api/categories` (5 phút), `/api/products?flash-sale` (1 phút), `/api/banners` (10 phút)
- [ ] Invalidate cache khi admin cập nhật dữ liệu

### 3.6 Environment & Secrets
**Việc cần làm:**
- [ ] Tạo `.env.example` đầy đủ cho cả frontend và backend
- [ ] Đảm bảo `.gitignore` loại trừ `.env`
- [ ] Kiểm tra không hardcode secret nào trong code

---

## PHASE 4 — Tính năng nâng cao (Tuần 10–12)

### 4.1 So sánh sản phẩm
- [ ] Nút "So sánh" trên product card (chọn tối đa 3)
- [ ] Floating bar hiển thị sản phẩm đã chọn
- [ ] Trang `/compare` với bảng so sánh thông số: giá, rating, tồn kho, mô tả

### 4.2 Recently Viewed (Xem gần đây)
- [ ] Lưu vào `localStorage` (tối đa 10 sản phẩm)
- [ ] Widget "Đã xem gần đây" ở cuối `ProductDetailPage`
- [ ] Không cần backend

### 4.3 Gợi ý sản phẩm thông minh
- [ ] "Khách hàng cũng mua" — dựa trên orders cùng sản phẩm (aggregation MongoDB)
- [ ] "Có thể bạn thích" — dựa trên cùng danh mục + tag
- [ ] Backend endpoint mới, hiển thị trên ProductDetailPage

### 4.4 Xuất báo cáo Excel (Admin)
- [ ] Cài `exceljs` backend
- [ ] Admin có thể xuất: danh sách đơn hàng, doanh thu theo tháng, danh sách sản phẩm
- [ ] Button "Xuất Excel" trên `AdminOrdersPage` và `AdminDashboardPage`

### 4.5 Web Push Notifications
- [ ] Dùng `web-push` backend + Service Worker frontend
- [ ] Thông báo khi đơn hàng thay đổi trạng thái
- [ ] User có thể bật/tắt trong AccountPage

### 4.6 Tích hợp Chat hỗ trợ
- [ ] Tích hợp Tawk.to (miễn phí, chỉ cần thêm script)
- [ ] Hiển thị chat widget trên tất cả trang
- [ ] Không cần backend

---

## Thứ tự ưu tiên theo tuần

```
Tuần 1-2  │ Search Page + Product Variants UI
Tuần 3    │ Google OAuth + Xác minh Email
Tuần 4    │ Address Book + Skeleton Loading + Empty States
Tuần 5    │ Thanh toán VNPay/MoMo thực
Tuần 6    │ SEO + Error Boundary + Mobile Responsive audit
Tuần 7    │ Pagination thực sự + UX polish
Tuần 8    │ Rate Limiting + Input Validation + Helmet
Tuần 9    │ Image Optimization + Caching + .env cleanup
Tuần 10   │ So sánh sản phẩm + Recently Viewed
Tuần 11   │ Gợi ý sản phẩm + Xuất Excel Admin
Tuần 12   │ Web Push Notifications + Chat hỗ trợ
```

---

## Files chính sẽ thay đổi

### Frontend
- `front-end/haha/src/App.jsx` — thêm routes mới
- `front-end/haha/src/pages/SearchPage.jsx` — tạo mới
- `front-end/haha/src/pages/ProductDetailPage.jsx` — thêm VariantSelector
- `front-end/haha/src/pages/CheckoutPage.jsx` — payment flow + address selection
- `front-end/haha/src/pages/AccountPage.jsx` — address book
- `front-end/haha/src/pages/LoginPage.jsx` / `SignUpPage.jsx` — Google OAuth button
- `front-end/haha/src/components/Header/index.jsx` — search redirect
- `front-end/haha/package.json` — thêm react-helmet-async

### Backend
- `back-end/main/app.js` — helmet, rate limiting, CORS
- `back-end/main/controllers/AuthController.js` — Google OAuth, email verify
- `back-end/main/controllers/PaymentController.js` — VNPay/MoMo real flow
- `back-end/main/controllers/ProductController.js` — recommendations
- `back-end/main/models/User.js` — addresses[], isEmailVerified
- `back-end/main/routes/authRoutes.js` — thêm OAuth routes
- `back-end/main/package.json` — thêm express-rate-limit, express-validator, helmet, sharp, passport

---

## Kiểm tra sau khi hoàn thành

1. **Chức năng:** Chạy toàn bộ luồng mua hàng: tìm kiếm → xem chi tiết → chọn variant → thêm giỏ → checkout → thanh toán → xem đơn hàng
2. **Auth:** Đăng ký → nhận email → verify → đăng nhập → Google OAuth
3. **Admin:** Tạo flash sale → tạo voucher → cập nhật trạng thái đơn → xuất Excel
4. **Security:** Thử brute force login (phải bị chặn sau 5 lần), thử gửi payload XSS
5. **Mobile:** Test toàn bộ flow trên viewport 375px (iPhone SE)
6. **Performance:** Kiểm tra Lighthouse score trang chủ và trang sản phẩm
