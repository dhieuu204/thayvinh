const mongoose      = require("mongoose");
const User          = require("../models/User");
const Product       = require("../models/Product");
const Order         = require("../models/Order");
const Category      = require("../models/Category");
const Banner        = require("../models/Banner");
const FlashSale     = require("../models/FlashSale");
const Notification  = require("../models/Notification");
const Setting       = require("../models/Setting");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ═══════════════════════════════════════════════════════════════════════════════
// THỐNG KÊ
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get Overview ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/overview
exports.getOverview = async (req, res, next) => {
  try {
    const DONE = ["Confirmed", "Shipped", "Delivered"];
    const [userCount, productCount, orderCount, profitResult] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Product.countDocuments({ isActive: true, deletedAt: null }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: DONE } } },
        // Lưu order.total (đã gồm ship, đã trừ voucher) trước khi unwind
        { $addFields: { _orderTotal: "$total" } },
        { $unwind: "$products" },
        { $lookup: { from: "products", localField: "products.product", foreignField: "_id", as: "_prod" } },
        { $addFields: {
          _cost: { $ifNull: [
            "$products.costAtOrder",
            { $ifNull: [{ $arrayElemAt: ["$_prod.basePrice", 0] }, "$products.priceAtOrder"] }
          ]},
        }},
        // Gom về đơn hàng để tránh đếm trùng revenue sau unwind
        { $group: {
          _id: "$_id",
          totalOrder: { $first: "$_orderTotal" },
          cost:       { $sum: { $multiply: ["$_cost", "$products.quantity"] } },
        }},
        { $group: {
          _id: null,
          totalRevenue: { $sum: "$totalOrder" },
          totalCost:    { $sum: "$cost" },
        }},
        { $addFields: { totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] } } },
      ]),
    ]);

    const totalRevenue = profitResult[0]?.totalRevenue || 0;
    const totalProfit  = profitResult[0]?.totalProfit  || 0;

    return res.status(200).json({
      success: true,
      data: { userCount, productCount, orderCount, totalRevenue, totalProfit },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Revenue Stats ────────────────────────────────────────────────────────
// GET /api/admin/stats/revenue?period=monthly&year=2025
exports.getRevenueStats = async (req, res, next) => {
  try {
    const { period = "monthly", year = new Date().getFullYear() } = req.query;

    const groupBy = period === "daily"
      ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } }
      : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };

    const stats = await Order.aggregate([
      {
        $match: {
          status: { $in: ["Confirmed", "Shipped", "Delivered"] },
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      { $addFields: { _orderTotal: "$total", _groupKey: groupBy } },
      { $unwind: "$products" },
      { $lookup: { from: "products", localField: "products.product", foreignField: "_id", as: "_prod" } },
      { $addFields: {
        _cost: { $ifNull: [
          "$products.costAtOrder",
          { $ifNull: [{ $arrayElemAt: ["$_prod.basePrice", 0] }, "$products.priceAtOrder"] }
        ]},
      }},
      // Gom về đơn hàng để tránh đếm revenue trùng, orderCount đúng
      { $group: {
        _id: { orderId: "$_id", groupKey: "$_groupKey" },
        revenue: { $first: "$_orderTotal" },
        cost:    { $sum: { $multiply: ["$_cost", "$products.quantity"] } },
      }},
      { $group: {
        _id: "$_id.groupKey",
        revenue:    { $sum: "$revenue" },
        cost:       { $sum: "$cost" },
        orderCount: { $sum: 1 },
      }},
      { $addFields: { profit: { $subtract: ["$revenue", "$cost"] } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ─── Get Stats By Category ───────────────────────────────────────────────────
// GET /api/admin/stats/by-category
exports.getStatsByCategory = async (req, res, next) => {
  try {
    const DONE = ["Confirmed", "Shipped", "Delivered"];
    const stats = await Order.aggregate([
      { $match: { status: { $in: DONE } } },
      { $addFields: { _orderTotal: "$total" } },
      { $unwind: "$products" },
      { $lookup: { from: "products", localField: "products.product", foreignField: "_id", as: "_prod" } },
      { $unwind: { path: "$_prod", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "categories", localField: "_prod.category", foreignField: "_id", as: "_cat" } },
      { $addFields: {
        _cost: { $ifNull: [
          "$products.costAtOrder",
          { $ifNull: ["$_prod.basePrice", "$products.priceAtOrder"] }
        ]},
        _categoryName: { $ifNull: [{ $arrayElemAt: ["$_cat.name", 0] }, "Khác"] },
        _categoryId:   { $ifNull: ["$_prod.category", "unknown"] },
      }},
      { $group: {
        _id: { orderId: "$_id", categoryId: "$_categoryId", categoryName: "$_categoryName" },
        revenue:  { $first: "$_orderTotal" },
        itemRevenue: { $sum: { $multiply: ["$products.priceAtOrder", "$products.quantity"] } },
        cost:     { $sum: { $multiply: ["$_cost", "$products.quantity"] } },
        quantity: { $sum: "$products.quantity" },
      }},
      { $group: {
        _id: { categoryId: "$_id.categoryId", categoryName: "$_id.categoryName" },
        revenue:  { $sum: "$itemRevenue" },
        cost:     { $sum: "$cost" },
        quantity: { $sum: "$quantity" },
      }},
      { $addFields: { profit: { $subtract: ["$revenue", "$cost"] } } },
      { $project: {
        _id: 0,
        categoryId:   "$_id.categoryId",
        categoryName: "$_id.categoryName",
        revenue:  1,
        profit:   1,
        quantity: 1,
      }},
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ─── Get Top Products ─────────────────────────────────────────────────────────
// GET /api/admin/stats/top-products?limit=10
exports.getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Tính số lượng bán từ các đơn hàng đã delivered
    const topProducts = await Order.aggregate([
      { $match: { status: { $in: ["Confirmed", "Shipped", "Delivered"] } } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          sold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $project: {
          _id: 1,
          name: "$productData.name",
          basePrice: "$productData.basePrice",
          images: "$productData.images",
          sold: 1,
        },
      },
    ]);

    return res.status(200).json({ success: true, data: topProducts });
  } catch (err) {
    next(err);
  }
};

// ─── Get Top Customers ────────────────────────────────────────────────────────
// GET /api/admin/stats/top-customers?limit=10
exports.getTopCustomers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const customers = await Order.aggregate([
      { $match: { status: { $in: ["Confirmed", "Shipped", "Delivered"] } } },
      { $group: { _id: "$user", totalSpent: { $sum: "$total" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { totalSpent: 1, orderCount: 1, "user.username": 1, "user.email": 1, "user.fullName": 1 } },
    ]);

    return res.status(200).json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

// ─── Get Category Stats ───────────────────────────────────────────────────────
// GET /api/admin/stats/categories
exports.getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true, deletedAt: null } },
      { $group: { _id: "$category", productCount: { $sum: 1 }, totalSold: { $sum: "$sold" } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $project: { productCount: 1, totalSold: 1, "category.name": 1, "category.slug": 1 } },
      { $sort: { totalSold: -1 } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ─── Get Low Stock Alert ──────────────────────────────────────────────────────
// GET /api/admin/stats/low-stock?threshold=10
exports.getLowStockAlert = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;

    const products = await Product.find({
      isActive: true,
      deletedAt: null,
      stock: { $lte: threshold },
    })
      .select("name stock images")
      .sort({ stock: 1 });

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// ─── Get Orders By Status ─────────────────────────────────────────────────────
// GET /api/admin/stats/orders-by-status
exports.getOrdersByStatus = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUẢN LÝ ĐƠN HÀNG
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get All Orders ───────────────────────────────────────────────────────────
// GET /api/admin/orders?status=Pending&page=1&limit=20
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    // Tìm theo tên / email khách hàng
    let userIds;
    if (search) {
      const matchedUsers = await User.find({
        $or: [
          { fullName: new RegExp(escapeRegex(search), "i") },
          { username: new RegExp(escapeRegex(search), "i") },
          { email: new RegExp(escapeRegex(search), "i") },
        ],
      }).select("_id");
      userIds = matchedUsers.map((u) => u._id);
      // Tìm theo mã đơn (8 ký tự cuối của _id)
      filter.$or = [
        { user: { $in: userIds } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "username email fullName")
        .populate("products.product", "name basePrice salePrice images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
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

// ─── Get Order By Id (Admin) ──────────────────────────────────────────────────
// GET /api/admin/orders/:orderId
exports.getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user", "username email fullName phone")
      .populate("products.product", "name basePrice salePrice images");
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── Update Order Status ──────────────────────────────────────────────────────
// PATCH /api/admin/orders/:orderId/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // State machine — chỉ cho phép chuyển trạng thái hợp lệ
    const validTransitions = {
      PendingPayment: ["Cancelled"],
      Pending:   ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
      Shipped:   ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${order.status}" sang "${status}".`,
      });
    }

    // Hoàn kho nếu admin cancel đơn
    if (status === "Cancelled") {
      for (const item of order.products) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity, sold: -item.quantity } }
        );
      }
    }

    // PendingPayment + bank bị admin huỷ → khách đã chuyển tiền, cần hoàn
    const extraUpdate = (status === "Cancelled" && order.paymentMethod === "bank" && order.status === "PendingPayment")
      ? { refundStatus: "pending_refund" }
      : {};

    await Order.updateOne({ _id: orderId }, { status, ...extraUpdate });

    // Thông báo cho user về cập nhật đơn hàng
    const statusMessages = {
      Confirmed: "Đơn hàng của bạn đã được xác nhận.",
      Shipped:   "Đơn hàng của bạn đang được vận chuyển.",
      Delivered: "Đơn hàng của bạn đã được giao thành công.",
      Cancelled: "Đơn hàng của bạn đã bị hủy.",
    };
    if (statusMessages[status]) {
      await Notification.create({
        userId: order.user,
        type: "order_update",
        title: `Đơn hàng ${status}`,
        message: statusMessages[status],
        referenceId: orderId,
        referenceModel: "Order",
      });
    }

    console.info(`[AUDIT] Admin ${req.user.id} updated order ${orderId}: ${order.status} → ${status}`);

    return res.status(200).json({ success: true, message: "Cập nhật trạng thái đơn hàng thành công." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUẢN LÝ USER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get All Users ────────────────────────────────────────────────────────────
// GET /api/admin/users?page=1&limit=20&search=
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { deletedAt: null };
    if (search) {
      filter.$or = [
        { username: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { fullName: new RegExp(search, "i") },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -googleId -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
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

// ─── Ban User ─────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/ban
// Chức năng chính đặt ở UserController.banUser — alias tại đây để route admin gọn hơn
exports.banUser = require("./UserController").banUser;

// ═══════════════════════════════════════════════════════════════════════════════
// QUẢN LÝ BANNER
// ═══════════════════════════════════════════════════════════════════════════════
// TODO: Uncomment khi đã tạo Banner model

exports.getBanners = async (req, res, next) => {
  try {
    const filter = { deletedAt: null };
    if (req.query.position) filter.position = req.query.position;
    const banners = await Banner.find(filter).sort({ sortOrder: 1 });
    return res.status(200).json({ success: true, data: banners });
  } catch (err) { next(err); }
};

exports.createBanner = async (req, res, next) => {
  try {
    const { title, imageUrl, linkUrl, sortOrder } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: "title và imageUrl là bắt buộc." });
    }
    const banner = await Banner.create({ title, imageUrl, linkUrl: linkUrl || "", sortOrder: sortOrder ?? 0 });
    return res.status(201).json({ success: true, message: "Tạo banner thành công.", data: banner });
  } catch (err) { next(err); }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!banner) return res.status(404).json({ success: false, message: "Banner không tồn tại." });
    return res.status(200).json({ success: true, message: "Cập nhật banner thành công.", data: banner });
  } catch (err) { next(err); }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOne({ _id: id, deletedAt: null });
    if (!banner) return res.status(404).json({ success: false, message: "Banner không tồn tại." });
    await Banner.updateOne({ _id: id }, { deletedAt: new Date(), isActive: false });
    return res.status(200).json({ success: true, message: "Xóa banner thành công." });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUẢN LÝ FLASH SALE
// ═══════════════════════════════════════════════════════════════════════════════
// TODO: Uncomment khi đã tạo FlashSale model

// ─── Get All Flash Sales ──────────────────────────────────────────────────────
// GET /api/admin/flash-sales
exports.getFlashSales = async (req, res, next) => {
  try {
    const flashSales = await FlashSale.find()
      .populate("products.productId", "name basePrice salePrice images")
      .sort({ startsAt: -1 });
    return res.status(200).json({ success: true, data: flashSales });
  } catch (err) { next(err); }
};

// ─── Create Flash Sale ────────────────────────────────────────────────────────
// POST /api/admin/flash-sales
// { name, description, startsAt, endsAt, products: [ { productId, discountType, discountValue } ] }
exports.createFlashSale = async (req, res, next) => {
  try {
    const { name, description, startsAt, endsAt, products } = req.body;

    if (!name || !startsAt || !endsAt || !products || products.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }
    if (new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ success: false, message: "Thời gian bắt đầu phải trước thời gian kết thúc." });
    }

    // Validate products array
    for (const p of products) {
      if (!p.productId || !p.discountType || p.discountValue === undefined || !p.quantity) {
        return res.status(400).json({ success: false, message: "Sản phẩm phải có productId, discountType, discountValue, quantity." });
      }
      if (!["percent", "fixed"].includes(p.discountType)) {
        return res.status(400).json({ success: false, message: "discountType phải là 'percent' hoặc 'fixed'." });
      }
      if (p.discountType === "percent" && (p.discountValue <= 0 || p.discountValue > 100)) {
        return res.status(400).json({ success: false, message: "Giảm giá % phải từ 1 đến 100." });
      }
      if (p.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Số lượng phải lớn hơn 0." });
      }

      // Kiểm tra giá sau flash sale không được nhỏ hơn giá gốc
      const product = await Product.findById(p.productId);
      if (product) {
        const basePrice = product.basePrice;
        const salePrice = product.salePrice || basePrice;
        let finalPrice;

        if (p.discountType === "percent") {
          finalPrice = salePrice * (1 - p.discountValue / 100);
        } else {
          finalPrice = salePrice - p.discountValue;
        }

        if (finalPrice < basePrice) {
          const productName = product.name;
          return res.status(400).json({
            success: false,
            message: `Giá sau flash sale của sản phẩm "${productName}" không được nhỏ hơn giá gốc.`
          });
        }
      }
    }

    const flashSale = await FlashSale.create({
      name,
      description: description || "",
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      products,
      createdBy: req.user.id,
    });

    console.info(`[AUDIT] Admin ${req.user.id} created flash sale ${flashSale._id}`);
    return res.status(201).json({ success: true, message: "Tạo flash sale thành công.", data: flashSale });
  } catch (err) { next(err); }
};

// ─── Update Flash Sale ────────────────────────────────────────────────────────
// PUT /api/admin/flash-sales/:id
exports.updateFlashSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, startsAt, endsAt, products, isActive } = req.body;

    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    if (name !== undefined) fs.name = name;
    if (description !== undefined) fs.description = description;
    if (startsAt !== undefined) fs.startsAt = new Date(startsAt);
    if (endsAt !== undefined) fs.endsAt = new Date(endsAt);
    if (isActive !== undefined) fs.isActive = isActive;
    if (products !== undefined) fs.products = products;

    await fs.save();

    console.info(`[AUDIT] Admin ${req.user.id} updated flash sale ${id}`);
    return res.status(200).json({ success: true, message: "Cập nhật flash sale thành công.", data: fs });
  } catch (err) { next(err); }
};

// ─── Add Product To Flash Sale ────────────────────────────────────────────────
// PATCH /api/admin/flash-sales/:id/products
// { productId, discountType, discountValue }
exports.addProductToFlashSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, discountType, discountValue } = req.body;

    if (!productId || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: "Thiếu productId, discountType, discountValue." });
    }

    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    // Check if product already in flash sale
    if (fs.products.some(p => p.productId.toString() === productId)) {
      return res.status(409).json({ success: false, message: "Sản phẩm này đã có trong flash sale." });
    }

    fs.products.push({ productId, discountType, discountValue });
    await fs.save();

    console.info(`[AUDIT] Admin ${req.user.id} added product ${productId} to flash sale ${id}`);
    return res.status(200).json({ success: true, message: "Thêm sản phẩm thành công.", data: fs });
  } catch (err) { next(err); }
};

