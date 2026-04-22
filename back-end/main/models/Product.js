const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // ─── Giá ──────────────────────────────────────────────────────────────────
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },
    saleDiscount: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // ─── Ảnh ──────────────────────────────────────────────────────────────────
    images: [
      {
        url:       { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ─── Kho hàng ─────────────────────────────────────────────────────────────
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Phân loại ────────────────────────────────────────────────────────────
    tags: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,   // false = ẩn khỏi frontend, admin vẫn xem được
    },

    // ─── Flash Sale ───────────────────────────────────────────────────────────
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    flashSalePrice: {
      type: Number,
      default: null,
      min: 0,
    },
    flashSaleEndsAt: {
      type: Date,
      default: null,
    },

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
productSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
productSchema.index({ category: 1, basePrice: 1 });
productSchema.index({ isActive: 1, deletedAt: 1 });
productSchema.index({ name: "text", tags: "text" }); // Full-text search

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
