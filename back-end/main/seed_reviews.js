const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Review = require("./models/Review");

const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";

async function seedReviews() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    // Find or create a test user
    let testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      testUser = await User.create({
        email: "test@example.com",
        password: "hashed_password",
        username: "testuser",
        fullName: "Test User",
        phone: "0123456789",
        address: "Test Address",
        isActive: true,
      });
      console.log("Created test user:", testUser._id);
    } else {
      console.log("Using existing test user:", testUser._id);
    }

    // Find a product (or create one)
    let product = await Product.findOne({ isActive: true, deletedAt: null }).limit(1);
    if (!product) {
      product = await Product.create({
        name: "Test Product",
        description: "A test product for reviews",
        category: new mongoose.Types.ObjectId(),
        basePrice: 100000,
        stock: 100,
        isActive: true,
      });
      console.log("Created test product:", product._id);
    } else {
      console.log("Using existing product:", product._id);
    }

    // Create a test order
    let order = await Order.findOne({ user: testUser._id, status: "Delivered" });
    if (!order) {
      order = await Order.create({
        user: testUser._id,
        products: [{ product: product._id, quantity: 1, priceAtOrder: product.basePrice }],
        total: product.basePrice,
        billingInfo: {
          fullName: "Test User",
          phone: "0123456789",
          street: "Test Street",
          district: "Test District",
          city: "Test City",
        },
        status: "Delivered",
      });
      console.log("Created test order:", order._id);
    } else {
      console.log("Using existing order:", order._id);
    }

    // Create test reviews
    const reviewTexts = [
      "Sản phẩm rất tốt, giao hàng nhanh!",
      "Chất lượng như mô tả, rất hài lòng.",
      "Giá cả hợp lý, sẽ mua tiếp.",
    ];

    for (let i = 0; i < reviewTexts.length; i++) {
      const existingReview = await Review.findOne({
        productId: product._id,
        userId: testUser._id,
        orderId: order._id,
      });

      if (!existingReview) {
        const review = await Review.create({
          productId: product._id,
          userId: testUser._id,
          orderId: order._id,
          rating: 5 - i,
          comment: reviewTexts[i],
          isVisible: true,
        });
        console.log(`Created test review ${i + 1}:`, review._id);
      } else {
        console.log(`Review already exists, skipping`);
      }
    }

    console.log("Test data created successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedReviews();
