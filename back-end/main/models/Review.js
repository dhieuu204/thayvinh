const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order",   required: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, default: "" },
    images:    [{ type: String }],
    reply:     { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    isVisible: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Một user chỉ được review một lần cho một sản phẩm (bất kể mua bao nhiêu lần)
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
