# Báo cáo Audit Toàn dự án

> Tổng hợp từ 3 agent review song song (auth/security, data flow, frontend) — 2026-05-10.
> **Lưu ý**: Pricing semantic đã được fix riêng — không nằm trong danh sách này.

Cách đọc: mỗi mục có **file:line** để click thẳng vào IDE. Severity từ 🔴 cao nhất → 🔵 thấp nhất.

---

## 🔴 NHÓM 1 — Phải fix NGAY (production-breaking / security holes)

### 1.1 Refresh token chết hoàn toàn — thiếu `cookie-parser`
- **File**: `back-end/main/app.js`, `back-end/main/package.json`
- **Vấn đề**: `app.js` không mount `cookie-parser`, `package.json` không có dependency. `req.cookies` luôn `undefined`.
- **Hậu quả**:
  - `AuthController.logout` line 177 → destructure throw 500
  - `AuthController.refreshToken` line 198 → luôn fail
  - User logout không xóa được RefreshToken row, refresh token endpoint chết
- **Fix**:
  ```bash
  cd back-end/main && npm i cookie-parser
  ```
  ```js
  // app.js
  const cookieParser = require("cookie-parser");
  app.use(cookieParser()); // trước routes
  ```

### 1.2 Secrets bị leak trong `.env` đã commit lên git
- **File**: `back-end/main/.env`
- **Vấn đề**:
  - `JWT_SECRET=secret` ← brute-force trong vài giây
  - `GOOGLE_CLIENT_SECRET`, Gmail app password đã commit
- **Hậu quả**: Bất kỳ ai clone repo đều ký được JWT admin token và bypass `authorizeAdmin` toàn hệ thống.
- **Fix**:
  1. Rotate hết secrets ngay (Google Console, Gmail App Password, gen JWT_SECRET 64-byte random)
  2. Xóa `.env` khỏi git history: `git filter-repo --path back-end/main/.env --invert-paths`
  3. Đảm bảo `.env` trong `.gitignore`
  4. Tạo `.env.example` không có giá trị thật

### 1.3 NoSQL injection auth bypass
- **File**: `back-end/main/controllers/AuthController.js:127`
- **Vấn đề**: `User.findOne(email ? { email } : { username })` — username/email không ép kiểu.
- **Khai thác**: POST `/api/auth/login` body `{"username":{"$ne":null},"password":"x"}` → query thành `{username:{$ne:null}}` → trả về user đầu tiên trong DB. Sau đó `bcrypt.compare("x", hash)` → fail, OK. **Nhưng**: nếu user đầu tiên có `password` rỗng/yếu thì auth bypass.
- **Phòng xa hơn**: cùng pattern dễ leak ở các controller khác spread `req.body` vào filter.
- **Fix**:
  ```js
  const username = String(req.body.username || "");
  const email = String(req.body.email || "");
  ```
  Hoặc cài `express-mongo-sanitize` global middleware.

### 1.4 Stock race condition (oversell)
- **File**: `back-end/main/controllers/OrderController.js:30-86`
- **Vấn đề**: pattern `findOne` → check stock → `updateOne $inc -qty`. Không atomic.
- **Khai thác**: 2 user concurrent order sản phẩm cuối → cả 2 pass check → stock = -1.
- **Fix**: thay loop bằng atomic conditional update:
  ```js
  const r = await Product.updateOne(
    { _id: item.product, stock: { $gte: item.quantity } },
    { $inc: { stock: -item.quantity, sold: item.quantity } }
  );
  if (r.modifiedCount === 0) {
    // rollback các item đã trừ trước đó + return 409
    throw new Error("Hết hàng");
  }
  ```
  Tốt nhất bọc cả `createOrder` trong mongoose transaction.

### 1.5 Variant stock không bao giờ bị trừ
- **File**: `back-end/main/controllers/OrderController.js:47-86`, `back-end/main/models/Order.js:16-26`
- **Vấn đề**:
  - Order trừ `Product.stock`, không động đến `ProductVariant.stock`
  - Order schema không có field `variant`/`variantId` → variant info bị mất hoàn toàn
  - `cancelOrder` cũng restore lệch (chỉ Product.stock)
  - Frontend đã gửi `variantId` từ checkout (ĐÃ FIX) nhưng backend không dùng để write
