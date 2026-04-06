# Phương Hướng Phát Triển E-Commerce

> Dựa trên hệ thống hiện tại: Node.js + Express + MongoDB + JWT

---

## 📌 Đánh Giá Hiện Trạng

### Đã có
- [x] Auth: Register / Login / Forgot password / OTP / Reset password
- [x] Product: CRUD, search, filter theo category & price, flash sales
- [x] Cart: Thêm / cập nhật / xóa sản phẩm
- [x] Wishlist
- [x] Order: Tạo đơn, xem đơn, xóa đơn
- [x] Payment controller (chưa rõ cổng thanh toán thật)
- [x] Admin role + middleware phân quyền
- [x] Email OTP qua Nodemailer

### Thiếu / Rủi ro hiện tại
| Vấn đề | Mức độ | Mô tả |
|--------|--------|-------|
| JWT hết hạn 2 giờ, không có refresh token | Cao | User bị đăng xuất đột ngột |
| Không trừ tồn kho khi đặt hàng | Cao | Overselling - bán quá hàng có sẵn |
| Payment chưa tích hợp cổng thật | Cao | Không thu được tiền thật |
| Không có rate limiting | Cao | Dễ bị brute-force / DDoS |
| Upload ảnh lưu local (`uploads/img/`) | Trung bình | Mất ảnh khi deploy, không scale |
| CORS chỉ cho `localhost:5173` | Trung bình | Deploy production sẽ lỗi |
| Không có logging | Trung bình | Không debug được lỗi production |
| OTP không bị xóa sau khi dùng | Trung bình | Có thể reuse OTP |

---

## 🗺️ Lộ Trình Phát Triển

### Giai đoạn 1 — Vá lỗi & Ổn định (Ưu tiên cao nhất)

#### 1.1 Bảo mật
```
[ ] Thêm Refresh Token
    - Access token: 15 phút
    - Refresh token: 7 ngày, lưu trong httpOnly cookie
    - Route: POST /api/auth/refresh-token

[ ] Rate Limiting
    - npm install express-rate-limit
    - Giới hạn: 100 req/15 phút cho API chung
    - Giới hạn: 5 req/15 phút cho /api/auth/login (chống brute-force)

[ ] Xóa OTP sau khi dùng thành công
    - Trong verify-otp: gọi Otp.deleteOne() sau khi verify xong

[ ] Validate input nghiêm ngặt hơn
    - npm install express-validator hoặc joi/zod
    - Validate tất cả req.body trước khi vào controller
```

#### 1.2 Tồn kho (Inventory)
```
[ ] Trừ tồn kho khi tạo đơn hàng
    - Trong OrderController.createOrder:
      → Product.findByIdAndUpdate({ $inc: { quantity: -qty } })

[ ] Hoàn trả tồn kho khi hủy đơn
    - Khi order.status chuyển sang 'cancelled':
      → Cộng lại số lượng cho từng sản phẩm

[ ] Check tồn kho trước khi add to cart
    - CartController.addToCart: kiểm tra product.quantity >= qty
```

#### 1.3 Cấu hình môi trường
```
[ ] Tách CORS cho dev và production
    - Dùng biến môi trường: ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

[ ] Chuyển upload ảnh lên cloud storage
    - Dùng Cloudinary (miễn phí) hoặc AWS S3
    - npm install cloudinary multer-storage-cloudinary
```

---

### Giai đoạn 2 — Tích hợp Thanh Toán Thật

#### 2.1 Cổng thanh toán Việt Nam
```
[ ] VNPay (phổ biến nhất VN)
    Luồng:
    POST /api/payments/vnpay/create
    ├── Tạo URL thanh toán VNPay
    └── Redirect user đến trang VNPay

    GET /api/payments/vnpay/return (callback)
    ├── VNPay gọi lại sau khi thanh toán
    ├── Verify chữ ký (HMAC-SHA512)
    ├── Cập nhật order.paymentStatus = 'paid'
    └── Redirect về frontend

[ ] MoMo (tùy chọn thêm)
    - Luồng tương tự VNPay
    - npm install axios (gọi MoMo API)
```

