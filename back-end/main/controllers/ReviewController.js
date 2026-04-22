const mongoose = require("mongoose");
const Review   = require("../models/Review");
const Order    = require("../models/Order");

// ─── Create Review ────────────────────────────────────────────────────────────
// POST /api/reviews
// Chỉ cho phép khi user đã mua sản phẩm trong đơn hàng đã Delivered
exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, orderId, rating, comment, images } = req.body;

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating phải là số nguyên từ 1 đến 5." });
    }

    // Kiểm tra user đã mua sản phẩm trong đơn hàng đó và đơn đã giao
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: "Delivered",
      "products.product": productId,
    });
    if (!order) {
      return res.status(403).json({
        success: false,
        message: "Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được giao.",
      });
    }

    // Kiểm tra đã review chưa
    const existing = await Review.findOne({ productId, userId, orderId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi." });
    }

    const review = await Review.create({
      productId,
      userId,
      orderId,
      rating,
      comment: comment || "",
      images: images || [],
    });

    return res.status(201).json({ success: true, message: "Đánh giá đã được gửi.", data: review });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Reviews (Admin) ──────────────────────────────────────────────────
// GET /api/reviews?page=1&limit=100
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({})
        .populate("userId", "username fullName avatarUrl _id")
        .populate("productId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Reviews By Product ───────────────────────────────────────────────────
// GET /api/reviews/product/:productId?page=1&limit=10&rating=5
exports.getReviewsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { productId };
    if (rating) filter.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "username fullName avatarUrl _id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter),
    ]);

    // Tính rating trung bình
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "productId không hợp lệ." });
    }

    const ratingAgg = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]);
    const avgRating = ratingAgg[0]?.avgRating?.toFixed(1) ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        avgRating: parseFloat(avgRating),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Review ────────────────────────────────────────────────────────────
// PUT /api/reviews/:reviewId
exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findOne({ _id: reviewId, userId, deletedAt: null });
    if (!review) {
      return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });
    }

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating phải là số nguyên từ 1 đến 5." });
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();
    return res.status(200).json({ success: true, message: "Cập nhật đánh giá thành công.", data: review });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Review ────────────────────────────────────────────────────────────
// DELETE /api/reviews/:reviewId
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });
    }

    await Review.deleteOne({ _id: reviewId });
    return res.status(200).json({ success: true, message: "Đã xóa đánh giá." });
  } catch (err) {
    next(err);
  }
};

// ─── Reply Review (Admin) ─────────────────────────────────────────────────────
// PATCH /api/reviews/:reviewId/reply
exports.replyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ success: false, message: "Nội dung phản hồi không được để trống." });
    }

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });
    }

    review.reply = reply;
    review.repliedAt = new Date();
    await review.save();

    return res.status(200).json({ success: true, message: "Đã phản hồi đánh giá.", data: review });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Any Review (Admin) ────────────────────────────────────────────────
// DELETE /api/reviews/:reviewId/admin
exports.deleteAnyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res.status(404).json({ success: false, message: "Đánh giá không tồn tại." });
    }

    await Review.deleteOne({ _id: reviewId });
    console.info(`[AUDIT] Admin ${req.user.id} deleted review ${reviewId}`);
    return res.status(200).json({ success: true, message: "Đã xóa đánh giá." });
  } catch (err) {
    next(err);
  }
};