- **Fix**:
  1. Thêm `variant: { type: ObjectId, ref: "ProductVariant" }` vào `orderSchema.products`
  2. Lưu `variantId` từ `enrichedProducts.push`
  3. Trừ `ProductVariant.stock` atomic khi có variantId
  4. `cancelOrder` restore symmetric
  5. Quyết định semantics: variant.stock có "child" của product.stock không, hay độc lập?

### 1.6 Verbose error handler leak stack trace
- **File**: `back-end/main/app.js:68-72`
- **Vấn đề**: trả `err.message` thẳng cho client → leak schema, internal paths, MongoDB CastError chi tiết.
- **Fix**:
  ```js
  app.use((err, req, res, next) => {
    console.error(err);
    const isProd = process.env.NODE_ENV === "production";
    res.status(err.status || 500).json({
      success: false,
      message: isProd ? "Có lỗi xảy ra. Vui lòng thử lại sau." : err.message,
    });
  });
  ```

---

## 🟠 NHÓM 2 — Fix sớm (logic sai, UX vỡ, exploit dễ)

### 2.1 Auth & rate limit

#### 2.1.1 Không có rate limit
- **File**: `back-end/main/app.js`, các route auth
- **Hậu quả**: brute-force OTP 6 chữ số (1M space) trong ~2 giây với 10 req/s.
- **Fix**: cài `express-rate-limit`:
  ```js
  const rateLimit = require("express-rate-limit");
  const authLimit = rateLimit({ windowMs: 15*60*1000, max: 5 });
  app.use("/api/auth/login", authLimit);
  app.use("/api/auth/register", authLimit);
  app.use("/api/auth/forgot-password", authLimit);
  app.use("/api/auth/verify-otp", authLimit);
  ```

#### 2.1.2 OTP cross-flow replay
- **File**: `back-end/main/models/Otp.js`, `controllers/AuthController.js`
- **Vấn đề**: register OTP và reset-password OTP cùng collection, key chỉ `(email, code)`. Register OTP có thể replay vào reset-password.
- **Fix**: thêm `purpose: { type: String, enum: ["register","reset"] }` vào OTP schema, filter theo purpose khi verify.

#### 2.1.3 `resetPassword` không validate độ dài + không revoke session
- **File**: `back-end/main/controllers/AuthController.js:323-348`
- **Vấn đề**: chấp nhận password rỗng, sau reset không xóa RefreshToken cũ.
- **Fix**:
  ```js
  if (!newPassword || newPassword.length < 8) return res.status(400).json(...);
  // sau user.save():
  await RefreshToken.deleteMany({ userId: user._id });
  ```

#### 2.1.4 `verifyRegisterOtp` reactivate banned user
- **File**: `back-end/main/controllers/AuthController.js:74-82`
- **Vấn đề**: re-register cùng email → set `isBanned=false` luôn → banned user tự unban.
- **Fix**: chỉ reactivate khi `deletedAt != null && isBanned !== true`. Không bao giờ reset `isBanned`.

#### 2.1.5 JWT_REFRESH_SECRET fallback về JWT_SECRET
- **File**: `back-end/main/controllers/AuthController.js:102, 153, 210, 253`
- **Vấn đề**: `process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET` — nếu unset, refresh token và access token có thể đổi vai trò.
- **Fix**: bỏ fallback, fail-fast ở startup:
  ```js
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("Missing JWT secrets");
  }
  ```

#### 2.1.6 Refresh token không rotate
- **File**: `back-end/main/controllers/AuthController.js:196`
- **Vấn đề**: leaked refresh token sống 7 ngày.
- **Fix**: trong `refreshToken` endpoint:
  1. Xóa RefreshToken row vừa dùng
  2. Sign refresh token mới
  3. Set cookie mới
  4. Trả access token mới

#### 2.1.7 OAuth Google không có `state` (CSRF)
- **File**: `back-end/main/routes/authRoutes.js`, `config/passport.js`
- **Fix**: dùng option `state: true` trong passport.authenticate, hoặc PKCE.

#### 2.1.8 OAuth callback truyền JWT trong URL
- **File**: `back-end/main/controllers/AuthController.js:267`
- **Vấn đề**: `redirect(${clientUrl}/oauth-callback?token=${accessToken})` → JWT vào browser history, Referer, server logs.
- **Fix**: set httpOnly cookie với token rồi redirect không kèm token; frontend gọi `/api/users/profile` để lấy user info.

