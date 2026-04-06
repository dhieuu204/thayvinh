const mongoose = require("mongoose");

const voucherUsageSchema = new mongoose.Schema(
  {
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,  // Số tiền thực tế đã giảm cho đơn hàng này
    },
  },
  { timestamps: true }
);

// Mỗi user chỉ dùng 1 voucher 1 lần
voucherUsageSchema.index({ voucherId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("VoucherUsage", voucherUsageSchema);
