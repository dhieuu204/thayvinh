require("dotenv").config();
const mongoose = require("mongoose");
const FlashSale = require("./models/FlashSale");
const Product   = require("./models/Product");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected");

  // Lấy một số sản phẩm thật từ DB
  const products = await Product.find().limit(10).lean();
  if (products.length < 3) {
    console.log("❌ Cần ít nhất 3 sản phẩm trong DB. Chạy seed.js trước.");
    return await mongoose.disconnect();
  }

  await FlashSale.deleteMany({});
  console.log("🗑️  Cleared existing flash sales");

  const now = new Date();
  const day = (d) => new Date(now.getTime() + d * 86400000);

  const flashSales = [
    {
      name: "Flash Sale Tháng 4 - Công nghệ đỉnh cao",
      description: "Ưu đãi giảm giá sốc các sản phẩm Apple hot nhất tháng 4",
      startsAt: day(-1),   // đang chạy
      endsAt:   day(6),
      isActive: true,
      products: [
        { productId: products[0]._id, discountType: "percent", discountValue: 10, quantity: 50, sold: 12 },
        { productId: products[1]._id, discountType: "percent", discountValue: 15, quantity: 30, sold: 8  },
        { productId: products[2]._id, discountType: "fixed",   discountValue: 500000, quantity: 20, sold: 5 },
      ],
    },
    {
      name: "Siêu Sale Cuối Tuần",
      description: "Chỉ diễn ra 2 ngày cuối tuần, số lượng có hạn",
      startsAt: day(3),   // sắp diễn ra
      endsAt:   day(5),
      isActive: true,
      products: [
        { productId: products[3]?._id || products[0]._id, discountType: "percent", discountValue: 20, quantity: 15, sold: 0 },
        { productId: products[4]?._id || products[1]._id, discountType: "percent", discountValue: 12, quantity: 25, sold: 0 },
      ],
    },
    {
      name: "Flash Sale Tháng 3 - Đã kết thúc",
      description: "Chương trình ưu đãi tháng 3 đã kết thúc",
      startsAt: day(-30),  // hết hạn
      endsAt:   day(-10),
      isActive: false,
      products: [
        { productId: products[5]?._id || products[0]._id, discountType: "percent", discountValue: 8, quantity: 40, sold: 38 },
      ],
    },
  ];

  await FlashSale.insertMany(flashSales);
  console.log(`✅ Seeded ${flashSales.length} flash sales`);
  await mongoose.disconnect();
}

main().catch(console.error);
