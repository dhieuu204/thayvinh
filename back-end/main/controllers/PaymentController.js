const crypto             = require("crypto");
const qs                 = require("qs");
const Order              = require("../models/Order");
const Product            = require("../models/Product");
const ProductVariant     = require("../models/ProductVariant");
const User               = require("../models/User");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const Notification       = require("../models/Notification");

// ─── Helper: Tạo HMAC-SHA512 cho VNPay ───────────────────────────────────────
const signVNPay = (params, secretKey) => {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => { acc[key] = params[key]; return acc; }, {});
  const signData = qs.stringify(sorted, { encode: false });
  return crypto.createHmac("sha512", secretKey).update(signData).digest("hex");
};

// ─── Create VNPay URL ─────────────────────────────────────────────────────────
// POST /api/payments/vnpay/create
exports.createVNPayUrl = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    if (order.status !== "PendingPayment" || order.paymentMethod !== "vnpay") {
      return res.status(400).json({ success: false, message: "Đơn hàng không hợp lệ để thanh toán VNPay." });
    }

    const tmnCode   = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl    = process.env.VNP_URL    || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = process.env.VNP_RETURN_URL;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const createDate =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const params = {
      vnp_Version:    "2.1.0",
      vnp_Command:    "pay",
      vnp_TmnCode:    tmnCode,
      vnp_Amount:     Math.round(order.total) * 100, // VNPay: VND * 100
      vnp_CurrCode:   "VND",
      vnp_TxnRef:     order._id.toString(),
      vnp_OrderInfo:  `Thanh toan don hang ${order.orderNumber || order._id}`,
      vnp_OrderType:  "other",
      vnp_Locale:     "vn",
      vnp_ReturnUrl:  returnUrl,
      vnp_IpAddr:     req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
      vnp_CreateDate: createDate,
    };

    params.vnp_SecureHash = signVNPay(params, secretKey);

    const paymentUrl = `${vnpUrl}?${qs.stringify(params, { encode: false })}`;
    return res.status(200).json({ success: true, data: { paymentUrl } });
  } catch (err) {
    next(err);
  }
};

// ─── VNPay Return (callback từ VNPay) ────────────────────────────────────────
// GET /api/payments/vnpay/return
exports.vnpayReturn = async (req, res, next) => {
  try {
    const secretKey = process.env.VNP_HASH_SECRET;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";

    const params       = { ...req.query };
    const receivedHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // Verify chữ ký
    if (receivedHash !== signVNPay(params, secretKey)) {
      return res.redirect(`${clientUrl}/payment/result?success=false&code=INVALID_SIGNATURE`);
    }

    const orderId      = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;
    const order        = await Order.findById(orderId);

    if (!order) {
      return res.redirect(`${clientUrl}/payment/result?success=false&code=ORDER_NOT_FOUND`);
    }

    if (responseCode === "00") {
      // Idempotency: VNPay có thể gọi lại nhiều lần
      if (order.status !== "PendingPayment") {
        return res.redirect(`${clientUrl}/payment/result?success=true&orderId=${orderId}`);
      }

      // Xác nhận thanh toán
      await Order.updateOne({ _id: orderId }, { status: "Confirmed", paidAt: new Date() });

      // Cộng loyalty points
      const earnedPoints = Math.floor(order.total / 1000);
      if (earnedPoints > 0) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: order.user },
          { $inc: { loyaltyPoints: earnedPoints } },
          { new: true }
        );
        await LoyaltyTransaction.create({
          userId:       order.user,
          type:         "earn",
          points:       earnedPoints,
          description:  `Thanh toán VNPay đơn #${order.orderNumber}`,
          referenceId:  orderId,
          balanceAfter: updatedUser.loyaltyPoints,
        });
      }

      await Notification.create({
        userId:         order.user,
        type:           "order_update",
        title:          "Thanh toán thành công",
        message:        `Đơn hàng #${order.orderNumber} đã được thanh toán và đang được xử lý.`,
        referenceId:    orderId,
        referenceModel: "Order",
      });

      console.info(`[AUDIT] VNPay payment success for order ${orderId}`);
      return res.redirect(`${clientUrl}/payment/result?success=true&orderId=${orderId}`);

    } else {
      // Thanh toán thất bại / bị huỷ — hoàn kho, huỷ đơn
      if (order.status === "PendingPayment") {
        await Order.updateOne({ _id: orderId }, { status: "Cancelled" });
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
        await Notification.create({
          userId:         order.user,
          type:           "order_update",
          title:          "Thanh toán thất bại",
          message:        `Thanh toán VNPay cho đơn #${order.orderNumber} không thành công. Đơn hàng đã bị huỷ.`,
          referenceId:    orderId,
          referenceModel: "Order",
        });
      }

      console.info(`[AUDIT] VNPay payment failed for order ${orderId}, code: ${responseCode}`);
      return res.redirect(`${clientUrl}/payment/result?success=false&orderId=${orderId}&code=${responseCode}`);
    }
  } catch (err) {
    next(err);
  }
};

// ─── Get Payment Status ───────────────────────────────────────────────────────
// GET /api/payments/status/:orderId
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const isAdmin = req.user.role === "admin";
    const filter  = isAdmin ? { _id: orderId } : { _id: orderId, user: req.user.id };

    const order = await Order.findOne(filter).select("status total billingInfo createdAt paidAt orderNumber");
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
