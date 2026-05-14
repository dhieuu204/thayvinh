const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Mỗi user chỉ có 1 giỏ hàng
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
          default: null,
        },
        color:       { type: String, default: "" },
        priceAtAdd:  { type: Number, default: 0 },
        quantity:    { type: Number, default: 1, min: 1 },
      },
    ],

    // ─── Voucher ──────────────────────────────────────────────────────────────
    // TODO: Kích hoạt khi có Voucher model
    voucherCode: {
      type: String,
      default: null,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
