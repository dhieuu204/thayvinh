/**
 * seed.js — Tạo dữ liệu mẫu cho MongoDB
 *
 * Chạy: node seed.js
 *
 * Sẽ tạo:
 *  - 1 tài khoản admin
 *  - 1 tài khoản user thường
 *  - 6 danh mục (iPhone, iPad, Mac, Watch, Audio, Accessories)
 *  - 12 sản phẩm (khớp với PRODUCT_LIST frontend)
 *  - Variants cho mỗi sản phẩm
 *  - 2 shipping zones
 *  - 1 voucher mẫu
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Category = require("./models/Category");
const Product = require("./models/Product");
const ProductVariant = require("./models/ProductVariant");
const ShippingZone = require("./models/ShippingZone");
const Voucher = require("./models/Voucher");

// ─── Kết nối DB ───────────────────────────────────────────────────────────────
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
}

// ─── Xóa dữ liệu cũ ──────────────────────────────────────────────────────────
async function clearData() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    ShippingZone.deleteMany({}),
    Voucher.deleteMany({}),
  ]);
  console.log("🗑️  Đã xóa dữ liệu cũ");
}

// ─── Tạo Users ────────────────────────────────────────────────────────────────
async function seedUsers() {
  const hashedAdmin = await bcrypt.hash("Admin@123", 10);
  const hashedUser = await bcrypt.hash("User@123", 10);

  const users = await User.insertMany([
    {
      username: "admin",
      email: "admin@gmail.com",
      password: hashedAdmin,
      role: "admin",
      fullName: "Admin Hệ Thống",
      isVerified: true,
    },
    {
      username: "user01",
      email: "user01@gmail.com",
      password: hashedUser,
      role: "user",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Lê Lợi, Quận 1, TP.HCM",
      isVerified: true,
      loyaltyPoints: 150,
    },
  ]);

  console.log("👤 Đã tạo users:");
  console.log("   Admin  — email: admin@gmail.com   | password: Admin@123");
  console.log("   User   — email: user01@gmail.com  | password: User@123");
  return users;
}

// ─── Tạo Categories ───────────────────────────────────────────────────────────
async function seedCategories() {
  const categories = await Category.insertMany([
    {
      name: "iPhone",
      slug: "iphone",
      description: "Điện thoại iPhone chính hãng Apple",
      imageUrl: "https://cdn.tgdd.vn/Products/Images/42/342680/s16/iphone-17-pro-max-cam-thumb-650x650.png",
      sortOrder: 1,
    },
    {
      name: "iPad",
      slug: "ipad",
      description: "Máy tính bảng iPad chính hãng Apple",
      imageUrl: "https://cdn.tgdd.vn/Products/Images/522/358099/s16/ipad-pro-m5-wifi-13-inch-black-thumbtz-650x650.png",
      sortOrder: 2,
    },
    {
      name: "Mac",
      slug: "mac",
      description: "MacBook và iMac chính hãng Apple",
      imageUrl: "https://cdn.tgdd.vn/Products/Images/44/363488/s16/macbook-pro-14-inch-m5-pro-24gb-1tb-den-thumb-650x650.png",
      sortOrder: 3,
    },
    {
      name: "Watch",
      slug: "watch",
      description: "Apple Watch chính hãng",
      imageUrl: "https://cdn.tgdd.vn/Products/Images/7077/344750/s16/apple-watch-series-11-42mm-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png",
      sortOrder: 4,
    },
    {
      name: "Audio",
      slug: "audio",
      description: "AirPods và tai nghe Apple",
      imageUrl: "https://cdn.tgdd.vn/Products/Images/54/329154/s16/airpods-4-thumb-1-650x650.png",
      sortOrder: 5,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Phụ kiện chính hãng Apple",
      imageUrl: "https://cdnv2.tgdd.vn/mwg-static/topzone/Products/Images/60/342314/op-lung-magsafe-iphone-17-pro-max-pc-tpu-ava-oc-bayer-ii-thumb-638926764707918633-650x650.png",
      sortOrder: 6,
    },
  ]);

  const catMap = {};
  categories.forEach((c) => (catMap[c.name] = c._id));

  console.log(`📂 Đã tạo ${categories.length} danh mục`);
  return catMap;
}

// ─── Tạo Products ─────────────────────────────────────────────────────────────
async function seedProducts(catMap) {
  const productData = [
    {
      name: "iPhone 17 Pro Max",
      slug: "iphone-17-pro-max",
      description: "A19 Pro, titanium frame, all-day battery, and advanced camera system.",
      category: catMap["iPhone"],
      basePrice: 37990000,
      salePrice: 34990000,
      stock: 50,
      sold: 224,
      tags: ["iphone", "apple", "smartphone", "flagship"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/342680/s16/iphone-17-pro-max-cam-thumb-650x650.png", publicId: "iphone17promax_1", isPrimary: true }],
    },
    {
      name: "iPhone 17",
      slug: "iphone-17",
      description: "Fast, light, and reliable with a brighter display for daily use.",
      category: catMap["iPhone"],
      basePrice: 27990000,
      salePrice: 25990000,
      stock: 80,
      sold: 193,
      tags: ["iphone", "apple", "smartphone"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/342679/s16/iphone-17-den-thumb-650x650.png", publicId: "iphone17_1", isPrimary: true }],
    },
    {
      name: "iPad Pro M5 13-inch",
      slug: "ipad-pro-m5-13-inch",
      description: "Ultra thin design and M5 performance for creators and power users.",
      category: catMap["iPad"],
      basePrice: 32990000,
      salePrice: null,
      stock: 30,
      sold: 89,
      tags: ["ipad", "apple", "tablet", "pro"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/522/358099/s16/ipad-pro-m5-wifi-13-inch-black-thumbtz-650x650.png", publicId: "ipadpro_1", isPrimary: true }],
    },
    {
      name: "iPad Air 11-inch",
      slug: "ipad-air-11-inch",
      description: "Portable iPad with strong performance and smooth multitasking.",
      category: catMap["iPad"],
      basePrice: 19990000,
      salePrice: 17990000,
      stock: 45,
      sold: 141,
      tags: ["ipad", "apple", "tablet"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/522/328576/s16/ipad-air-11-inch-m3-wifi-blue-thumb-650x650.png", publicId: "ipadair_1", isPrimary: true }],
    },
    {
      name: "MacBook Pro 14 M5 Pro",
      slug: "macbook-pro-14-m5-pro",
      description: "Desktop class power in a compact laptop for engineering workloads.",
      category: catMap["Mac"],
      basePrice: 59990000,
      salePrice: 56990000,
      stock: 20,
      sold: 56,
      tags: ["macbook", "apple", "laptop", "pro"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/363488/s16/macbook-pro-14-inch-m5-pro-24gb-1tb-den-thumb-650x650.png", publicId: "macbookpro_1", isPrimary: true }],
    },
    {
      name: "MacBook Air 15 M4",
      slug: "macbook-air-15-m4",
      description: "Thin and silent laptop with strong battery for work and travel.",
      category: catMap["Mac"],
      basePrice: 34990000,
      salePrice: 32990000,
      stock: 35,
      sold: 128,
      tags: ["macbook", "apple", "laptop", "air"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/334852/s16/macbook-air-15-inch-m4-midnight-thumb-650x650.png", publicId: "macbookair_1", isPrimary: true }],
    },
    {
      name: "Apple Watch Series 11",
      slug: "apple-watch-series-11",
      description: "Health insights, smarter workouts, and quick notifications on your wrist.",
      category: catMap["Watch"],
      basePrice: 12990000,
      salePrice: 11990000,
      stock: 60,
      sold: 176,
      tags: ["apple watch", "apple", "smartwatch"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/7077/344750/s16/apple-watch-series-11-42mm-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png", publicId: "watch11_1", isPrimary: true }],
    },
    {
      name: "Apple Watch Ultra 3",
      slug: "apple-watch-ultra-3",
      description: "Rugged build and long battery life for outdoor and endurance sports.",
      category: catMap["Watch"],
      basePrice: 21990000,
      salePrice: null,
      stock: 15,
      sold: 63,
      tags: ["apple watch", "apple", "smartwatch", "ultra"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/7077/344791/s16/apple-watch-ultra-3-titanium-day-ocean-xanh-duong-thumb-650x650.png", publicId: "watchultra_1", isPrimary: true }],
    },
    {
      name: "AirPods Pro 3",
      slug: "airpods-pro-3",
      description: "Adaptive noise control and spatial audio in a compact form.",
      category: catMap["Audio"],
      basePrice: 7490000,
      salePrice: 6990000,
      stock: 100,
      sold: 284,
      tags: ["airpods", "apple", "earbuds", "audio"],
      isFlashSale: true,
      flashSalePrice: 6490000,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/329154/s16/airpods-4-thumb-1-650x650.png", publicId: "airpodspro_1", isPrimary: true }],
    },
    {
      name: "AirPods Max USB-C",
      slug: "airpods-max-usb-c",
      description: "Premium over-ear audio with active noise cancellation.",
      category: catMap["Audio"],
      basePrice: 14990000,
      salePrice: 13990000,
      stock: 25,
      sold: 45,
      tags: ["airpods", "apple", "headphones", "audio"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/334358/s16/tai-nghe-chup-tai-airpods-max-usb-c-thumb-650x650.png", publicId: "airpodsmax_1", isPrimary: true }],
    },
    {
      name: "MagSafe Silicone Case",
      slug: "magsafe-silicone-case",
      description: "Soft touch finish with MagSafe alignment and everyday protection.",
      category: catMap["Accessories"],
      basePrice: 1190000,
      salePrice: null,
      stock: 200,
      sold: 72,
      tags: ["case", "magsafe", "phụ kiện", "ốp lưng"],
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static/topzone/Products/Images/60/342314/op-lung-magsafe-iphone-17-pro-max-pc-tpu-ava-oc-bayer-ii-thumb-638926764707918633-650x650.png", publicId: "magsafe_1", isPrimary: true }],
    },
    {
      name: "Apple 70W USB-C Adapter",
      slug: "apple-70w-usb-c-adapter",
      description: "Fast and stable charging for MacBook, iPad, and iPhone.",
      category: catMap["Accessories"],
      basePrice: 1790000,
      salePrice: 1590000,
      stock: 150,
      sold: 109,
      tags: ["sạc", "adapter", "usb-c", "phụ kiện"],
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/9499/309907/s16/adapter-sac-apple-type-c-70w-thumb-650x650.png", publicId: "adapter_1", isPrimary: true }],
    },
  ];

  const products = await Product.insertMany(productData);
  console.log(`📦 Đã tạo ${products.length} sản phẩm`);
  return products;
}

// ─── Tạo Variants ─────────────────────────────────────────────────────────────
async function seedVariants(products) {
  const variantData = [];

  const variantMap = {
    "iphone-17-pro-max": [
      { name: "256GB - Cam Vũ Trụ", sku: "IP17PM-256-CAM", attributes: { storage: "256GB", color: "Cam Vũ Trụ" }, price: 34990000, stock: 15 },
      { name: "512GB - Đen Titan", sku: "IP17PM-512-DEN", attributes: { storage: "512GB", color: "Đen Titan" }, price: 39990000, stock: 10 },
      { name: "1TB - Trắng Titan", sku: "IP17PM-1TB-TRANG", attributes: { storage: "1TB", color: "Trắng Titan" }, price: 44990000, stock: 5 },
    ],
    "iphone-17": [
      { name: "128GB - Đen", sku: "IP17-128-DEN", attributes: { storage: "128GB", color: "Đen" }, price: 25990000, stock: 30 },
      { name: "256GB - Trắng", sku: "IP17-256-TRANG", attributes: { storage: "256GB", color: "Trắng" }, price: 28990000, stock: 25 },
    ],
    "ipad-pro-m5-13-inch": [
      { name: "256GB WiFi - Đen", sku: "IPADPRO-256-DEN", attributes: { storage: "256GB", connectivity: "WiFi", color: "Đen" }, price: 32990000, stock: 15 },
      { name: "512GB WiFi - Bạc", sku: "IPADPRO-512-BAC", attributes: { storage: "512GB", connectivity: "WiFi", color: "Trắng Bạc" }, price: 38990000, stock: 10 },
    ],
    "macbook-pro-14-m5-pro": [
      { name: "24GB/512GB - Đen Thiên Hà", sku: "MBP14-512-DEN", attributes: { ram: "24GB", storage: "512GB", color: "Đen Thiên Hà" }, price: 56990000, stock: 8 },
      { name: "24GB/1TB - Bạc", sku: "MBP14-1TB-BAC", attributes: { ram: "24GB", storage: "1TB", color: "Bạc" }, price: 62990000, stock: 7 },
    ],
    "apple-watch-series-11": [
      { name: "42mm - Vàng Hồng", sku: "AW11-42-HONG", attributes: { size: "42mm", color: "Vàng Hồng" }, price: 11990000, stock: 20 },
      { name: "46mm - Đen", sku: "AW11-46-DEN", attributes: { size: "46mm", color: "Đen" }, price: 12990000, stock: 15 },
    ],
    "airpods-pro-3": [
      { name: "Lightning", sku: "APP3-LIGHTNING", attributes: { connector: "Lightning" }, price: 6990000, stock: 50 },
      { name: "USB-C", sku: "APP3-USBC", attributes: { connector: "USB-C" }, price: 6990000, stock: 50 },
    ],
  };

  for (const product of products) {
    const variants = variantMap[product.slug];
    if (variants) {
      variants.forEach((v) => {
        variantData.push({ ...v, productId: product._id });
      });
    }
  }

  if (variantData.length > 0) {
    await ProductVariant.insertMany(variantData);
  }
  console.log(`🎨 Đã tạo ${variantData.length} variants`);
}

// ─── Tạo Shipping Zones ───────────────────────────────────────────────────────
async function seedShippingZones() {
  await ShippingZone.insertMany([
    { name: "TP. Hồ Chí Minh", code: "HCM", fee: 20000, estimatedDays: 1 },
    { name: "Hà Nội",          code: "HN",  fee: 20000, estimatedDays: 1 },
    { name: "Đà Nẵng",         code: "DN",  fee: 25000, estimatedDays: 2 },
    { name: "Toàn quốc",       code: "ALL", fee: 35000, estimatedDays: 3 },
  ]);
  console.log("🚚 Đã tạo 4 shipping zones");
}

// ─── Tạo Voucher ──────────────────────────────────────────────────────────────
async function seedVouchers() {
  const now = new Date();
  await Voucher.insertMany([
    {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      minOrderValue: 500000,
      maxDiscount: 200000,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      startsAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
    },
    {
      code: "SALE50K",
      type: "fixed",
      value: 50000,
      minOrderValue: 300000,
      maxDiscount: 50000,
      usageLimit: 50,
      usedCount: 0,
      isActive: true,
      startsAt: now,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 ngày
    },
  ]);
  console.log("🎟️  Đã tạo 2 vouchers: WELCOME10 (giảm 10%), SALE50K (giảm 50k)");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await connectDB();
    await clearData();
    await seedUsers();
    const catMap = await seedCategories();
    const products = await seedProducts(catMap);
    await seedVariants(products);
    await seedShippingZones();
    await seedVouchers();

    console.log("\n🎉 Seed hoàn tất!");
    console.log("─────────────────────────────────────");
    console.log("Tài khoản admin : admin@gmail.com / Admin@123");
    console.log("Tài khoản user  : user01@gmail.com / User@123");
    console.log("─────────────────────────────────────");
  } catch (err) {
    console.error("❌ Seed thất bại:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }
}

main();
