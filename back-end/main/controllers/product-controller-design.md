# Thiết Kế Chi Tiết — Product Controller (Node.js / MVC)

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
- **Controller** nhận request, validate đầu vào, gọi service, trả response
- **Service** chứa business logic, tương tác với Model
- **Model** định nghĩa schema Mongoose

**Phân loại endpoint:**
- **Public** — không cần đăng nhập: `getAll`, `getById`, `search`, `filterByCategory`, `filterByPrice`, `getFlashSales`, `getVariants`, `getRelated`
- **User (đã đăng nhập)** — `notifyRestock`
- **Admin only** — `createProduct`, `updateProduct`, `deleteProduct`, `getRestockSubscribers`

---

## 2. Cấu trúc thư mục

```
src/
├── config/
│   └── cloudinary.js              # Cấu hình Cloudinary upload ảnh sản phẩm
│
├── models/
│   ├── Product.model.js
│   ├── Category.model.js
│   ├── ProductVariant.model.js
│   ├── FlashSale.model.js
│   └── RestockSubscriber.model.js
│
├── controllers/
│   └── product.controller.js
│
├── services/
│   └── product.service.js
│
├── middlewares/
│   ├── auth.middleware.js          # verifyToken, authorizeAdmin (dùng chung)
│   ├── validate.middleware.js      # Joi schemas cho product
│   ├── rateLimiter.middleware.js
│   └── upload.middleware.js        # Multer + Cloudinary (ảnh sản phẩm)
│
├── routes/
│   └── product.routes.js
│
├── utils/
│   ├── response.utils.js
│   └── notification.utils.js      # Gửi email thông báo restock
│
└── app.js
```

---

## 3. Database Models

### 3.1 Product Model (`models/Product.model.js`)

```javascript
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",              // Text index để hỗ trợ search
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,                 // VD: "ao-thun-nam-basic" — dùng cho SEO URL
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: null,              // null = không giảm giá
      min: 0,
    },
    images: [
      {
        url:       { type: String, required: true },
        publicId:  { type: String, required: true }, // Cloudinary public_id để xóa ảnh
        isPrimary: { type: Boolean, default: false },
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,              // false = ẩn sản phẩm, không hiện ngoài frontend
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    flashSalePrice: {
      type: Number,
      default: null,
    },
    flashSaleEndsAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,              // Soft delete
    },
  },
  { timestamps: true }
);

// Compound index để filter nhanh theo category + price
productSchema.index({ category: 1, basePrice: 1 });
productSchema.index({ isActive: 1, deletedAt: 1 });
productSchema.index({ name: "text", tags: "text" }); // Full-text search
```

**Lưu ý:**
- `slug` dùng cho URL thân thiện — tạo tự động từ `name` khi create
- `sold` tăng dần mỗi khi order được xác nhận, dùng để sort "bán chạy"
- `isActive: false` = ẩn khỏi frontend nhưng admin vẫn xem được

---

### 3.2 ProductVariant Model (`models/ProductVariant.model.js`)

```javascript
const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,                 // VD: "Size M - Màu đỏ"
    },
    sku: {
      type: String,
      unique: true,
      trim: true,                 // Stock Keeping Unit — mã phân biệt variant
    },
    attributes: {
      type: Map,
      of: String,                 // VD: { size: "M", color: "đỏ" }
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [{ type: String }],   // URL ảnh riêng cho variant (tuỳ chọn)
  },
  { timestamps: true }
);
```

---

### 3.3 FlashSale Model (`models/FlashSale.model.js`)

```javascript
const flashSaleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    flashSalePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

flashSaleSchema.index({ endsAt: 1 }); // Để cron job tìm flash sale đã hết hạn
```

---

### 3.4 RestockSubscriber Model (`models/RestockSubscriber.model.js`)

```javascript
const restockSubscriberSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,              // null nếu guest đăng ký bằng email
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    notifiedAt: {
      type: Date,
      default: null,              // null = chưa gửi thông báo
    },
  },
  { timestamps: true }
);

// Mỗi email chỉ subscribe 1 lần cho 1 sản phẩm
restockSubscriberSchema.index({ productId: 1, email: 1 }, { unique: true });
```

---

## 4. Middleware

