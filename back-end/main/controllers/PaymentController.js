const crypto = require("crypto");
const qs     = require("qs");
const Order  = require("../models/Order");

// ─── Helper: Tạo chuỗi HMAC-SHA512 cho VNPay ─────────────────────────────────
const signVNPay = (params, secretKey) => {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => { acc[key] = params[key]; return acc; }, {});
  const signData = qs.stringify(sorted, { encode: false });
  return crypto.createHmac("sha512", secretKey).update(signData).digest("hex");
};

// ─── Create VNPay URL ─────────────────────────────────────────────────────────
// POST /api/payment/vnpay/create
// Tạo URL thanh toán VNPay, redirect client đến trang thanh toán
exports.createVNPayUrl = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Đơn hàng không ở trạng thái chờ thanh toán." });
    }

    const tmnCode   = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl    = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = process.env.VNP_RETURN_URL;

    const now    = new Date();
    const pad    = (n) => String(n).padStart(2, "0");
    const createDate =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const params = {
      vnp_Version:     "2.1.0",
      vnp_Command:     "pay",
      vnp_TmnCode:     tmnCode,
      vnp_Amount:      order.total * 100, // VNPay tính theo đơn vị VND * 100
      vnp_CurrCode:    "VND",
      vnp_TxnRef:      order._id.toString(),
      vnp_OrderInfo:   `Thanh toan don hang ${order._id}`,
      vnp_OrderType:   "other",
      vnp_Locale:      "vn",
      vnp_ReturnUrl:   returnUrl,
      vnp_IpAddr:      req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      vnp_CreateDate:  createDate,
    };

    params.vnp_SecureHash = signVNPay(params, secretKey);

    const paymentUrl = `${vnpUrl}?${qs.stringify(params, { encode: false })}`;

    return res.status(200).json({ success: true, data: { paymentUrl } });
  } catch (err) {
    next(err);
  }
};

// ─── VNPay Return (callback) ──────────────────────────────────────────────────
// GET /api/payment/vnpay/return
// VNPay redirect về sau khi thanh toán — verify HMAC trước khi cập nhật đơn
exports.vnpayReturn = async (req, res, next) => {
  try {
    const secretKey = process.env.VNP_HASH_SECRET;
    const params    = { ...req.query };
    const receivedHash = params.vnp_SecureHash;

    // Xóa hash trước khi tính lại để verify
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const expectedHash = signVNPay(params, secretKey);

    if (receivedHash !== expectedHash) {
      return res.status(400).json({ success: false, message: "Chữ ký không hợp lệ." });
    }

    const orderId    = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    if (responseCode === "00") {
      // Idempotency: nếu đã Confirmed (VNPay retry) thì redirect luôn, không update lại
      if (order.status === "Confirmed") {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${clientUrl}/payment/success?orderId=${orderId}`);
      }

      // Thanh toán thành công
      await Order.updateOne({ _id: orderId }, { status: "Confirmed", paidAt: new Date() });
      console.info(`[AUDIT] VNPay payment success for order ${orderId}`);

      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      return res.redirect(`${clientUrl}/payment/success?orderId=${orderId}`);
    } else {
      // Thanh toán thất bại hoặc bị hủy
      console.info(`[AUDIT] VNPay payment failed for order ${orderId}, code: ${responseCode}`);
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      return res.redirect(`${clientUrl}/payment/failed?orderId=${orderId}&code=${responseCode}`);
    }
  } catch (err) {
    next(err);
  }
};

// ─── Get Payment Status ───────────────────────────────────────────────────────
// GET /api/payment/status/:orderId
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const filter = isAdmin
      ? { _id: orderId }
      : { _id: orderId, user: userId };

    const order = await Order.findOne(filter).select("status total billingInfo createdAt paidAt");
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
