const Product            = require("../models/Product");
const Category           = require("../models/Category");
const ProductVariant     = require("../models/ProductVariant");
const RestockSubscriber  = require("../models/RestockSubscriber");

// TODO: Cài slugify: npm install slugify
// const slugify = require("slugify");
// Tạm dùng hàm đơn giản cho đến khi cài package
const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

// ─── 6.1 Get All ──────────────────────────────────────────────────────────────
// GET /api/products?page=1&limit=20&sort=newest
// Public — hỗ trợ sort: newest, price_asc, price_desc, best_seller
exports.getAll = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const sortOptions = {
      newest:      { createdAt: -1 },
      price_asc:   { basePrice: 1 },
      price_desc:  { basePrice: -1 },
      best_seller: { sold: -1 },
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

// ─── 6.2 Get By ID ────────────────────────────────────────────────────────────
// GET /api/products/:id
// Public — kiểm tra flash sale còn hiệu lực không
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
        effectivePrice: flashSaleActive
          ? product.flashSalePrice
          : (product.salePrice ?? product.basePrice),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.3 Search ───────────────────────────────────────────────────────────────
// GET /api/products/search?q=keyword&page=1&limit=20
// Public — dùng MongoDB $text search, rate limit 30 req/phút
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
        .sort({ score: { $meta: "textScore" } })
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

// ─── 6.4 Filter By Category ───────────────────────────────────────────────────
// GET /api/products/filter/category?categoryId=...&categorySlug=...&page=1
// Public — tìm theo categoryId hoặc categorySlug
exports.filterByCategory = async (req, res, next) => {
  try {
    const { categoryId, categorySlug, page = 1, limit = 20, sort, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let category;
    if (categoryId) {
      category = await Category.findById(categoryId);
    } else if (categorySlug) {
      category = await Category.findOne({ slug: categorySlug });
    } else {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp categoryId hoặc categorySlug." });
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
    if (search) filter.name = { $regex: search, $options: "i" };

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

// ─── 6.5 Filter By Price ──────────────────────────────────────────────────────
// GET /api/products/filter/price?min=100000&max=500000&page=1
// Public — cần ít nhất min hoặc max
exports.filterByPrice = async (req, res, next) => {
  try {
    const { min, max, page = 1, limit = 20, sort } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const priceFilter = {};
    if (min !== undefined) priceFilter.$gte = parseFloat(min);
    if (max !== undefined) priceFilter.$lte = parseFloat(max);

    if (Object.keys(priceFilter).length === 0) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp ít nhất min hoặc max." });
    }

    const filter = { isActive: true, deletedAt: null, basePrice: priceFilter };

    const sortOptions = {
      price_asc:   { basePrice: 1 },
      price_desc:  { basePrice: -1 },
      best_seller: { sold: -1 },
      newest:      { createdAt: -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.price_asc;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-__v")
        .populate("category", "name slug")
        .sort(sortQuery)
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

// ─── 6.6b Category Showcase ───────────────────────────────────────────────────
// GET /api/products/category-showcase
// Public — trả về top 6 sản phẩm bán chạy cho mỗi danh mục (iPhone, iPad, Mac)
exports.getCategoryShowcase = async (req, res, next) => {
  try {
    const slugs = (req.query.slugs || "iphone,ipad,mac").split(",").map((s) => s.trim());

    const categories = await Category.find({ slug: { $in: slugs } });

    const result = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({
          category: cat._id,
          isActive: true,
          deletedAt: null,
        })
          .select("name slug basePrice salePrice images isFlashSale flashSalePrice")
          .sort({ sold: -1 })
          .limit(6);
        return { slug: cat.slug, name: cat.name, products };
      })
    );

    result.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── 6.6 Get Flash Sales ──────────────────────────────────────────────────────
// GET /api/products/flash-sales
// Public — chỉ lấy flash sale còn hiệu lực, sort theo thời gian kết thúc sớm nhất
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
      .sort({ flashSaleEndsAt: 1 });

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// ─── 6.7 Create Product (Admin) ───────────────────────────────────────────────
// POST /api/products
// Admin only — tạo slug tự động từ name, xử lý ảnh qua Cloudinary middleware
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, basePrice, salePrice, stock, tags } = req.body;

    // Tạo slug từ name
    const slug = slugify(name);

    // Kiểm tra slug đã tồn tại chưa
    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: "Sản phẩm với tên này đã tồn tại." });
    }

    // Xử lý ảnh từ Cloudinary (req.files từ uploadProductImages middleware)
    const images = (req.files || []).map((file, index) => ({
      url:       file.path,
      publicId:  file.filename,
      isPrimary: index === 0,
    }));

    const product = await Product.create({
      name, slug, description, category, basePrice,
      salePrice: salePrice || null,
      stock:     stock || 0,
      tags:      tags || [],
      images,
    });

    console.info(`[AUDIT] Admin ${req.user.id} created product ${product._id} at ${new Date().toISOString()}`);

    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công.",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.8 Update Product (Admin) ───────────────────────────────────────────────
// PUT /api/products/:id
// Admin only — whitelist field, tự động regenerate slug nếu name thay đổi
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
      updateData.slug = slugify(name);
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

    console.info(`[AUDIT] Admin ${req.user.id} updated product ${id} at ${new Date().toISOString()}`);

    return res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.9 Delete Product (Admin) ───────────────────────────────────────────────
// DELETE /api/products/:id
// Admin only — soft delete (bảo toàn lịch sử đơn hàng)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    await Product.updateOne({ _id: id }, { deletedAt: new Date(), isActive: false });

    console.info(`[AUDIT] Admin ${req.user.id} deleted product ${id} at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Xóa sản phẩm thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── 6.10 Get Variants ────────────────────────────────────────────────────────
// GET /api/products/:id/variants
// Public — TODO: Bỏ comment khi đã tạo ProductVariant model
exports.getVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

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

// ─── 6.11 Get Related ─────────────────────────────────────────────────────────
// GET /api/products/:id/related?limit=8
// Public — sản phẩm cùng category, sort theo bán chạy
exports.getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit  = parseInt(req.query.limit) || 8;

    const product = await Product.findOne({ _id: id, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    const related = await Product.find({
      _id:      { $ne: id },
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

// ─── 6.12 Notify Restock ──────────────────────────────────────────────────────
// POST /api/products/:id/notify-restock
// User đã đăng nhập — chỉ cho đăng ký khi sản phẩm hết hàng (stock === 0)
// TODO: Bỏ comment RestockSubscriber khi đã tạo model
exports.notifyRestock = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id || null;

    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    if (product.stock > 0) {
      return res.status(400).json({ success: false, message: "Sản phẩm vẫn còn hàng." });
    }

    try {
      await RestockSubscriber.create({ productId, userId, email });
    } catch (err) {
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

// ─── 6.13 Get Restock Subscribers (Admin) ────────────────────────────────────
// GET /api/products/:id/restock-subscribers?onlyPending=true&page=1&limit=50
// Admin only — xem danh sách email đã đăng ký thông báo
// TODO: Bỏ comment RestockSubscriber khi đã tạo model
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
          totalPages: Math.ceil(total / parseInt(limit)) || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
