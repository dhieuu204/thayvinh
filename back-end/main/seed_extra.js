/**
 * seed_extra.js — Bổ sung sản phẩm từ topzone.vn (không xóa data cũ)
 *
 * Chạy: node seed_extra.js
 *
 * - Chỉ INSERT sản phẩm chưa có (kiểm tra theo slug)
 * - Không xóa users, categories, orders hay bất kỳ data nào khác
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Category     = require("./models/Category");
const Product      = require("./models/Product");
const ProductVariant = require("./models/ProductVariant");

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
}

// ─── Helper: chỉ insert nếu slug chưa tồn tại ─────────────────────────────────
async function insertIfNew(productData) {
  const exists = await Product.findOne({ slug: productData.slug });
  if (exists) {
    console.log(`  ⏭  Bỏ qua (đã có): ${productData.name}`);
    return null;
  }
  const product = await Product.create(productData);
  console.log(`  ✅ Đã thêm: ${product.name}`);
  return product;
}

// ─── Dữ liệu sản phẩm mới từ topzone.vn ──────────────────────────────────────
async function seedExtraProducts(catMap) {
  const newProducts = [
    // ── iPhone ────────────────────────────────────────────────────────────────
    {
      name: "iPhone 16 Plus",
      slug: "iphone-16-plus",
      description: "A18 chip, larger 6.7-inch display, and USB-C for all-day performance.",
      category: catMap["iPhone"],
      basePrice: 25990000,
      salePrice: 23990000,
      stock: 45,
      sold: 178,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/329138/s16/iphone-16-plus-xanh-luu-ly-thumbnew-650x650.png", publicId: "iphone16plus_1", isPrimary: true }],
    },
    {
      name: "iPhone 15 Plus",
      slug: "iphone-15-plus",
      description: "Super Retina XDR display and impressive battery life in a 6.7-inch form.",
      category: catMap["iPhone"],
      basePrice: 21990000,
      salePrice: 17990000,
      stock: 35,
      sold: 263,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/303891/s16/iphone-15-plus-black-1-2-650x650.png", publicId: "iphone15plus_1", isPrimary: true }],
    },
    {
      name: "iPhone 17e",
      slug: "iphone-17e",
      description: "Compact design with A18 chip and essential iPhone features at a great price.",
      category: catMap["iPhone"],
      basePrice: 17990000,
      salePrice: 17490000,
      stock: 65,
      sold: 94,
      tags: ["iphone", "apple", "smartphone"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/42/342692/s16/iphone-17e-256gb-hong-thumb-650x650.png", publicId: "iphone17e_1", isPrimary: true }],
    },

    // ── iPad ──────────────────────────────────────────────────────────────────
    {
      name: "iPad Air M4 13-inch WiFi",
      slug: "ipad-air-m4-13-inch",
      description: "Large canvas with M4 chip — ideal for creative work and multitasking.",
      category: catMap["iPad"],
      basePrice: 22090000,
      salePrice: null,
      stock: 20,
      sold: 67,
      tags: ["ipad", "apple", "tablet", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/522/363422/s16/ipad-air-m4-13-inch-wifi-128gb-xam-thumb-650x650.png", publicId: "ipadair13_1", isPrimary: true }],
    },

    // ── Mac ───────────────────────────────────────────────────────────────────
    {
      name: "MacBook Air 13 M5",
      slug: "macbook-air-13-m5",
      description: "M5 chip in an ultralight 13-inch laptop with all-day battery life.",
      category: catMap["Mac"],
      basePrice: 29990000,
      salePrice: 29490000,
      stock: 30,
      sold: 41,
      tags: ["macbook", "apple", "laptop", "air"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/363477/s16/macbook-air-15-inch-m5-16gb-512gb-xanh-da-troi-nhat-650x650.png", publicId: "macbookair13m5_1", isPrimary: true }],
    },
    {
      name: "MacBook Pro 16 M5 Pro",
      slug: "macbook-pro-16-m5-pro",
      description: "M5 Pro chip with 24-core GPU and a stunning 16-inch Liquid Retina XDR display.",
      category: catMap["Mac"],
      basePrice: 72990000,
      salePrice: 72490000,
      stock: 10,
      sold: 23,
      tags: ["macbook", "apple", "laptop", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/363490/s16/macbook-pro-16-inch-m5-pro-24gb-1tb-den-thumb-650x650.png", publicId: "macbookpro16pro_1", isPrimary: true }],
    },
    {
      name: "MacBook Pro 16 M5 Max",
      slug: "macbook-pro-16-m5-max",
      description: "M5 Max chip for the most demanding creative and professional workflows.",
      category: catMap["Mac"],
      basePrice: 104990000,
      salePrice: 104490000,
      stock: 5,
      sold: 12,
      tags: ["macbook", "apple", "laptop", "pro"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/44/363492/s16/macbook-pro-16-inch-m5-max-36gb-2tb-den-thumb-650x650.png", publicId: "macbookpro16max_1", isPrimary: true }],
    },

    // ── Watch ─────────────────────────────────────────────────────────────────
    {
      name: "Apple Watch Series 11 GPS + Cellular",
      slug: "apple-watch-series-11-lte",
      description: "Stay connected anywhere with LTE and the latest health features.",
      category: catMap["Watch"],
      basePrice: 14490000,
      salePrice: 12090000,
      stock: 30,
      sold: 88,
      tags: ["apple watch", "apple", "smartwatch", "lte"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/7077/344752/s16/apple-watch-series-11-gps-cellular-vien-nhom-day-the-thao-vang-hong-thumb-650x650.png", publicId: "watch11lte_1", isPrimary: true }],
    },

    // ── Audio ─────────────────────────────────────────────────────────────────
    {
      name: "AirPods 4",
      slug: "airpods-4",
      description: "Redesigned open-ear fit with personalized Spatial Audio and USB-C.",
      category: catMap["Audio"],
      basePrice: 3790000,
      salePrice: 3090000,
      stock: 120,
      sold: 312,
      tags: ["airpods", "apple", "earbuds", "audio"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/329152/s16/airpods-4-thumb-1-650x650.png", publicId: "airpods4_1", isPrimary: true }],
    },
    {
      name: "EarPods USB-C",
      slug: "earpods-usb-c",
      description: "Wired earphones with USB-C connector and built-in remote and microphone.",
      category: catMap["Audio"],
      basePrice: 540000,
      salePrice: null,
      stock: 300,
      sold: 189,
      tags: ["earpods", "apple", "tai nghe có dây", "audio"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/54/298829/s16/tai-nghe-co-day-apple-earpods-usb-c-thumb-1-650x650.png", publicId: "earpods_1", isPrimary: true }],
    },

    // ── Accessories ───────────────────────────────────────────────────────────
    {
      name: "Apple Pencil USB-C",
      slug: "apple-pencil-usb-c",
      description: "Attach, charge, and pair magnetically. Great value for everyday note-taking.",
      category: catMap["Accessories"],
      basePrice: 2190000,
      salePrice: null,
      stock: 150,
      sold: 74,
      tags: ["pencil", "apple", "phụ kiện", "ipad"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/40/308906/s16/apple-pencil-usb-c-thumb-1-650x650.png", publicId: "pencilusbc_1", isPrimary: true }],
    },
    {
      name: "Apple 20W USB-C Adapter",
      slug: "apple-20w-usb-c-adapter",
      description: "Compact 20W fast charger for iPhone and iPad via USB-C.",
      category: catMap["Accessories"],
      basePrice: 540000,
      salePrice: null,
      stock: 500,
      sold: 621,
      tags: ["sạc", "adapter", "usb-c", "phụ kiện"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/9499/222458/s16/adapter-sac-type-c-20w-cho-iphone-ipad-apple-thumb-650x650.png", publicId: "adapter20w_1", isPrimary: true }],
    },
    {
      name: "Smart Folio iPad Pro M5 11-inch",
      slug: "smart-folio-ipad-pro-m5-11",
      description: "Slim protective cover with multiple viewing angles for iPad Pro 11-inch.",
      category: catMap["Accessories"],
      basePrice: 2190000,
      salePrice: null,
      stock: 80,
      sold: 36,
      tags: ["case", "smart folio", "ipad", "phụ kiện"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/38/309077/s16/bao-da-smart-folio-ipad-pro-11-inch-m4-den-thumb-1-650x650.png", publicId: "smartfolio_1", isPrimary: true }],
    },
    {
      name: "Cáp USB-C to USB-C 1m",
      slug: "cable-usb-c-to-usb-c-1m",
      description: "Braided USB-C cable for fast charging and data transfer.",
      category: catMap["Accessories"],
      basePrice: 540000,
      salePrice: null,
      stock: 400,
      sold: 287,
      tags: ["cáp", "usb-c", "sạc", "phụ kiện"],
      isFlashSale: false,
      images: [{ url: "https://cdn.tgdd.vn/Products/Images/9499/323217/s16/cap-type-c-type-c-1m-apple-mqkj3-thumb-1-650x650.png", publicId: "cableusbc_1", isPrimary: true }],
    },
  ];

  const variantMap = {
    "iphone-16-plus": [
      { name: "128GB - Xanh",   sku: "IP16P-128-XANH",  attributes: { storage: "128GB", color: "Xanh Lưu Ly" },  price: 23990000, stock: 15 },
      { name: "256GB - Hồng",   sku: "IP16P-256-HONG",  attributes: { storage: "256GB", color: "Hồng" },          price: 26990000, stock: 15 },
      { name: "512GB - Trắng",  sku: "IP16P-512-TRANG", attributes: { storage: "512GB", color: "Trắng" },          price: 30990000, stock: 10 },
    ],
    "iphone-15-plus": [
      { name: "128GB - Đen",    sku: "IP15P-128-DEN",   attributes: { storage: "128GB", color: "Đen" },            price: 17990000, stock: 15 },
      { name: "256GB - Vàng",   sku: "IP15P-256-VANG",  attributes: { storage: "256GB", color: "Vàng" },           price: 19990000, stock: 10 },
    ],
    "iphone-17e": [
      { name: "128GB - Hồng",   sku: "IP17E-128-HONG",  attributes: { storage: "128GB", color: "Hồng" },           price: 17490000, stock: 25 },
      { name: "256GB - Trắng",  sku: "IP17E-256-TRANG", attributes: { storage: "256GB", color: "Trắng" },          price: 19490000, stock: 20 },
    ],
    "ipad-air-m4-13-inch": [
      { name: "128GB WiFi - Xám",  sku: "IPADAIR13-128-XAM",  attributes: { storage: "128GB", connectivity: "WiFi", color: "Xám" },  price: 22090000, stock: 10 },
      { name: "256GB WiFi - Xanh", sku: "IPADAIR13-256-XANH", attributes: { storage: "256GB", connectivity: "WiFi", color: "Xanh" }, price: 25090000, stock: 8  },
    ],
    "macbook-air-13-m5": [
      { name: "16GB/512GB - Midnight", sku: "MBA13M5-512-MID", attributes: { ram: "16GB", storage: "512GB", color: "Midnight" }, price: 29490000, stock: 12 },
      { name: "24GB/512GB - Bạc",      sku: "MBA13M5-24-BAC",  attributes: { ram: "24GB", storage: "512GB", color: "Bạc" },     price: 33490000, stock: 8  },
    ],
    "macbook-pro-16-m5-pro": [
      { name: "24GB/1TB - Đen Thiên Hà", sku: "MBP16PRO-1TB-DEN", attributes: { ram: "24GB", storage: "1TB", color: "Đen Thiên Hà" }, price: 72490000, stock: 5 },
      { name: "48GB/1TB - Bạc",          sku: "MBP16PRO-48-BAC",  attributes: { ram: "48GB", storage: "1TB", color: "Bạc" },          price: 84490000, stock: 3 },
    ],
    "macbook-pro-16-m5-max": [
      { name: "36GB/2TB - Đen Thiên Hà", sku: "MBP16MAX-2TB-DEN", attributes: { ram: "36GB", storage: "2TB", color: "Đen Thiên Hà" }, price: 104490000, stock: 3 },
    ],
    "apple-watch-series-11-lte": [
      { name: "42mm - Vàng Hồng", sku: "AW11LTE-42-HONG", attributes: { size: "42mm", color: "Vàng Hồng" }, price: 12090000, stock: 15 },
      { name: "46mm - Đen",       sku: "AW11LTE-46-DEN",  attributes: { size: "46mm", color: "Đen" },       price: 13090000, stock: 10 },
    ],
    "airpods-4": [
      { name: "Trắng", sku: "AP4-TRANG", attributes: { color: "Trắng" }, price: 3090000, stock: 70 },
      { name: "Đen",   sku: "AP4-DEN",   attributes: { color: "Đen" },   price: 3090000, stock: 50 },
    ],
  };

  const inserted = [];
  for (const data of newProducts) {
    const product = await insertIfNew(data);
    if (product) inserted.push(product);
  }

  // Tạo variants cho sản phẩm mới
  let variantCount = 0;
  for (const product of inserted) {
    const variants = variantMap[product.slug];
    if (variants) {
      await ProductVariant.insertMany(
        variants.map((v) => ({ ...v, productId: product._id }))
      );
      variantCount += variants.length;
    }
  }

  console.log(`\n📦 Đã thêm ${inserted.length} sản phẩm mới`);
  console.log(`🎨 Đã thêm ${variantCount} variants mới`);
  return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await connectDB();

    const categories = await Category.find({});
    if (categories.length === 0) {
      console.error("❌ Chưa có danh mục! Hãy chạy seed.js trước.");
      process.exit(1);
    }

    const catMap = {};
    categories.forEach((c) => (catMap[c.name] = c._id));

    console.log("\n🔍 Kiểm tra và thêm sản phẩm mới từ topzone.vn...\n");
    await seedExtraProducts(catMap);

    console.log("\n🎉 Hoàn tất! Database đã được bổ sung.");
  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }
}

main();