const crypto             = require("crypto");
const https              = require("https");
const Order              = require("../models/Order");
const Product            = require("../models/Product");
const ProductVariant     = require("../models/ProductVariant");
const User               = require("../models/User");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const Notification       = require("../models/Notification");

// ─── Helper: Sort + encode params đúng theo sortObject của VNPay ─────────────
// VNPay ký trên giá trị đã encodeURIComponent (+ thay %20), KHÔNG phải raw value
const sortVNPayParams = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();
  for (const k of keys) {
    const rawKey = decodeURIComponent(k);
    sorted[rawKey] = encodeURIComponent(obj[rawKey]).replace(/%20/g, "+");
  }
  return sorted;
};

const signVNPay = (params, secretKey) => {
  const sorted   = sortVNPayParams(params);
  const signData = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join("&");
  return crypto.createHmac("sha512", secretKey).update(Buffer.from(signData, "utf-8")).digest("hex");
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

    const hash   = signVNPay(params, secretKey);
    const sorted = sortVNPayParams({ ...params, vnp_SecureHash: hash });
    const paymentUrl = `${vnpUrl}?${Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join("&")}`;
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

// ─── MoMo Helpers ────────────────────────────────────────────────────────────
const signMoMo = (rawSignature, secretKey) =>
  crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

const callMoMoAPI = (endpoint, body) =>
  new Promise((resolve, reject) => {
    const url    = new URL(endpoint);
    const data   = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   "POST",
      headers:  { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error("MoMo response parse error: " + raw)); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });

// ─── Create MoMo Payment ──────────────────────────────────────────────────────
// POST /api/payments/momo/create
exports.createMoMoPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
    }
    if (order.status !== "PendingPayment" || order.paymentMethod !== "momo") {
      return res.status(400).json({ success: false, message: "Đơn hàng không hợp lệ để thanh toán MoMo." });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey   = process.env.MOMO_ACCESS_KEY;
    const secretKey   = process.env.MOMO_SECRET_KEY;
    const ipnUrl      = process.env.MOMO_IPN_URL;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const endpoint    = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";

    const requestId  = `${partnerCode}_${Date.now()}`;
    const amount     = Math.round(order.total);
    const orderInfo  = `Thanh toan don hang ${order.orderNumber || order._id}`;
    const requestType = "payWithMethod";
    const extraData  = "";

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = signMoMo(rawSignature, secretKey);

    const requestBody = {
      partnerCode, accessKey, requestId,
      amount, orderId, orderInfo,
      redirectUrl, ipnUrl, extraData,
      requestType, signature,
      lang: "vi",
    };

    const momoRes = await callMoMoAPI(endpoint, requestBody);

    if (momoRes.resultCode !== 0) {
      return res.status(400).json({
        success: false,
        message: momoRes.message || "Tạo thanh toán MoMo thất bại.",
        code: momoRes.resultCode,
      });
    }

    return res.status(200).json({ success: true, data: { paymentUrl: momoRes.payUrl } });
  } catch (err) {
    next(err);
  }
};

// ─── MoMo IPN (server-to-server callback) ────────────────────────────────────
// POST /api/payments/momo/ipn
exports.momoIPN = async (req, res, next) => {
  try {
    const {
      partnerCode, orderId, requestId, amount,
      orderInfo, orderType, transId, resultCode,
      message, payType, responseTime, extraData, signature,
    } = req.body;

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    // Verify chữ ký IPN
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSig = signMoMo(rawSignature, secretKey);
    if (signature !== expectedSig) {
      console.warn(`[AUDIT] MoMo IPN invalid signature for order ${orderId}`);
      return res.status(200).json({ resultCode: 0, message: "ok" }); // vẫn 200 để MoMo không retry
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json({ resultCode: 0, message: "ok" });
    }

    if (resultCode === 0) {
      // Thanh toán thành công
      if (order.status !== "PendingPayment") {
        return res.status(200).json({ resultCode: 0, message: "ok" });
      }

      await Order.updateOne({ _id: orderId }, { status: "Confirmed", paidAt: new Date() });

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
          description:  `Thanh toán MoMo đơn #${order.orderNumber}`,
          referenceId:  orderId,
          balanceAfter: updatedUser.loyaltyPoints,
        });
      }

      await Notification.create({
        userId:         order.user,
        type:           "order_update",
        title:          "Thanh toán thành công",
        message:        `Đơn hàng #${order.orderNumber} đã được thanh toán qua MoMo và đang được xử lý.`,
        referenceId:    orderId,
        referenceModel: "Order",
      });

      console.info(`[AUDIT] MoMo IPN payment success for order ${orderId}, transId: ${transId}`);
    } else {
      // Thanh toán thất bại
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
          message:        `Thanh toán MoMo cho đơn #${order.orderNumber} không thành công. Đơn hàng đã bị huỷ.`,
          referenceId:    orderId,
          referenceModel: "Order",
        });
      }
      console.info(`[AUDIT] MoMo IPN payment failed for order ${orderId}, code: ${resultCode}`);
    }

    return res.status(200).json({ resultCode: 0, message: "ok" });
  } catch (err) {
    next(err);
  }
};

// ─── MoMo Return (redirect về frontend) ──────────────────────────────────────
// GET /api/payments/momo/return
exports.momoReturn = async (req, res, next) => {
  try {
    const clientUrl  = process.env.CLIENT_URL || "http://localhost:5174";
    const { orderId, resultCode, message } = req.query;

    if (resultCode === "0") {
      return res.redirect(`${clientUrl}/payment/result?success=true&orderId=${orderId}`);
    } else {
      return res.redirect(`${clientUrl}/payment/result?success=false&orderId=${orderId}&code=${resultCode}`);
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