#### 2.2 Quản lý trạng thái thanh toán
```
Order.paymentStatus:
- 'pending'   → Chờ thanh toán
- 'paid'      → Đã thanh toán
- 'failed'    → Thanh toán thất bại
- 'refunded'  → Đã hoàn tiền

Order.status:
- 'pending'   → Chờ xác nhận
- 'confirmed' → Đã xác nhận (sau khi paid)
- 'shipping'  → Đang giao
- 'delivered' → Đã nhận hàng
- 'cancelled' → Đã hủy
```

---

### Giai đoạn 3 — Tính năng Vận hành

#### 3.1 Admin Dashboard APIs
```
[ ] Thống kê doanh thu
    GET /api/admin/stats/revenue?from=&to=
    ├── Tổng doanh thu theo khoảng thời gian
    ├── Doanh thu theo ngày/tháng (group by)
    └── Top sản phẩm bán chạy

[ ] Quản lý đơn hàng
    GET /api/admin/orders → Tất cả đơn hàng
    PUT /api/admin/orders/:id/status → Cập nhật trạng thái

[ ] Quản lý sản phẩm
    POST /api/admin/products → Thêm sản phẩm
    PUT /api/admin/products/:id → Sửa sản phẩm
    DELETE /api/admin/products/:id → Xóa sản phẩm

[ ] Quản lý user
    GET /api/admin/users → Danh sách user (đã có)
    PUT /api/admin/users/:id/ban → Khóa tài khoản
```

#### 3.2 Email Notifications
```
[ ] Email xác nhận đơn hàng
    - Gửi sau khi POST /api/orders/create thành công
    - Template: thông tin đơn hàng, tổng tiền, địa chỉ giao

[ ] Email cập nhật trạng thái giao hàng
    - Gửi khi admin đổi order.status

[ ] Sử dụng template email đẹp hơn
    - npm install nodemailer-mjml hoặc handlebars
```

#### 3.3 Logging & Monitoring
```
[ ] Application logging
    - npm install winston
    - Log: request, error, performance vào file

[ ] Request logging
    - npm install morgan
    - Ghi lại mọi HTTP request

[ ] Health check endpoint
    GET /api/health → { status: 'ok', db: 'connected', uptime: ... }
```

---

### Giai đoạn 4 — Nâng Cao Trải Nghiệm Mua Hàng