#### 2.1.9 forgotPassword không lowercase email + leak existence
- **File**: `back-end/main/controllers/AuthController.js:280`
- **Vấn đề**: `User.findOne({ email })` không `.toLowerCase()` → email viết hoa fail. Trả 404 "Email không tồn tại" → enumeration oracle.
- **Fix**: lowercase + luôn trả message generic "Nếu email tồn tại, mã đã được gửi".

### 2.2 Race conditions & atomicity

#### 2.2.1 Voucher.usedCount race
- **File**: `back-end/main/controllers/OrderController.js:69-77, 102-105`
- **Fix**: atomic conditional:
  ```js
  const v = await Voucher.findOneAndUpdate(
    {
      code: voucherCode.toUpperCase(),
      isActive: true,
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  ```

#### 2.2.2 VoucherUsage thiếu unique index
- **File**: `back-end/main/models/VoucherUsage.js`
- **Fix**: `voucherUsageSchema.index({ voucherId: 1, userId: 1 }, { unique: true });`

#### 2.2.3 WishList.products dedupe race
- **File**: `back-end/main/controllers/WishListController.js:42-47, 108-115`
- **Vấn đề**: 2 request đồng thời tạo 2 entry cùng product.
- **Fix**: dùng atomic update với guard:
  ```js
  await WishList.updateOne(
    { userId, "products.productId": { $ne: productId } },
    { $push: { products: { productId, priceAtAdd: getEffectivePrice(product) } } }
  );
  ```

#### 2.2.4 Cancel order không revoke voucher + loyalty
- **File**: `back-end/main/controllers/OrderController.js:182-215`, `AdminController.js:307-314`
- **Fix**: trong `cancelOrder`:
  ```js
  if (order.voucherCode) {
    await Voucher.updateOne({ code: order.voucherCode }, { $inc: { usedCount: -1 } });
    await VoucherUsage.deleteOne({ orderId: order._id });
  }
  // hoàn loyalty
  const earned = Math.floor((order.total - order.shippingFee) / 1000);
  if (earned > 0) {
    await User.updateOne({ _id: userId }, { $inc: { loyaltyPoints: -earned } });
    await LoyaltyTransaction.create({ userId, type: "refund", points: -earned, ... });
  }
  ```

### 2.3 Cart variant lost end-to-end

- **Files**:
  - `front-end/haha/src/lib/cart.js:48, 62, 74` (syncServer chỉ post `{productId, quantity}`)
  - `back-end/main/models/Cart.js:11-20` (thiếu `variantId`, `color`, `priceAtAdd`)
  - `back-end/main/controllers/CartController.js:120-122` (`removeFromCart` xóa MỌI variant)
  - `front-end/haha/src/pages/CartPage.jsx:252-266` (`normalizeServerCart` set `variant: null`)
- **Vấn đề**: cùng product 2 variant → server collapse 1 line. Re-login mất variant info. Remove 1 variant → xóa hết.
- **Fix step-by-step**:
  1. Cart model: thêm `variantId`, `color`, `priceAtAdd` vào subdoc
  2. CartController: dedupe key trên `(productId, variantId, color)`
  3. lib/cart.js: pass đủ field trong syncServer
  4. CartPage normalizeServerCart: đọc variant info từ server

### 2.4 Cart merge khi login
- **Vấn đề**: login xong cart localStorage không merge vào server cart.
- **Fix**: thêm endpoint `POST /api/cart/merge` nhận array items, merge add-or-increment. Gọi sau login thành công.

### 2.5 FlashSale logic vỡ

#### 2.5.1 Flash stock không trừ
- **File**: `back-end/main/controllers/OrderController.js`, `models/FlashSale.js:41-50`
- **Fix**: sau khi lookup product trong order, nếu có FlashSale active:
  ```js
  await FlashSale.updateOne(
    {
      _id: flashSale._id,
      "products.productId": product._id,
      $expr: { $lte: [{ $add: ["$products.$.sold", qty] }, "$products.$.quantity"] },
    },
    { $inc: { "products.$.sold": qty } }
  );
  ```

#### 2.5.2 `isActive=false` không vô hiệu flash
- **File**: `back-end/main/lib/pricing.js`, `front-end/haha/src/lib/pricing.js`
- **Vấn đề**: helper đọc `product.isFlashSale` denormalized.
- **Fix**: hoặc query FlashSale trực tiếp (lookup theo productId), hoặc add hook trên FlashSale save sync về Product.

