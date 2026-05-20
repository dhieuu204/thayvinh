const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Fail-fast: bắt buộc JWT secrets phải có. Nếu không, refresh và access token có thể đổi vai trò.
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error(
    "FATAL: JWT_SECRET và JWT_REFRESH_SECRET phải được đặt trong .env",
  );
  process.exit(1);
}

const connectDB = require("./config/db");

// ── Import routes ──────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const wishListRoutes = require("./routes/wishListRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const imageRoutes = require("./routes/imageRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const chatRoutes = require("./routes/chatRoutes");

const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const passport = require("./config/passport");
const app = express();
app.set("trust proxy", 1);

// ── Security headers ───────────────────────────────────────────────────────────
// Tắt CSP mặc định vì API trả JSON, không render HTML (FE riêng do nginx serve).
// Frontend riêng có thể cấu hình CSP qua nginx headers.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // cho phép FE khác origin load ảnh /api/images/...
  }),
);

const ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? [process.env.CLIENT_URL].filter(Boolean)
    : ["http://localhost:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ── Rate limiting ──────────────────────────────────────────────────────────────
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  },
});
const searchLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu tìm kiếm." },
});
const chatLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Bạn đang chat quá nhanh. Thử lại sau ít phút.",
  },
});

// Kết nối MongoDB
connectDB();

// ── No-store cho API nhạy cảm (route handler có thể override bằng res.set) ─────
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth/login", authLimit);
app.use("/api/auth/register", authLimit);
app.use("/api/auth/forgot-password", authLimit);
app.use("/api/auth/verify-otp", authLimit);
app.use("/api/auth/verify-register-otp", authLimit);
app.use("/api/auth/reset-password", authLimit);
app.use("/api/products/search", searchLimit);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishListRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatLimit, chatRoutes);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    success: false,
    message: isProd
      ? "Có lỗi xảy ra. Vui lòng thử lại sau."
      : err.message || "Lỗi server.",
  });
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
