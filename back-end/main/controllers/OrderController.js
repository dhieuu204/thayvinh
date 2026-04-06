const Order              = require("../models/Order");
const Product            = require("../models/Product");
const Cart               = require("../models/Cart");
const User               = require("../models/User");
const Voucher            = require("../models/Voucher");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const VoucherUsage       = require("../models/VoucherUsage");
const ReturnRequest      = require("../models/ReturnRequest");
const Notification       = require("../models/Notification");
// const transporter = require("../config/mailer"); // TODO: khi có mailer config

// ─── Create Order ─────────────────────────────────────────────────────────────
// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { products, billingInfo, voucherCode } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách sản phẩm không được để trống." });
    }

    // Kiểm tra tồn kho từng sản phẩm, tính tổng tiền và gắn priceAtOrder
    let total = 0;
    const enrichedProducts = [];

    for (const item of products) {
      const product = await Product.findOne({
        _id: item.product,
        isActive: true,
        deletedAt: null,
      });

      if (!product) {
        return res.status(404).json({ success: false, message: `Sản phẩm ${item.product} không tồn tại.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho.`,
        });
      }

      const price = product.salePrice ?? product.basePrice;
      total += price * item.quantity;
      enrichedProducts.push({ product: item.product, quantity: item.quantity, priceAtOrder: price });
    }

    // Áp dụng voucher nếu có
    let discountAmount = 0;
    let appliedVoucher = null;
    if (voucherCode) {
      const now = new Date();
      appliedVoucher = await Voucher.findOne({
        code: voucherCode.toUpperCase(),
        isActive: true,
        deletedAt: null,
        startsAt: { $lte: now },
        expiresAt: { $gt: now },
      });

      if (appliedVoucher) {
        const alreadyUsed = await VoucherUsage.findOne({ voucherId: appliedVoucher._id, userId });
        if (!alreadyUsed && (appliedVoucher.usageLimit === null || appliedVoucher.usedCount < appliedVoucher.usageLimit)) {
          discountAmount = appliedVoucher.type === "percent"
            ? Math.min(total * appliedVoucher.value / 100, appliedVoucher.maxDiscount ?? Infinity)
            : appliedVoucher.value;
        }
      }
    }
    const finalTotal = Math.max(0, total - discountAmount);

    // Trừ tồn kho
    for (const item of enrichedProducts) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
    }

    const order = await Order.create({
      user: userId,
      products: enrichedProducts,
      total: finalTotal,
      billingInfo,
      status: "Pending",
      voucherCode: appliedVoucher?.code ?? null,
      discountAmount,
    });

    // Ghi VoucherUsage
    if (appliedVoucher && discountAmount > 0) {
      await VoucherUsage.create({ voucherId: appliedVoucher._id, userId, orderId: order._id, discountAmount });
      await Voucher.updateOne({ _id: appliedVoucher._id }, { $inc: { usedCount: 1 } });
    }

    // Xóa giỏ hàng server
    await Cart.findOneAndDelete({ userId });

    // Cộng loyalty points
    const earnedPoints = Math.floor(finalTotal / 1000);
    if (earnedPoints > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $inc: { loyaltyPoints: earnedPoints } },
        { new: true }
      );
      await LoyaltyTransaction.create({
        userId,
        type: "earn",
        points: earnedPoints,
        description: `Mua đơn hàng #${order._id}`,
        referenceId: order._id.toString(),
        balanceAfter: updatedUser.loyaltyPoints,
      });
    }

    // Tạo notification
    await Notification.create({
      userId,
      type: "order_update",
      title: "Đặt hàng thành công",
      message: `Đơn hàng #${order._id} đã được tiếp nhận.`,
      referenceId: order._id.toString(),
      referenceModel: "Order",
    });

    console.info(`[AUDIT] User ${userId} created order ${order._id} at ${new Date().toISOString()}`);

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công.",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get My Orders ────────────────────────────────────────────────────────────
// GET /api/orders/my?page=1&limit=10
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .populate("products.product", "name basePrice salePrice images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:orderId/cancel
// Chỉ hủy được khi status là Pending hoặc Confirmed; hoàn lại tồn kho
exports.cancelOrder = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    if (!["Pending", "Confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng ở trạng thái "${order.status}".`,
      });
    }

    // Hoàn lại tồn kho
    for (const item of order.products) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, sold: -item.quantity } }
      );
    }

    await Order.updateOne({ _id: orderId }, { status: "Cancelled" });

    console.info(`[AUDIT] User ${userId} cancelled order ${orderId} at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Đã hủy đơn hàng thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── Create Return Request ────────────────────────────────────────────────────
// POST /api/orders/:orderId/return
// Chỉ cho phép khi đơn hàng đã ở trạng thái Delivered
// TODO: Uncomment khi đã tạo ReturnRequest model
exports.createReturnRequest = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp lý do hoàn trả." });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    if (order.status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Chỉ có thể hoàn trả đơn hàng đã giao." });
    }

    // Kiểm tra đơn hàng này đã có yêu cầu hoàn trả chưa
    const existingRequest = await ReturnRequest.findOne({ orderId });
    if (existingRequest) {
      return res.status(409).json({ success: false, message: "Đơn hàng này đã có yêu cầu hoàn trả." });
    }

    const returnRequest = await ReturnRequest.create({ orderId, userId, reason });
    return res.status(201).json({ success: true, message: "Yêu cầu hoàn trả đã được gửi.", data: returnRequest });
  } catch (err) {
    next(err);
  }
};

// ─── Get Return Requests (Admin) ──────────────────────────────────────────────
// GET /api/orders/returns?status=Pending&page=1
// TODO: Uncomment khi đã tạo ReturnRequest model
exports.getReturnRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      ReturnRequest.find(filter)
        .populate("orderId")
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ReturnRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Approve Return (Admin) ───────────────────────────────────────────────────
// PATCH /api/orders/returns/:returnId/approve
// TODO: Uncomment khi đã tạo ReturnRequest model
exports.approveReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const request = await ReturnRequest.findById(returnId);
    if (!request) return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại." });
    if (request.status !== "Pending") return res.status(400).json({ success: false, message: "Yêu cầu đã được xử lý." });

    await ReturnRequest.updateOne({ _id: returnId }, { status: "Approved", resolvedAt: new Date() });
    console.info(`[AUDIT] Admin ${req.user.id} approved return ${returnId}`);
    return res.status(200).json({ success: true, message: "Đã duyệt yêu cầu hoàn trả." });
  } catch (err) {
    next(err);
  }
};

// ─── Reject Return (Admin) ────────────────────────────────────────────────────
// PATCH /api/orders/returns/:returnId/reject
// TODO: Uncomment khi đã tạo ReturnRequest model
exports.rejectReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { rejectReason } = req.body;
    const request = await ReturnRequest.findById(returnId);
    if (!request) return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại." });
    if (request.status !== "Pending") return res.status(400).json({ success: false, message: "Yêu cầu đã được xử lý." });

    await ReturnRequest.updateOne({ _id: returnId }, { status: "Rejected", rejectReason: rejectReason || "", resolvedAt: new Date() });
    console.info(`[AUDIT] Admin ${req.user.id} rejected return ${returnId}`);
    return res.status(200).json({ success: true, message: "Đã từ chối yêu cầu hoàn trả." });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Order (giữ lại để tương thích) ────────────────────────────────────
// Chỉ dùng nội bộ / admin — user thông thường dùng cancelOrder
exports.deleteOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại hoặc không có quyền xóa." });
    }

    await order.deleteOne();
    return res.status(200).json({ success: true, message: "Xóa đơn hàng thành công." });
  } catch (err) {
    next(err);
  }
};
