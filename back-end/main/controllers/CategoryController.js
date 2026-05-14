const Category = require("../models/Category");
const Product  = require("../models/Product");

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
// GET /api/categories
// Public — chỉ trả danh mục active, sort theo sortOrder
exports.getAllAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find({ deletedAt: null })
      .select("-__v")
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, createdAt: 1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

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

// ─── 6.2 Get By ID ────────────────────────────────────────────────────────────
// GET /api/categories/:id
// GET /api/categories/:slug?bySlug=true
// Public — hỗ trợ tìm theo ObjectId hoặc slug
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bySlug } = req.query;

    const filter = bySlug === "true"
      ? { slug: id, isActive: true, deletedAt: null }
      : { _id: id,  isActive: true, deletedAt: null };

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

// ─── 6.3 Create (Admin) ───────────────────────────────────────────────────────
// POST /api/categories
// Admin only — tạo slug tự động, kiểm tra trùng, giới hạn 2 cấp danh mục
exports.create = async (req, res, next) => {
  try {
    const { name, description, imageUrl, parent, sortOrder } = req.body;

    const slug = slugify(name);

    // Kiểm tra trùng tên hoặc slug
    const existing = await Category.findOne({
      $or: [{ name }, { slug }],
      deletedAt: null,
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Tên danh mục đã tồn tại." });
    }

    // Kiểm tra danh mục cha tồn tại và không vượt quá 2 cấp
    if (parent) {
      const parentCategory = await Category.findOne({ _id: parent, deletedAt: null });
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: "Danh mục cha không tồn tại." });
      }
      if (parentCategory.parent) {
        return res.status(400).json({ success: false, message: "Không hỗ trợ danh mục lồng nhau quá 2 cấp." });
      }
    }

    const category = await Category.create({
      name, slug, description, imageUrl,
      parent:    parent || null,
      sortOrder: sortOrder ?? 0,
    });

    console.info(`[AUDIT] Admin ${req.user.id} created category ${category._id} at ${new Date().toISOString()}`);

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công.",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.4 Update (Admin) ───────────────────────────────────────────────────────
// PUT /api/categories/:id
// Admin only — whitelist field, regenerate slug nếu name đổi, kiểm tra circular reference
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, parent, isActive, sortOrder, showOnHome } = req.body;

    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    const updateData = {};

    // Nếu đổi tên → regenerate slug và kiểm tra trùng
    if (name !== undefined && name !== category.name) {
      const newSlug = slugify(name);
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
    if (showOnHome  !== undefined) updateData.showOnHome  = showOnHome;

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

// ─── 6.5 Delete (Admin) ───────────────────────────────────────────────────────
// DELETE /api/categories/:id
// DELETE /api/categories/:id?force=true  →  xóa dù còn sản phẩm
// Admin only — soft delete, kiểm tra sản phẩm còn tồn tại
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

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

    await Category.updateOne({ _id: id }, { deletedAt: new Date(), isActive: false });

    console.info(`[AUDIT] Admin ${req.user.id} deleted category ${id} at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Xóa danh mục thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── 6.6 Get Products By Category ────────────────────────────────────────────
// GET /api/categories/:id/products?page=1&limit=20&sort=newest&minPrice=&maxPrice=
// GET /api/categories/:slug/products?bySlug=true
// Public — hỗ trợ filter thêm theo khoảng giá
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bySlug, page = 1, limit = 20, sort, minPrice, maxPrice } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categoryFilter = bySlug === "true"
      ? { slug: id, isActive: true, deletedAt: null }
      : { _id: id,  isActive: true, deletedAt: null };

    const category = await Category.findOne(categoryFilter);
    if (!category) {
      return res.status(404).json({ success: false, message: "Danh mục không tồn tại." });
    }

    const productFilter = { category: category._id, isActive: true, deletedAt: null };

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
