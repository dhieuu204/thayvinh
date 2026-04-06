const mongoose = require("mongoose");

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem"],  // earn: tích điểm, redeem: đổi điểm
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      required: true,  // VD: "Mua đơn #ORD-001", "Đổi điểm lấy voucher"
    },
    referenceId: {
      type: String,
      default: null,   // ID đơn hàng hoặc voucher liên quan
    },
    balanceAfter: {
      type: Number,
      required: true,  // Ghi lại số dư sau giao dịch để audit
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,    // Chỉ unique với document có field này (redeem)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);