#### 4.1 Voucher / Mã Giảm Giá
```
Voucher Model:
{
  code: String (unique, uppercase),
  name: String,                    // tên hiển thị: "Giảm 20% toàn bộ điện thoại"
  description: String,

  // Phạm vi áp dụng (chọn 1 trong 3)
  scope: 'global' | 'category' | 'product',
  applicableCategories: [ObjectId],  // áp dụng cho danh mục cụ thể
  applicableProducts: [ObjectId],    // áp dụng cho sản phẩm cụ thể

  // Loại giảm giá
  discountType: 'percent' | 'fixed', // % hoặc số tiền cố định
  discountValue: Number,             // VD: 20 (20%) hoặc 50000 (50.000đ)
  maxDiscountAmount: Number,         // giảm tối đa (dùng với percent)
  minOrderValue: Number,             // đơn hàng tối thiểu

  // Giới hạn sử dụng
  maxUsage: Number,                  // tổng lần dùng tối đa
  maxUsagePerUser: Number,           // mỗi user dùng tối đa bao nhiêu lần
  usedCount: Number,                 // đã dùng bao nhiêu lần

  // Thời hạn
  startDate: Date,
  expiresAt: Date,
  isActive: Boolean,

  createdBy: ObjectId (ref User/Admin),
  createdAt: Date
}

VoucherUsage Model (lịch sử dùng):
{
  voucherId: ObjectId,
  userId: ObjectId,
  orderId: ObjectId,
  discountAmount: Number,  // số tiền thực tế được giảm
  usedAt: Date
}

--- Admin APIs (yêu cầu admin role) ---

[ ] POST /api/admin/vouchers
    ├── Tạo voucher mới
    ├── Chọn scope: global / category / product
    ├── Nếu scope = 'category': truyền applicableCategories: [id1, id2]
    ├── Nếu scope = 'product': truyền applicableProducts: [id1, id2]
    └── Validate: discountValue > 0, expiresAt > startDate

[ ] GET /api/admin/vouchers
    ├── Danh sách tất cả voucher
    ├── Filter: ?status=active|expired|disabled
    ├── Filter: ?scope=product|category|global
    └── Thống kê: đã dùng / còn lại

[ ] GET /api/admin/vouchers/:id
    └── Chi tiết voucher + lịch sử ai đã dùng

[ ] PUT /api/admin/vouchers/:id
    └── Cập nhật: gia hạn, thay đổi giá trị, bật/tắt

[ ] DELETE /api/admin/vouchers/:id
    └── Xóa voucher (chỉ được xóa nếu chưa có ai dùng)

[ ] PUT /api/admin/vouchers/:id/toggle
    └── Bật/tắt nhanh voucher (isActive true/false)

--- User APIs ---

[ ] POST /api/vouchers/apply
    ├── Input: { code, cartItems }
    ├── Tìm voucher theo code
    ├── Validate: còn hạn, còn lượt dùng, user chưa dùng quá giới hạn
    ├── Validate scope:
    │   - global → áp dụng cho toàn bộ giỏ hàng
    │   - category → chỉ tính giảm cho sản phẩm thuộc category đó
    │   - product → chỉ tính giảm cho sản phẩm được chỉ định
    ├── Tính toán discountAmount
    └── Response: { discountAmount, finalPrice, applicableItems }

[ ] GET /api/vouchers/check/:code
    └── Kiểm tra nhanh mã có hợp lệ không (không áp dụng)

--- Logic tính giảm giá ---

Ví dụ giỏ hàng:
  SP_A (category: Điện thoại) - 5.000.000đ
  SP_B (category: Áo)         - 300.000đ
  SP_C (category: Điện thoại) - 3.000.000đ

Voucher: giảm 10% cho category "Điện thoại", tối đa 500.000đ

Kết quả:
  SP_A + SP_C = 8.000.000đ × 10% = 800.000đ → capped → giảm 500.000đ
  SP_B: không áp dụng
  Tổng giảm: 500.000đ
```

#### 4.2 Review & Rating
```
Review Model:
{
  productId: ObjectId (ref Product),
  userId: ObjectId (ref User),
  orderId: ObjectId (ref Order),   // đảm bảo chỉ user đã mua mới review được
  rating: Number (1-5),
  comment: String,
  images: [String],                // cho phép đính kèm ảnh review
  likes: Number,                   // lượt thấy hữu ích
  isVerifiedPurchase: Boolean,     // đã mua hàng thật
  createdAt: Date,
  updatedAt: Date
}

API Endpoints:
[ ] POST /api/products/:id/reviews
    ├── Yêu cầu: authenticate
    ├── Validate: user phải có order chứa productId với status 'delivered'
    ├── Validate: mỗi user chỉ review 1 lần / 1 sản phẩm
    ├── Lưu review vào DB
    └── Cập nhật product.rating = trung bình cộng tất cả rating

[ ] GET /api/products/:id/reviews
    ├── Public route (không cần login)
    ├── Hỗ trợ filter: ?rating=5 (lọc theo số sao)
    ├── Hỗ trợ sort: ?sort=newest | oldest | most_liked
    ├── Pagination: ?page=1&limit=10
    └── Response kèm: tổng số review, phân bố sao (1★ x%, 2★ y%...)

[ ] PUT /api/products/:id/reviews/:reviewId
    ├── Yêu cầu: authenticate + chính chủ review
    └── Chỉ cho phép sửa trong 7 ngày sau khi tạo

[ ] DELETE /api/products/:id/reviews/:reviewId
    ├── Yêu cầu: authenticate
    └── Cho phép: chính chủ review HOẶC admin

[ ] POST /api/products/:id/reviews/:reviewId/like
    ├── Yêu cầu: authenticate
    └── Đánh dấu review hữu ích (+1 like)

Admin:
[ ] GET /api/admin/reviews → Xem tất cả review
[ ] DELETE /api/admin/reviews/:id → Xóa review vi phạm
[ ] PUT /api/admin/reviews/:id/hide → Ẩn review không xóa

Cập nhật Product Model:
{
  ...hiện tại,
  rating: Number,           // trung bình sao (tự động cập nhật)
  reviewCount: Number,      // tổng số review
  ratingBreakdown: {        // phân bố sao
    1: Number,
    2: Number,
    3: Number,
    4: Number,
    5: Number
  }
}
```

