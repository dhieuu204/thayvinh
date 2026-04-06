# Thiết Kế Chi Tiết — Category Controller (Node.js / MVC)

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Database Models](#3-database-models)
4. [Middleware](#4-middleware)
5. [Routes](#5-routes)
6. [Controller — Chi tiết từng chức năng](#6-controller--chi-tiết-từng-chức-năng)
7. [Xử lý lỗi & Response chuẩn](#7-xử-lý-lỗi--response-chuẩn)
8. [Biến môi trường (.env)](#8-biến-môi-trường-env)

---

## 1. Tổng quan kiến trúc

```
Client
  │
  ▼
Routes (Express Router)
  │
  ├── Middleware (verifyToken, authorizeAdmin, Validate)
  │
  ▼
Controller  ──►  Model (Mongoose)
                        │
                        ▼
                  MongoDB (Atlas / Local)
```

**Luồng xử lý chuẩn:**
- **Route** định nghĩa endpoint, gắn middleware xác thực và phân quyền
- **Controller** nhận request, gọi Model trực tiếp (không cần service layer riêng do logic đơn giản), trả response
- **Model** định nghĩa schema Mongoose

**Phân loại endpoint:**
- **Public** — không cần đăng nhập: `getAll`, `getById`, `getProductsByCategory`
- **Admin only** — `create`, `update`, `delete`

---

## 2. Cấu trúc thư mục

```
src/
├── models/
│   ├── Category.model.js
│   └── Product.model.js          # Dùng chung với Product Controller
│
├── controllers/
│   └── category.controller.js
│
├── middlewares/
│   ├── auth.middleware.js         # verifyToken, authorizeAdmin (dùng chung)
│   └── validate.middleware.js     # Joi schemas cho category
│
├── routes/
│   └── category.routes.js
│
└── utils/
    └── response.utils.js
```

---

## 3. Database Models

### 3.1 Category Model (`models/Category.model.js`)

```javascript
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,               // VD: "ao-thun" — dùng cho SEO URL
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      default: "",              // Ảnh đại diện danh mục
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,            // null = danh mục gốc, có giá trị = danh mục con
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,               // Thứ tự hiển thị — số nhỏ hơn lên trước
    },
    deletedAt: {
      type: Date,
      default: null,            // Soft delete
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ isActive: 1, deletedAt: 1, sortOrder: 1 });
```

**Lưu ý:**
- `parent` cho phép xây dựng cấu trúc danh mục cha - con (2 cấp là đủ với e-commerce thông thường)
- `slug` tạo tự động từ `name` khi create, dùng cho URL thân thiện
- `sortOrder` để admin sắp xếp thứ tự hiển thị danh mục trên frontend
- `isActive: false` ẩn danh mục khỏi frontend nhưng admin vẫn quản lý được

---

## 4. Middleware

### 4.1 Auth Middleware (`middlewares/auth.middleware.js`)

> Dùng chung với Auth, User, Product Controller. `verifyToken` + `authorizeAdmin`.

---

### 4.2 Validate Middleware (`middlewares/validate.middleware.js`)

```javascript
const Joi = require("joi");

const schemas = {
  createCategory: Joi.object({
    name:        Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    imageUrl:    Joi.string().uri().optional(),
    parent:      Joi.string().hex().length(24).allow(null).optional(), // ObjectId hoặc null
    sortOrder:   Joi.number().integer().min(0).optional(),
  }),

  updateCategory: Joi.object({
    name:        Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    imageUrl:    Joi.string().uri().optional(),
    parent:      Joi.string().hex().length(24).allow(null).optional(),
    isActive:    Joi.boolean().optional(),
    sortOrder:   Joi.number().integer().min(0).optional(),
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

### `routes/category.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyToken, authorizeAdmin } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/",                         categoryController.getAll);
router.get("/:id",                      categoryController.getById);
router.get("/:id/products",             categoryController.getProductsByCategory);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post("/",       verifyToken, authorizeAdmin, validate("createCategory"), categoryController.create);
router.put("/:id",     verifyToken, authorizeAdmin, validate("updateCategory"), categoryController.update);
router.delete("/:id",  verifyToken, authorizeAdmin, categoryController.delete);

module.exports = router;
```

---

## 6. Controller — Chi tiết từng chức năng

### `controllers/category.controller.js`

---

### 6.1 Get All

**Luồng xử lý:**
1. Lấy tất cả danh mục `isActive: true` và `deletedAt: null`
2. Sort theo `sortOrder` tăng dần
3. Populate `parent` để trả về tên danh mục cha

```javascript
exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, deletedAt: null })
      .select("-__v")
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, createdAt: 1 });

    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.2 Get By ID

**Luồng xử lý:**
1. Tìm category theo `id` hoặc `slug` (query param `bySlug=true`)
2. Kiểm tra `isActive` và `deletedAt`

```javascript
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bySlug } = req.query;

    // Cho phép tìm theo slug hoặc ObjectId
    const filter = bySlug === "true"
      ? { slug: id, isActive: true, deletedAt: null }
      : { _id: id, isActive: true, deletedAt: null };

    const category = await Category.findOne(filter)
      .select("-__v")
      .populate("parent", "name slug");

    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};
```

---

### 6.3 Create (Admin)

**Luồng xử lý:**
1. Validate input qua Joi middleware
2. Tạo `slug` tự động từ `name`
3. Kiểm tra `slug` và `name` chưa tồn tại
4. Nếu có `parent` → kiểm tra danh mục cha tồn tại
5. Tạo category mới

```javascript
exports.create = async (req, res, next) => {
  try {
    const { name, description, imageUrl, parent, sortOrder } = req.body;

    const slug = slugify(name, { lower: true, strict: true, locale: "vi" });

    // Kiểm tra trùng tên hoặc slug
    const existing = await Category.findOne({
      $or: [{ name }, { slug }],
      deletedAt: null,
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Tên danh mục đã tồn tại." });
    }

    // Kiểm tra danh mục cha tồn tại nếu được truyền
    if (parent) {
      const parentCategory = await Category.findOne({ _id: parent, deletedAt: null });
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: "Danh mục cha không tồn tại." });
      }
      // Ngăn nested quá 2 cấp — danh mục cha không được có parent
      if (parentCategory.parent) {
        return res.status(400).json({ success: false, message: "Không hỗ trợ danh mục lồng nhau quá 2 cấp." });
      }
    }

    const category = await Category.create({
      name, slug, description, imageUrl,
      parent: parent || null,
      sortOrder: sortOrder ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công.",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Route bảo vệ bởi `verifyToken` + `authorizeAdmin`
- Giới hạn 2 cấp danh mục — tránh cấu trúc phức tạp khó quản lý

---

### 6.4 Update (Admin)

**Luồng xử lý:**
1. Tìm category theo `id`, kiểm tra tồn tại
2. Whitelist field được phép update
3. Nếu `name` thay đổi → regenerate `slug`, kiểm tra trùng
4. Nếu `isActive: false` → không ảnh hưởng sản phẩm, chỉ ẩn danh mục

```javascript
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, parent, isActive, sortOrder } = req.body;

    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    const updateData = {};

    // Nếu đổi tên → regenerate slug và kiểm tra trùng
    if (name !== undefined && name !== category.name) {
      const newSlug = slugify(name, { lower: true, strict: true, locale: "vi" });
      const conflict = await Category.findOne({
        $or: [{ name }, { slug: newSlug }],
        _id: { $ne: id },
        deletedAt: null,
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: "Tên danh mục đã tồn tại." });
      }
      updateData.name = name;
      updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description;
    if (imageUrl    !== undefined) updateData.imageUrl    = imageUrl;
    if (isActive    !== undefined) updateData.isActive    = isActive;
    if (sortOrder   !== undefined) updateData.sortOrder   = sortOrder;

    // Kiểm tra parent hợp lệ nếu thay đổi
    if (parent !== undefined) {
      if (parent === null) {
        updateData.parent = null;
      } else {
        // Không được set parent là chính mình
        if (parent === id) {
          return res.status(400).json({ success: false, message: "Danh mục không thể là cha của chính nó." });
        }
        const parentCategory = await Category.findOne({ _id: parent, deletedAt: null });
        if (!parentCategory) {
          return res.status(404).json({ success: false, message: "Danh mục cha không tồn tại." });
        }
        if (parentCategory.parent) {
          return res.status(400).json({ success: false, message: "Không hỗ trợ danh mục lồng nhau quá 2 cấp." });
        }
        updateData.parent = parent;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu để cập nhật." });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-__v");

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Kiểm tra circular reference — không cho phép danh mục là cha của chính nó
- Whitelist field — không thể update `deletedAt` hay `createdAt` qua endpoint này

---

### 6.5 Delete (Admin)

**Luồng xử lý:**
1. Tìm category theo `id`
2. Kiểm tra có sản phẩm đang dùng danh mục này không (nếu có → từ chối xóa hoặc cảnh báo)
3. Soft delete: set `deletedAt = new Date()` và `isActive = false`
4. Ghi audit log

```javascript
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true để xóa dù còn sản phẩm

    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    // Kiểm tra còn sản phẩm active thuộc danh mục này không
    const productCount = await Product.countDocuments({
      category: id,
      isActive: true,
      deletedAt: null,
    });

    if (productCount > 0 && force !== "true") {
      return res.status(409).json({
        success: false,
        message: `Danh mục đang có ${productCount} sản phẩm. Dùng ?force=true để xóa hoặc chuyển sản phẩm sang danh mục khác trước.`,
        data: { productCount },
      });
    }

    await Category.updateOne(
      { _id: id },
      { deletedAt: new Date(), isActive: false }
    );

    console.info(`[AUDIT] Admin ${req.user.id} deleted category ${id} at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Xóa danh mục thành công." });
  } catch (err) {
    next(err);
  }
};
```

**Bảo mật:**
- Kiểm tra sản phẩm còn tồn tại trước khi xóa — tránh orphaned products
- `?force=true` yêu cầu explicit — tránh xóa nhầm
- Soft delete + audit log

---

### 6.6 Get Products By Category (với Pagination)

**Luồng xử lý:**
1. Tìm category theo `id` hoặc `slug`
2. Lấy danh sách sản phẩm thuộc category, phân trang + sort
3. Hỗ trợ filter thêm theo `minPrice`, `maxPrice`

```javascript
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      bySlug,
      page = 1, limit = 20, sort,
      minPrice, maxPrice,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Tìm category theo slug hoặc ObjectId
    const categoryFilter = bySlug === "true"
      ? { slug: id, isActive: true, deletedAt: null }
      : { _id: id, isActive: true, deletedAt: null };

    const category = await Category.findOne(categoryFilter);
    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    // Build product filter
    const productFilter = {
      category: category._id,
      isActive: true,
      deletedAt: null,
    };

    // Filter giá nếu có
    if (minPrice !== undefined || maxPrice !== undefined) {
      productFilter.basePrice = {};
      if (minPrice !== undefined) productFilter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) productFilter.basePrice.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {
      newest:      { createdAt: -1 },
      price_asc:   { basePrice: 1 },
      price_desc:  { basePrice: -1 },
      best_seller: { sold: -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const [products, total] = await Promise.all([
      Product.find(productFilter)
        .select("-__v")
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(productFilter),
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

## 7. Xử lý lỗi & Response chuẩn

### Chuẩn Response JSON

| Tình huống | HTTP Status | Body |
|---|---|---|
| Thành công | 200 / 201 | `{ success: true, message, data? }` |
| Lỗi validation | 400 | `{ success: false, message: [...] }` |
| Chưa đăng nhập | 401 | `{ success: false, message }` |
| Không có quyền | 403 | `{ success: false, message }` |
| Không tìm thấy | 404 | `{ success: false, message }` |
| Trùng dữ liệu / xung đột | 409 | `{ success: false, message, data? }` |
| Lỗi server | 500 | `{ success: false, message }` |

---

## 8. Biến môi trường (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/shop_db

# JWT (dùng chung)
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
```

> ⚠️ Không bao giờ commit file `.env` lên Git. Thêm vào `.gitignore`.

---

*Tài liệu này được tạo dựa trên yêu cầu thiết kế Category Controller với Node.js / MVC.*
