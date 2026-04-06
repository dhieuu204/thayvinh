const mongoose      = require("mongoose");
const Product       = require("../models/Product");
const Cart          = require("../models/Cart");
const Voucher       = require("../models/Voucher");
const VoucherUsage  = require("../models/VoucherUsage");

// ─── View Cart ────────────────────────────────────────────────────────────────
exports.viewCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate("products.productId", "name basePrice salePrice images isActive stock");

    if (!cart) {
      return res.status(200).json({ success: true, data: { products: [], voucher: null, total: 0 } });
    }

    return res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

// ─── Add To Cart ──────────────────────────────────────────────────────────────
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Số lượng phải là số nguyên dương." });
    }

    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} sản phẩm trong kho.` });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, products: [] });
    }

    const index = cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    // Check tổng quantity (hiện có + thêm mới) không vượt tồn kho
    const existingQty = index > -1 ? cart.products[index].quantity : 0;
    if (product.stock < existingQty + quantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stock} sản phẩm trong kho (giỏ hàng đã có ${existingQty}).`,
      });
    }

    if (index > -1) {
      cart.products[index].quantity += quantity;
    } else {
      cart.products.push({ productId, quantity });
    }

    await cart.save();
    return res.status(200).json({ success: true, message: "Đã thêm vào giỏ hàng." });
  } catch (err) {
    next(err);
  }
};

// ─── Update Cart ──────────────────────────────────────────────────────────────
exports.updateCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Số lượng phải là số nguyên dương." });
    }

    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} sản phẩm trong kho.` });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại." });
    }

    const item = cart.products.find((item) => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Sản phẩm không có trong giỏ hàng." });
    }

    item.quantity = quantity;
    await cart.save();
    return res.status(200).json({ success: true, message: "Cập nhật giỏ hàng thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── Remove Item ──────────────────────────────────────────────────────────────
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại." });
    }

    cart.products = cart.products.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();
    return res.status(200).json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng." });
  } catch (err) {
    next(err);
  }
};

// ─── Clear Cart ───────────────────────────────────────────────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id });
    return res.status(200).json({ success: true, message: "Đã xóa toàn bộ giỏ hàng." });
  } catch (err) {
    next(err);
  }
};

// ─── Apply Voucher ────────────────────────────────────────────────────────────
// POST /api/cart/voucher
// Kiểm tra voucher hợp lệ, tính discount và lưu vào cart
// TODO: Uncomment khi đã tạo Voucher model
exports.applyVoucher = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã voucher." });
    }

    const cart = await Cart.findOne({ userId }).populate("products.productId", "basePrice salePrice");
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Giỏ hàng trống." });
    }

    const now = new Date();
    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      deletedAt: null,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Mã voucher không hợp lệ hoặc đã hết hạn." });
    }
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: "Mã voucher đã hết lượt sử dụng." });
    }

    const alreadyUsed = await VoucherUsage.findOne({ voucherId: voucher._id, userId });
    if (alreadyUsed) {
      return res.status(400).json({ success: false, message: "Bạn đã sử dụng mã voucher này rồi." });
    }

    // Tính tổng giỏ hàng
    const subtotal = cart.products.reduce((sum, item) => {
      const price = item.productId.salePrice ?? item.productId.basePrice;
      return sum + price * item.quantity;
    }, 0);

    if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để dùng mã này.`,
      });
    }

    const discount = voucher.type === "percent"
      ? Math.min(subtotal * voucher.value / 100, voucher.maxDiscount ?? Infinity)
      : voucher.value;

    cart.voucherCode    = voucher.code;
    cart.voucherId      = voucher._id;
    cart.discountAmount = discount;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Áp dụng voucher thành công.",
      data: { code: voucher.code, discount },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Remove Voucher ───────────────────────────────────────────────────────────
// DELETE /api/cart/voucher
exports.removeVoucher = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại." });
    }

    cart.voucherCode    = null;
    cart.voucherId      = null;
    cart.discountAmount = 0;
    await cart.save();

    return res.status(200).json({ success: true, message: "Đã xóa voucher khỏi giỏ hàng." });
  } catch (err) {
    next(err);
  }
};