#### 4.3 Địa chỉ giao hàng nhiều địa chỉ
```
[ ] Cho phép user lưu nhiều địa chỉ
    - addresses: [{ label, street, district, city, isDefault }]
[ ] Chọn địa chỉ khi tạo đơn hàng
```

---

### Giai đoạn 4B — Vận Chuyển & Logistics

#### 4B.1 Tính Phí Vận Chuyển
```
ShippingZone Model (admin cấu hình):
{
  name: String,               // "Nội thành HCM", "Tỉnh thành khác"
  provinces: [String],        // ["Ho Chi Minh", "Ha Noi", ...]
  baseFee: Number,            // phí cơ bản (đ)
  feePerKg: Number,           // phí thêm mỗi kg vượt ngưỡng
  weightThreshold: Number,    // ngưỡng kg miễn phí thêm
  estimatedDays: String,      // "1-2 ngày", "3-5 ngày"
  isActive: Boolean
}

ShippingMethod Model:
{
  name: String,               // "Giao hàng tiêu chuẩn", "Giao hàng nhanh", "Hỏa tốc"
  description: String,
  zones: [ObjectId],          // áp dụng cho zone nào
  extraFee: Number,           // phí thêm cho method này (nhanh, hỏa tốc)
  isActive: Boolean
}

--- Logic tính phí ship ---

Bước 1: Xác định zone từ địa chỉ user
  → Lấy city/province từ shippingAddress
  → Tìm ShippingZone khớp với province

Bước 2: Tính tổng trọng lượng đơn hàng
  → Mỗi Product có thêm trường: weight (gram), dimensions (cm)
  → totalWeight = Σ(product.weight × quantity)

Bước 3: Tính phí
  shippingFee = zone.baseFee
  if totalWeight > zone.weightThreshold:
    extraWeight = totalWeight - zone.weightThreshold
    shippingFee += ceil(extraWeight / 1000) × zone.feePerKg
  shippingFee += selectedMethod.extraFee

Bước 4: Áp dụng miễn phí ship
  if order.subtotal >= freeShippingThreshold:
    shippingFee = 0
  if voucherFreeShip applied:
    shippingFee = 0

Ví dụ thực tế:
  Đơn hàng giao về Hà Nội, tổng 2.5kg
  Zone "Miền Bắc": baseFee=30.000đ, feePerKg=5.000đ, threshold=1kg
  Method "Nhanh": extraFee=20.000đ

  Phí = 30.000 + (2 kg vượt × 5.000) + 20.000 = 60.000đ

--- API ---

[ ] GET /api/shipping/calculate
    Input: { province, totalWeight, subtotal, methodId }
    └── Response: { shippingFee, estimatedDays, freeShippingRemaining }

[ ] GET /api/shipping/methods
    Input: { province }
    └── Response: danh sách phương thức ship + giá cho địa chỉ đó

Admin:
[ ] CRUD /api/admin/shipping/zones   → Quản lý vùng & giá
[ ] CRUD /api/admin/shipping/methods → Quản lý phương thức giao
[ ] PUT /api/admin/shipping/free-threshold
    └── Cấu hình mức đơn hàng được miễn phí ship
```

#### 4B.2 Tích Hợp Đơn Vị Vận Chuyển (GHN / GHTK)
```
Thay vì tự tính, gọi thẳng API của đơn vị vận chuyển:

[ ] GHN (Giao Hàng Nhanh) — phổ biến nhất
    POST https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee
    Input: { from_district, to_district, weight, service_type_id }
    → Trả về: phí ship chính xác theo thời gian thực

[ ] Luồng tạo đơn GHN tự động:
    Khi order.status → 'confirmed':
    → Gọi GHN API tạo đơn vận chuyển
    → Lưu tracking_code vào Order
    → GHN webhook cập nhật trạng thái giao hàng tự động

[ ] GET /api/orders/:id/tracking
    └── Trả về lịch sử vận chuyển từ GHN/GHTK

Cập nhật Order Model:
{
  ...hiện tại,
  shippingFee: Number,
  shippingMethod: String,
  trackingCode: String,       // mã vận đơn GHN/GHTK
  shippingProvider: String,   // 'GHN' | 'GHTK' | 'manual'
  shippingHistory: [          // lịch sử tracking
    { status: String, location: String, time: Date }
  ]
}
```

