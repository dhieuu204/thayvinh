const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:           {
      type: String,
      enum: ["order_update", "price_drop", "restock", "promotion", "system"],
      required: true,
    },
    title:          { type: String, required: true },
    message:        { type: String, required: true },
    referenceId:    { type: String, default: null },   // orderId, productId, v.v.
    referenceModel: { type: String, default: null },   // "Order", "Product", v.v.
    isRead:         { type: Boolean, default: false },
    readAt:         { type: Date,    default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