#### 2.5.3 FlashSale soonest-end logic sai
- **File**: `front-end/haha/src/components/FlashSale/index.jsx:203-208`
- **Fix**: chỉ track min trên flash sale có `endsAt > now`:
  ```js
  const future = flashSales.filter(f => new Date(f.endsAt) > new Date());
  const soonest = future.reduce((min, f) =>
    !min || new Date(f.endsAt) < new Date(min) ? f.endsAt : min, null);
  ```

### 2.6 Frontend critical bugs

#### 2.6.1 AccountPage fake success
- **File**: `front-end/haha/src/pages/AccountPage.jsx:189-191`
- **Fix**: đổi `toast.success` → `toast.error` trong catch.

#### 2.6.2 401 hard-redirect cho guest
- **File**: `front-end/haha/src/lib/api.js:57-63`
- **Vấn đề**: NotificationBell poll → guest bị kick về /login mid-browse.
- **Fix**: chỉ redirect khi đang ở route protected; hoặc clear token + dispatch event, để route guard xử lý.

#### 2.6.3 NotificationBell poll sau logout
- **File**: `front-end/haha/src/components/Header/index.jsx:79-83`
- **Fix**: gate `useEffect` setInterval bằng check `localStorage.getItem("token")` mỗi tick, hoặc unmount component khi logout (storage event listener).

#### 2.6.4 Không có ErrorBoundary, scroll restore, post-login redirect
- **File**: `front-end/haha/src/App.jsx:46-119`
- **Fix**:
  - Wrap `<Routes>` bằng ErrorBoundary class component
  - `<ScrollRestoration>` từ react-router v6
  - `AuthRoute`: pass `state: { from: location }` khi redirect, login xong navigate về `from`

#### 2.6.5 AdminRoute trust localStorage
- **File**: `front-end/haha/src/App.jsx`
- **Vấn đề**: ex-admin có localStorage cũ vẫn pass 1 render → có thể xem trang admin trước khi server reject.
- **Fix**: gọi `/api/users/profile` trong AdminRoute để verify role server-side.

#### 2.6.6 Race fetch trên ProductDetailPage
- **File**: `front-end/haha/src/pages/ProductDetailPage.jsx:96-117`
- **Vấn đề**: 4 fetch parallel không có AbortController. Click A→B→A có thể leave stale.
- **Fix**:
  ```js
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })...
    return () => ctrl.abort();
  }, [id]);
  ```

#### 2.6.7 Wishlist removeFromWishlist không sync server
- **File**: `front-end/haha/src/lib/wishlist.js:66-70`
- **Fix**: gọi `syncServer(id)` (toggle endpoint) trong remove function.

### 2.7 Upload security (Stored XSS)
- **File**: `back-end/main/middleware/uploadMiddleware.js:6`
- **Vấn đề**: `file.mimetype.startsWith("image/")` tin client mimetype → SVG có `<script>` qua được → stored XSS.
- **Fix**:
  ```js
  const allowedExt = /\.(png|jpe?g|webp|gif)$/i;
  // Sau upload, dùng `file-type` package check magic bytes.
  // Serve image với header:
  res.setHeader("Content-Disposition", `inline; filename="${name}"`);
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  ```

### 2.8 CORS quá rộng
- **File**: `back-end/main/app.js:32`
- **Vấn đề**: `/^http:\/\/localhost(:\d+)?$/` + `credentials:true` → bất kỳ app nào trên localhost cũng gọi API.
- **Fix**:
  ```js
  origin: process.env.NODE_ENV === "production"
    ? [process.env.CLIENT_URL]
    : ["http://localhost:5174"],
  ```

---

## 🟡 NHÓM 3 — Nên fix (medium)

