const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    productId:      { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    flashSalePrice: { type: Number, required: true, min: 0 },
    startsAt:       { type: Date, required: true },
    endsAt:         { type: Date, required: true },
    isActive:       { type: Boolean, default: true },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

flashSaleSchema.index({ productId: 1 });
flashSaleSchema.index({ startsAt: 1, endsAt: 1, isActive: 1 });

module.exports = mongoose.model("FlashSale", flashSaleSchema);
