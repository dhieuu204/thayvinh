const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        discountType: {
          type: String,
          enum: ["percent", "fixed"],
          required: true,
        },
        discountValue: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        sold: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

flashSaleSchema.index({ startsAt: 1, endsAt: 1, isActive: 1 });
flashSaleSchema.index({ "products.productId": 1 });

module.exports = mongoose.model("FlashSale", flashSaleSchema);
