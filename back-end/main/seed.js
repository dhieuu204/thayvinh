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
    // ── iPhone ──────────────────────────────────────────────────────────────────
    {
      name: "iPhone 17 Pro Max",
      slug: "iphone-17-pro-max",
      description: "A19 Pro chip, titanium frame, Camera Control, all-day battery.",
      category: catMap["iPhone"],
      basePrice: 37990000,
      salePrice: 36990000,
      stock: 50,
      sold: 224,
      tags: ["iphone", "apple", "smartphone", "flagship"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//42/342679/s16/iphone-17-pro-max-cam-2-638932623143505358.jpg", publicId: "iphone17promax_1", isPrimary: true }],
    },
    {
      name: "iPhone 17 Pro",
      slug: "iphone-17-pro",
      description: "A19 Pro chip, titanium design, and a powerful triple-camera system.",
      category: catMap["iPhone"],
      basePrice: 34990000,
      salePrice: 34890000,
      stock: 45,
      sold: 187,
      tags: ["iphone", "apple", "smartphone", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//42/342676/s16/iphone-17-pro-cam-2-638932620708852596.jpg", publicId: "iphone17pro_1", isPrimary: true }],
    },
    {
      name: "iPhone 17",
      slug: "iphone-17",
      description: "Fast, light, and reliable with a brighter display for daily use.",
      category: catMap["iPhone"],
      basePrice: 24990000,
      salePrice: 24490000,
      stock: 80,
      sold: 193,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//42/342667/s16/iphone-17-xanh-2-638932754880011696.jpg", publicId: "iphone17_1", isPrimary: true }],
    },
    {
      name: "iPhone Air",
      slug: "iphone-air",
      description: "The thinnest iPhone ever with a stunning 6.6-inch display.",
      category: catMap["iPhone"],
      basePrice: 31990000,
      salePrice: 22990000,
      stock: 35,
      sold: 142,
      tags: ["iphone", "apple", "smartphone", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//42/342670/s16/iphone-air-blue-2-638932632227907303.jpg", publicId: "iphoneair_1", isPrimary: true }],
    },
    {
      name: "iPhone 16",
      slug: "iphone-16",
      description: "A18 chip, Camera Control button, and next-generation portraits.",
      category: catMap["iPhone"],
      basePrice: 21990000,
      salePrice: 19990000,
      stock: 70,
      sold: 310,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/329135/s16/iphone-16-hong-1-650x650.png", publicId: "iphone16_1", isPrimary: true }],
    },
    {
      name: "iPhone 15",
      slug: "iphone-15",
      description: "Dynamic Island, USB-C, and a 48MP main camera.",
      category: catMap["iPhone"],
      basePrice: 18990000,
      salePrice: 17590000,
      stock: 60,
      sold: 405,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/281570/s16/iphone-15-green-2.jpg", publicId: "iphone15_1", isPrimary: true }],
    },
    {
      name: "iPhone 14",
      slug: "iphone-14",
      description: "Crash Detection, Emergency SOS via satellite, and long battery life.",
      category: catMap["iPhone"],
      basePrice: 16990000,
      salePrice: 13990000,
      stock: 40,
      sold: 512,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/240259/s16/iphone_14_pdp_position-1a_blue_color-0.jpg", publicId: "iphone14_1", isPrimary: true }],
    },

    // ── iPad ────────────────────────────────────────────────────────────────────
    {
      name: "iPad Pro M5 13-inch WiFi",
      slug: "ipad-pro-m5-13-inch",
      description: "Ultra-thin design with M5 chip and stunning 13-inch Liquid Retina display.",
      category: catMap["iPad"],
      basePrice: 39990000,
      salePrice: 38890000,
      stock: 30,
      sold: 89,
      tags: ["ipad", "apple", "tablet", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//522/358099/s16/ipad-pro-m5-13-inch-wifi-black-1-638963835275448818.jpg", publicId: "ipadpro13_1", isPrimary: true }],
    },
    {
      name: "iPad Pro M5 11-inch WiFi",
      slug: "ipad-pro-m5-11-inch",
      description: "Portable powerhouse with M5 chip and OLED Liquid Retina display.",
      category: catMap["iPad"],
      basePrice: 29990000,
      salePrice: 28190000,
      stock: 25,
      sold: 112,
      tags: ["ipad", "apple", "tablet", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//522/358082/s16/ipad-pro-11-inch-m5-wifi-black-1-638963827458766375.jpg", publicId: "ipadpro11_1", isPrimary: true }],
    },
    {
      name: "iPad Air M4 11-inch WiFi",
      slug: "ipad-air-m4-11-inch",
      description: "Portable iPad with M4 chip for smooth multitasking and creative work.",
      category: catMap["iPad"],
      basePrice: 16690000,
      salePrice: null,
      stock: 45,
      sold: 141,
      tags: ["ipad", "apple", "tablet", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//522/363417/s16/ipad-air-m4-11-inch-wifi-gray-tz-1-639082610460814996.jpg", publicId: "ipadair11_1", isPrimary: true }],
    },
    {
      name: "iPad mini 7 WiFi",
      slug: "ipad-mini-7",
      description: "Compact and capable with A17 Pro chip and stunning 8.3-inch display.",
      category: catMap["iPad"],
      basePrice: 13790000,
      salePrice: 13090000,
      stock: 55,
      sold: 198,
      tags: ["ipad", "apple", "tablet", "mini"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//522/331229/s16/ipad-mini-7-wifi-purple-1-638652063831431484.jpg", publicId: "ipadmini7_1", isPrimary: true }],
    },
    {
      name: "iPad 11 (A16) WiFi",
      slug: "ipad-11-a16",
      description: "Versatile everyday iPad with A16 chip and a crisp 11-inch display.",
      category: catMap["iPad"],
      basePrice: 9790000,
      salePrice: 9290000,
      stock: 90,
      sold: 267,
      tags: ["ipad", "apple", "tablet"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//522/335308/s16/ipad-11-wifi-yellow-01-638769374967059765.jpg", publicId: "ipad11_1", isPrimary: true }],
    },

    // ── Mac ─────────────────────────────────────────────────────────────────────
    {
      name: "MacBook Air 13 M4",
      slug: "macbook-air-13-m4",
      description: "Fanless design with M4 chip delivers all-day battery and silent performance.",
      category: catMap["Mac"],
      basePrice: 26490000,
      salePrice: 25590000,
      stock: 40,
      sold: 156,
      tags: ["macbook", "apple", "laptop", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/335362/s16/macbook-air-13-inch-m4-thumb-xanh-den-650x650.png", publicId: "macbookair13_1", isPrimary: true }],
    },
    {
      name: "MacBook Air 15 M5",
      slug: "macbook-air-15-m5",
      description: "Big beautiful display and M5 performance in a thin, quiet laptop.",
      category: catMap["Mac"],
      basePrice: 34990000,
      salePrice: 34490000,
      stock: 35,
      sold: 128,
      tags: ["macbook", "apple", "laptop", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/363477/s16/macbook-air-15-inch-m5-16gb-512gb-xanh-da-troi-nhat-650x650.png", publicId: "macbookair15_1", isPrimary: true }],
    },
    {
      name: "MacBook Pro 14 M5",
      slug: "macbook-pro-14-m5",
      description: "M5 chip with 10-core GPU, Liquid Retina XDR display, and MagSafe charging.",
      category: catMap["Mac"],
      basePrice: 41990000,
      salePrice: 41490000,
      stock: 20,
      sold: 74,
      tags: ["macbook", "apple", "laptop", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/358086/s16/macbook-pro-14-inch-m5-16gb-512gb-den-650x650.png", publicId: "macbookpro14_1", isPrimary: true }],
    },
    {
      name: "MacBook Pro 14 M5 Pro",
      slug: "macbook-pro-14-m5-pro",
      description: "M5 Pro chip with up to 24-core GPU for demanding creative and engineering work.",
      category: catMap["Mac"],
      basePrice: 59990000,
      salePrice: 59490000,
      stock: 15,
      sold: 56,
      tags: ["macbook", "apple", "laptop", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//44/363488/s16/macbook-pro-14-inch-m5-pro-2-639101280771918269.jpg", publicId: "macbookpro14pro_1", isPrimary: true }],
    },

    // ── Watch ───────────────────────────────────────────────────────────────────
    {
      name: "Apple Watch Series 11",
      slug: "apple-watch-series-11",
      description: "Thinner design, health insights, and smarter fitness tracking.",
      category: catMap["Watch"],
      basePrice: 11490000,
      salePrice: 9190000,
      stock: 60,
      sold: 176,
      tags: ["apple watch", "apple", "smartwatch"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//7077/344750/s16/apple-watch-series-11-vien-nhom-day-the-thao-hong-1-638932003750149179.jpg", publicId: "watch11_1", isPrimary: true }],
    },
    {
      name: "Apple Watch Series 10",
      slug: "apple-watch-series-10",
      description: "Largest Apple Watch display ever with fast charging and sleep apnea detection.",
      category: catMap["Watch"],
      basePrice: 13290000,
      salePrice: 9790000,
      stock: 50,
      sold: 234,
      tags: ["apple watch", "apple", "smartwatch"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/7077/329159/s16/titan-tu-nhien-topzone-1-2-650x650.png", publicId: "watch10_1", isPrimary: true }],
    },
    {
      name: "Apple Watch SE 3",
      slug: "apple-watch-se-3",
      description: "Essential Apple Watch features at a more affordable price.",
      category: catMap["Watch"],
      basePrice: 6990000,
      salePrice: 6390000,
      stock: 75,
      sold: 318,
      tags: ["apple watch", "apple", "smartwatch", "se"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//7077/344767/s16/apple-watch-se-3-lte-vien-nhom-day-the-thao-trang-1-638931998980907103.jpg", publicId: "watchse3_1", isPrimary: true }],
    },
    {
      name: "Apple Watch Ultra 3",
      slug: "apple-watch-ultra-3",
      description: "Rugged titanium build and 60-hour battery life for extreme sports.",
      category: catMap["Watch"],
      basePrice: 23490000,
      salePrice: null,
      stock: 15,
      sold: 63,
      tags: ["apple watch", "apple", "smartwatch", "ultra"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//7077/344764/s16/apple-watch-ultra-3-gps-cellular-49mm-vien-titanium-day-ocean-tn-1-638932021003644344.jpg", publicId: "watchultra3_1", isPrimary: true }],
    },

    // ── Audio ───────────────────────────────────────────────────────────────────
    {
      name: "AirPods Pro 3",
      slug: "airpods-pro-3",
      description: "Adaptive Audio, Conversation Awareness, and next-level noise cancellation.",
      category: catMap["Audio"],
      basePrice: 6790000,
      salePrice: 6190000,
      stock: 100,
      sold: 284,
      tags: ["airpods", "apple", "earbuds", "audio"],
      isFlashSale: true,
      flashSalePrice: 5690000,
      flashSaleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//54/344776/s16/airpods-pro-3-1-638930696335323277.jpg", publicId: "airpodspro3_1", isPrimary: true }],
    },
    {
      name: "AirPods 4 ANC",
      slug: "airpods-4-anc",
      description: "Active Noise Cancellation and Transparency mode in an open-ear design.",
      category: catMap["Audio"],
      basePrice: 4990000,
      salePrice: 4390000,
      stock: 80,
      sold: 197,
      tags: ["airpods", "apple", "earbuds", "audio"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static//54/329158/s16/airpods-4-cong-usb-c-2-638616704475511198.jpg", publicId: "airpods4anc_1", isPrimary: true }],
    },
    {
      name: "AirPods Pro 2 USB-C",
      slug: "airpods-pro-2-usb-c",
      description: "Up to 2x more Active Noise Cancellation with Adaptive Audio.",
      category: catMap["Audio"],
      basePrice: 6090000,
      salePrice: 5190000,
      stock: 60,
      sold: 341,
      tags: ["airpods", "apple", "earbuds", "audio"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/315014/s16/tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-1.jpg", publicId: "airpodspro2_1", isPrimary: true }],
    },
    {
      name: "AirPods Max USB-C",
      slug: "airpods-max-usb-c",
      description: "Premium over-ear audio with industry-leading Active Noise Cancellation.",
      category: catMap["Audio"],
      basePrice: 14990000,
      salePrice: 13990000,
      stock: 25,
      sold: 45,
      tags: ["airpods", "apple", "headphones", "audio"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/334358/s16/tai-nghe-chup-tai-airpods-max-usb-c-thumb-650x650.png", publicId: "airpodsmax_1", isPrimary: true }],
    },

    // ── Accessories ─────────────────────────────────────────────────────────────
    {
      name: "Apple Pencil Pro",
      slug: "apple-pencil-pro",
      description: "Squeeze and double tap gestures, Find My support, and hover precision.",
      category: catMap["Accessories"],
      basePrice: 3490000,
      salePrice: 3290000,
      stock: 120,
      sold: 88,
      tags: ["pencil", "apple", "phụ kiện", "ipad"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/1882/325539/s16/apple-pencil-pro-11.jpg", publicId: "pencilpro_1", isPrimary: true }],
    },
    {
      name: "Apple 70W USB-C Adapter",
      slug: "apple-70w-usb-c-adapter",
      description: "Fast and compact 70W charging for MacBook, iPad, and iPhone.",
      category: catMap["Accessories"],
      basePrice: 1490000,
      salePrice: null,
      stock: 150,
      sold: 109,
      tags: ["sạc", "adapter", "usb-c", "phụ kiện"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/9499/309907/s16/adapter-sac-apple-type-c-70w-1.jpg", publicId: "adapter70w_1", isPrimary: true }],
    },
    {
      name: "AirTag",
      slug: "airtag",
      description: "Precision Finding with Ultra Wideband to locate your items with ease.",
      category: catMap["Accessories"],
      basePrice: 790000,
      salePrice: null,
      stock: 300,
      sold: 423,
      tags: ["airtag", "apple", "phụ kiện", "định vị"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/10618/238092/s16/thiet-bi-dinh-vi-thong-minh-airtag-1-pack-mx532-1.jpg", publicId: "airtag_1", isPrimary: true }],
    },
    {
      name: "MagSafe Silicone Case iPhone 17 Pro Max",
      slug: "magsafe-silicone-case-iphone-17-pro-max",
      description: "Soft touch silicone with MagSafe magnets and microfiber lining.",
      category: catMap["Accessories"],
      basePrice: 1690000,
      salePrice: null,
      stock: 200,
      sold: 72,
      tags: ["case", "magsafe", "phụ kiện", "ốp lưng"],
      isFlashSale: false,
      images: [{ url: "https://cdnv2.tgdd.vn/mwg-static/topzone/Products/Images/60/345676/op-lung-magsafe-iphone-17-pro-max-techwoven-apple-xanh-la-01-638942230250129840.png", publicId: "magsafe_1", isPrimary: true }],
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
      { name: "256GB - Cam Vũ Trụ",  sku: "IP17PM-256-CAM",   attributes: { storage: "256GB", color: "Cam Vũ Trụ" },  price: 36990000, stock: 20 },
      { name: "512GB - Đen Titan",   sku: "IP17PM-512-DEN",   attributes: { storage: "512GB", color: "Đen Titan" },   price: 40990000, stock: 15 },
      { name: "1TB - Trắng Titan",   sku: "IP17PM-1TB-TRANG", attributes: { storage: "1TB",   color: "Trắng Titan" }, price: 46990000, stock: 10 },
    ],
    "iphone-17-pro": [
      { name: "256GB - Đen Titan",   sku: "IP17P-256-DEN",    attributes: { storage: "256GB", color: "Đen Titan" },   price: 34890000, stock: 15 },
      { name: "512GB - Bạc Titan",   sku: "IP17P-512-BAC",    attributes: { storage: "512GB", color: "Bạc Titan" },   price: 38890000, stock: 10 },
      { name: "1TB - Sa Mạc",        sku: "IP17P-1TB-SA",     attributes: { storage: "1TB",   color: "Sa Mạc" },      price: 43890000, stock: 5  },
    ],
    "iphone-17": [
      { name: "128GB - Đen",         sku: "IP17-128-DEN",     attributes: { storage: "128GB", color: "Đen" },         price: 24490000, stock: 30 },
      { name: "256GB - Trắng",       sku: "IP17-256-TRANG",   attributes: { storage: "256GB", color: "Trắng" },       price: 27490000, stock: 25 },
      { name: "512GB - Hồng",        sku: "IP17-512-HONG",    attributes: { storage: "512GB", color: "Hồng" },        price: 31490000, stock: 10 },
    ],
    "iphone-air": [
      { name: "128GB - Trắng",       sku: "IPA-128-TRANG",    attributes: { storage: "128GB", color: "Trắng" },       price: 22990000, stock: 15 },
      { name: "256GB - Đen",         sku: "IPA-256-DEN",      attributes: { storage: "256GB", color: "Đen" },         price: 25990000, stock: 10 },
    ],
    "iphone-16": [
      { name: "128GB - Đen",         sku: "IP16-128-DEN",     attributes: { storage: "128GB", color: "Đen" },         price: 19990000, stock: 25 },
      { name: "256GB - Hồng",        sku: "IP16-256-HONG",    attributes: { storage: "256GB", color: "Hồng" },        price: 22990000, stock: 20 },
      { name: "512GB - Xanh",        sku: "IP16-512-XANH",    attributes: { storage: "512GB", color: "Xanh Mòng Két" }, price: 26990000, stock: 10 },
    ],
    "iphone-15": [
      { name: "128GB - Hồng",        sku: "IP15-128-HONG",    attributes: { storage: "128GB", color: "Hồng" },        price: 17590000, stock: 20 },
      { name: "256GB - Vàng",        sku: "IP15-256-VANG",    attributes: { storage: "256GB", color: "Vàng" },        price: 19590000, stock: 15 },
    ],
    "iphone-14": [
      { name: "128GB - Đen",         sku: "IP14-128-DEN",     attributes: { storage: "128GB", color: "Đen" },         price: 13990000, stock: 15 },
      { name: "256GB - Tím",         sku: "IP14-256-TIM",     attributes: { storage: "256GB", color: "Tím" },         price: 15990000, stock: 10 },
    ],
    "ipad-pro-m5-13-inch": [
      { name: "256GB WiFi - Đen",    sku: "IPADPRO13-256-DEN", attributes: { storage: "256GB", connectivity: "WiFi", color: "Đen" },      price: 38890000, stock: 15 },
      { name: "512GB WiFi - Bạc",    sku: "IPADPRO13-512-BAC", attributes: { storage: "512GB", connectivity: "WiFi", color: "Trắng Bạc" }, price: 44890000, stock: 8  },
    ],
    "ipad-pro-m5-11-inch": [
      { name: "256GB WiFi - Đen",    sku: "IPADPRO11-256-DEN", attributes: { storage: "256GB", connectivity: "WiFi", color: "Đen" },      price: 28190000, stock: 12 },
      { name: "512GB WiFi - Bạc",    sku: "IPADPRO11-512-BAC", attributes: { storage: "512GB", connectivity: "WiFi", color: "Trắng Bạc" }, price: 34190000, stock: 8  },
    ],
    "ipad-air-m4-11-inch": [
      { name: "128GB WiFi - Xanh",   sku: "IPADAIR11-128-XANH", attributes: { storage: "128GB", connectivity: "WiFi", color: "Xanh" },  price: 16690000, stock: 20 },
      { name: "256GB WiFi - Vàng",   sku: "IPADAIR11-256-VANG", attributes: { storage: "256GB", connectivity: "WiFi", color: "Vàng" },  price: 19690000, stock: 12 },
    ],
    "ipad-mini-7": [
      { name: "128GB WiFi - Trắng",  sku: "IPADMINI7-128-TRANG", attributes: { storage: "128GB", connectivity: "WiFi", color: "Trắng" }, price: 13090000, stock: 25 },
      { name: "256GB WiFi - Đen",    sku: "IPADMINI7-256-DEN",   attributes: { storage: "256GB", connectivity: "WiFi", color: "Đen" },   price: 15090000, stock: 15 },
    ],
    "macbook-air-13-m4": [
      { name: "16GB/256GB - Midnight", sku: "MBA13M4-256-MID", attributes: { ram: "16GB", storage: "256GB", color: "Midnight" }, price: 25590000, stock: 15 },
      { name: "16GB/512GB - Bạc",      sku: "MBA13M4-512-BAC", attributes: { ram: "16GB", storage: "512GB", color: "Bạc" },     price: 29590000, stock: 10 },
    ],
    "macbook-air-15-m5": [
      { name: "16GB/512GB - Midnight", sku: "MBA15M5-512-MID", attributes: { ram: "16GB", storage: "512GB", color: "Midnight" }, price: 34490000, stock: 12 },
      { name: "24GB/512GB - Bạc",      sku: "MBA15M5-24-BAC",  attributes: { ram: "24GB", storage: "512GB", color: "Bạc" },     price: 38490000, stock: 8  },
    ],
    "macbook-pro-14-m5": [
      { name: "16GB/512GB - Đen Thiên Hà", sku: "MBP14M5-512-DEN", attributes: { ram: "16GB", storage: "512GB", color: "Đen Thiên Hà" }, price: 41490000, stock: 8 },
      { name: "24GB/1TB - Bạc",            sku: "MBP14M5-1TB-BAC", attributes: { ram: "24GB", storage: "1TB",   color: "Bạc" },          price: 47490000, stock: 5 },
    ],
    "macbook-pro-14-m5-pro": [
      { name: "24GB/512GB - Đen Thiên Hà", sku: "MBP14PRO-512-DEN", attributes: { ram: "24GB", storage: "512GB", color: "Đen Thiên Hà" }, price: 59490000, stock: 6 },
      { name: "24GB/1TB - Bạc",            sku: "MBP14PRO-1TB-BAC", attributes: { ram: "24GB", storage: "1TB",   color: "Bạc" },          price: 65490000, stock: 5 },
    ],
    "apple-watch-series-11": [
      { name: "42mm - Vàng Hồng",  sku: "AW11-42-HONG", attributes: { size: "42mm", color: "Vàng Hồng" }, price: 9190000,  stock: 20 },
      { name: "46mm - Đen",        sku: "AW11-46-DEN",  attributes: { size: "46mm", color: "Đen" },       price: 10190000, stock: 15 },
    ],
    "apple-watch-series-10": [
      { name: "42mm - Đen",        sku: "AW10-42-DEN",  attributes: { size: "42mm", color: "Đen" },       price: 9790000,  stock: 20 },
      { name: "46mm - Bạc",        sku: "AW10-46-BAC",  attributes: { size: "46mm", color: "Bạc" },       price: 10790000, stock: 15 },
    ],
    "apple-watch-se-3": [
      { name: "40mm - Đen",        sku: "AWSE3-40-DEN", attributes: { size: "40mm", color: "Đen" },       price: 6390000,  stock: 30 },
      { name: "44mm - Trắng",      sku: "AWSE3-44-TRANG", attributes: { size: "44mm", color: "Trắng" },   price: 6890000,  stock: 25 },
    ],
    "apple-watch-ultra-3": [
      { name: "49mm - Ocean Band", sku: "AWULTRA3-OCEAN", attributes: { size: "49mm", band: "Ocean Band" }, price: 23490000, stock: 8 },
      { name: "49mm - Milan Band", sku: "AWULTRA3-MILAN", attributes: { size: "49mm", band: "Milan Band" }, price: 26490000, stock: 5 },
    ],
    "airpods-pro-3": [
      { name: "Trắng",             sku: "APP3-TRANG",   attributes: { color: "Trắng" },   price: 6190000, stock: 60 },
      { name: "Đen",               sku: "APP3-DEN",     attributes: { color: "Đen" },     price: 6190000, stock: 40 },
    ],
    "airpods-4-anc": [
      { name: "Trắng",             sku: "AP4ANC-TRANG", attributes: { color: "Trắng" },   price: 4390000, stock: 50 },
      { name: "Đen",               sku: "AP4ANC-DEN",   attributes: { color: "Đen" },     price: 4390000, stock: 30 },
    ],
    "airpods-pro-2-usb-c": [
      { name: "Trắng USB-C",       sku: "APP2C-TRANG",  attributes: { color: "Trắng", connector: "USB-C" }, price: 5190000, stock: 30 },
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