---

### Giai đoạn 4C — Tính Năng Tăng Doanh Thu

#### 4C.1 Hệ Thống Điểm Thưởng (Loyalty Points)
```
[ ] Tích điểm khi mua hàng
    - Mặc định: 1.000đ = 1 điểm
    - Điểm cộng sau khi đơn hàng 'delivered'
    - Điểm trừ nếu đơn bị hủy / hoàn trả

[ ] Dùng điểm để giảm giá
    - VD: 100 điểm = 10.000đ
    - Giới hạn: tối đa dùng 20% giá trị đơn hàng bằng điểm

[ ] Cấu hình tỷ lệ điểm (admin)
    PUT /api/admin/loyalty/config
    { earnRate: 1000, redeemRate: 100, maxRedeemPercent: 20 }

LoyaltyTransaction Model:
{
  userId: ObjectId,
  type: 'earn' | 'redeem' | 'expire' | 'adjust',
  points: Number,
  orderId: ObjectId,
  description: String,
  createdAt: Date
}
```

#### 4C.2 Sản Phẩm Biến Thể (Variants)
```
Hiện tại Product chỉ có 1 color, 1 quantity — không đủ cho thực tế.

Cập nhật Product Model:
{
  ...hiện tại (bỏ color, quantity),
  variants: [
    {
      sku: String,              // mã SKU riêng
      attributes: {             // VD: { color: 'Đỏ', size: 'XL' }
        color: String,
        size: String,
        storage: String,        // cho điện thoại: 128GB, 256GB
      },
      price: Number,            // giá riêng cho variant này
      quantity: Number,
      image: String             // ảnh riêng cho variant
    }
  ]
}

[ ] GET /api/products/:id → trả về kèm variants
[ ] Khi add to cart: phải chọn variantId
[ ] Trừ tồn kho theo variantId khi đặt hàng
```

#### 4C.3 Sản Phẩm Liên Quan & Gợi Ý
```
[ ] GET /api/products/:id/related
    ├── Lấy sản phẩm cùng category
    ├── Loại trừ sản phẩm hiện tại
    └── Sort theo rating desc, limit 8

[ ] GET /api/products/recommendations
    ├── Dựa trên lịch sử đơn hàng của user
    ├── Dựa trên wishlist của user
    └── Fallback: sản phẩm bán chạy nhất

[ ] Lưu lịch sử xem sản phẩm
    POST /api/products/:id/view (authenticate, optional)
    → Lưu vào ViewHistory { userId, productId, viewedAt }
    GET /api/users/recently-viewed
    → Trả về 10 sản phẩm xem gần nhất
```

#### 4C.4 Thông Báo (Notifications)
```
Notification Model:
{
  userId: ObjectId,
  type: 'order_confirmed' | 'order_shipped' | 'order_delivered'
       | 'price_drop' | 'back_in_stock' | 'voucher_expiring' | 'review_reply',
  title: String,
  message: String,
  link: String,        // link đến trang liên quan
  isRead: Boolean,
  createdAt: Date
}

[ ] GET /api/notifications → Danh sách thông báo của user
[ ] PUT /api/notifications/:id/read → Đánh dấu đã đọc
[ ] PUT /api/notifications/read-all → Đọc tất cả
[ ] GET /api/notifications/unread-count → Số thông báo chưa đọc (cho badge)

Trigger thông báo tự động:
  - Đơn hàng được xác nhận → notify 'order_confirmed'
  - Admin đổi status → 'shipped', 'delivered' → notify user
  - Sản phẩm trong wishlist giảm giá → notify 'price_drop'
  - Sản phẩm hết hàng có người đăng ký → notify 'back_in_stock'
```

#### 4C.5 Đăng Ký Thông Báo Hàng Về
```
[ ] POST /api/products/:id/notify-restock
    ├── Yêu cầu: authenticate
    ├── Lưu { userId, productId } vào RestockNotify
    └── Khi admin cập nhật quantity > 0: tự động gửi email + notification
```

