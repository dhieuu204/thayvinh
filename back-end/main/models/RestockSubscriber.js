const mongoose = require("mongoose");

const restockSubscriberSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,   // null nếu guest đăng ký bằng email
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    notifiedAt: {
      type: Date,
      default: null,   // null = chưa gửi thông báo
    },
  },
  { timestamps: true }
);

// Mỗi email chỉ subscribe 1 lần cho 1 sản phẩm
restockSubscriberSchema.index({ productId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("RestockSubscriber", restockSubscriberSchema);
