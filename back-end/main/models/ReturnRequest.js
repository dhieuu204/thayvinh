const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    rejectReason: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Thông tin TK nhận hoàn tiền (chỉ cần cho đơn thanh toán online)
    refundBankInfo: {
      bankName:      { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountHolder: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Mỗi đơn hàng chỉ có 1 yêu cầu hoàn trả
returnRequestSchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