---

### Giai đoạn 4D — Quản Lý Sau Bán Hàng

#### 4D.1 Hủy Đơn & Hoàn Trả
```
[ ] Hủy đơn hàng (user tự hủy)
    PUT /api/orders/:id/cancel
    ├── Chỉ được hủy khi status = 'pending'
    ├── Hoàn lại tồn kho
    ├── Nếu đã thanh toán: tạo refund request
    └── Gửi email xác nhận hủy

[ ] Yêu cầu hoàn trả (return/refund)
    POST /api/orders/:id/return-request
    ├── Chỉ được trong vòng 7 ngày sau 'delivered'
    ├── Input: { reason, images, items: [{ productId, quantity }] }
    └── Admin duyệt/từ chối

ReturnRequest Model:
{
  orderId: ObjectId,
  userId: ObjectId,
  items: [{ productId, quantity, reason }],
  images: [String],
  status: 'pending' | 'approved' | 'rejected' | 'refunded',
  adminNote: String,
  refundAmount: Number,
  createdAt: Date
}

Admin:
[ ] GET /api/admin/return-requests → Xem tất cả yêu cầu hoàn trả
[ ] PUT /api/admin/return-requests/:id/approve → Duyệt hoàn trả
[ ] PUT /api/admin/return-requests/:id/reject → Từ chối + ghi lý do
```

#### 4D.2 Đăng Nhập Mạng Xã Hội
```
[ ] Google OAuth
    GET /api/auth/google → Redirect sang Google
    GET /api/auth/google/callback → Nhận token, tạo/tìm user
    - npm install passport passport-google-oauth20

[ ] Facebook OAuth (tùy chọn)
    Tương tự Google

Luồng:
  User click "Đăng nhập Google"
  → Redirect sang Google OAuth
  → Google callback với profile info
  → Tìm user theo email, nếu không có thì tạo mới
  → Tạo JWT, redirect về frontend kèm token
```

---

### Giai đoạn 4E — Công Cụ Admin Nâng Cao

#### 4E.1 Thống Kê & Báo Cáo
```
[ ] GET /api/admin/stats/overview
    └── { totalRevenue, totalOrders, totalUsers, totalProducts }

[ ] GET /api/admin/stats/revenue?period=daily|weekly|monthly&from=&to=
    └── Doanh thu theo thời gian (dùng MongoDB $group + $match)

[ ] GET /api/admin/stats/top-products?limit=10
    └── Top sản phẩm bán chạy nhất (theo số lượng bán)

[ ] GET /api/admin/stats/top-customers?limit=10
    └── Top khách hàng chi tiêu nhiều nhất

[ ] GET /api/admin/stats/categories
    └── Doanh thu theo từng danh mục

[ ] GET /api/admin/stats/orders-by-status
    └── Số đơn hàng theo từng trạng thái

[ ] GET /api/admin/stats/low-stock?threshold=10
    └── Cảnh báo sản phẩm sắp hết hàng (quantity <= threshold)
```

#### 4E.2 Quản Lý Banner & Flash Sale
```
Banner Model:
{
  title: String,
  image: String,
  link: String,
  position: 'hero' | 'sidebar' | 'popup',
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  order: Number    // thứ tự hiển thị
}

[ ] CRUD /api/admin/banners → Quản lý banner trang chủ

FlashSale Model (thay vì field flashSales trong Product):
{
  name: String,               // "Flash Sale 12.12"
  products: [
    { productId: ObjectId, salePrice: Number, quantity: Number, sold: Number }
  ],
  startTime: Date,
  endTime: Date,
  isActive: Boolean
}

[ ] GET /api/flash-sales/active → Flash sale đang diễn ra (public)
[ ] CRUD /api/admin/flash-sales → Admin quản lý flash sale
[ ] Khi hết endTime: tự động kết thúc (dùng cron job hoặc check khi query)
```

---

### Giai đoạn 5 — Hiệu Năng & Scale

