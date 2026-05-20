const Order              = require("../models/Order");
const Product            = require("../models/Product");
const ProductVariant     = require("../models/ProductVariant");
const FlashSale          = require("../models/FlashSale");
const Cart               = require("../models/Cart");
const User               = require("../models/User");
const Voucher            = require("../models/Voucher");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const VoucherUsage       = require("../models/VoucherUsage");
const ReturnRequest      = require("../models/ReturnRequest");
const Notification       = require("../models/Notification");
const ShippingZone       = require("../models/ShippingZone");
const { getEffectivePrice } = require("../lib/pricing");
// const transporter = require("../config/mailer"); // TODO: khi có mailer config

// ─── Create Order ─────────────────────────────────────────────────────────────
// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { products, billingInfo, voucherCode, paymentMethod, shippingFee, note } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách sản phẩm không được để trống." });
    }

    // Kiểm tra tồn kho từng sản phẩm, tính tổng tiền và gắn priceAtOrder
    let total = 0;
    const enrichedProducts = [];
    const stockReserved = []; // theo dõi để rollback khi lỗi
    const flashSaleItems = []; // theo dõi để cộng sold sau khi order thành công

    for (const item of products) {
      const product = await Product.findOne({
        _id: item.product,
        isActive: true,
        deletedAt: null,
      });

      if (!product) {
        // Rollback tồn kho đã trừ trước đó
        for (const r of stockReserved) {
          await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty, sold: -r.qty } });
        }
        return res.status(404).json({ success: false, message: `Sản phẩm ${item.product} không tồn tại.` });
      }

      // Atomic: chỉ trừ khi đủ hàng — tránh race condition oversell
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, deletedAt: null, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, sold: item.quantity } },
        { new: false }
      );
      if (!updated) {
        for (const r of stockReserved) {
          await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty, sold: -r.qty } });
        }
        return res.status(409).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ hàng trong kho.`,
        });
      }
      stockReserved.push({ id: item.product, qty: item.quantity });

      // Áp giá theo flash sale → variant → discount % (single source of truth)
      let variant = null;
      if (item.variantId) {
        variant = await ProductVariant.findOne({ _id: item.variantId, productId: product._id });
      }
      const price = getEffectivePrice(product, variant);
      total += price * item.quantity;
      const variantLabel = variant
        ? Object.entries(
            variant.attributes instanceof Map
              ? Object.fromEntries(variant.attributes)
              : (variant.attributes ?? {})
          ).filter(([k]) => k !== "colorHex").map(([, v]) => v).join(" / ")
        : "";
      // Trừ variant stock nếu có
      if (variant) {
        const variantUpdated = await ProductVariant.findOneAndUpdate(
          { _id: variant._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: false }
        );
        if (!variantUpdated) {
          // Rollback
          for (const r of stockReserved) {
            await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty, sold: -r.qty } });
          }
          return res.status(409).json({
            success: false,
            message: `Phiên bản "${variantLabel || variant._id}" của "${product.name}" không đủ hàng.`,
          });
        }
      }

      enrichedProducts.push({
        product:      item.product,
        quantity:     item.quantity,
        priceAtOrder: price,
        costAtOrder:  product.basePrice || 0,
        nameAtOrder:  product.name || "",
        imageAtOrder: product.images?.[0]?.url || "",
        variantLabel,
        variant:      variant?._id ?? null,
      });

      // Track flash sale items for sold counter update after order is saved
      if (product.isFlashSale) {
        flashSaleItems.push({ productId: item.product, quantity: item.quantity });
      }
    }

    // Áp dụng voucher nếu có — atomic để tránh race usedCount
    let discountAmount = 0;
    let appliedVoucher = null;
    if (voucherCode) {
      const now = new Date();

      // Atomic: tìm và increment trong 1 query, rollback nếu không tìm thấy
      appliedVoucher = await Voucher.findOneAndUpdate(
        {
          code: voucherCode.toUpperCase(),
          isActive: true,
          deletedAt: null,
          startsAt: { $lte: now },
          expiresAt: { $gt: now },
          $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (appliedVoucher) {
        // Check user đã dùng CHÍNH voucher này chưa (theo voucherId + userId)
        const alreadyUsed = await VoucherUsage.findOne({ voucherId: appliedVoucher._id, userId });

        if (!alreadyUsed) {
          discountAmount = appliedVoucher.type === "percent"
            ? Math.min(total * appliedVoucher.value / 100, appliedVoucher.maxDiscount ?? Infinity)
            : appliedVoucher.value;
        } else {
          // Đã dùng → rollback increment
          await Voucher.updateOne({ _id: appliedVoucher._id }, { $inc: { usedCount: -1 } });
          appliedVoucher = null;
        }
      }
    }
    const finalTotal = Math.max(0, total - discountAmount);

    // Tính shippingFee server-side từ ShippingZone (không tin shippingFee từ client)
    // Quy tắc: subtotal >= 500k → free; else lookup zone theo billingInfo.city; fallback 30k
    const FREE_SHIP_THRESHOLD = 500_000;
    const DEFAULT_SHIP_FEE = 30_000;
    let fee = 0;
    if (total < FREE_SHIP_THRESHOLD) {
      const cityName = billingInfo?.city?.trim();
      if (cityName) {
        const zone = await ShippingZone.findOne({
          name: { $regex: `^${cityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
          isActive: true,
        }).lean();
        fee = zone?.fee ?? DEFAULT_SHIP_FEE;
      } else {
        fee = DEFAULT_SHIP_FEE;
      }
    }
    const initialStatus = ["bank", "vnpay", "momo"].includes(paymentMethod) ? "PendingPayment" : "Pending";

    const order = await Order.create({
      user: userId,
      products: enrichedProducts,
      subtotal: total,
      total: finalTotal + fee,
      billingInfo,
      status: initialStatus,
      voucherCode: appliedVoucher?.code ?? null,
      discountAmount,
      paymentMethod: paymentMethod || "cod",
      shippingFee: fee,
      note: note || "",
    });

    // Ghi VoucherUsage (usedCount đã được tăng atomic ở bước findOneAndUpdate trên)
    if (appliedVoucher && discountAmount > 0) {
      await VoucherUsage.create({ voucherId: appliedVoucher._id, userId, orderId: order._id, discountAmount });
    }

    // Xóa giỏ hàng server
    await Cart.findOneAndDelete({ userId });

    // Cộng sold counter vào FlashSale (best-effort, không block order)
    if (flashSaleItems.length > 0) {
      const now = new Date();
      await Promise.all(
        flashSaleItems.map(({ productId, quantity }) =>
          FlashSale.updateOne(
            {
              isActive: true,
              endsAt: { $gt: now },
              "products.productId": productId,
            },
            { $inc: { "products.$.sold": quantity } }
          ).catch(() => {})
        )
      );
    }

    // Cộng loyalty points — bank/vnpay chờ xác nhận thanh toán mới cộng
    if (!["bank", "vnpay"].includes(paymentMethod)) {
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
          description: `Mua đơn hàng #${order.orderNumber}`,
          referenceId: order._id.toString(),
          balanceAfter: updatedUser.loyaltyPoints,
        });
      }
    }

    // Tạo notification cho khách
    await Notification.create({
      userId,
      type: "order_update",
      title: "Đặt hàng thành công",
      message: paymentMethod === "bank"
        ? `Đơn hàng #${order.orderNumber} đã được tiếp nhận. Vui lòng hoàn tất chuyển khoản để xử lý đơn.`
        : `Đơn hàng #${order.orderNumber} đã được tiếp nhận.`,
      referenceId: order._id.toString(),
      referenceModel: "Order",
    });

    // Thông báo cho admin khi có đơn chuyển khoản cần xác nhận (bank only, vnpay tự động)
    if (paymentMethod === "bank") {
      const admins = await User.find({ role: "admin" }, "_id");
      await Promise.all(admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          type: "order_update",
          title: "Đơn hàng chờ xác nhận thanh toán",
          message: `Khách hàng vừa đặt đơn #${order.orderNumber} bằng chuyển khoản. Vui lòng xác nhận sau khi nhận tiền.`,
          referenceId: order._id.toString(),
          referenceModel: "Order",
        })
      ));
    }

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
// GET /api/orders/my?page=1&limit=10&status=Delivered
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;
    const { status } = req.query;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("products.product", "name basePrice salePrice images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
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
exports.cancelOrder = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;
    const { refundBankInfo } = req.body; // chỉ dùng khi PendingPayment + bank

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    if (!["PendingPayment", "Pending", "Confirmed"].includes(order.status)) {
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
      if (item.variant) {
        await ProductVariant.updateOne(
          { _id: item.variant },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Hoàn voucher
    if (order.voucherCode) {
      await Voucher.updateOne({ code: order.voucherCode }, { $inc: { usedCount: -1 } });
      await VoucherUsage.deleteOne({ orderId: order._id });
    }

    // Hoàn loyalty points (chỉ với đơn đã được cộng điểm — COD/đã confirmed bank)
    const wasPointsAwarded = !["bank", "vnpay"].includes(order.paymentMethod) ||
      (["bank", "vnpay"].includes(order.paymentMethod) && order.paidAt != null);
    if (wasPointsAwarded) {
      const earnedPoints = Math.floor((order.total - (order.shippingFee || 0)) / 1000);
      if (earnedPoints > 0) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: order.user },
          { $inc: { loyaltyPoints: -earnedPoints } },
          { new: true }
        );
        if (updatedUser) {
          await LoyaltyTransaction.create({
            userId:       order.user,
            type:         "deduct",
            points:       -earnedPoints,
            description:  `Hủy đơn #${order.orderNumber}`,
            referenceId:  orderId,
            balanceAfter: updatedUser.loyaltyPoints,
          });
        }
      }
    }

    // PendingPayment + bank → cần hoàn tiền; Confirmed/Pending đã paidAt → cần hoàn tiền
    const needsRefund = order.paymentMethod === "bank" && (
      order.status === "PendingPayment" ||
      (["Pending", "Confirmed"].includes(order.status) && order.paidAt != null)
    );

    const updatePayload = { status: "Cancelled" };
    if (needsRefund) {
      updatePayload.refundStatus = "pending_refund";
      if (refundBankInfo) updatePayload.refundBankInfo = refundBankInfo;
    }

    await Order.updateOne({ _id: orderId }, updatePayload);

    console.info(`[AUDIT] User ${userId} cancelled order ${orderId} at ${new Date().toISOString()}`);

    return res.status(200).json({
      success: true,
      message: "Đã hủy đơn hàng thành công.",
      data: { needsRefund },
    });
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

    // Nếu đơn thanh toán online → lấy thông tin TK hoàn tiền
    const refundBankInfo = (order.paymentMethod !== "cod" && req.body.refundBankInfo)
      ? req.body.refundBankInfo
      : undefined;

    const returnRequest = await ReturnRequest.create({ orderId, userId, reason, refundBankInfo });
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

    // Nếu đơn hàng thanh toán online → đánh dấu cần hoàn tiền + lưu TK từ return request
    const order = await Order.findById(request.orderId);
    if (order && order.paymentMethod !== "cod" && order.paidAt) {
      await Order.updateOne(
        { _id: order._id },
        {
          refundStatus: "pending_refund",
          "refundBankInfo.bankName":      request.refundBankInfo?.bankName      || "",
          "refundBankInfo.accountNumber": request.refundBankInfo?.accountNumber || "",
          "refundBankInfo.accountHolder": request.refundBankInfo?.accountHolder || "",
        }
      );
    }

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

// ─── Get Order By Id ──────────────────────────────────────────────────────────
// GET /api/orders/:orderId
exports.getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate("products.product", "name basePrice salePrice images");

    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── Confirm Payment (Admin) ──────────────────────────────────────────────────
// PATCH /api/orders/:orderId/confirm-payment
// Admin xác nhận đã nhận tiền chuyển khoản → chuyển sang Pending (xử lý bình thường)
exports.confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    if (order.status !== "PendingPayment") {
      return res.status(400).json({ success: false, message: "Đơn hàng không ở trạng thái chờ thanh toán." });
    }

    await Order.updateOne({ _id: orderId }, { status: "Confirmed", paidAt: new Date() });

    // Cộng loyalty points sau khi xác nhận thanh toán
    const earnedPoints = Math.floor(order.total / 1000);
    if (earnedPoints > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: order.user },
        { $inc: { loyaltyPoints: earnedPoints } },
        { new: true }
      );
      await LoyaltyTransaction.create({
        userId: order.user,
        type: "earn",
        points: earnedPoints,
        description: `Xác nhận thanh toán đơn #${order.orderNumber}`,
        referenceId: order._id.toString(),
        balanceAfter: updatedUser.loyaltyPoints,
      });
    }

    await Notification.create({
      userId: order.user,
      type: "order_update",
      title: "Thanh toán được xác nhận",
      message: `Đơn hàng #${order.orderNumber} đã được xác nhận thanh toán và đang được xử lý.`,
      referenceId: order._id.toString(),
      referenceModel: "Order",
    });

    console.info(`[AUDIT] Admin ${req.user.id} confirmed payment for order ${orderId}`);
    return res.status(200).json({ success: true, message: "Đã xác nhận thanh toán." });
  } catch (err) {
    next(err);
  }
};

// ─── Mark Refunded (Admin) ────────────────────────────────────────────────────
// PATCH /api/orders/:orderId/mark-refunded
// Admin xác nhận đã chuyển tiền hoàn lại cho khách
exports.markRefunded = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { refundNote } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    if (order.refundStatus !== "pending_refund") {
      return res.status(400).json({ success: false, message: "Đơn hàng không ở trạng thái chờ hoàn tiền." });
    }

    await Order.updateOne(
      { _id: orderId },
      {
        refundStatus: "refunded",
        "refundBankInfo.refundedAt": new Date(),
        "refundBankInfo.refundNote": refundNote || "",
      }
    );

    await Notification.create({
      userId: order.user,
      type: "order_update",
      title: "Hoàn tiền thành công",
      message: `Đơn hàng #${order.orderNumber} đã được hoàn tiền.`,
      referenceId: order._id.toString(),
      referenceModel: "Order",
    });

    console.info(`[AUDIT] Admin ${req.user.id} marked order ${orderId} as refunded`);
    return res.status(200).json({ success: true, message: "Đã đánh dấu hoàn tiền thành công." });
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
