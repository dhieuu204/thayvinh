const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,   // VD: "Size M - Màu đỏ"
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,   // Stock Keeping Unit — mã phân biệt variant
    },
    attributes: {
      type: Map,
      of: String,   // VD: { size: "M", color: "đỏ" }
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [{ type: String }],  // URL ảnh riêng cho variant (tuỳ chọn)
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);
