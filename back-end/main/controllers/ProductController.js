const mongoose           = require("mongoose");
const Product            = require("../models/Product");
const Category           = require("../models/Category");
const ProductVariant     = require("../models/ProductVariant");
const RestockSubscriber  = require("../models/RestockSubscriber");
const FlashSale          = require("../models/FlashSale");
const { getEffectivePrice } = require("../lib/pricing");

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

    // Tìm kiếm theo tên / mô tả (partial match, không dấu cũng OK vì regex)
    const keyword = (req.query.search || req.query.q || "").trim();
    if (keyword) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    // Lọc theo giá bán (frontend truyền minPrice/maxPrice)
    if (req.query.minPrice || req.query.maxPrice) {
      filter.salePrice = {};
      if (req.query.minPrice) filter.salePrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.salePrice.$lte = Number(req.query.maxPrice);
    }

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
    // Chấp nhận cả ObjectId (link nội bộ) lẫn slug (link từ chatbot, SEO)
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = {
      isActive: true,
      deletedAt: null,
      ...(isObjectId ? { _id: id } : { slug: id }),
    };
    const product = await Product.findOne(query)
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
        effectivePrice: getEffectivePrice(product),
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
      if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({ success: false, message: "categoryId không hợp lệ." });
      }
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
// Public — trả về top 8 sản phẩm bán chạy cho mỗi danh mục được đánh dấu showOnHome
// ?slugs=iphone,mac  → override, chỉ lấy những slug đó (backward compat)
exports.getCategoryShowcase = async (req, res, next) => {
  try {
    let categories;
    if (req.query.slugs) {
      const slugs = req.query.slugs.split(",").map((s) => s.trim()).filter(Boolean);
      categories = await Category.find({ slug: { $in: slugs }, isActive: true, deletedAt: null })
        .sort({ sortOrder: 1, createdAt: 1 });
    } else {
      categories = await Category.find({ showOnHome: { $ne: false }, isActive: true, deletedAt: null })
        .sort({ sortOrder: 1, createdAt: 1 });
    }

    const result = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({
          category: cat._id,
          isActive: true,
          deletedAt: null,
        })
          .select("name slug basePrice salePrice saleDiscount images isFlashSale flashSalePrice flashSaleEndsAt")
          .sort({ sold: -1 })
          .limit(8);
        return { slug: cat.slug, name: cat.name, products };
      })
    );

    // Lọc danh mục không có sản phẩm nào
    const filtered = result.filter((r) => r.products.length > 0);

    return res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
};

// ─── 6.6 Get Flash Sales ──────────────────────────────────────────────────────
// GET /api/products/flash-sales
// Public — lấy flash sale đang chạy, populate products
exports.getFlashSales = async (req, res, next) => {
  try {
    const now = new Date();

    const flashSales = await FlashSale.find({
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    })
      .populate("products.productId", "name basePrice salePrice images slug")
      .sort({ endsAt: 1 });

    return res.status(200).json({ success: true, data: flashSales });
  } catch (err) {
    next(err);
  }
};

