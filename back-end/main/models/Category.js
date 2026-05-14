const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      default: "",
    },

    // ─── Danh mục cha - con (tối đa 2 cấp) ──────────────────────────────────
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    showOnHome: {
      type: Boolean,
      default: true, // Hiện trong CategoryShowcase ở trang chủ
    },
    sortOrder: {
      type: Number,
      default: 0,   // Số nhỏ hơn hiển thị trước
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
// Partial unique indexes — only enforce uniqueness for non-deleted documents
categorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ isActive: 1, deletedAt: 1, sortOrder: 1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
