const mongoose = require("mongoose");
const crypto   = require("crypto");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () => `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity:         { type: Number, required: true, min: 1 },
        priceAtOrder:     { type: Number, required: true, min: 0 },
        costAtOrder:      { type: Number, default: null, min: 0 },
        nameAtOrder:      { type: String, default: "" },
        imageAtOrder:     { type: String, default: "" },
        variantLabel:     { type: String, default: "" },
        variant:          { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },
      },
    ],
    subtotal: { type: Number, default: 0, min: 0 }, // tổng trước phí ship + voucher
    note: { type: String, default: "" },            // ghi chú của khách
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PendingPayment", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
    },

    // ─── Hoàn tiền ───────────────────────────────────────────────────────────
    refundStatus: {
      type: String,
      enum: ["none", "pending_refund", "refunded"],
      default: "none",
    },
    refundBankInfo: {
      bankName:      { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountHolder: { type: String, default: "" },
      refundedAt:    { type: Date,   default: null },
      refundNote:    { type: String, default: "" },
    },
    billingInfo: {
      fullName: String,
      street:   String,
      district: String,
      city:     String,
      phone:    String,
      email:    String,
    },

    // ─── Thanh toán ───────────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ["cod", "bank", "momo", "vnpay"],
      default: "cod",
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null, // null = chưa thanh toán; set khi VNPay callback thành công
    },

    // ─── Voucher ──────────────────────────────────────────────────────────────
    // TODO: Kích hoạt khi có Voucher model
    voucherCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true } // thay thế createdAt manual
);

module.exports = mongoose.model("Order", orderSchema);
