const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed"],  // percent: giảm %, fixed: giảm số tiền cố định
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,   // Với percent: 0–100, với fixed: số tiền giảm
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,   // Giá trị đơn hàng tối thiểu để áp dụng
    },
    maxDiscount: {
      type: Number,
      default: null,  // Giới hạn số tiền giảm tối đa (dùng cho type percent)
    },
    usageLimit: {
      type: Number,
      default: null,  // null = không giới hạn lượt dùng
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

voucherSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
voucherSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model("Voucher", voucherSchema);
