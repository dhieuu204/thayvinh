const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Mỗi user chỉ có 1 wishlist
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        priceAtAdd: {
          type: Number,
          default: 0,  // Giá tại thời điểm thêm vào wishlist — dùng để trigger price drop notification
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('WishList', wishListSchema);
