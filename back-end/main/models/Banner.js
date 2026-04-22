const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true },
    imageUrl:  { type: String, required: true },
    linkUrl:   { type: String, default: "" },
    position:  { type: String, default: "homepage", enum: ["homepage", "iphone", "ipad", "mac", "watch", "audio", "accessories"] },
    sortOrder: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