// ─── 6.7 Create Product (Admin) ───────────────────────────────────────────────
// POST /api/products
// Admin only — tạo slug tự động từ name, xử lý ảnh qua Cloudinary middleware
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, basePrice, salePrice, saleDiscount, stock, tags, images } = req.body;

    // Giá bán không được nhỏ hơn giá nhập (không bán dưới giá vốn)
    if (salePrice && Number(salePrice) < Number(basePrice)) {
      return res.status(400).json({ success: false, message: "Giá bán không được nhỏ hơn giá nhập." });
    }

    // Giá sau % giảm không được nhỏ hơn giá nhập
    if (saleDiscount) {
      const discountPercent = Number(saleDiscount);
      const baseForDiscount = Number(salePrice || basePrice);
      const finalPrice = baseForDiscount * (1 - discountPercent / 100);
      if (finalPrice < Number(basePrice)) {
        return res.status(400).json({
          success: false,
          message: `Giá sau giảm (${Math.round(finalPrice)}) không được nhỏ hơn giá nhập (${basePrice}).`
        });
      }
    }

    // Tạo slug từ name
    const slug = slugify(name);

    // Kiểm tra slug đã tồn tại chưa (chỉ check những sản phẩm chưa xóa)
    const existing = await Product.findOne({ slug, deletedAt: null });
    if (existing) {
      return res.status(409).json({ success: false, message: "Sản phẩm với tên này đã tồn tại." });
    }

    const product = await Product.create({
      name, slug, description, category, basePrice,
      salePrice: salePrice || null,
      saleDiscount: saleDiscount || null,
      stock:     stock || 0,
      tags:      tags || [],
      images:    images || [],
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
    const { name, description, category, basePrice, salePrice, saleDiscount, stock, tags, isActive, images } = req.body;

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    // Giá bán không được nhỏ hơn giá nhập (không bán dưới giá vốn)
    const finalBasePrice = basePrice !== undefined ? basePrice : product.basePrice;
    if (salePrice && Number(salePrice) < Number(finalBasePrice)) {
      return res.status(400).json({ success: false, message: "Giá bán không được nhỏ hơn giá nhập." });
    }

    // Kiểm tra sale discount: giá sau sale không được nhỏ hơn giá gốc
    if (saleDiscount !== undefined && saleDiscount !== null) {
      const discountPercent = Number(saleDiscount);
      const finalSalePrice = salePrice !== undefined ? salePrice : product.salePrice;
      const baseForDiscount = finalSalePrice || finalBasePrice;
      const finalPrice = baseForDiscount * (1 - discountPercent / 100);
      if (finalPrice < finalBasePrice) {
        return res.status(400).json({
          success: false,
          message: `Giá sau giảm (${Math.round(finalPrice)}) không được nhỏ hơn giá nhập (${finalBasePrice}).`
        });
      }
    }

    // Whitelist field được phép update
    const updateData = {};
    if (name        !== undefined) {
      const newSlug = slugify(name);
      // Kiểm tra slug mới có bị trùng không (chỉ check những sản phẩm chưa xóa)
      const conflict = await Product.findOne({
        slug: newSlug,
        _id: { $ne: id },
        deletedAt: null,
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: "Tên sản phẩm này đã tồn tại." });
      }
      updateData.name = name;
      updateData.slug = newSlug;
    }
    if (description !== undefined) updateData.description = description;
    if (category    !== undefined) updateData.category    = category;
    if (basePrice   !== undefined) updateData.basePrice   = basePrice;
    if (salePrice   !== undefined) updateData.salePrice   = salePrice;
    if (saleDiscount!== undefined) updateData.saleDiscount= saleDiscount;
    if (stock       !== undefined) updateData.stock       = stock;
    if (tags        !== undefined) updateData.tags        = tags;
    if (isActive    !== undefined) updateData.isActive    = isActive;
    if (images      !== undefined) updateData.images      = images;

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

// ─── 6.10b Create Variant ─────────────────────────────────────────────────────
// POST /api/products/:id/variants  (Admin)
exports.createVariant = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { name, sku, attributes, stock, price } = req.body;

    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });

    if (!attributes || typeof attributes !== "object" || Object.keys(attributes).length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 thuộc tính." });
    }

    // Variant.price = giá list của variant (chưa áp saleDiscount).
    // saleDiscount của product sẽ được áp lúc hiển thị / tính order.
    const variantPrice = price !== undefined && price !== null
      ? Number(price)
      : (product.salePrice ?? product.basePrice);

    const variant = await ProductVariant.create({
      productId,
      name: name || Object.entries(attributes).map(([, v]) => `${v}`).join(" - "),
      sku: sku || undefined,
      attributes,
      price: variantPrice,
      stock: Number(stock) || 0,
    });

    return res.status(201).json({ success: true, data: variant });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "SKU đã tồn tại." });
    next(err);
  }
};

// ─── 6.10c Delete Variant ─────────────────────────────────────────────────────
// DELETE /api/products/:id/variants/:variantId  (Admin)
exports.deleteVariant = async (req, res, next) => {
  try {
    const { id: productId, variantId } = req.params;
    const deleted = await ProductVariant.findOneAndDelete({ _id: variantId, productId });
    if (!deleted) return res.status(404).json({ success: false, message: "Variant không tồn tại." });
    return res.status(200).json({ success: true, message: "Đã xoá variant." });
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