| # | File | Vấn đề | Fix |
|---|------|--------|-----|
| 3.1 | `controllers/AdminController.js:222, 358`<br>`controllers/ProductController.js:187` | Regex unescaped → ReDoS | Copy `escapeRegex` từ `ProductController.getAll` |
| 3.2 | `middleware/authMiddleware.js:11` | `req.user = await User.findById(...)` có thể null → `authorizeAdmin` crash | Trả 401 nếu null hoặc isBanned |
| 3.3 | `middleware/authMiddleware.js:14` | JWT invalid trả 400, nên 401 | Đổi status code |
| 3.4 | `routes/orderRoutes.js:9, 15` | `/:orderId` đặt trước `/returns` → `/returns` 404 | Đảo thứ tự route |
| 3.5 | `models/Order.js` | Thiếu `note`, `subtotal`, `productNameAtOrder`, `imageAtOrder` snapshot | Thêm field; copy lúc create |
| 3.6 | `controllers/VoucherController.js:107` | Update voucher percent value > 100 không bị chặn | Custom validator theo type |
| 3.7 | `models/Order.js:5-9` | `Math.random()` cho orderNumber → predictable, dễ trùng | `crypto.randomBytes(4).toString("hex")` |
| 3.8 | `models/Review.js:20` | Unique index `(productId,userId,orderId)` → 1 user mua lại review 2 lần | Đổi thành `(productId, userId)` |
| 3.9 | `pages/CartPage.jsx:23, 131`<br>`pages/CheckoutPage.jsx:16-17` | Hardcoded shipping fee duplicate | Trích `lib/shipping.js` |
| 3.10 | `components/Header/index.jsx:339-352` | Search debounce không cancel inflight axios | AbortController + axios signal |
| 3.11 | `components/ImageWithFallback.jsx:23` | `didError` không reset khi `src` đổi | `useEffect(()=>setDidError(false), [src])` |
| 3.12 | `pages/WishlistPage.jsx` `handleAddToCart` | `product.variants?.[0]` là string → variant bogus | Fetch variants thực |
| 3.13 | `components/FlashSale/index.jsx:196, 227-228, 233, 237` | `console.log` còn trong production | Remove |
| 3.14 | 8+ files | `formatCurrency` duplicate | Trích `lib/format.js` |
| 3.15 | `models/User.js` toJSON | `.lean()` queries bypass transform → leak password/googleId | `select: false` global trên password, googleId |
| 3.16 | `controllers/CartController.js:84` | `updateCart` thiếu check `isActive: true` | Thêm vào filter |
| 3.17 | `controllers/CartController.js:11-15` | Populate cart không có variant info | Populate ProductVariant qua variantId (sau khi cart có variantId) |

---

## 🔵 NHÓM 4 — Nice-to-have

- Cài `helmet` + HSTS + CSP + `frame-ancestors`
- Index `(userId, token)` cho RefreshToken (revoke-all nhanh)
- Focus trap + ESC handler cho dropdown notification, mobile menu, drawer admin
- Replace `confirm()` mobile-unfriendly bằng modal pattern (đã có sẵn)
- Indexes thiếu cho aggregation analytics (top customers, revenue)
- `.env.example` cho cả backend + frontend
- Notification chưa fire ở: user `cancelOrder`, `createReturnRequest`, `approveReturn`, `rejectReturn`
- Product detail review form `confirm()` → modal
- Mobile responsive audit Admin Dashboard

---

## Đề xuất thứ tự fix

| Tuần | Task | Lý do ưu tiên |
|------|------|---------------|
| **Tuần này (urgent)** | Nhóm 1.1, 1.2, 1.3, 1.6 | 4 lỗi attacker exploit trong 5 phút |
| Tuần sau | Nhóm 1.4, 1.5 (stock + variant in order) | Cần redesign nhỏ, không vội như security |
| Tuần kế | Nhóm 2.1 (auth + rate limit) | Hoàn thiện auth flow |
| Tuần kế | Nhóm 2.2 (atomic) + 2.4 (cart merge) | Logic data đúng |
| Tuần kế | Nhóm 2.3 (cart variant) + 2.5 (FlashSale) | UX |
| Tuần kế | Nhóm 2.6 + 2.7 + 2.8 (FE bugs + upload + CORS) | UX + security |
| Tuần sau | Nhóm 3 | Polish |
| Khi rảnh | Nhóm 4 | Nice-to-have |

---

## Test smoke sau mỗi nhóm

| Nhóm fix xong | Test |
|---------------|------|
| 1.1 cookie-parser | Logout xóa được RefreshToken row, refresh endpoint trả token mới |
| 1.2 secrets rotate | Server start OK; OAuth login OK; email OTP gửi OK |
| 1.3 NoSQL inj | POST login `{"username":{"$ne":null},"password":"x"}` → 401, không 200 |
| 1.4 stock atomic | 2 user concurrent buy 1 sản phẩm cuối → 1 success, 1 fail 409 |
| 1.5 variant stock | Mua variant 256GB → variant 256GB stock giảm, variant 512GB không đổi; cancel → restore đúng variant |
| 1.6 error handler | Trigger crash (thử cast invalid id) → response không có stack trace |
