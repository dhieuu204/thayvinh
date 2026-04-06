const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
        quantity: { type: Number, required: true, min: 1 },
        priceAtOrder: { type: Number, required: true, min: 0 }, // Lưu giá tại thời điểm đặt — tránh giá thay đổi sau
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      index: true,
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