// ─── Remove Product From Flash Sale ────────────────────────────────────────────
// DELETE /api/admin/flash-sales/:id/products/:productId
exports.removeProductFromFlashSale = async (req, res, next) => {
  try {
    const { id, productId } = req.params;

    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    fs.products = fs.products.filter(p => p.productId.toString() !== productId);
    await fs.save();

    console.info(`[AUDIT] Admin ${req.user.id} removed product ${productId} from flash sale ${id}`);
    return res.status(200).json({ success: true, message: "Xóa sản phẩm thành công.", data: fs });
  } catch (err) { next(err); }
};

// ─── Delete Flash Sale ────────────────────────────────────────────────────────
// DELETE /api/admin/flash-sales/:id
exports.deleteFlashSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    await FlashSale.deleteOne({ _id: id });

    console.info(`[AUDIT] Admin ${req.user.id} deleted flash sale ${id}`);
    return res.status(200).json({ success: true, message: "Xóa flash sale thành công." });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEPAGE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_LAYOUT = [
  { key: "flashSale",       label: "Flash Sale",        visible: true,  order: 1 },
  { key: "categories",      label: "Danh mục",          visible: true,  order: 2 },
  { key: "newArrival",      label: "Hàng mới về",       visible: true,  order: 3 },
  { key: "categoryShowcase",label: "Category Showcase",  visible: true,  order: 4 },
  { key: "exploreProducts", label: "Khám phá sản phẩm", visible: true,  order: 5 },
  { key: "services",        label: "Dịch vụ",           visible: true,  order: 6 },
];

// GET /api/admin/homepage-layout  &  GET /api/settings/homepage-layout (public)
exports.getHomepageLayout = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: "homepage_layout" });
    const sections = setting ? setting.value : DEFAULT_LAYOUT;
    return res.status(200).json({ success: true, data: sections });
  } catch (err) { next(err); }
};

// PUT /api/admin/homepage-layout
exports.updateHomepageLayout = async (req, res, next) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ success: false, message: "sections phải là array." });
    }
    await Setting.findOneAndUpdate(
      { key: "homepage_layout" },
      { value: sections },
      { upsert: true, new: true }
    );
    console.info(`[AUDIT] Admin ${req.user.id} updated homepage layout`);
    return res.status(200).json({ success: true, message: "Đã cập nhật layout trang chủ." });
  } catch (err) { next(err); }
};
