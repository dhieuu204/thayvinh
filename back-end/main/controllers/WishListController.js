const Product  = require("../models/Product");
const WishList = require("../models/WishList");
const Cart     = require("../models/Cart");
const { getEffectivePrice } = require("../lib/pricing");

// ─── View Wishlist ────────────────────────────────────────────────────────────
exports.viewWishList = async (req, res, next) => {
  try {
    const wishList = await WishList.findOne({ userId: req.user.id })
      .populate(
        "products.productId",
        "name basePrice salePrice saleDiscount isFlashSale flashSalePrice flashSaleEndsAt images isActive stock"
      );

    if (!wishList) {
      return res.status(200).json({ success: true, data: { products: [] } });
    }

    return res.status(200).json({ success: true, data: wishList });
  } catch (err) {
    next(err);
  }
};

// ─── Add To Wishlist ──────────────────────────────────────────────────────────
// Toggle: thêm nếu chưa có, bỏ qua nếu đã có (wishlist không có quantity)
// Lưu priceAtAdd để sau này trigger price drop notification
exports.addToWishList = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }

    const price = getEffectivePrice(product);

    // Atomic: upsert wishlist, chỉ push khi productId chưa có — tránh dedupe race condition
    const result = await WishList.findOneAndUpdate(
      { userId: req.user.id, "products.productId": { $ne: productId } },
      { $push: { products: { productId, priceAtAdd: price } } },
      { upsert: true, new: true }
    );

    if (!result) {
      return res.status(200).json({ success: true, message: "Sản phẩm đã có trong danh sách yêu thích." });
    }
    return res.status(200).json({ success: true, message: "Đã thêm vào danh sách yêu thích." });
  } catch (err) {
    next(err);
  }
};

// ─── Remove From Wishlist ─────────────────────────────────────────────────────
exports.removeFromWishList = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const wishList = await WishList.findOne({ userId: req.user.id });
    if (!wishList) {
      return res.status(404).json({ success: false, message: "Danh sách yêu thích không tồn tại." });
    }

    wishList.products = wishList.products.filter(
      (item) => item.productId.toString() !== productId
    );
    await wishList.save();
    return res.status(200).json({ success: true, message: "Đã xóa sản phẩm khỏi danh sách yêu thích." });
  } catch (err) {
    next(err);
  }
};

// ─── Add All To Cart ──────────────────────────────────────────────────────────
// Chuyển toàn bộ wishlist vào giỏ hàng — chỉ thêm sản phẩm còn hàng
exports.addAll = async (req, res, next) => {
  try {
    const wishList = await WishList.findOne({ userId: req.user.id });
    if (!wishList || wishList.products.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách yêu thích trống." });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, products: [] });
    }

    let addedCount = 0;
    for (const wishItem of wishList.products) {
      const product = await Product.findOne({
        _id: wishItem.productId,
        isActive: true,
        deletedAt: null,
        stock: { $gt: 0 },
      });

      if (!product) continue; // Bỏ qua sản phẩm hết hàng hoặc không còn tồn tại

      const index = cart.products.findIndex(
        (cartItem) => cartItem.productId.toString() === wishItem.productId.toString()
      );
      if (index > -1) {
        cart.products[index].quantity += 1;
      } else {
        cart.products.push({ productId: wishItem.productId, quantity: 1 });
      }
      addedCount++;
    }

    await cart.save();
    return res.status(200).json({
      success: true,
      message: `Đã thêm ${addedCount} sản phẩm vào giỏ hàng.`,
    });
  } catch (err) {
    next(err);
  }
};
