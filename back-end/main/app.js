const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");
dotenv.config();
const connectDB = require("./config/db");

// ── Import routes ──────────────────────────────────────────────────────────────
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const productRoutes      = require("./routes/productRoutes");
const categoryRoutes     = require("./routes/categoryRoutes");
const cartRoutes         = require("./routes/cartRoutes");
const orderRoutes        = require("./routes/orderRoutes");
const paymentRoutes      = require("./routes/paymentRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const wishListRoutes     = require("./routes/wishListRoutes");
const voucherRoutes      = require("./routes/voucherRoutes");
const reviewRoutes       = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const shippingRoutes     = require("./routes/shippingRoutes");
const imageRoutes        = require("./routes/imageRoutes");
const bannerRoutes       = require("./routes/bannerRoutes");
const settingsRoutes     = require("./routes/settingsRoutes");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép mọi localhost (bất kể port) và không có origin (curl, Postman)
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
connectDB();

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/categories",    categoryRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/wishlist",      wishListRoutes);
app.use("/api/vouchers",      voucherRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shipping",      shippingRoutes);
app.use("/api/images",        imageRoutes);
app.use("/api/banners",       bannerRoutes);
app.use("/api/settings",      settingsRoutes);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || "Lỗi server." });
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
