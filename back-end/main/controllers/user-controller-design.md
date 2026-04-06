# Thiết Kế Chi Tiết — User Controller (Node.js / MVC)

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Database Models](#3-database-models)
4. [Middleware](#4-middleware)
5. [Routes](#5-routes)
6. [Controller — Chi tiết từng chức năng](#6-controller--chi-tiết-từng-chức-năng)
7. [Service Layer](#7-service-layer)
8. [Xử lý lỗi & Response chuẩn](#8-xử-lý-lỗi--response-chuẩn)
9. [Biến môi trường (.env)](#9-biến-môi-trường-env)


---

## 1. Tổng quan kiến trúc

```
Client
  │
  ▼
Routes (Express Router)
  │
  ├── Middleware (verifyToken, authorizeAdmin, Validate, RateLimit, Upload)
  │
  ▼
Controller  ──►  Service  ──►  Model (Mongoose)
  │                                    │
  │                                    ▼
  │                              MongoDB (Atlas / Local)
  │
  ▼
Response (JSON)
```

**Luồng xử lý chuẩn:**
- **Route** định nghĩa endpoint, gắn middleware xác thực và phân quyền
- **Controller** nhận request, lấy `userId` từ `req.user` (JWT payload), gọi service, trả response
- **Service** chứa business logic, tương tác với Model
- **Model** định nghĩa schema Mongoose

> ⚠️ **Nguyên tắc quan trọng:** Không bao giờ lấy `userId` từ `req.body` hoặc `req.params` cho các thao tác liên quan đến chính user đang đăng nhập. Luôn dùng `req.user.id` từ JWT đã được verify.

---

## 2. Cấu trúc thư mục

```
src/
├── config/
│   └── cloudinary.js           # Cấu hình Cloudinary để upload avatar
│
├── models/
│   ├── User.model.js
│   └── LoyaltyTransaction.model.js
│
├── controllers/
│   └── user.controller.js
│
├── services/
│   └── user.service.js
│
├── middlewares/
│   ├── auth.middleware.js       # verifyToken, authorizeAdmin (dùng chung với Auth)
│   ├── validate.middleware.js   # Joi schemas cho user
│   ├── rateLimiter.middleware.js
│   └── upload.middleware.js     # Multer + Cloudinary storage
│
├── routes/
│   └── user.routes.js
│
├── utils/
│   ├── response.utils.js        # Chuẩn hóa response JSON
│   └── sanitize.utils.js        # Strip HTML / trim fields
│
└── app.js
```

---

## 3. Database Models

### 3.1 User Model (`models/User.model.js`)

> Model này dùng chung với Auth Controller. Thêm các field cần thiết cho User Controller:

```javascript
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    googleId: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ─── Thêm cho User Controller ───────────────────────────────────────────
    fullName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",                 // URL Cloudinary
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,                      // Không cho phép âm
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedReason: {
      type: String,
      default: "",
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,               // Soft delete
    },
  },
  { timestamps: true }
);

// Ẩn các field nhạy cảm khi serialize
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.googleId;
    return ret;
  },
});
```

**Lưu ý bảo mật:**
- `toJSON` transform đảm bảo `password`, `googleId`, `__v` không bao giờ xuất hiện trong response
- `loyaltyPoints` có ràng buộc `min: 0` ở schema nhưng vẫn phải check ở service trước khi trừ
- `deletedAt` dùng cho soft delete — không xóa record khỏi DB

---

### 3.2 LoyaltyTransaction Model (`models/LoyaltyTransaction.model.js`)

```javascript
const loyaltyTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem"],    // earn: tích điểm, redeem: đổi điểm
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      required: true,             // Ví dụ: "Mua đơn #ORD-001", "Đổi điểm lấy voucher VOUCHER-50K"
    },
    referenceId: {
      type: String,
      default: null,              // ID đơn hàng hoặc voucher liên quan
    },
    balanceAfter: {
      type: Number,
      required: true,             // Ghi lại số dư sau giao dịch để audit
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,               // Chỉ unique với các document có field này (redeem)
    },
  },
  { timestamps: true }
);
```

**Lưu ý:**
- `balanceAfter` lưu lại số dư tại thời điểm giao dịch → dễ audit, phát hiện bất thường
- `idempotencyKey` ngăn chặn double-redeem do client retry

---

## 4. Middleware

### 4.1 Auth Middleware (`middlewares/auth.middleware.js`)

> Dùng chung với Auth Controller. Xem file `auth-controller-design.md` mục 4.2.

```javascript
// verifyToken: kiểm tra JWT từ Authorization header
// authorizeAdmin: kiểm tra role === "admin"
// checkBanned: kiểm tra user có bị ban không
exports.checkBanned = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("isBanned bannedReason");
  if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
  if (user.isBanned) {
    return res.status(403).json({
      success: false,
      message: `Tài khoản đã bị khóa. Lý do: ${user.bannedReason || "Vi phạm điều khoản."}`,
    });
  }
  next();
};
```

---

### 4.2 Rate Limiter (`middlewares/rateLimiter.middleware.js`)

```javascript
const rateLimit = require("express-rate-limit");

// Dùng cho updateProfile
exports.updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 phút
  max: 10,
  message: { success: false, message: "Quá nhiều yêu cầu cập nhật. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dùng cho redeemPoints
exports.redeemPointsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 giờ
  max: 5,
  message: { success: false, message: "Quá nhiều yêu cầu đổi điểm. Vui lòng thử lại sau." },
});
```

---

### 4.3 Upload Middleware (`middlewares/upload.middleware.js`)

```javascript
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }], // Resize về 400x400
  },
});

// Giới hạn 2MB, chỉ chấp nhận image/*
exports.uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ chấp nhận file ảnh."), false);
    }
    cb(null, true);
  },
}).single("avatar");
```

---

### 4.4 Validate Middleware (`middlewares/validate.middleware.js`)

```javascript
const Joi = require("joi");

const schemas = {
  updateProfile: Joi.object({
    fullName:    Joi.string().max(100).optional(),
    phone:       Joi.string().pattern(/^[0-9]{9,11}$/).optional(),
    address:     Joi.string().max(300).optional(),
    // Email/username thay đổi qua endpoint riêng (cần xác minh thêm)
  }),

  banUser: Joi.object({
    isBanned:     Joi.boolean().required(),
    bannedReason: Joi.string().max(300).when("isBanned", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  redeemPoints: Joi.object({
    points:         Joi.number().integer().min(1).required(),
    idempotencyKey: Joi.string().uuid().required(),  // Client tạo UUID mỗi lần redeem
  }),
};

exports.validate = (schemaName) => (req, res, next) => {
  const { error } = schemas[schemaName].validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};
```

---

## 5. Routes

### `routes/user.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, authorizeAdmin, checkBanned } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { updateProfileLimiter, redeemPointsLimiter } = require("../middlewares/rateLimiter.middleware");
const { uploadAvatar } = require("../middlewares/upload.middleware");

// ─── Profile (self) ──────────────────────────────────────────────────────────
router.get("/profile",          verifyToken, checkBanned, userController.getProfile);
router.put("/profile",          verifyToken, checkBanned, updateProfileLimiter, uploadAvatar, validate("updateProfile"), userController.updateProfile);
router.delete("/account",       verifyToken, userController.deleteAccount);

// ─── Loyalty ─────────────────────────────────────────────────────────────────
router.get("/loyalty",          verifyToken, checkBanned, userController.getLoyaltyPoints);
router.post("/loyalty/redeem",  verifyToken, checkBanned, redeemPointsLimiter, validate("redeemPoints"), userController.redeemPoints);

// ─── User lookup (self hoặc admin) ───────────────────────────────────────────
router.get("/users/:id",        verifyToken, userController.getUser);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.patch("/users/:id/ban",  verifyToken, authorizeAdmin, validate("banUser"), userController.banUser);

module.exports = router;
```

---

## 6. Controller — Chi tiết từng chức năng

### `controllers/user.controller.js`

---

### 6.1 Get Profile

**Luồng xử lý:**
1. Lấy `userId` từ `req.user.id` (JWT payload)
2. Truy vấn DB, loại bỏ các field nhạy cảm
3. Kiểm tra `deletedAt` — nếu tài khoản đã bị xóa mềm, từ chối truy cập

```javascript
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      deletedAt: null,
    }).select("-password -googleId -__v");

    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Chỉ trả dữ liệu của chính user đang đăng nhập
- Kiểm tra `deletedAt` để tránh user đã xóa vẫn đọc được data

---

### 6.2 Get User (by ID)

**Luồng xử lý:**
1. Lấy `targetId` từ `req.params.id`
2. Nếu `targetId !== req.user.id` và `req.user.role !== "admin"` → từ chối
3. Admin được xem full info; user thường chỉ xem thông tin public của chính mình

```javascript
exports.getUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;
    const requesterId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Không phải admin và đang xem người khác → từ chối
    if (!isAdmin && targetId !== requesterId) {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập." });
    }

    // Admin xem full info; user thường chỉ lấy field public
    const selectFields = isAdmin
      ? "-password -googleId -__v"
      : "-password -googleId -__v -phone -address -isBanned -bannedReason -bannedAt -deletedAt";

    const user = await User.findOne({ _id: targetId, deletedAt: null }).select(selectFields);

    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Không tiết lộ thông tin nhạy cảm (phone, address, trạng thái ban) cho user thường
- Admin có thể xem toàn bộ thông tin để hỗ trợ

---

### 6.3 Update Profile

**Luồng xử lý:**
1. Lấy `userId` từ `req.user.id`
2. Sanitize các field text (strip HTML tags)
3. Nếu có file avatar → URL từ Cloudinary đã được upload bởi `uploadAvatar` middleware
4. Chỉ cập nhật các field được phép (whitelist) — không cho phép thay đổi `role`, `email`, `isBanned`
5. Lưu DB

```javascript
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, address } = req.body;

    // Whitelist fields — không chấp nhận bất kỳ field nào khác
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = sanitize(fullName);
    if (phone    !== undefined) updateData.phone    = sanitize(phone);
    if (address  !== undefined) updateData.address  = sanitize(address);

    // Avatar từ Cloudinary (upload qua middleware)
    if (req.file?.path) {
      updateData.avatarUrl = req.file.path;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu để cập nhật." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -googleId -__v");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công.",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Whitelist field cứng — không thể cập nhật `role`, `email`, `isBanned` qua endpoint này
- Sanitize input để chống XSS lưu vào DB
- `runValidators: true` kích hoạt lại validation ở schema Mongoose khi update
- Avatar bị resize về 400×400 bởi Cloudinary transform trước khi lưu URL

---

### 6.4 Delete Account

**Luồng xử lý:**
1. Lấy `userId` từ `req.user.id`
2. Soft delete: set `deletedAt = new Date()`
3. Revoke toàn bộ refresh token của user đó
4. Clear cookie

```javascript
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    // Soft delete — không xóa khỏi DB để bảo toàn lịch sử đơn hàng, review, v.v.
    await User.updateOne({ _id: userId }, { deletedAt: new Date() });

    // Revoke toàn bộ phiên đăng nhập
    await RefreshToken.deleteMany({ userId });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Ghi audit log (tuỳ yêu cầu hệ thống)
    console.info(`[AUDIT] User ${userId} self-deleted at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Tài khoản đã được xóa thành công." });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Soft delete thay vì hard delete — bảo toàn dữ liệu liên quan (orders, reviews)
- Revoke toàn bộ refresh token ngay lập tức
- Ghi audit log để theo dõi

---

### 6.5 Ban User (Admin)

**Luồng xử lý:**
1. Lấy `targetId` từ `req.params.id`
2. Không cho phép admin tự ban chính mình
3. Cập nhật `isBanned`, `bannedReason`, `bannedAt` (hoặc clear nếu unban)
4. Nếu ban → revoke toàn bộ refresh token của user bị ban ngay lập tức
5. Ghi audit log

```javascript
exports.banUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;
    const adminId = req.user.id;
    const { isBanned, bannedReason } = req.body;

    // Admin không thể tự ban chính mình
    if (targetId === adminId) {
      return res.status(400).json({ success: false, message: "Không thể khóa tài khoản của chính mình." });
    }

    const target = await User.findOne({ _id: targetId, deletedAt: null });
    if (!target) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const updateData = isBanned
      ? { isBanned: true,  bannedReason, bannedAt: new Date() }
      : { isBanned: false, bannedReason: "", bannedAt: null };

    await User.updateOne({ _id: targetId }, { $set: updateData });

    // Khi ban → kick phiên đăng nhập ngay lập tức
    if (isBanned) {
      await RefreshToken.deleteMany({ userId: targetId });
    }

    // Audit log
    console.info(
      `[AUDIT] Admin ${adminId} ${isBanned ? "banned" : "unbanned"} user ${targetId} ` +
      `at ${new Date().toISOString()}. Reason: ${bannedReason || "N/A"}`
    );

    return res.status(200).json({
      success: true,
      message: isBanned ? "Tài khoản đã bị khóa." : "Tài khoản đã được mở khóa.",
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Route được bảo vệ bởi `verifyToken` + `authorizeAdmin`
- Ngăn admin tự ban chính mình
- Revoke refresh token ngay khi ban → user bị đăng xuất khỏi tất cả thiết bị
- Audit log đầy đủ: ai ban, ban ai, khi nào, lý do gì

---

### 6.6 Get Loyalty Points

**Luồng xử lý:**
1. Lấy `userId` từ `req.user.id`
2. Trả về số điểm hiện tại và lịch sử giao dịch (phân trang)

```javascript
exports.getLoyaltyPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const user = await User.findOne({ _id: userId, deletedAt: null }).select("loyaltyPoints");
    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LoyaltyTransaction.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        currentPoints: user.loyaltyPoints,
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Chỉ trả dữ liệu của chính user đang đăng nhập
- Phân trang để tránh trả về toàn bộ lịch sử cùng lúc

---

### 6.7 Redeem Points

**Luồng xử lý:**
1. Lấy `userId` từ `req.user.id`
2. Kiểm tra `idempotencyKey` đã xử lý chưa → nếu rồi, trả response thành công luôn (không xử lý lại)
3. Dùng MongoDB session + transaction để đảm bảo atomic:
   - Kiểm tra số điểm hiện tại đủ không
   - Trừ điểm
   - Ghi `LoyaltyTransaction`
4. Trả về số điểm còn lại

```javascript
exports.redeemPoints = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { points, idempotencyKey } = req.body;

    // Kiểm tra idempotency — tránh double-redeem do client retry
    const existing = await LoyaltyTransaction.findOne({ idempotencyKey }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "Giao dịch đã được xử lý trước đó.",
        data: { idempotencyKey },
      });
    }

    // Lấy user và lock document trong transaction
    const user = await User.findOne({ _id: userId, deletedAt: null }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    if (user.loyaltyPoints < points) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Không đủ điểm. Hiện có: ${user.loyaltyPoints}, yêu cầu: ${points}.`,
      });
    }

    const newBalance = user.loyaltyPoints - points;

    // Trừ điểm
    await User.updateOne(
      { _id: userId },
      { $inc: { loyaltyPoints: -points } },
      { session }
    );

    // Ghi lịch sử giao dịch
    await LoyaltyTransaction.create(
      [{
        userId,
        type: "redeem",
        points,
        description: `Đổi ${points} điểm`,
        balanceAfter: newBalance,
        idempotencyKey,
      }],
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: `Đổi điểm thành công. Số điểm còn lại: ${newBalance}.`,
      data: { pointsRedeemed: points, remainingPoints: newBalance },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
```

**Bảo mật:**
- MongoDB transaction đảm bảo atomic — không xảy ra tình trạng trừ điểm nhưng không ghi log hoặc ngược lại
- `idempotencyKey` (UUID do client tạo) ngăn chặn double-redeem khi client retry
- Kiểm tra số dư trước khi trừ trong cùng một transaction
- Rate limit 5 req/giờ ở route

---

## 7. Service Layer

### `utils/sanitize.utils.js`

```javascript
const sanitizeHtml = require("sanitize-html");

/**
 * Strip toàn bộ HTML tags khỏi string
 * Dùng trước khi lưu các field text vào DB để chống stored XSS
 */
exports.sanitize = (value) => {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
};
```

### `config/cloudinary.js`

```javascript
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

---

## 8. Xử lý lỗi & Response chuẩn

### Error Handler Global (`app.js`)

```javascript
// Đặt ở cuối cùng, sau tất cả routes
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Lỗi từ Multer (upload file)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File ảnh không được vượt quá 2MB." });
  }
  if (err.message === "Chỉ chấp nhận file ảnh.") {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production"
    ? "Đã xảy ra lỗi. Vui lòng thử lại."
    : err.message;

  res.status(status).json({ success: false, message });
});
```

### Chuẩn Response JSON

| Tình huống | HTTP Status | Body |
|---|---|---|
| Thành công | 200 / 201 | `{ success: true, message, data? }` |
| Lỗi validation | 400 | `{ success: false, message: [...] }` |
| Chưa đăng nhập | 401 | `{ success: false, message }` |
| Không có quyền / bị ban | 403 | `{ success: false, message }` |
| Không tìm thấy | 404 | `{ success: false, message }` |
| Rate limit | 429 | `{ success: false, message }` |
| Lỗi server | 500 | `{ success: false, message }` |

---

## 9. Biến môi trường (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/shop_db

# JWT (dùng chung với Auth Controller)
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Cloudinary (upload avatar)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ Không bao giờ commit file `.env` lên Git. Thêm vào `.gitignore`.

---

*Tài liệu này được tạo dựa trên yêu cầu thiết kế User Controller với Node.js / MVC.*