#### 5.1 Caching
```
[ ] Redis cache cho dữ liệu ít thay đổi
    - Cache: danh sách sản phẩm, categories
    - Invalidate cache khi admin cập nhật sản phẩm
    - npm install ioredis

[ ] Pagination cho tất cả danh sách
    GET /api/products?page=1&limit=20
    - Thêm vào tất cả API trả về array
```

#### 5.2 Database Optimization
```
[ ] Thêm indexes cho các trường query nhiều
    - Product: { category: 1 }, { price: 1 }, { name: 'text' }
    - Order: { userId: 1, createdAt: -1 }
    - Cart: { userId: 1 }

[ ] Full-text search nâng cao
    - MongoDB Atlas Search hoặc Elasticsearch
    - Tìm kiếm theo tên, mô tả, tag
```

#### 5.3 File & Infrastructure
```
[ ] Docker hóa ứng dụng
    - Dockerfile cho backend
    - docker-compose.yml: backend + MongoDB + Redis

[ ] CI/CD cơ bản
    - GitHub Actions: test → build → deploy
    - Chạy test trước khi merge PR
```

---

## ✅ Checklist Ưu Tiên Ngay

Làm theo thứ tự này để hệ thống ổn định trước khi go live:

```
Tuần 1 — Ổn định nền tảng:
[ ] Rate limiting cho /api/auth/*
[ ] Trừ tồn kho khi tạo đơn hàng
[ ] Xóa OTP sau khi dùng
[ ] Cấu hình CORS cho production domain
[ ] Thêm helmet (security headers)

Tuần 2 — Thanh toán & Upload:
[ ] Refresh token mechanism
[ ] Tích hợp VNPay
[ ] Upload ảnh lên Cloudinary

Tuần 3 — Vận chuyển & Email:
[ ] Tính phí ship theo tỉnh thành (ShippingZone)
[ ] Email xác nhận đơn hàng + cập nhật trạng thái
[ ] Logging với Winston + Morgan

Tuần 4 — Tính năng mua sắm:
[ ] Voucher (global / category / product)
[ ] Review & Rating (chỉ user đã mua)
[ ] Hủy đơn + hoàn trả
[ ] Pagination cho tất cả danh sách

Tuần 5 — Tăng doanh thu:
[ ] Sản phẩm biến thể (variants: màu, size, dung lượng)
[ ] Thông báo in-app (Notifications)
[ ] Admin thống kê doanh thu
[ ] Flash sale với thời gian đếm ngược

Tuần 6+ — Nâng cao:
[ ] Loyalty points
[ ] Sản phẩm liên quan & gợi ý
[ ] Đăng ký thông báo hàng về
[ ] Google OAuth
[ ] Tích hợp GHN tracking tự động
```

---

## 🏗️ Kiến Trúc Đề Xuất Khi Scale

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │ Express 1  │  │ Express 2  │  │ Express 3  │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │                             │
        ┌─────▼─────┐               ┌───────▼──────┐
        │  MongoDB   │               │    Redis     │
        │ (Replica   │               │   (Cache +   │
        │   Set)     │               │   Session)   │
        └───────────┘               └──────────────┘
              │
        ┌─────▼─────┐
        │ Cloudinary │  (File storage)
        └───────────┘
```

---

## 📚 Thư Viện Bổ Sung Đề Xuất

| Package | Mục đích | Ưu tiên |
|---------|----------|---------|
| `express-rate-limit` | Chống brute-force | Cao |
| `joi` hoặc `zod` | Validate input | Cao |
| `cloudinary` | Upload ảnh | Cao |
| `helmet` | HTTP security headers | Cao |
| `winston` + `morgan` | Logging | Trung bình |
| `ioredis` | Cache + session | Trung bình |
| `axios` | Gọi API GHN/VNPay/MoMo | Cao |
| `passport` + `passport-google-oauth20` | Google OAuth | Trung bình |
| `node-cron` | Cron job (flash sale, expire voucher) | Trung bình |
| `socket.io` | Notification realtime (tùy chọn) | Thấp |
| `compression` | Gzip response | Thấp |
| `jest` + `supertest` | Unit & Integration test | Trung bình |

> **Lưu ý thêm `helmet` ngay** — chỉ cần `app.use(helmet())` để thêm các HTTP security headers cơ bản, bảo vệ khỏi XSS, clickjacking, v.v.