### 4.1 Auth Middleware (`middlewares/auth.middleware.js`)

> Dùng chung với Auth & User Controller. `verifyToken` + `authorizeAdmin`.

---

### 4.2 Validate Middleware (`middlewares/validate.middleware.js`)

```javascript
const Joi = require("joi");

const schemas = {
  createProduct: Joi.object({
    name:        Joi.string().max(200).required(),
    description: Joi.string().optional(),
    category:    Joi.string().hex().length(24).required(), // MongoDB ObjectId
    basePrice:   Joi.number().min(0).required(),
    salePrice:   Joi.number().min(0).optional(),
    stock:       Joi.number().integer().min(0).required(),
    tags:        Joi.array().items(Joi.string()).optional(),
  }),

  updateProduct: Joi.object({
    name:        Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    category:    Joi.string().hex().length(24).optional(),
    basePrice:   Joi.number().min(0).optional(),
    salePrice:   Joi.number().min(0).allow(null).optional(),
    stock:       Joi.number().integer().min(0).optional(),
    tags:        Joi.array().items(Joi.string()).optional(),
    isActive:    Joi.boolean().optional(),
  }),

  notifyRestock: Joi.object({
    email: Joi.string().email().required(),
  }),

  filterByPrice: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(0).optional(),
  }),
};

exports.validate = (schemaName) => (req, res, next) => {
  const source = ["createProduct", "updateProduct", "notifyRestock"].includes(schemaName)
    ? req.body
    : req.query;
  const { error } = schemas[schemaName].validate(source, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};
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
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // Max 800x800
  },
});

// Cho phép upload tối đa 10 ảnh cho 1 sản phẩm
exports.uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB mỗi ảnh
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ chấp nhận file ảnh."), false);
    }
    cb(null, true);
  },
}).array("images", 10);
```

---

### 4.4 Rate Limiter (`middlewares/rateLimiter.middleware.js`)

```javascript
const rateLimit = require("express-rate-limit");

// Dùng cho notifyRestock — tránh spam đăng ký email
exports.notifyRestockLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 giờ
  max: 10,
  message: { success: false, message: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dùng cho search — tránh DDoS bằng query phức tạp
exports.searchLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 phút
  max: 30,
  message: { success: false, message: "Quá nhiều yêu cầu tìm kiếm." },
});
```

---

## 5. Routes

### `routes/product.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { verifyToken, authorizeAdmin } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { notifyRestockLimiter, searchLimiter } = require("../middlewares/rateLimiter.middleware");
const { uploadProductImages } = require("../middlewares/upload.middleware");

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/",                     productController.getAll);
router.get("/search",               searchLimiter, productController.search);
router.get("/filter/category",      productController.filterByCategory);
router.get("/filter/price",         validate("filterByPrice"), productController.filterByPrice);
router.get("/flash-sales",          productController.getFlashSales);
router.get("/:id",                  productController.getById);
router.get("/:id/variants",         productController.getVariants);
router.get("/:id/related",          productController.getRelated);

// ─── User (đã đăng nhập) ──────────────────────────────────────────────────────
router.post("/:id/notify-restock",  verifyToken, notifyRestockLimiter, validate("notifyRestock"), productController.notifyRestock);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post("/",                    verifyToken, authorizeAdmin, uploadProductImages, validate("createProduct"), productController.createProduct);
router.put("/:id",                  verifyToken, authorizeAdmin, uploadProductImages, validate("updateProduct"), productController.updateProduct);
router.delete("/:id",               verifyToken, authorizeAdmin, productController.deleteProduct);
router.get("/:id/restock-subscribers", verifyToken, authorizeAdmin, productController.getRestockSubscribers);

