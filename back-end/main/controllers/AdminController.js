const mongoose      = require("mongoose");
const User          = require("../models/User");
const Product       = require("../models/Product");
const Order         = require("../models/Order");
const Category      = require("../models/Category");
const Banner        = require("../models/Banner");
const FlashSale     = require("../models/FlashSale");
const Notification  = require("../models/Notification");

// ═══════════════════════════════════════════════════════════════════════════════
// THỐNG KÊ
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get Overview ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/overview
exports.getOverview = async (req, res, next) => {
  try {
    const [userCount, productCount, orderCount, revenueResult] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Product.countDocuments({ isActive: true, deletedAt: null }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ["Confirmed", "Shipped", "Delivered"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: { userCount, productCount, orderCount, totalRevenue },
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
      { $group: { _id: groupBy, revenue: { $sum: "$total" }, orderCount: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
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

    const products = await Product.find({ deletedAt: null })
      .select("name sold basePrice images")
      .sort({ sold: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, data: products });
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
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "username email fullName")
        .populate("products.product", "name basePrice images")
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

// ─── Update Order Status ──────────────────────────────────────────────────────
// PATCH /api/admin/orders/:orderId/status
exports.updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // State machine — chỉ cho phép chuyển trạng thái hợp lệ
    const validTransitions = {
      Pending:   ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
      Shipped:   ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    if (!validTransitions[order.status]?.includes(status)) {
      await session.abortTransaction();
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
          { $inc: { stock: item.quantity, sold: -item.quantity } },
          { session }
        );
      }
    }

    await Order.updateOne({ _id: orderId }, { status }, { session });
    await session.commitTransaction();

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
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
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
    const banners = await Banner.find({ deletedAt: null }).sort({ sortOrder: 1 });
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

exports.getFlashSales = async (req, res, next) => {
  try {
    const flashSales = await FlashSale.find()
      .populate("productId", "name basePrice salePrice images")
      .sort({ startsAt: -1 });
    return res.status(200).json({ success: true, data: flashSales });
  } catch (err) { next(err); }
};

exports.createFlashSale = async (req, res, next) => {
  try {
    const { productId, flashSalePrice, startsAt, endsAt } = req.body;
    if (!productId || flashSalePrice === undefined || !startsAt || !endsAt) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }
    if (new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ success: false, message: "Thời gian bắt đầu phải trước thời gian kết thúc." });
    }

    // Cập nhật trường flash sale trên Product đồng thời
    await Product.updateOne(
      { _id: productId },
      { isFlashSale: true, flashSalePrice, flashSaleEndsAt: new Date(endsAt) }
    );

    const flashSale = await FlashSale.create({
      productId,
      flashSalePrice,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Tạo flash sale thành công.", data: flashSale });
  } catch (err) { next(err); }
};

exports.updateFlashSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flashSalePrice, startsAt, endsAt, isActive } = req.body;

    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    if (flashSalePrice !== undefined) fs.flashSalePrice = flashSalePrice;
    if (startsAt !== undefined) fs.startsAt = new Date(startsAt);
    if (endsAt !== undefined) fs.endsAt = new Date(endsAt);
    if (isActive !== undefined) fs.isActive = isActive;

    await fs.save();

    // Đồng bộ lại Product nếu isActive thay đổi
    if (isActive === false) {
      await Product.updateOne(
        { _id: fs.productId },
        { isFlashSale: false, flashSalePrice: null, flashSaleEndsAt: null }
      );
    }

    return res.status(200).json({ success: true, message: "Cập nhật flash sale thành công.", data: fs });
  } catch (err) { next(err); }
};

exports.deleteFlashSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fs = await FlashSale.findById(id);
    if (!fs) return res.status(404).json({ success: false, message: "Flash sale không tồn tại." });

    // Hoàn lại trạng thái Product
    await Product.updateOne(
      { _id: fs.productId },
      { isFlashSale: false, flashSalePrice: null, flashSaleEndsAt: null }
    );

    await FlashSale.deleteOne({ _id: id });
    return res.status(200).json({ success: true, message: "Xóa flash sale thành công." });
  } catch (err) { next(err); }
};
