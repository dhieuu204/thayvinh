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

// Sau mỗi save: sync flash sale fields vào Product để pricing helper luôn đọc đúng
async function syncProductsFlashSale(flashSale) {
  const Product = require("./Product"); // lazy require — tránh circular
  const now = new Date();
  const active = flashSale.isActive && new Date(flashSale.endsAt) > now;

  for (const item of flashSale.products) {
    if (active) {
      const product = await Product.findById(item.productId).select("salePrice basePrice");
      if (!product) continue;
      const listPrice = product.salePrice ?? product.basePrice ?? 0;
      const flashPrice = item.discountType === "percent"
        ? Math.round(listPrice * (1 - item.discountValue / 100))
        : Math.max(0, listPrice - item.discountValue);
      await Product.updateOne(
        { _id: item.productId },
        { isFlashSale: true, flashSalePrice: flashPrice, flashSaleEndsAt: flashSale.endsAt }
      );
    } else {
      // Chỉ xóa flash fields nếu đây chính là flash sale đang được gán
      await Product.updateOne(
        { _id: item.productId, flashSaleEndsAt: flashSale.endsAt },
        { $unset: { isFlashSale: "", flashSalePrice: "", flashSaleEndsAt: "" } }
      );
    }
  }
}

flashSaleSchema.post("save", async function () {
  try { await syncProductsFlashSale(this); } catch {}
});

module.exports = mongoose.model("FlashSale", flashSaleSchema);
