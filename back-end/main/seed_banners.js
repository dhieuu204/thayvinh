require("dotenv").config();
const mongoose = require("mongoose");
const Banner = require("./models/Banner");

const banners = [
  // ── Homepage ──
  {
    title: "Tháng Tự Hào - Trao Ngàn Ưu Đãi",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/first-pc.png",
    linkUrl: "",
    position: "homepage",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "iPhone 17 Pro Max - Titan Tự Nhiên",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iP17promax_PC.png",
    linkUrl: "/categories/iphone",
    position: "homepage",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "MacBook Pro - Sức mạnh vượt trội",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20Macbook%20pro_PC.png",
    linkUrl: "/categories/mac",
    position: "homepage",
    sortOrder: 3,
    isActive: true,
  },
  {
    title: "iPad Air - Sáng tạo không giới hạn",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iPadAir_PC.png",
    linkUrl: "/categories/ipad",
    position: "homepage",
    sortOrder: 4,
    isActive: true,
  },
  {
    title: "Apple Watch Series 11 - Sức khỏe thông minh",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20watch11_PC.png",
    linkUrl: "/categories/watch",
    position: "homepage",
    sortOrder: 5,
    isActive: true,
  },
  {
    title: "AirPods Pro 3 - Âm thanh không gian",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20AirPodpro3_PC.png",
    linkUrl: "/categories/audio",
    position: "homepage",
    sortOrder: 6,
    isActive: true,
  },

  // ── iPhone ──
  {
    title: "iPhone 17 Pro Max - Chip A19 Pro",
    imageUrl: "https://shopdunk.com/images/uploaded/banner-thang-4/homepage/banner%20iP17promax_PC.png",
    linkUrl: "",
    position: "iphone",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "iPhone Air - Siêu mỏng, siêu nhẹ",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-iphone-air-pc.jpg",
    linkUrl: "",
    position: "iphone",
    sortOrder: 2,
    isActive: true,
  },

  // ── iPad ──
  {
    title: "iPad Pro M5 - Màn hình OLED tuyệt đỉnh",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-ipad-pro-m5-pc.jpg",
    linkUrl: "",
    position: "ipad",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "iPad Air M4 - Sáng tạo không giới hạn",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-ipad-air-m4-pc.jpg",
    linkUrl: "",
    position: "ipad",
    sortOrder: 2,
    isActive: true,
  },

  // ── Mac ──
  {
    title: "MacBook Air M4 - Hiệu năng bứt phá",
    imageUrl: "https://shopdunk.com/images/uploaded/banner%20macbook%20air%20m4_PC.jpg",
    linkUrl: "",
    position: "mac",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "MacBook Pro M5 - Sức mạnh chuyên nghiệp",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-macbook-pro-m5-pc.jpg",
    linkUrl: "",
    position: "mac",
    sortOrder: 2,
    isActive: true,
  },

  // ── Watch ──
  {
    title: "Apple Watch Series 11 - Sức khỏe thông minh",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-watch-series-11-pc.jpg",
    linkUrl: "",
    position: "watch",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Apple Watch Ultra 3 - Đỉnh cao bền bỉ",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-watch-ultra-3-pc.jpg",
    linkUrl: "",
    position: "watch",
    sortOrder: 2,
    isActive: true,
  },

  // ── Audio ──
  {
    title: "AirPods Pro 3 - Chống ồn thế hệ mới",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/airpods-pro-2-banner-pc.jpg",
    linkUrl: "",
    position: "audio",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "AirPods 4 - Trải nghiệm âm thanh mới",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-airpods-4-pc.jpg",
    linkUrl: "",
    position: "audio",
    sortOrder: 2,
    isActive: true,
  },

  // ── Accessories ──
  {
    title: "Apple Pencil Pro - Sáng tạo đỉnh cao",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-apple-pencil-pro-pc.jpg",
    linkUrl: "",
    position: "accessories",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "AirTag - Không bao giờ mất đồ",
    imageUrl: "https://shopdunk.com/images/uploaded/banner/banner-airtag-pc.jpg",
    linkUrl: "",
    position: "accessories",
    sortOrder: 2,
    isActive: true,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected");

  await Banner.deleteMany({});
  console.log("🗑️  Cleared existing banners");

  await Banner.insertMany(banners);
  console.log(`✅ Seeded ${banners.length} banners`);

  await mongoose.disconnect();
}

main().catch(console.error);