module.exports = router;
```

---

## 6. Controller — Chi tiết từng chức năng

### `controllers/product.controller.js`

---

### 6.1 Get All

**Luồng xử lý:**
1. Nhận query params: `page`, `limit`, `sort`
2. Chỉ lấy sản phẩm `isActive: true` và `deletedAt: null`
3. Hỗ trợ sort: `newest`, `price_asc`, `price_desc`, `best_seller`
4. Trả về danh sách kèm pagination

```javascript
exports.getAll = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const sortOptions = {
      newest:       { createdAt: -1 },
      price_asc:    { basePrice: 1 },
      price_desc:   { basePrice: -1 },
      best_seller:  { sold: -1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;

    const filter = { isActive: true, deletedAt: null };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-__v")
        .populate("category", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.2 Get By ID

**Luồng xử lý:**
1. Tìm sản phẩm theo `id`, chỉ lấy `isActive: true` và `deletedAt: null`
2. Populate category
3. Kiểm tra flash sale còn hiệu lực không (so sánh `flashSaleEndsAt` với `new Date()`)

```javascript
exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      deletedAt: null,
    })
      .select("-__v")
      .populate("category", "name slug");

    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    // Kiểm tra flash sale còn hiệu lực không
    const now = new Date();
    const flashSaleActive =
      product.isFlashSale &&
      product.flashSaleEndsAt &&
      product.flashSaleEndsAt > now;

    return res.status(200).json({
      success: true,
      data: {
        ...product.toJSON(),
        flashSaleActive,
        effectivePrice: flashSaleActive ? product.flashSalePrice : (product.salePrice ?? product.basePrice),
      },
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.3 Search

**Luồng xử lý:**
1. Nhận `q` (từ khóa) từ query params
2. Dùng MongoDB `$text` search kết hợp với `$regex` fallback
3. Phân trang kết quả

```javascript
exports.search = async (req, res, next) => {
  try {
    const { q = "", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập từ khóa tìm kiếm." });
    }

    const filter = {
      isActive: true,
      deletedAt: null,
      $text: { $search: q },
    };

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: "textScore" } })
        .select("-__v")
        .populate("category", "name slug")
        .sort({ score: { $meta: "textScore" } }) // Sort theo độ liên quan
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Rate limit 30 req/phút để tránh DDoS bằng query phức tạp
- `q.trim()` check rỗng trước khi query

---

### 6.4 Filter By Category

**Luồng xử lý:**
1. Nhận `categoryId` hoặc `categorySlug` từ query
2. Filter sản phẩm theo category, phân trang + sort

```javascript
exports.filterByCategory = async (req, res, next) => {
  try {
    const { categoryId, categorySlug, page = 1, limit = 20, sort } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Tìm category theo id hoặc slug
    let category;
    if (categoryId) {
      category = await Category.findById(categoryId);
    } else if (categorySlug) {
      category = await Category.findOne({ slug: categorySlug });
    }

    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    const sortOptions = {
      newest:      { createdAt: -1 },
      price_asc:   { basePrice: 1 },
      price_desc:  { basePrice: -1 },
      best_seller: { sold: -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const filter = { category: category._id, isActive: true, deletedAt: null };

    const [products, total] = await Promise.all([
      Product.find(filter).select("-__v").sort(sortQuery).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        category: { id: category._id, name: category.name, slug: category.slug },
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.5 Filter By Price

**Luồng xử lý:**
1. Nhận `min`, `max` từ query (đã validate bởi middleware Joi)
2. Build filter động theo các giá trị được truyền

```javascript
exports.filterByPrice = async (req, res, next) => {
  try {
    const { min, max, page = 1, limit = 20, sort } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const priceFilter = {};
    if (min !== undefined) priceFilter.$gte = parseFloat(min);
    if (max !== undefined) priceFilter.$lte = parseFloat(max);

    // Nếu không có min và max → trả lỗi
    if (Object.keys(priceFilter).length === 0) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp ít nhất min hoặc max." });
    }

    const filter = {
      isActive: true,
      deletedAt: null,
      basePrice: priceFilter,
    };

    const sortOptions = {
      price_asc:   { basePrice: 1 },
      price_desc:  { basePrice: -1 },
      best_seller: { sold: -1 },
      newest:      { createdAt: -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.price_asc;

    const [products, total] = await Promise.all([
      Product.find(filter).select("-__v").populate("category", "name slug").sort(sortQuery).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.6 Get Flash Sales

**Luồng xử lý:**
1. Lấy các sản phẩm có `isFlashSale: true` và `flashSaleEndsAt > now`
2. Sort theo `flashSaleEndsAt` tăng dần (hết hạn sớm nhất lên đầu)

```javascript
exports.getFlashSales = async (req, res, next) => {
  try {
    const now = new Date();

    const products = await Product.find({
      isActive: true,
      deletedAt: null,
      isFlashSale: true,
      flashSaleEndsAt: { $gt: now },
    })
      .select("-__v")
      .populate("category", "name slug")
      .sort({ flashSaleEndsAt: 1 }); // Sắp xếp theo thời gian kết thúc

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.7 Create Product (Admin)

**Luồng xử lý:**
1. Validate input qua Joi middleware
2. Tạo `slug` tự động từ `name` (dùng thư viện `slugify`)
3. Xử lý ảnh upload từ Cloudinary (đã xử lý bởi `uploadProductImages` middleware)
4. Tạo sản phẩm mới

```javascript
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, basePrice, salePrice, stock, tags } = req.body;

    // Tạo slug từ name
    const slug = slugify(name, { lower: true, strict: true, locale: "vi" });

    // Kiểm tra slug đã tồn tại chưa
    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: "Sản phẩm với tên này đã tồn tại." });
    }

    // Xử lý ảnh từ Cloudinary (req.files từ uploadProductImages middleware)
    const images = (req.files || []).map((file, index) => ({
      url:       file.path,
      publicId:  file.filename,
      isPrimary: index === 0,    // Ảnh đầu tiên là primary
    }));

    const product = await Product.create({
      name, slug, description, category, basePrice,
      salePrice: salePrice || null,
      stock: stock || 0,
      tags: tags || [],
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công.",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Route bảo vệ bởi `verifyToken` + `authorizeAdmin`
- Kiểm tra slug trùng → tránh tạo duplicate
- `salePrice` phải nhỏ hơn `basePrice` (nên thêm check này ở service layer)

---

### 6.8 Update Product (Admin)

**Luồng xử lý:**
1. Tìm sản phẩm theo `id`, kiểm tra tồn tại và chưa bị xóa
2. Whitelist các field được phép update
3. Nếu có ảnh mới → upload lên Cloudinary, xóa ảnh cũ (optional)
4. Nếu `name` thay đổi → regenerate `slug`

```javascript
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, basePrice, salePrice, stock, tags, isActive } = req.body;

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    // Whitelist field được phép update
    const updateData = {};
    if (name        !== undefined) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true, locale: "vi" });
    }
    if (description !== undefined) updateData.description = description;
    if (category    !== undefined) updateData.category    = category;
    if (basePrice   !== undefined) updateData.basePrice   = basePrice;
    if (salePrice   !== undefined) updateData.salePrice   = salePrice;
    if (stock       !== undefined) updateData.stock       = stock;
    if (tags        !== undefined) updateData.tags        = tags;
    if (isActive    !== undefined) updateData.isActive    = isActive;

    // Ảnh mới nếu có upload
    if (req.files?.length > 0) {
      updateData.images = req.files.map((file, index) => ({
        url:       file.path,
        publicId:  file.filename,
        isPrimary: index === 0,
      }));
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-__v");

    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.9 Delete Product (Admin)

**Luồng xử lý:**
1. Tìm sản phẩm theo `id`
2. Soft delete: set `deletedAt = new Date()` và `isActive = false`
3. Không xóa ảnh trên Cloudinary ngay (có thể cleanup sau bằng cron job)

```javascript
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    await Product.updateOne(
      { _id: id },
      { deletedAt: new Date(), isActive: false }
    );

    console.info(`[AUDIT] Admin ${req.user.id} deleted product ${id} at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Xóa sản phẩm thành công." });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Soft delete — bảo toàn lịch sử đơn hàng đã đặt sản phẩm này
- Audit log ghi lại admin nào xóa, sản phẩm nào, khi nào

---

### 6.10 Get Variants

**Luồng xử lý:**
1. Tìm tất cả variants thuộc sản phẩm `productId`
2. Public endpoint — không cần đăng nhập

```javascript
exports.getVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    const variants = await ProductVariant.find({ productId }).select("-__v");

    return res.status(200).json({ success: true, data: variants });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.11 Get Related

**Luồng xử lý:**
1. Lấy `category` của sản phẩm hiện tại
2. Tìm các sản phẩm cùng category, loại trừ sản phẩm hiện tại
3. Giới hạn 8 sản phẩm, sort theo `sold` giảm dần

```javascript
exports.getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit  = parseInt(req.query.limit) || 8;

    const product = await Product.findOne({ _id: id, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    const related = await Product.find({
      _id: { $ne: id },             // Loại trừ sản phẩm hiện tại
      category: product.category,
      isActive: true,
      deletedAt: null,
    })
      .select("-__v")
      .sort({ sold: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, data: related });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.12 Notify Restock

**Luồng xử lý:**
1. Kiểm tra sản phẩm tồn tại và đang hết hàng (`stock === 0`)
2. Kiểm tra email đã đăng ký chưa (unique index xử lý, bắt lỗi duplicate)
3. Lưu `RestockSubscriber`

```javascript
exports.notifyRestock = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id || null;

    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    // Chỉ cho đăng ký khi sản phẩm hết hàng
    if (product.stock > 0) {
      return res.status(400).json({ success: false, message: "Sản phẩm vẫn còn hàng." });
    }

    try {
      await RestockSubscriber.create({ productId, userId, email });
    } catch (err) {
      // Duplicate key → email đã đăng ký rồi
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Email này đã đăng ký nhận thông báo." });
      }
      throw err;
    }

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Chúng tôi sẽ thông báo khi sản phẩm có hàng trở lại.",
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Rate limit 10 req/giờ để tránh spam đăng ký email
- Unique index `{ productId, email }` ở DB layer ngăn duplicate cứng
- Chỉ cho đăng ký khi `stock === 0` — tránh subscribe vô lý

---

### 6.13 Get Restock Subscribers (Admin)

**Luồng xử lý:**
1. Admin xem danh sách email đã đăng ký thông báo cho sản phẩm
2. Filter được theo `notifiedAt: null` (chưa gửi) hoặc tất cả

```javascript
exports.getRestockSubscribers = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { onlyPending = "true", page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { productId };
    if (onlyPending === "true") filter.notifiedAt = null;

    const [subscribers, total] = await Promise.all([
      RestockSubscriber.find(filter)
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RestockSubscriber.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
```

---

## 7. Service Layer

### `utils/notification.utils.js`

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gửi email thông báo sản phẩm có hàng trở lại
 * Gọi từ bên trong OrderController sau khi nhập thêm hàng
 * hoặc từ cron job kiểm tra stock định kỳ
 */
exports.sendRestockNotification = async (email, product) => {
  await transporter.sendMail({
    from: `"Cửa hàng" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Sản phẩm "${product.name}" đã có hàng trở lại!`,
    html: `
      <p>Xin chào,</p>
      <p>Sản phẩm <strong>${product.name}</strong> bạn quan tâm đã có hàng trở lại.</p>
      <p><a href="${process.env.CLIENT_URL}/products/${product.slug}">Mua ngay</a></p>
    `,
  });
};

/**
 * Gửi thông báo hàng loạt cho tất cả subscriber của 1 sản phẩm
 * Gọi sau khi cập nhật stock từ 0 → > 0
 */
exports.notifyAllSubscribers = async (productId, product) => {
  const subscribers = await RestockSubscriber.find({
    productId,
    notifiedAt: null,
  });

  const promises = subscribers.map(async (sub) => {
    await exports.sendRestockNotification(sub.email, product);
    await RestockSubscriber.updateOne({ _id: sub._id }, { notifiedAt: new Date() });
  });

  await Promise.allSettled(promises); // allSettled — không dừng nếu 1 email fail
};
```

---

## 8. Xử lý lỗi & Response chuẩn

### Error Handler Global (`app.js`)

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File ảnh không được vượt quá 5MB." });
  }
  if (err.message === "Chỉ chấp nhận file ảnh.") {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status  = err.statusCode || 500;
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
| Không có quyền | 403 | `{ success: false, message }` |
| Không tìm thấy | 404 | `{ success: false, message }` |
| Trùng dữ liệu | 409 | `{ success: false, message }` |
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

# JWT (dùng chung)
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Cloudinary (upload ảnh sản phẩm)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Client
CLIENT_URL=http://localhost:3000
```

> ⚠️ Không bao giờ commit file `.env` lên Git. Thêm vào `.gitignore`.

---

*Tài liệu này được tạo dựa trên yêu cầu thiết kế Product Controller với Node.js / MVC.*
